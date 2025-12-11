import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, UserRole
from app.core.security import get_password_hash
from app.routers import all_routers
from app.routers import chat

# Configuración de Logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    logger.info("🚀 Iniciando CRAC Backend...")
    
    # 0. Habilitar extensión pgvector en la base de datos
    try:
        with engine.connect() as connection:
            connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            connection.commit()
            logger.info("✅ Extensión 'vector' habilitada en PostgreSQL.")
    except Exception as e:
        logger.error(f"❌ Error habilitando pgvector: {e}")

    # 1. Crear Tablas
    Base.metadata.create_all(bind=engine)
    
    # 2. Crear Superadmin por defecto
    db = SessionLocal()
    try:
        superadmin_email = settings.DEFAULT_SUPERADMIN_EMAIL
        existing_admin = db.query(User).filter(User.email == superadmin_email).first()
        
        if not existing_admin:
            logger.info(f"🌱 Creando Superadmin por defecto: {superadmin_email}")
            superadmin = User(
                email=superadmin_email,
                hashed_password=get_password_hash(settings.DEFAULT_SUPERADMIN_PASSWORD),
                role=UserRole.superadmin,
                is_active=True
            )
            db.add(superadmin)
            db.commit()
        else:
            logger.info("✅ Superadmin ya existe.")
    except Exception as e:
        logger.error(f"❌ Error creando superadmin: {e}")
    finally:
        db.close()
    
    # 3. DEBUG: Imprimir rutas registradas para verificar 404s
    logger.info("🔍 Rutas registradas:")
    for route in app.routes:
        if hasattr(route, "path"):
            logger.info(f"   - {route.path} [{','.join(route.methods)}]")

# Incluir todos los routers
for router in all_routers:
    app.include_router(router, prefix=settings.API_V1_STR)

# Incluir router del Chatbot explícitamente
app.include_router(chat.router, prefix=settings.API_V1_STR)