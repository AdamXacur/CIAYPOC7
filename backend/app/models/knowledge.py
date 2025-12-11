from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
import uuid
from app.database import Base

class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(String, index=True, default="general") 
    topic = Column(String, index=True)
    content = Column(Text, nullable=False)
    source_filename = Column(String, nullable=True)
    
    # Google Gemini Embedding (Dimensiones reducidas a 768 para eficiencia)
    embedding: Mapped[Vector] = mapped_column(Vector(768), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InteractionLog(Base):
    __tablename__ = "interaction_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String, index=True)
    user_input = Column(Text)
    bot_response = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())