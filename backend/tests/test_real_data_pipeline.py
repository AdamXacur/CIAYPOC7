import pytest
import requests
import time
import os
from pathlib import Path
from tests.conftest import API_BASE_URL
from tests.state import state

DOCS_DIR = Path(__file__).resolve().parent.parent / "docs"

@pytest.mark.order(300)
def test_real_csv_ingestion_and_processing(auth_superadmin):
    """
    Test de Integración Completo (Extensivo):
    1. Busca CSVs reales en /docs.
    2. Los sube al endpoint /import-csv.
    3. Monitorea el progreso vía /ai/progress.
    4. Verifica que la IA haya clasificado (OPERATIVA vs ADMINISTRATIVA).
    """
    
    csv_files = list(DOCS_DIR.glob("*.CSV")) + list(DOCS_DIR.glob("*.csv"))
    if not csv_files:
        pytest.skip(f"No se encontraron CSVs en {DOCS_DIR}. Saltando test extensivo.")
    
    print(f"\n📂 Encontrados {len(csv_files)} archivos para prueba extensiva.")
    
    for csv_file in csv_files:
        print(f"   ➡️ Procesando: {csv_file.name}")
        
        with open(csv_file, "rb") as f:
            files = {'file': (csv_file.name, f, 'text/csv')}
            resp = requests.post(f"{API_BASE_URL}/requests/import-csv", headers=auth_superadmin, files=files)
            
        assert resp.status_code == 200, f"Fallo al subir {csv_file.name}: {resp.text}"
        print("      ✅ Subida exitosa. Worker iniciado.")
        
        max_retries = 30 
        finished = False
        
        for i in range(max_retries):
            time.sleep(2)
            
            prog_resp = requests.get(f"{API_BASE_URL}/ai/progress", headers=auth_superadmin)
            assert prog_resp.status_code == 200
            data = prog_resp.json()
            
            print(f"      ⏳ Progreso: {data['processed']}/{data['total']} ({data['percentage']}%) - {data['status']}")
            
            if data['processed'] >= 10:
                print("      ✅ Se verificó que el procesamiento avanza (>=10 items).")
                finished = True
                break
        
        if not finished:
            pytest.fail("❌ El worker de IA parece atascado o muy lento.")

        # 4. Verificación de Calidad de Datos (CORREGIDO)
        # Ahora usamos el filtro analysis_status=COMPLETADO para asegurar que leemos lo procesado
        list_resp = requests.get(f"{API_BASE_URL}/requests?limit=100&analysis_status=COMPLETADO", headers=auth_superadmin)
        items = list_resp.json()['items']
        
        classified_count = 0
        for item in items:
            if item.get('request_type') in ['ADMINISTRATIVA', 'OPERATIVA']:
                classified_count += 1
        
        print(f"      📊 Encontrados {classified_count} registros clasificados en la muestra.")
        assert classified_count > 0, "❌ La IA no clasificó ningún registro con los nuevos tipos."
        print(f"      ✅ Calidad Aprobada.")

    print("\n✅ TEST EXTENSIVO COMPLETADO CON ÉXITO.")