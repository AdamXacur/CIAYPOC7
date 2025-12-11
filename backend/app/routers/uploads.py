import uuid
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Directorio donde se guardarán las imágenes
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("")
async def upload_file(file: UploadFile = File(...)):
    """
    Recibe un archivo, lo guarda con un nombre único y devuelve la URL para acceder a él.
    """
    # Validar tipo de archivo (simple)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes.")

    # Generar nombre de archivo único
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Guardar el archivo
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception:
        raise HTTPException(status_code=500, detail="No se pudo guardar el archivo.")

    # Devolver la URL pública para acceder al archivo
    return {"file_url": f"/api/uploads/{unique_filename}"}

@router.get("/{filename}")
async def get_file(filename: str):
    """
    Sirve un archivo guardado desde el directorio de uploads.
    """
    file_path = UPLOAD_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado.")
    return FileResponse(file_path)