from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.requests import CitizenRequest
import csv
import io
from datetime import datetime

router = APIRouter(prefix="/reports", tags=["Reportes"])

@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    """
    Genera y descarga un CSV con las últimas 1000 solicitudes registradas.
    """
    # 1. Consultar datos reales (Limitamos a 1000 para el POC para ser rápidos)
    requests = db.query(CitizenRequest).order_by(CitizenRequest.created_at.desc()).limit(1000).all()

    # 2. Crear archivo en memoria (StringIO)
    output = io.StringIO()
    writer = csv.writer(output)

    # 3. Escribir Encabezados
    writer.writerow([
        "Folio", 
        "Fecha Creación", 
        "Hora", 
        "Tema", 
        "Estatus", 
        "Urgencia", 
        "Sentimiento",
        "Dependencia Asignada", 
        "Descripción", 
        "Ubicación"
    ])

    # 4. Escribir Filas
    for r in requests:
        # Manejo seguro de relaciones nulas
        dept_name = r.department.name if r.department else "Sin asignar"
        
        # Obtener valores de Enums si es necesario
        topic = r.topic.value if hasattr(r.topic, 'value') else r.topic
        status = r.status.value if hasattr(r.status, 'value') else r.status
        urgency = r.urgency.value if hasattr(r.urgency, 'value') else r.urgency
        sentiment = r.sentiment.value if hasattr(r.sentiment, 'value') else r.sentiment

        writer.writerow([
            r.folio,
            r.created_at.strftime("%Y-%m-%d"),
            r.created_at.strftime("%H:%M:%S"),
            topic,
            status,
            urgency,
            sentiment,
            dept_name,
            r.description.replace("\n", " "), # Limpiar saltos de línea para no romper el CSV
            r.location_text
        ])

    # Preparar el puntero al inicio del archivo
    output.seek(0)

    # 5. Retornar como Stream (Descarga)
    filename = f"reporte_crac_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    
    response = StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = f"attachment; filename={filename}"
    
    return response