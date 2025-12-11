import sys
import os
import json
import time
import pandas as pd
import io
from openai import OpenAI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# --- CONFIGURACIÓN ---
# Ajusta esto si tu archivo se llama diferente dentro del contenedor
CSV_PATH = "/app/datos_pnt.CSV" 
DB_URL = "postgresql://postgres:postgres@db:5432/crac_db"
DEEPSEEK_KEY = "sk-5e903e801ca641169ab9406cc1491b2e" # Tu Key
CHUNK_SIZE = 15 # Lotes pequeños para asegurar respuesta

# Setup Entorno
sys.path.append(os.getcwd())
from app.models.requests import CitizenRequest, RequestStatus, Topic, Urgency, Sentiment
from app.models.alerts import SystemAlert, AlertType

# Setup DB y AI
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)
client = OpenAI(api_key=DEEPSEEK_KEY, base_url="https://api.deepseek.com")

def clean_text(text):
    if pd.isna(text): return ""
    return str(text).replace('"', '').replace("'", "").strip()[:500]

def get_ai_analysis(batch_data):
    """Envía el lote a DeepSeek y retorna JSON"""
    prompt = f"""
    Actúa como un Analista de Gobierno experto en ITIL.
    Analiza estas solicitudes ciudadanas.
    
    TU OBJETIVO:
    1. Clasificar cada solicitud (Topic, Urgency, Sentiment).
    2. Detectar si hay un patrón sistémico en este grupo.

    DATOS DE ENTRADA:
    {json.dumps(batch_data, ensure_ascii=False)}

    REGLAS:
    - Topics: [Seguridad, Salud, Transporte, Servicios Públicos, Educación, Otros]
    - Urgency: [Baja, Media, Alta, Crítica]
    - Sentiment: [Positivo, Neutro, Negativo]

    FORMATO JSON DE SALIDA (OBLIGATORIO):
    {{
        "classifications": [
            {{ "folio": "...", "topic": "...", "urgency": "...", "sentiment": "...", "summary": "..." }}
        ],
        "pattern_detected": {{
            "exists": true/false,
            "name": "Nombre del problema (ej. Falla Red Kanasín)",
            "description": "Explicación breve"
        }}
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0,
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"   ❌ Error IA: {e}")
        return None

def process_file():
    print(f"🚀 INICIANDO PROCESADOR AUTÓNOMO")
    print(f"📂 Leyendo archivo: {CSV_PATH}")
    
    # 1. Leer CSV (Con la lógica robusta de codificación)
    df = None
    for enc in ['cp1252', 'latin-1', 'utf-8', 'iso-8859-1']:
        try:
            df = pd.read_csv(CSV_PATH, encoding=enc, engine='python', on_bad_lines='skip')
            print(f"   ✅ Leído con encoding: {enc}")
            break
        except: continue
    
    if df is None:
        print("   ❌ No se pudo leer el CSV.")
        return

    # Limpieza de columnas
    df.columns = df.columns.str.strip().str.replace('ï»¿', '')
    total_rows = len(df)
    print(f"📊 Total filas encontradas: {total_rows}")

    db = SessionLocal()
    
    # 2. Procesar en Chunks
    for i in range(0, total_rows, CHUNK_SIZE):
        chunk = df.iloc[i:i+CHUNK_SIZE]
        print(f"\n⚡ Procesando Lote {i} - {i+CHUNK_SIZE}...")
        
        batch_for_ai = []
        rows_map = {} # Mapa para acceder a la fila original por folio

        # A. Preparar datos
        for _, row in chunk.iterrows():
            folio = str(row.get('FOLIO', '')).replace('=', '').replace('"', '').strip()
            desc = clean_text(row.get('DESCRIPCIONSOLICITUD', ''))
            
            if len(folio) < 3: continue
            
            batch_for_ai.append({"folio": folio, "text": desc})
            rows_map[folio] = row

        if not batch_for_ai: continue

        # B. Consultar IA
        print(f"   🧠 Consultando a DeepSeek ({len(batch_for_ai)} items)...")
        ai_result = get_ai_analysis(batch_for_ai)
        
        if not ai_result: 
            print("   ⚠️ IA falló, saltando lote.")
            continue

        # C. Guardar en BD
        classifications = ai_result.get("classifications", [])
        saved_count = 0
        
        for item in classifications:
            folio = item.get("folio")
            original_row = rows_map.get(folio)
            
            if not original_row is None:
                # Verificar si existe
                existing = db.query(CitizenRequest).filter(CitizenRequest.folio == folio).first()
                
                topic_val = item.get("topic", "Otros")
                # Mapeo seguro de Topic (si la IA alucina)
                if topic_val not in Topic.__members__.values(): topic_val = "Otros"

                if existing:
                    # Actualizar
                    existing.topic = topic_val
                    existing.urgency = item.get("urgency", "Media")
                    existing.sentiment = item.get("sentiment", "Neutro")
                    existing.internal_notes = f"[IA UPDATE] {item.get('summary')}"
                else:
                    # Crear Nuevo
                    new_req = CitizenRequest(
                        folio=folio,
                        description=str(original_row.get('DESCRIPCIONSOLICITUD', ''))[:4000],
                        location_text=f"Yucatán - {original_row.get('MUNICIPIO', 'General')}",
                        status=RequestStatus.recibida,
                        topic=topic_val,
                        urgency=item.get("urgency", "Media"),
                        sentiment=item.get("sentiment", "Neutro"),
                        internal_notes=f"[IA NEW] {item.get('summary')}"
                    )
                    db.add(new_req)
                saved_count += 1

        # D. Guardar Alerta si hay patrón
        pattern = ai_result.get("pattern_detected", {})
        if pattern.get("exists"):
            print(f"   🚨 PATRÓN DETECTADO: {pattern.get('name')}")
            alert = SystemAlert(
                type=AlertType.warning,
                message=f"IA DETECTÓ: {pattern.get('name')}",
                region=pattern.get("description", "")[:500],
                related_topic=Topic.otros
            )
            db.add(alert)

        db.commit()
        print(f"   💾 Guardados/Actualizados: {saved_count}")
        time.sleep(1) # Respetar rate limit

    db.close()
    print("\n🏁 PROCESO TERMINADO.")

if __name__ == "__main__":
    process_file()