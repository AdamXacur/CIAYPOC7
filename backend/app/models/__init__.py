# Importar todos los modelos aquí para que SQLAlchemy los cree al inicio
from .base import Base
from .organization import Dependency, Department
from .users import User, CitizenProfile, UserRole
from .requests import CitizenRequest, GovAction, RequestStatus, Urgency, Sentiment, Topic
from .alerts import SystemAlert, AlertType
from .knowledge import KnowledgeItem, InteractionLog
# NUEVO: Historial de Chat
from .chat_history import ChatSession, ChatMessage