import sys
import os
import pandas as pd
import json
import asyncio
import time
from pathlib import Path
from openai import AsyncOpenAI

# --- CONFIGURACIÓN ---
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DOCS_DIR = BASE_DIR / "docs"

# Archivos a procesar
FILES_CONFIG = [
    {"name": "datos_pnt.CSV", "label": "PNT", "encoding": "latin-1"},
    {"name": "SDATA.CSV", "label": "SDATA", "encoding": "latin-1"} # Ajusta encoding si SDATA es utf-8
]

DEEPSEEK_API_KEY = "sk-5e903e801ca641169ab9406cc1491b2e"
DEEPSEEK_BASE_URL = "https://api.deepseek.com"

BATCH_SIZE = 5
LIMIT_PER_FILE = 50  # 50 de cada uno = 100 total

# Cliente Asíncrono
client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

def clean_text(text):
    if pd.isna(text): return "Sin descripción"
    text = str(text).replace('\n', ' ').replace('\r', '').strip()
    return text[:500]

def get_system_prompt():
    return """
Eres un Coordinador de Despacho de Emergencias y Gobierno.
Analiza la solicitud y determina la acción operativa.

CLASIFICACIÓN:
1. TIPO: "ADMINISTRATIVA" (Papeles) vs "OPERATIVA" (Acción física).
2. URGENCIA: Baja, Media, Alta, Crítica.
3. DEPENDENCIA: ¿Quién lo atiende? (SSP, Salud, JAPAY, Ayuntamiento, Transparencia).
4. ACCIÓN: ¿Qué se debe hacer?

EJEMPLOS:
- "Robo en proceso" -> { "tipo": "OPERATIVA", "urgency": "Crítica", "department": "SSP", "action": "Despacho inmediato unidad" }
- "Solicito nómina" -> { "tipo": "ADMINISTRATIVA", "urgency": "Baja", "department": "Transparencia", "action": "Enviar archivo digital" }
- "Bache peligroso" -> { "tipo": "OPERATIVA", "urgency": "Media", "department": "Obras Públicas", "action": "Programar bacheo" }

SALIDA JSON (Lista):
[{"folio": "...", "tipo": "...", "urgency": "...", "department": "...", "suggested_action": "...", "summary": "..."}]
"""

async def process_batch_async(batch_df, source_label):
    """Procesa un lote de forma asíncrona."""
    items_to_send = []
    for _, row in batch_df.iterrows():
        # Intentamos buscar columnas comunes o fallback
        folio = str(row.get('FOLIO', row.get('id', 'S/N')))
        # Buscamos descripción en varias posibles columnas comunes
        desc = row.get('DESCRIPCIONSOLICITUD', row.get('descripcion', row.get('motivo', '')))
        
        items_to_send.append({
            "folio": folio,
            "texto": clean_text(desc)
        })
    
    if not items_to_send: return []

    user_prompt = json.dumps(items_to_send, ensure_ascii=False)
    
    try:
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": get_system_prompt()},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        if "```json" in content: content = content.replace("```json", "").replace("```", "")
        result = json.loads(content)
        
        data = []
        if isinstance(result, dict):
            for key, val in result.items():
                if isinstance(val, list): data = val; break
            if not data: data = [result]
        elif isinstance(result, list):
            data = result
            
        # Inyectar etiqueta de origen para el reporte
        for item in data:
            item['source'] = source_label
            
        return data

    except Exception as e:
        print(f"   ❌ Error IA ({source_label}): {e}")
        return []

async def process_file(file_config):
    """Lee un archivo, hace sampling y procesa lotes."""
    file_path = DOCS_DIR / file_config["name"]
    label = file_config["label"]
    
    print(f"📂 [{label}] Leyendo: {file_path.name}...")
    
    if not file_path.exists():
        print(f"❌ [{label}] Archivo no encontrado.")
        return []

    try:
        df = pd.read_csv(file_path, encoding=file_config['encoding'], on_bad_lines='skip')
        
        # Sampling
        if len(df) > LIMIT_PER_FILE:
            sample_df = df.sample(n=LIMIT_PER_FILE, random_state=42)
        else:
            sample_df = df
            
        print(f"📊 [{label}] Procesando {len(sample_df)} registros en paralelo...")
        
        tasks = []
        # Crear tareas asíncronas para cada lote
        for i in range(0, len(sample_df), BATCH_SIZE):
            batch = sample_df.iloc[i : i + BATCH_SIZE]
            tasks.append(process_batch_async(batch, label))
        
        # Ejecutar todos los lotes de este archivo
        # Nota: Podríamos usar gather para todo, pero por rate limits de DeepSeek
        # es mejor procesar los lotes de un archivo secuencialmente o con semáforo,
        # pero aquí correremos los dos ARCHIVOS en paralelo.
        
        file_results = []
        for task in tasks:
            res = await task
            file_results.extend(res)
            # Pequeña pausa dentro del archivo para no saturar
            await asyncio.sleep(0.5) 
            
        return file_results

    except Exception as e:
        print(f"❌ [{label}] Error crítico: {e}")
        return []

async def main():
    print("🚀 INICIANDO PROCESAMIENTO PARALELO (Asyncio)")
    start_time = time.time()
    
    # Crear las tareas principales (una por archivo)
    tasks = [process_file(conf) for conf in FILES_CONFIG]
    
    # Ejecutar ambas cargas simultáneamente
    results_list = await asyncio.gather(*tasks)
    
    # Aplanar resultados
    all_results = [item for sublist in results_list for item in sublist]
    
    print("\n" + "="*60)
    print("RESULTADOS CONSOLIDADOS")
    print("="*60)
    
    for res in all_results:
        source = res.get('source', 'UNK')
        tipo = res.get('tipo', '?')
        urgency = res.get('urgency', '?')
        dept = res.get('department', 'Sin asignar')
        action = res.get('suggested_action', '')
        
        # Colores y formato
        prefix = f"[{source}]"
        icon = "🚨" if tipo == "OPERATIVA" else "📋"
        urg_color = "🔴" if urgency in ["Alta", "Crítica"] else "🟢"
        
        print(f"{prefix} {icon} {urg_color} {dept} -> {action}")

    duration = time.time() - start_time
    print("-" * 60)
    print(f"✅ Procesados {len(all_results)} registros en {duration:.2f} segundos.")
    
    # Guardar
    output_file = BASE_DIR / "app" / "scripts" / "parallel_results.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    asyncio.run(main())