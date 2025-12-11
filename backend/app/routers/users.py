from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.users import User, UserRole, CitizenProfile
from app.models.organization import Dependency
from app.schemas.users import UserCreateAdmin, UserList, UserUpdate
from app.core.deps import get_current_active_user
from app.core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Gestión de Usuarios"])

# Dependencia para verificar que sea Superadmin
def check_superadmin(current_user: User = Depends(get_current_active_user)):
    if current_user.role != UserRole.superadmin:
        raise HTTPException(status_code=403, detail="Requiere privilegios de Superadministrador")
    return current_user

@router.get("", response_model=List[UserList])
def list_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_superadmin)
):
    """Listar usuarios con filtros."""
    query = db.query(User).options(joinedload(User.dependency))
    
    if role:
        query = query.filter(User.role == role)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(User.email.ilike(search_term))
        
    return query.all()

@router.post("", response_model=UserList)
def create_user(
    user_in: UserCreateAdmin,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_superadmin)
):
    """Crear un nuevo usuario administrativo."""
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Crear perfil dummy si es necesario para mantener consistencia, 
    # o simplemente dejar citizen_profile_id en null para admins.
    
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        is_active=True,
        dependency_id=user_in.dependency_id if user_in.role == UserRole.official else None
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserList)
def update_user(
    user_id: str,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_superadmin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = get_password_hash(user_in.password)
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_superadmin)
):
    """Borrado lógico (Desactivar) o físico si se prefiere."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Evitar auto-borrado
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes borrar tu propia cuenta")

    db.delete(user)
    db.commit()
    return {"message": "Usuario eliminado"}