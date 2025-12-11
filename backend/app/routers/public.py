from typing import Any  # <--- CORRECCIÓN: Se agregó Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.requests import CitizenRequest
from app.schemas.requests import RequestRead

router = APIRouter(prefix="/public", tags=["Acceso Público"])

@router.get("/requests/{folio}", response_model=RequestRead)
def track_request(
    folio: str,
    db: Session = Depends(get_db)
) -> Any:
    """
    Rastreador ciudadano público.
    Busca por folio exacto (ej: YUC-2024-001).
    """
    request = db.query(CitizenRequest).filter(CitizenRequest.folio == folio).first()
    if not request:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return request