import uuid
import enum
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLAlchemyEnum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from .base import Base
from .requests import Topic

class AlertType(enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"

class SystemAlert(Base):
    """
    RF-W-05: Alertas visuales generadas por el sistema.
    """
    __tablename__ = "system_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type: Mapped[AlertType] = mapped_column(SQLAlchemyEnum(AlertType), nullable=False)
    
    # CAMBIO: Aumentamos a Text para permitir nombres de patrones largos
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    related_topic: Mapped[Optional[Topic]] = mapped_column(SQLAlchemyEnum(Topic), nullable=True)
    
    # CAMBIO CRÍTICO: Cambiamos String(100) a Text para que quepa la "Causa Raíz" de la IA
    region: Mapped[Optional[str]] = mapped_column(Text, nullable=True) 
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    dismissed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)