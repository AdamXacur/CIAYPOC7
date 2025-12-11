import pytest
import requests
import io
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(60)
def test_upload_transparency_csv_success(auth_superadmin):
    """Carga masiva REAL de archivo"""
    # CORRECCIÓN: Usar los nombres de columna exactos que espera el mapeo del backend
    csv_content = "Folio,Fecha de recepción,Institución,Detalle de la solicitud\n001,2024-01-01,Salud,Test de carga masiva\n"
    files = {'file': ('test.csv', io.BytesIO(csv_content.encode('utf-8')), 'text/csv')}
    
    resp = requests.post(f"{API_BASE_URL}/ingestion/transparency", headers=auth_superadmin, files=files)
    
    assert resp.status_code == 200, f"Error en carga: {resp.text}"
    data = resp.json()
    assert data["processed"] > 0