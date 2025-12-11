from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.stats import DashboardStats, StatsFilter
from app.services.stats_service import stats_service
from typing import Optional, List, Any
from datetime import date

router = APIRouter(prefix="/stats", tags=["Analítica"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    dependency_id: Optional[str] = None,
    topic: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    KPIs principales con filtros dinámicos.
    """
    filters = StatsFilter(
        start_date=start_date,
        end_date=end_date,
        dependency_id=dependency_id,
        topic=topic
    )
    return stats_service.get_filtered_stats(db, filters)

# --- ENDPOINT RESTAURADO PARA PASAR EL TEST ---
@router.get("/trends")
def get_trends(db: Session = Depends(get_db)) -> List[Any]:
    """
    Endpoint legacy para gráficas de tendencia.
    """
    # Reutilizamos la lógica del servicio, extrayendo solo la parte de fechas
    stats = stats_service.get_filtered_stats(db, StatsFilter())
    return stats["requests_by_date"]