import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.requests import CitizenRequest, RequestStatus
from app.models.organization import Department
from app.schemas.requests import RequestCreate, RequestUpdateStatus
from app.services.ai_service import ai_service
from app.services.routing_service import routing_service # <--- IMPORTANTE

class RequestService:
    def generate_folio(self, db: Session) -> str:
        year = datetime.now().year
        count = db.query(func.count(CitizenRequest.id)).scalar() or 0
        return f"YUC-{year}-{str(count + 1).zfill(5)}"

    async def create_request(self, db: Session, request_in: RequestCreate, citizen_id: uuid.UUID) -> CitizenRequest:
        # 1. Generar Folio
        folio = self.generate_folio(db)
        
        # 2. Clasificar con IA
        ai_data = await ai_service.classify_request(request_in.description)
        topic = ai_data.get("topic")
        
        # 3. RUTEO INTELIGENTE (El Eslabón Perdido)
        dept_id = None
        detected_zone = None
        
        # Si hay coordenadas, usamos el RoutingService
        if request_in.latitude and request_in.longitude:
            # A. Detectar Municipio
            detected_zone = routing_service.get_zone_from_coords(request_in.latitude, request_in.longitude)
            
            if detected_zone:
                # B. Determinar nombre del departamento responsable
                target_dept_name = routing_service.get_department_for_request(detected_zone, topic)
                
                # C. Buscar ese departamento en la BD para obtener su UUID
                if target_dept_name:
                    dept_obj = db.query(Department).filter(Department.name == target_dept_name).first()
                    if dept_obj:
                        dept_id = dept_obj.id
        
        # Si el usuario mandó un ID manual (y no lo sobreescribimos), úsalo
        if not dept_id and request_in.department_id:
            try:
                dept_id = uuid.UUID(request_in.department_id)
            except: pass

        # Enriquecer la ubicación con el municipio detectado
        final_location = request_in.location_text
        if detected_zone:
            final_location = f"{final_location} [{detected_zone}]"

        # 4. Crear Objeto
        db_request = CitizenRequest(
            folio=folio,
            description=request_in.description,
            location_text=final_location,
            latitude=request_in.latitude,
            longitude=request_in.longitude,
            evidence_url=request_in.evidence_url,
            citizen_id=citizen_id,
            department_id=dept_id, # <--- Aquí va el ID calculado
            # Datos IA
            topic=topic,
            sentiment=ai_data.get("sentiment"),
            urgency=ai_data.get("urgency"),
            # Timeline
            timeline=[{
                "action": "created",
                "timestamp": datetime.now().isoformat(),
                "note": f"Recibido. Clasificado como {topic}. Zona detectada: {detected_zone or 'Desconocida'}."
            }]
        )
        
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request

    def update_status(self, db: Session, request_id: str, update_data: RequestUpdateStatus, official_id: str) -> CitizenRequest:
        request = db.query(CitizenRequest).filter(CitizenRequest.id == request_id).first()
        if not request:
            return None
            
        request.status = update_data.status
        if update_data.official_response:
            request.official_response = update_data.official_response
        if update_data.internal_notes:
            request.internal_notes = update_data.internal_notes
            
        new_event = {
            "action": "status_change",
            "new_status": update_data.status.value,
            "timestamp": datetime.now().isoformat(),
            "official_id": str(official_id)
        }
        timeline = list(request.timeline) if request.timeline else []
        timeline.append(new_event)
        request.timeline = timeline
        
        if update_data.status == RequestStatus.atendida:
            request.closed_at = datetime.now()
            
        db.commit()
        db.refresh(request)
        return request

request_service = RequestService()