from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CRAC - Atención Ciudadana Yucatán"
    API_V1_STR: str = "/api"
    
    # Base de Datos
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    # Seguridad
    SECRET_KEY: str
    # CAMBIO: Aumentado a 7 días (10080 minutos) para evitar desconexiones en desarrollo
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080 
    ALGORITHM: str = "HS256"

    # Superadmin
    DEFAULT_SUPERADMIN_EMAIL: str
    DEFAULT_SUPERADMIN_PASSWORD: str

    # CORS
    FRONTEND_BASE_URL: str
    
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return ["http://localhost:3000", self.FRONTEND_BASE_URL]

    # IA Generativa (DeepSeek)
    AI_PROVIDER: str = "deepseek"
    DEEPSEEK_API_KEY: str
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"
    DEEPSEEK_MODEL: str = "deepseek-chat"

    # Embeddings (Google)
    GOOGLE_API_KEY: str
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()