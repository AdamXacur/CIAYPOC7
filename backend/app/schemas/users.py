from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.models.users import UserRole

# Schema para crear usuarios administrativos (Superadmin crea a otros)
class UserCreateAdmin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: UserRole
    dependency_id: Optional[str] = None # Solo si es Official
    department_id: Optional[str] = None # Opcional

class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    password: Optional[str] = None
    full_name: Optional[str] = None

class UserList(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    is_active: bool
    dependency_name: Optional[str] = None
    
    class Config:
        from_attributes = True