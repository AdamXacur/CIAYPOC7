import asyncio
import random
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, CitizenRequest, User, UserRole, CitizenProfile
from datetime import datetime
from sqlalchemy import func

# Coordenadas de Mérida y colonias de ejemplo
MERIDA_ZONES = {
    "Centro": (20.9674, -89.6243),
    "Norte": (20.9943, -89.6221),
    "Poniente": (20.9732, -89.6512),
    "Oriente": (20.9651, -89.5923),
    "Sur": (20.9345, -89.6198)
}
NUM_REQUESTS = 300

REQUESTS_EXAMPLES = [
    {"desc": "Bache enorme", "topic": "servicios", "urgency": "alta"},
    {"desc": "Luminaria apagada", "topic": "servicios", "urgency": "media"},
    {"desc": "Fuga de agua potable", "topic": "servicios", "urgency": "critica"},
    {"desc": "Semáforo no funciona", "topic": "seguridad", "urgency": "alta"},
    {"desc": "Piden 'mordida' en retén", "topic": "seguridad", "urgency": "critica"},
    {"desc": "Parque con basura acumulada", "topic": "servicios", "urgency": "media"},
]

def generate_random_coords(lat, lon, radius=0.02):
    new_lat = lat + random.uniform(-radius, radius)
    new_lon = lon + random.uniform(-radius, radius)
    return new_lat, new_lon

async def seed_data():
    print(f"🔥 Iniciando sembrado de {NUM_REQUESTS} puntos de calor para Mérida...")
    db: Session = SessionLocal()
    
    try:
        # Crear un ciudadano de prueba si no existe
        citizen_user = db.query(User).filter(User.email == "heatmap.demo@test.com").first()
        if not citizen_user:
            profile = CitizenProfile(full_name="Ciudadano Heatmap")
            db.add(profile)
            db.flush()
            citizen_user = User(email="heatmap.demo@test.com", hashed_password="123", role=UserRole.citizen, citizen_profile_id=profile.id)
            db.add(citizen_user)
            db.flush()
        
        # Crear solicitudes masivas
        year = datetime.now().year
        
        for i in range(NUM_REQUESTS):
            folio = f"HEATMAP-{year}-{str(i + 1).zfill(5)}"
            if db.query(CitizenRequest).filter(CitizenRequest.folio == folio).first():
                continue

            # Elegir una zona aleatoria y generar coordenadas
            zone_name, (lat, lon) = random.choice(list(MERIDA_ZONES.items()))
            rand_lat, rand_lon = generate_random_coords(lat, lon)
            
            sample = random.choice(REQUESTS_EXAMPLES)
            urgency = random.choices(['baja', 'media', 'alta', 'critica'], weights=[10, 30, 40, 20], k=1)[0]

            new_request = CitizenRequest(
                folio=folio,
                description=f"{sample['desc']} en {zone_name}",
                topic=sample["topic"],
                urgency=urgency,
                latitude=rand_lat,
                longitude=rand_lon,
                location_text=f"Colonia en {zone_name}, Mérida",
                citizen_id=citizen_user.profile.id,
            )
            db.add(new_request)
        
        db.commit()
        print(f"✅ Sembrado completado. {NUM_REQUESTS} solicitudes creadas.")

    except Exception as e:
        print(f"❌ Error durante el sembrado: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    asyncio.run(seed_data())