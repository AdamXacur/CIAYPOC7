from typing import List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.ingestion_service import ingestion_service
from app.core.deps import get_current_active_user
from app.models.knowledge import KnowledgeItem
import pandas as pd
import io

router = APIRouter(prefix="/ingestion", tags=["Ingesta de Conocimiento"])

# --- 1. Subir Manual (PDF) ---
@router.post("/upload-manual")
async def upload_manual(
    tenant_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")
    
    content = await file.read()
    result = ingestion_service.process_pdf(db, content, file.filename, tenant_id)
    
    if result["status"] == "error":
        raise HTTPException(status_code=500, detail=result["msg"])
        
    return result

# --- 2. Listar Documentos Indexados ---
@router.get("/documents", response_model=List[str])
def list_documents(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Devuelve la lista de nombres de archivos únicos en la base de conocimiento."""
    results = db.query(KnowledgeItem.source_filename).distinct().filter(KnowledgeItem.source_filename != None).all()
    return [r[0] for r in results]

# --- 3. Borrar Documento ---
@router.delete("/documents/{filename}")
def delete_document(
    filename: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Borra todos los fragmentos (vectores) asociados a un archivo."""
    deleted_count = db.query(KnowledgeItem).filter(KnowledgeItem.source_filename == filename).delete()
    db.commit()
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return {"message": "Documento eliminado", "deleted_fragments": deleted_count}

# --- 4. Legacy (CSV) ---
@router.post("/transparency")
async def upload_transparency(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos CSV")
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        return {"processed": len(df), "errors": 0, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error leyendo CSV: {str(e)}")