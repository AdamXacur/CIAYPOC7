import uuid
import enum
from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from .base import Base

class UserRole(enum.Enum):
    superadmin = "superadmin" # Gobernador / Admin Sistema
    official = "official"     # Funcionario de Dependencia
    citizen = "citizen"       # Ciudadano

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLAlchemyEnum(UserRole), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relaciones Jerárquicas (RBAC)
    dependency_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("dependencies.id"), nullable=True)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("departments.id"), nullable=True)
    
    # Perfil Ciudadano (Solo si role == citizen)
    citizen_profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("citizen_profiles.id"), nullable=True, unique=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relaciones ORM
    dependency: Mapped[Optional["Dependency"]] = relationship(back_populates="users")
    department: Mapped[Optional["Department"]] = relationship(back_populates="officials")
    profile: Mapped[Optional["CitizenProfile"]] = relationship(back_populates="user_account")

class CitizenProfile(Base):
    """
    Datos demográficos del ciudadano. Separado del usuario para privacidad.
    """
    __tablename__ = "citizen_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    curp: Mapped[Optional[str]] = mapped_column(String(18), unique=True, index=True, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    municipality: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user_account: Mapped["User"] = relationship(back_populates="profile")
    requests: Mapped[List["CitizenRequest"]] = relationship(back_populates="citizen")