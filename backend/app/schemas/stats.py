from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import date

class StatsFilter(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    dependency_id: Optional[str] = None
    topic: Optional[str] = None

class StatMetric(BaseModel):
    label: str
    value: int

# Restauramos TrendPoint para compatibilidad
class TrendPoint(BaseModel):
    date: str
    total: int

# Renombramos a DashboardStats (antes DashboardData) para que coincida con __init__.py
class DashboardStats(BaseModel):
    total_requests: int
    pending_count: int
    attended_count: int
    avg_response_time_hours: float
    
    # Gráficas
    requests_by_date: List[Dict[str, Any]] 
    requests_by_topic: List[StatMetric]    
    requests_by_dependency: List[StatMetric] 
    
    # Alertas
    active_alerts: List[str]