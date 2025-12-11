import pytest
import requests
import io
from tests.conftest import API_BASE_URL

@pytest.mark.order(301)
def test_csv_location_parsing_logic(auth_superadmin):
    """
    Verifica que el importador maneje correctamente los campos de ubicación vacíos o 'nan'.
    """
    # 1. Crear CSV sintético con casos borde
    csv_content = """FOLIO,DESCRIPCIONSOLICITUD,MUNICIPIO
TEST-LOC-001,Caso con municipio valido,Mérida
TEST-LOC-002,Caso con municipio vacio,
TEST-LOC-003,Caso con municipio nan,nan
TEST-LOC-004,Caso con municipio NAN mayuscula,NAN
TEST-LOC-005,Caso con municipio Kanasin,Kanasín
"""
    
    files = {'file': ('test_locations.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')}
    
    # 2. Subir
    print("\n🧪 Subiendo CSV de prueba de ubicaciones...")
    resp = requests.post(f"{API_BASE_URL}/requests/import-csv", headers=auth_superadmin, files=files)
    assert resp.status_code == 200
    data = resp.json()
    
    # Verificar contadores en la respuesta
    print(f"   📊 Respuesta del servidor: {data}")
    assert data["imported"] == 5
    assert data["locations_found"] == 2 # Mérida y Kanasín
    
    # 3. Verificar en BD (Consultando la API)
    # Buscamos cada folio para ver cómo quedó guardado
    
    # Caso 1: Válido
    r1 = requests.get(f"{API_BASE_URL}/requests?search=TEST-LOC-001", headers=auth_superadmin).json()['items'][0]
    assert "Mérida" in r1['location_text']
    assert "Importado" in r1['location_text']
    print(f"   ✅ Caso 1 (Válido): {r1['location_text']}")

    # Caso 2: Vacío
    r2 = requests.get(f"{API_BASE_URL}/requests?search=TEST-LOC-002", headers=auth_superadmin).json()['items'][0]
    assert "Ubicación General" in r2['location_text']
    print(f"   ✅ Caso 2 (Vacío): {r2['location_text']}")

    # Caso 3: 'nan'
    r3 = requests.get(f"{API_BASE_URL}/requests?search=TEST-LOC-003", headers=auth_superadmin).json()['items'][0]
    assert "Ubicación General" in r3['location_text']
    print(f"   ✅ Caso 3 ('nan'): {r3['location_text']}")
    
    print("✅ Lógica de parseo de ubicaciones verificada correctamente.")