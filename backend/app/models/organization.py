import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from .base import Base

class Dependency(Base):
    __tablename__ = "dependencies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True)
    acronym: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    
    admin_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # CORRECCIÓN: cascade="all, delete-orphan" permite borrar la dependencia y sus hijos
    departments: Mapped[List["Department"]] = relationship(back_populates="dependency", cascade="all, delete-orphan")
    gov_actions: Mapped[List["GovAction"]] = relationship(back_populates="dependency", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship(back_populates="dependency", cascade="all, delete-orphan")

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    dependency_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dependencies.id", ondelete="CASCADE"), nullable=False)
    
    is_public_facing: Mapped[bool] = mapped_column(Boolean, default=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dependency: Mapped["Dependency"] = relationship(back_populates="departments")
    officials: Mapped[List["User"]] = relationship(back_populates="department", cascade="all, delete-orphan")
    requests: Mapped[List["CitizenRequest"]] = relationship(back_populates="department")