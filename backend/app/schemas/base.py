from pydantic import BaseModel, ConfigDict
from uuid import UUID

class BaseSchema(BaseModel):
    """Configuración base para todos los schemas"""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        arbitrary_types_allowed=True # Permitir tipos complejos como UUID
    )