import pandas as pd
import requests
import json
import time
import random
from datetime import datetime

# --- CONFIGURACIÓN ---
API_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "gobernador@yucatan.gob.mx"
ADMIN_PASS = "admin"
CSV_FILE = "datos_pnt.csv"
CHUNK_SIZE = 50 # Enviar de 50 en 50

def login():
    print("🔑 Iniciando sesión...")
    try:
        resp = requests.post(f"{API_URL}/auth/token", data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASS,
            "grant_type": "password"
        })
        if resp.status_code == 200:
            return resp.json()["access_token"]
        print(f"❌ Error login: {resp.text}")
    except Exception as e:
        print(f"❌ No hay conexión: {e}")
    return None

def clean_folio(folio_raw):
    return str(folio_raw).replace('=', '').replace('"', '').strip()

def map_status(pnt_status):
    s = str(pnt_status).lower()
    if "terminada" in s or "entregada" in s: return "Atendida"
    if "proceso" in s or "trámite" in s: return "En revisión"
    if "desechada" in s or "cancelada" in s: return "Rechazada"
    return "Recibida"

def parse_date(date_str):
    # Intentar parsear DD/MM/YYYY
    try:
        return datetime.strptime(str(date_str).strip(), "%d/%m/%Y").isoformat()
    except:
        return datetime.now().isoformat()

def import_data():
    token = login()
    if not token: return
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"📂 Leyendo {CSV_FILE}...")
    try:
        df = pd.read_csv(CSV_FILE, encoding='latin-1')
    except:
        print("❌ No se encontró el archivo datos_pnt.csv")
        return

    total_rows = len(df)
    print(f"📊 Total registros: {total_rows}. Iniciando carga por lotes de {CHUNK_SIZE}...")

    # Iterar por chunks
    for i in range(0, total_rows, CHUNK_SIZE):
        chunk = df.iloc[i:i+CHUNK_SIZE]
        batch_payload = []
        
        for _, row in chunk.iterrows():
            try:
                folio = clean_folio(row.get('FOLIO', ''))
                if not folio: continue
                
                desc = str(row.get('DESCRIPCIONSOLICITUD', 'Sin descripción'))
                resp_text = str(row.get('TEXTORESPUESTA', ''))
                status = map_status(row.get('ESTATUS', ''))
                date_created = parse_date(row.get('FECHASOLICITUD', ''))
                
                # Limpieza
                if pd.isna(desc) or desc == 'nan': desc = "Solicitud importada"
                if pd.isna(resp_text) or resp_text == 'nan': resp_text = None
                
                # Coordenadas aleatorias en Yucatán
                lat = 20.967 + (random.uniform(-0.1, 0.1))
                lon = -89.623 + (random.uniform(-0.1, 0.1))

                item = {
                    "folio": folio,
                    "description": desc[:2000],
                    "location_text": f"Importado PNT - {row.get('MUNICIPIO', 'Yucatán')}",
                    "latitude": lat,
                    "longitude": lon,
                    "status": status,
                    "official_response": resp_text[:2000] if resp_text else None,
                    "created_at": date_created
                }
                batch_payload.append(item)
            except:
                continue
        
        if batch_payload:
            # Enviar Lote
            r = requests.post(f"{API_URL}/requests/bulk", json=batch_payload, headers=headers)
            if r.status_code == 201:
                print(f"✅ Lote {i//CHUNK_SIZE + 1}: {r.json()['message']}")
            else:
                print(f"⚠️ Error en lote {i}: {r.text}")
        
        # Pequeña pausa para respirar
        time.sleep(0.1)

    print("\n🏁 Carga masiva finalizada.")

if __name__ == "__main__":
    import_data()