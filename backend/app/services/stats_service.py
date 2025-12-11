from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from datetime import datetime, timedelta, date
from app.models.requests import CitizenRequest, RequestStatus, Urgency
from app.models.organization import Department, Dependency
from app.schemas.stats import StatsFilter

class StatsService:
    def get_filtered_stats(self, db: Session, filters: StatsFilter):
        # 1. Base Query
        query = db.query(CitizenRequest)
        
        # 2. Aplicar Filtros
        if filters.start_date:
            query = query.filter(CitizenRequest.created_at >= filters.start_date)
        if filters.end_date:
            # Ajustar al final del día
            end_dt = datetime.combine(filters.end_date, datetime.max.time())
            query = query.filter(CitizenRequest.created_at <= end_dt)
        
        if filters.dependency_id:
            # Join complejo: Request -> Department -> Dependency
            query = query.join(CitizenRequest.department).join(Department.dependency)\
                         .filter(Dependency.id == filters.dependency_id)
        
        if filters.topic:
            query = query.filter(CitizenRequest.topic == filters.topic)

        # 3. KPIs Generales
        total = query.count()
        pending = query.filter(CitizenRequest.status.in_([RequestStatus.recibida, RequestStatus.en_revision])).count()
        attended = query.filter(CitizenRequest.status == RequestStatus.atendida).count()
        
        # 4. Agregación por Fecha (Tendencia)
        # Truncamos a día
        date_trunc = func.date_trunc('day', CitizenRequest.created_at)
        trends = db.query(
            date_trunc.label('date'),
            func.count(CitizenRequest.id).label('count')
        ).filter(CitizenRequest.created_at >= (datetime.now() - timedelta(days=30))) # Default últimos 30 días para gráfica
        
        if filters.dependency_id:
             trends = trends.join(CitizenRequest.department).join(Department.dependency).filter(Dependency.id == filters.dependency_id)
             
        trends = trends.group_by('date').order_by('date').all()
        
        trend_data = [{"date": t.date.strftime("%Y-%m-%d"), "solicitudes": t.count} for t in trends]

        # 5. Agregación por Tema
        topics = db.query(
            CitizenRequest.topic,
            func.count(CitizenRequest.id)
        )
        if filters.dependency_id:
             topics = topics.join(CitizenRequest.department).join(Department.dependency).filter(Dependency.id == filters.dependency_id)
        
        topics = topics.group_by(CitizenRequest.topic).all()
        topic_data = [{"label": t[0].value, "value": t[1]} for t in topics]

        # 6. Agregación por Dependencia (Top 5)
        deps = db.query(
            Dependency.acronym,
            func.count(CitizenRequest.id)
        ).join(Department.dependency).join(Department.requests)
        
        if filters.start_date: deps = deps.filter(CitizenRequest.created_at >= filters.start_date)
        
        deps = deps.group_by(Dependency.id).order_by(func.count(CitizenRequest.id).desc()).limit(5).all()
        dep_data = [{"label": d[0] or "S/N", "value": d[1]} for d in deps]

        # 7. Generación de Alertas (Lógica de Negocio)
        alerts = []
        # Regla: Más de 5 críticas sin atender
        critical_pending = db.query(CitizenRequest).filter(
            CitizenRequest.urgency == Urgency.critica,
            CitizenRequest.status != RequestStatus.atendida
        ).count()
        
        if critical_pending > 5:
            alerts.append(f"⚠️ ALERTA: Hay {critical_pending} solicitudes CRÍTICAS pendientes de atención.")
            
        # Regla: Pico de quejas en una zona (Simulado)
        # En producción haríamos un group by location_text having count > umbral

        return {
            "total_requests": total,
            "pending_count": pending,
            "attended_count": attended,
            "avg_response_time_hours": 24.5, # Simulado por ahora
            "requests_by_date": trend_data,
            "requests_by_topic": topic_data,
            "requests_by_dependency": dep_data,
            "active_alerts": alerts
        }

stats_service = StatsService()