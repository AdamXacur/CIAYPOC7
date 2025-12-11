import requests
import random
import time
import json
import os

# El script ahora es consciente de su entorno (Docker vs Local)
API_URL = os.getenv("INTERNAL_API_URL", "http://localhost:8000/api")

ADMIN_EMAIL = "gobernador@yucatan.gob.mx"
ADMIN_PASS = "admin"

DEPARTMENTS_TO_CREATE = [
    {"name": "Dirección de Servicios Públicos Municipales"},
    {"name": "Policía Municipal de Mérida"},
    {"name": "Policía Municipal de Kanasín"},
    {"name": "Jurisdicción Sanitaria No. 2"},
    {"name": "Instituto de Movilidad (IMDUT)"},
    {"name": "Secretaría de Seguridad Pública (SSP)"},
    {"name": "Atención Ciudadana General"}
]

SCENARIOS = [
    {"desc": "Bache profundo en la Avenida Paseo de Montejo.", "lat": 20.9845, "lon": -89.6185},
    {"desc": "Fuga de agua potable en Kanasín centro.", "lat": 20.9345, "lon": -89.5640},
    {"desc": "Acumulación de basura en el Malecón de Progreso.", "lat": 21.2845, "lon": -89.6620},
    {"desc": "Semáforo descompuesto en Ciudad Caucel.", "lat": 20.9980, "lon": -89.7150},
    {"desc": "Solicitud de fumigación en Valladolid.", "lat": 20.6890, "lon": -88.2020}
]

def run_simulation():
    print(f"🚀 INICIANDO SIMULACIÓN (Apuntando a: {API_URL})...")
    
    # --- FIX: Lógica de Reintentos para el Login ---
    token = None
    headers = {}
    for i in range(5): # Intentar 5 veces
        print(f"🔑 Autenticando (Intento {i+1}/5)...")
        try:
            resp = requests.post(
                f"{API_URL}/auth/token", 
                data={"username": ADMIN_EMAIL, "password": ADMIN_PASS, "grant_type": "password"},
                timeout=5 # Esperar 5 segundos por respuesta
            )
            if resp.status_code == 200:
                token = resp.json()["access_token"]
                headers = {"Authorization": f"Bearer {token}"}
                print("✅ Login exitoso.")
                break
            else:
                print(f"   ⚠️ Servidor respondió {resp.status_code}. Reintentando en 2s...")
        except requests.exceptions.RequestException:
            print("   ⚠️ Servidor no responde. Reintentando en 2s...")
        
        time.sleep(2)

    if not token:
        print("❌ FATAL: No se pudo autenticar tras varios intentos.")
        print("   Asegúrate de que el servidor esté corriendo con 'docker-compose up -d backend'")
        return
    # ---------------------------------------------

    print("\n🏗️  Construyendo infraestructura administrativa...")
    dep_id = None
    try:
        r = requests.post(f"{API_URL}/dependencies", json={"name": "Gobierno del Estado", "acronym": "GOY", "admin_email": f"admin.goy.{random.randint(100,999)}@yucatan.gob.mx", "admin_password": "admin"}, headers=headers)
        if r.status_code == 201: dep_id = r.json()["id"]
        else: 
            r = requests.get(f"{API_URL}/dependencies", headers=headers)
            if r.json(): dep_id = r.json()[0]["id"]
    except: pass

    if dep_id:
        for dept in DEPARTMENTS_TO_CREATE:
            requests.post(f"{API_URL}/departments", json={"name": dept["name"], "dependency_id": dep_id, "is_public_facing": True}, headers=headers)
        print("✅ Departamentos operativos listos.")

    print("\n📡 Enviando reportes ciudadanos...")
    for i, case in enumerate(SCENARIOS):
        payload = {"description": case["desc"], "latitude": case["lat"], "longitude": case["lon"], "location_text": "Ubicación GPS"}
        
        r = requests.post(f"{API_URL}/requests", json=payload, headers=headers)
        if r.status_code == 201:
            data = r.json()
            print(f"   📝 [{i+1}/{len(SCENARIOS)}] Folio: {data['folio']}")
            dept = data.get('department_name')
            zone = data.get('location_text')
            status_icon = "✅" if dept else "⚠️"
            print(f"      {status_icon} Ruteo: {dept or 'Sin Asignar'}")
            print(f"      📍 Zona: {zone}")
        else:
            print(f"   ❌ Error: {r.text}")
        time.sleep(0.5)

    print("\n✨ SIMULACIÓN COMPLETADA.")

if __name__ == "__main__":
    run_simulation()