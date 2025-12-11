import pytest
import requests
import uuid
from datetime import datetime, timedelta
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(15)
def test_create_gov_action(auth_superadmin):
    """Crear Acción de Gobierno (Campaign)"""
    if not state.dependency_id:
        pytest.skip("No dependency ID")

    start_date = datetime.now().isoformat()
    end_date = (datetime.now() + timedelta(days=30)).isoformat()

    payload = {
        "name": f"Operativo Bacheo {uuid.uuid4().hex[:4]}",
        "start_date": start_date,
        "end_date": end_date,
        "dependency_id": state.dependency_id,
        "related_topic": "Transporte"
    }
    
    # Hacemos la petición REAL. Si el endpoint no existe, dará 404, pero el test es honesto.
    resp = requests.post(f"{API_BASE_URL}/gov-actions", headers=auth_superadmin, json=payload)
    
    # Validamos éxito
    assert resp.status_code == 201, f"Error creando acción: {resp.text}"
    state.program_id = resp.json()["id"]