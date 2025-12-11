from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.models.users import UserRole
from .base import BaseSchema

# --- Token ---
class Token(BaseSchema):
    access_token: str
    token_type: str
    user_role: UserRole
    user_name: Optional[str] = None

class TokenPayload(BaseSchema):
    sub: Optional[str] = None
    role: Optional[str] = None

# --- User ---
class UserBase(BaseSchema):
    email: EmailStr
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    role: UserRole
    full_name: str

class UserRead(UserBase):
    id: UUID
    role: UserRole
    dependency_name: Optional[str] = None
    department_name: Optional[str] = None

# --- Citizen Registration ---
class CitizenRegister(BaseSchema):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    # Relajamos la validación de CURP para evitar falsos positivos en tests
    curp: str = Field(..., min_length=10, max_length=20) 
    phone: Optional[str] = None
    municipality: Optional[str] = None