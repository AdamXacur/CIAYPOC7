import uuid
import enum
from datetime import datetime
from typing import Optional, Dict, List
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLAlchemyEnum, Text, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from .base import Base

# Enums Existentes
class RequestStatus(str, enum.Enum):
    recibida = "Recibida"
    en_revision = "En revisión"
    atendida = "Atendida"
    rechazada = "Rechazada"

class Urgency(str, enum.Enum):
    baja = "Baja"
    media = "Media"
    alta = "Alta"
    critica = "Crítica"

class Sentiment(str, enum.Enum):
    positivo = "Positivo"
    neutro = "Neutro"
    negativo = "Negativo"

class Topic(str, enum.Enum):
    seguridad = "Seguridad"
    salud = "Salud"
    transporte = "Transporte"
    servicios = "Servicios Públicos"
    educacion = "Educación"
    transparencia = "Transparencia" # Nuevo
    otros = "Otros"

# --- NUEVOS ENUMS PARA LA LÓGICA DE VICTORIA ---
class RequestType(str, enum.Enum):
    administrativa = "ADMINISTRATIVA" # Papeles, info
    operativa = "OPERATIVA"           # Acción de campo
    desconocida = "DESCONOCIDA"

class AnalysisStatus(str, enum.Enum):
    pendiente = "PENDIENTE"
    procesando = "PROCESANDO"
    completado = "COMPLETADO"
    error = "ERROR"

class GovAction(Base):
    __tablename__ = "gov_actions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    dependency_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dependencies.id"), nullable=False)
    related_topic: Mapped[Topic] = mapped_column(SQLAlchemyEnum(Topic, name="topic_enum", native_enum=False), nullable=True)
    dependency: Mapped["Dependency"] = relationship(back_populates="gov_actions")
    requests: Mapped[List["CitizenRequest"]] = relationship(back_populates="gov_action")

class CitizenRequest(Base):
    __tablename__ = "citizen_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    folio: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # Aumentado a 50 por si acaso
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location_text: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    evidence_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    
    # Clasificación IA
    topic: Mapped[Topic] = mapped_column(SQLAlchemyEnum(Topic, name="topic_enum", native_enum=False), default=Topic.otros)
    sentiment: Mapped[Sentiment] = mapped_column(SQLAlchemyEnum(Sentiment, name="sentiment_enum", native_enum=False), default=Sentiment.neutro)
    urgency: Mapped[Urgency] = mapped_column(SQLAlchemyEnum(Urgency, name="urgency_enum", native_enum=False), default=Urgency.media)
    
    # --- NUEVOS CAMPOS IA ---
    request_type: Mapped[RequestType] = mapped_column(SQLAlchemyEnum(RequestType, name="req_type_enum", native_enum=False), default=RequestType.desconocida)
    suggested_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analysis_status: Mapped[AnalysisStatus] = mapped_column(SQLAlchemyEnum(AnalysisStatus, name="analysis_status_enum", native_enum=False), default=AnalysisStatus.pendiente, index=True)
    # ------------------------

    status: Mapped[RequestStatus] = mapped_column(SQLAlchemyEnum(RequestStatus, name="status_enum", native_enum=False), default=RequestStatus.recibida)
    
    official_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    timeline: Mapped[Optional[Dict]] = mapped_column(JSON, default=list)

    citizen_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("citizen_profiles.id"), nullable=True)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    gov_action_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("gov_actions.id"), nullable=True)

    citizen: Mapped[Optional["CitizenProfile"]] = relationship(back_populates="requests")
    department: Mapped[Optional["Department"]] = relationship(back_populates="requests")
    gov_action: Mapped[Optional["GovAction"]] = relationship(back_populates="requests")

    @property
    def department_name(self) -> Optional[str]:
        return self.department.name if self.department else None
    
    @property
    def dependency_name(self) -> Optional[str]:
        return self.department.dependency.name if self.department and self.department.dependency else None