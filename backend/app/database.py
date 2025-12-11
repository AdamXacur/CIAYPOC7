from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Crear el motor de conexión (Engine)
# pool_pre_ping=True ayuda a reconectar si la BD cierra la conexión
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True
)

# Fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Clase base para los modelos ORM
Base = declarative_base()

# Dependencia para inyección en FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()