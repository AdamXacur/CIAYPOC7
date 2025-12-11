from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.requests import RequestStatus, Topic, Urgency, Sentiment, RequestType, AnalysisStatus
from .base import BaseSchema

# --- Crear Solicitud (Ciudadano) ---
class RequestCreate(BaseSchema):
    description: str = Field(..., min_length=10)
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_url: Optional[str] = None
    department_id: Optional[str] = None 

# --- Schema para Importación Masiva (PNT) ---
class RequestImport(BaseSchema):
    folio: str
    description: str
    location_text: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: RequestStatus = RequestStatus.recibida
    official_response: Optional[str] = None
    created_at: Optional[datetime] = None

# --- Actualizar Estatus (Funcionario) ---
class RequestUpdateStatus(BaseSchema):
    status: RequestStatus
    official_response: Optional[str] = None
    internal_notes: Optional[str] = None
    evidence_url: Optional[str] = None

# --- Actualizar Análisis (IA) ---
class RequestAnalysisUpdate(BaseSchema):
    topic: Optional[Topic] = None
    urgency: Optional[Urgency] = None
    sentiment: Optional[Sentiment] = None
    request_type: Optional[RequestType] = None
    suggested_action: Optional[str] = None

# --- Leer Solicitud (Dashboard/Tracker) ---
class RequestRead(BaseSchema):
    id: UUID
    folio: str
    created_at: datetime
    description: str
    location_text: Optional[str] = None
    status: RequestStatus
    
    # Campos IA (Hacemos opcionales los nuevos para evitar errores de validación)
    topic: Optional[Topic] = Topic.otros
    urgency: Optional[Urgency] = Urgency.media
    sentiment: Optional[Sentiment] = Sentiment.neutro
    request_type: Optional[RequestType] = None # <--- AHORA ES OPCIONAL
    suggested_action: Optional[str] = None
    analysis_status: Optional[AnalysisStatus] = AnalysisStatus.pendiente
    
    department_id: Optional[UUID] = None
    department_name: Optional[str] = None
    dependency_name: Optional[str] = None
    
    official_response: Optional[str] = None
    closed_at: Optional[datetime] = None
    timeline: Optional[List[Dict[str, Any]]] = None

class RequestFilter(BaseSchema):
    status: Optional[RequestStatus] = None
    topic: Optional[Topic] = None
    urgency: Optional[Urgency] = None
    sentiment: Optional[Sentiment] = None
    request_type: Optional[RequestType] = None
    search: Optional[str] = None