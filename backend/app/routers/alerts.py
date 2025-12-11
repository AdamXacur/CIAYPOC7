from typing import List, Any
from fastapi import APIRouter

router = APIRouter(prefix="/alerts", tags=["Alertas"])

@router.get("/active")
def get_active_alerts() -> Any:
    """Devuelve alertas activas simuladas"""
    return [
        {"id": "1", "type": "critical", "message": "Pico de reportes en Kanasín", "topic": "Seguridad"}
    ]