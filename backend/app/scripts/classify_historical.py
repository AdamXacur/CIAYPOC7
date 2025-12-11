import requests
import json
import time
from openai import OpenAI

# --- CONFIGURACIÓN ---
API_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "gobernador@yucatan.gob.mx"
ADMIN_PASS = "admin"
DEEPSEEK_API_KEY = "sk-5e903e801ca641169ab9406cc1491b2e" 

client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

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
    except: pass
    return None

def get_unclassified_requests(token):
    # Pedimos las últimas 500 para procesar
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{API_URL}/requests?limit=500", headers=headers)
    if resp.status_code == 200:
        all_reqs = resp.json()["items"]
        # Filtramos las que dicen "Otros" (default)
        return [r for r in all_reqs if r['topic'] == 'Otros']
    return []

def classify_batch(batch):
    prompt_data = []
    for req in batch:
        prompt_data.append({
            "id": req['id'],
            "text": req['description'][:300] # Cortar para ahorrar tokens
        })
    
    system_prompt = """
    Eres un clasificador de atención ciudadana. Recibirás una lista de solicitudes.
    Para cada una, asigna:
    1. topic: Seguridad, Salud, Transporte, Servicios Públicos, Educación, Otros.
    2. sentiment: Positivo, Neutro, Negativo.
    3. urgency: Baja, Media, Alta, Crítica.
    
    Reglas:
    - Solicitud de info/documentos -> Urgency: Baja, Topic: Otros.
    - Queja de baches/luz/agua -> Topic: Servicios Públicos.
    - Crimen/policía -> Topic: Seguridad.
    - Hospitales/medicinas -> Topic: Salud.
    
    RESPONDE SOLO CON UN JSON VÁLIDO: [{"id": "...", "topic": "...", "sentiment": "...", "urgency": "..."}]
    """

    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(prompt_data)}
            ],
            temperature=0.1,
            response_format={ "type": "json_object" } 
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        # Normalizar salida (a veces DeepSeek envuelve en una key)
        if isinstance(data, dict):
            for key in data:
                if isinstance(data[key], list):
                    return data[key]
        return data if isinstance(data, list) else []

    except Exception as e:
        print(f"❌ Error IA: {e}")
        return []

def update_requests(token, classifications):
    headers = {"Authorization": f"Bearer {token}"}
    count = 0
    for item in classifications:
        try:
            req_id = item.get('id')
            if not req_id: continue
            
            payload = {
                "topic": item.get('topic', 'Otros'),
                "urgency": item.get('urgency', 'Media'),
                "sentiment": item.get('sentiment', 'Neutro')
            }
            
            # Llamada al nuevo endpoint PATCH
            r = requests.patch(f"{API_URL}/requests/{req_id}/analysis", json=payload, headers=headers)
            if r.status_code == 200:
                print(f"   💾 {req_id[:8]}: {item.get('topic')} | {item.get('urgency')}")
                count += 1
        except Exception as e: 
            print(f"Error saving: {e}")
    return count

def main():
    token = login()
    if not token: return

    print("🔍 Buscando solicitudes sin clasificar...")
    unclassified = get_unclassified_requests(token)
    print(f"📊 Encontradas {len(unclassified)} solicitudes genéricas.")

    BATCH_SIZE = 20
    for i in range(0, len(unclassified), BATCH_SIZE):
        batch = unclassified[i:i+BATCH_SIZE]
        print(f"🚀 Procesando lote {i//BATCH_SIZE + 1} ({len(batch)} items)...")
        
        results = classify_batch(batch)
        if results:
            saved = update_requests(token, results)
            print(f"   ✅ Guardados: {saved}/{len(batch)}")
        
        time.sleep(1) # Respetar rate limits

    print("\n🏁 Clasificación finalizada.")

if __name__ == "__main__":
    main()