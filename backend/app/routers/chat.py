from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.chat_service import chat_service
from app.core.deps import get_current_active_user
from app.models.chat_history import ChatSession, ChatMessage
from app.models.users import User
import uuid

router = APIRouter(prefix="/chat", tags=["Asistente IA"])

class ChatMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class SessionRead(BaseModel):
    id: uuid.UUID
    title: str
    created_at: str

    class Config:
        from_attributes = True

class MessageRead(BaseModel):
    role: str
    content: str

# --- 1. Crear Nueva Sesión ---
@router.post("/sessions", response_model=SessionRead)
def create_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    new_session = ChatSession(user_id=current_user.id, title="Nueva conversación")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    # Convertir datetime a string para evitar errores de pydantic simple
    return {
        "id": new_session.id, 
        "title": new_session.title, 
        "created_at": new_session.created_at.isoformat()
    }

# --- 2. Listar Sesiones ---
@router.get("/sessions", response_model=List[SessionRead])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sessions = db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.updated_at.desc()).all()
    return [
        {"id": s.id, "title": s.title, "created_at": s.created_at.isoformat() if s.created_at else ""} 
        for s in sessions
    ]

# --- 3. Obtener Mensajes de una Sesión ---
@router.get("/sessions/{session_id}/messages", response_model=List[MessageRead])
def get_session_messages(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verificar propiedad
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    return session.messages

# --- 4. Chat Stream (Con Guardado) ---
@router.post("/stream")
async def chat_stream(
    body: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Si no hay session_id, creamos una al vuelo (o fallamos, pero mejor crear)
    session_id = body.session_id
    if not session_id:
        new_session = ChatSession(user_id=current_user.id, title=body.message[:30] + "...")
        db.add(new_session)
        db.commit()
        session_id = str(new_session.id)
    
    # Guardar mensaje del usuario
    user_msg = ChatMessage(session_id=session_id, role="user", content=body.message)
    db.add(user_msg)
    db.commit()

    # Generador que guarda la respuesta al final
    async def stream_with_save():
        full_response = ""
        # Usamos el generador del servicio
        async for chunk in chat_service.get_chat_response(db, body.message):
            full_response += chunk
            yield chunk
        
        # Al terminar, guardar respuesta del bot
        # Necesitamos una nueva sesión de DB porque el generador es asíncrono y la anterior puede haberse cerrado
        # (Simplificación: Usamos la misma si el scope lo permite, o creamos una nueva manual)
        # Para evitar líos de async db en este POC, usaremos un hack simple:
        # En producción usaríamos AsyncSession
        try:
            from app.database import SessionLocal
            db_save = SessionLocal()
            bot_msg = ChatMessage(session_id=session_id, role="bot", content=full_response)
            db_save.add(bot_msg)
            
            # Actualizar título si es "Nueva conversación"
            session = db_save.query(ChatSession).filter(ChatSession.id == session_id).first()
            if session and session.title == "Nueva conversación":
                session.title = body.message[:40] + "..."
            
            db_save.commit()
            db_save.close()
        except Exception as e:
            print(f"Error guardando historial: {e}")

    return StreamingResponse(stream_with_save(), media_type="text/plain")

# --- 5. Borrar Sesión ---
@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    
    db.delete(session)
    db.commit()
    return {"message": "Sesión eliminada"}