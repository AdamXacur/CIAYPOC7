from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from .base import BaseSchema

# --- Dependency (Secretaría) ---
class DependencyBase(BaseSchema):
    name: str
    acronym: Optional[str] = None
    contact_phone: Optional[str] = None
    website_url: Optional[str] = None

class DependencyCreate(DependencyBase):
    admin_email: EmailStr
    admin_password: str = Field(..., min_length=6)

class DependencyRead(DependencyBase):
    id: UUID
    slug: str
    is_active: bool
    created_at: datetime

# --- Department (Dirección) ---
class DepartmentBase(BaseSchema):
    name: str
    is_public_facing: bool = True
    contact_email: Optional[EmailStr] = None

class DepartmentCreate(DepartmentBase):
    dependency_id: UUID # Cambiado a UUID para validación correcta
    official_email: Optional[EmailStr] = None
    official_password: Optional[str] = None

class DepartmentRead(DepartmentBase):
    id: UUID
    dependency_name: Optional[str] = None
    dependency_id: UUID # <--- AGREGADO para que pase el test