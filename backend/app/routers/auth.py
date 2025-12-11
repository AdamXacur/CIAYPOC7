from datetime import timedelta
from typing import Any  # <--- CORRECCIÓN: Se agregó Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.database import get_db
from app.models.users import User, UserRole, CitizenProfile
from app.schemas.auth import Token, UserCreate, CitizenRegister

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/token", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires,
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": user.role,
        "user_name": user.email
    }

@router.post("/citizen/register", response_model=Token, status_code=201)
def register_citizen(
    *,
    db: Session = Depends(get_db),
    citizen_in: CitizenRegister,
) -> Any:
    """
    Registro abierto para ciudadanos.
    """
    user = db.query(User).filter(User.email == citizen_in.email).first()
    if user:
        raise HTTPException(
            status_code=409,
            detail="El email ya está registrado",
        )
        
    # 1. Crear Perfil
    profile = CitizenProfile(
        full_name=citizen_in.full_name,
        curp=citizen_in.curp,
        phone=citizen_in.phone,
        municipality=citizen_in.municipality
    )
    db.add(profile)
    db.flush() # Obtener ID
    
    # 2. Crear Usuario
    user = User(
        email=citizen_in.email,
        hashed_password=security.get_password_hash(citizen_in.password),
        role=UserRole.citizen,
        citizen_profile_id=profile.id
    )
    db.add(user)
    db.commit()
    
    # 3. Auto-login
    access_token = security.create_access_token(
        data={"sub": str(user.id), "role": "citizen"}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_role": UserRole.citizen,
        "user_name": citizen_in.full_name
    }