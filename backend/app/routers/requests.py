from typing import List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from pydantic import BaseModel
from app.database import get_db
from app.models.users import User
from app.models.organization import Department, Dependency
from app.models.requests import CitizenRequest, RequestStatus, Topic, Urgency, Sentiment, AnalysisStatus, RequestType
from app.schemas.requests import RequestCreate, RequestRead, RequestUpdateStatus, RequestImport, RequestAnalysisUpdate
from app.services.request_service import request_service
from app.services.ai_service import ai_service
from app.core.deps import get_current_active_user
import uuid
import pandas as pd
import io
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/requests", tags=["Solicitudes"])

class PaginatedRequestResponse(BaseModel):
    items: List[RequestRead]
    total: int

@router.get("", response_model=PaginatedRequestResponse)
def list_requests(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 10,
    status: Optional[RequestStatus] = None,
    topic: Optional[Topic] = None,
    urgency: Optional[Urgency] = None,
    sentiment: Optional[Sentiment] = None,
    request_type: Optional[RequestType] = None,
    analysis_status: Optional[AnalysisStatus] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(CitizenRequest).options(
        joinedload(CitizenRequest.department).joinedload(Department.dependency)
    )
    
    if status: query = query.filter(CitizenRequest.status == status)
    if topic: query = query.filter(CitizenRequest.topic == topic)
    if urgency: query = query.filter(CitizenRequest.urgency == urgency)
    if sentiment: query = query.filter(CitizenRequest.sentiment == sentiment)
    if request_type: query = query.filter(CitizenRequest.request_type == request_type)
    if analysis_status: query = query.filter(CitizenRequest.analysis_status == analysis_status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                CitizenRequest.folio.ilike(search_term),
                CitizenRequest.description.ilike(search_term),
                CitizenRequest.location_text.ilike(search_term)
            )
        )
    
    total = query.count()
    items = query.order_by(CitizenRequest.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"items": items, "total": total}

@router.post("/import-csv")
async def import_requests_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.value != 'superadmin':
        raise HTTPException(status_code=403, detail="Solo superadmin puede importar")

    try:
        content = await file.read()
        df = None
        encodings = ['cp1252', 'latin-1', 'utf-8', 'iso-8859-1']
        for enc in encodings:
            try:
                df = pd.read_csv(io.BytesIO(content), encoding=enc, engine='python', on_bad_lines='skip')
                break
            except: continue
            
        if df is None: raise HTTPException(400, "Error encoding CSV")
        df.columns = df.columns.str.strip().str.replace('ï»¿', '')
        
        col_folio = next((c for c in df.columns if 'FOLIO' in c.upper() or 'ID' in c.upper()), None)
        col_desc = next((c for c in df.columns if 'DESCRIPCION' in c.upper() or 'MOTIVO' in c.upper()), None)
        col_mun = next((c for c in df.columns if 'MUNICIPIO' in c.upper() or 'UBICACION' in c.upper()), None)
        
        if not col_folio or not col_desc:
             raise HTTPException(400, f"Columnas requeridas no encontradas.")

        success = 0
        # --- CONTADORES DE CALIDAD DE DATOS ---
        loc_found = 0
        loc_missing = 0
        
        for _, row in df.iterrows():
            try:
                folio_raw = str(row.get(col_folio, '')).replace('=', '').replace('"', '').strip()
                if len(folio_raw) < 3: continue
                if db.query(CitizenRequest.id).filter(CitizenRequest.folio == folio_raw).first(): continue

                desc = str(row.get(col_desc, 'Sin descripción'))
                if desc == 'nan': desc = "Solicitud importada"

                # --- LÓGICA DE UBICACIÓN ---
                raw_mun = row.get(col_mun) if col_mun else None
                
                # Verificar si es válido (No NaN, No vacío, No 'nan' literal)
                if pd.isna(raw_mun) or str(raw_mun).strip() == '' or str(raw_mun).lower() == 'nan':
                    location_str = "Ubicación General / No especificada"
                    loc_missing += 1
                else:
                    location_str = f"Importado - {str(raw_mun).strip()}"
                    loc_found += 1
                # ---------------------------

                db_req = CitizenRequest(
                    folio=folio_raw,
                    description=desc[:4000],
                    location_text=location_str,
                    status=RequestStatus.recibida,
                    created_at=datetime.now(),
                    topic=Topic.otros,
                    analysis_status=AnalysisStatus.pendiente
                )
                db.add(db_req)
                success += 1
                if success % 100 == 0: db.commit()
            except: continue
        
        db.commit()
        
        # --- LOG DE CALIDAD ---
        logger.info(f"📊 REPORTE DE IMPORTACIÓN: {success} registros.")
        logger.info(f"   📍 Ubicaciones detectadas: {loc_found}")
        logger.info(f"   ⚠️ Ubicaciones vacías/nan: {loc_missing}")
        
        if success > 0:
            background_tasks.add_task(ai_service.run_process_queue)

        return {
            "message": "Archivo cargado exitosamente.", 
            "imported": success, 
            "locations_found": loc_found,
            "status": "processing_started"
        }

    except Exception as e:
        logger.error(f"Error import: {e}")
        raise HTTPException(500, str(e))

@router.get("/stats/topics")
def get_topic_counts(db: Session = Depends(get_db)):
    results = db.query(CitizenRequest.topic, func.count(CitizenRequest.id)).group_by(CitizenRequest.topic).all()
    return {r[0].value: r[1] for r in results}

@router.patch("/{request_id}/analysis")
def update_request_analysis(
    request_id: str,
    analysis: RequestAnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.value != 'superadmin':
        raise HTTPException(status_code=403, detail="Solo admin")
    req = db.query(CitizenRequest).filter(CitizenRequest.id == request_id).first()
    if not req: raise HTTPException(status_code=404)
    
    if analysis.topic: req.topic = analysis.topic
    if analysis.urgency: req.urgency = analysis.urgency
    if analysis.sentiment: req.sentiment = analysis.sentiment
    if analysis.request_type: req.request_type = analysis.request_type
    if analysis.suggested_action: req.suggested_action = analysis.suggested_action
    
    db.commit()
    return {"message": "Análisis actualizado"}

@router.post("", response_model=RequestRead, status_code=201)
async def create_request(
    *,
    db: Session = Depends(get_db),
    request_in: RequestCreate,
    current_user: User = Depends(get_current_active_user)
):
    citizen_id = current_user.citizen_profile_id if current_user.role.value == 'citizen' else None
    request = await request_service.create_request(db, request_in, citizen_id)
    return request

@router.put("/{request_id}/status", response_model=RequestRead)
def update_request_status(
    *,
    db: Session = Depends(get_db),
    request_id: str,
    status_in: RequestUpdateStatus,
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role.value not in ['official', 'superadmin']:
        raise HTTPException(status_code=403, detail="No tienes permisos")
    request = request_service.update_status(db, request_id, status_in, official_id=str(current_user.id))
    if not request:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return request