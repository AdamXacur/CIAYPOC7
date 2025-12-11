import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(25)
def test_ai_classification_structure(auth_superadmin):
    """RF-W-01: Validar que la IA clasificó la solicitud"""
    if not state.last_folio:
        pytest.skip("No request created")

    resp = requests.get(f"{API_BASE_URL}/public/requests/{state.last_folio}")
    assert resp.status_code == 200
    data = resp.json()
    
    assert "topic" in data
    assert "sentiment" in data
    assert "urgency" in data

@pytest.mark.order(26)
def test_ai_batch_processing(auth_superadmin):
    """Prueba de estrés: Clasificación en lote"""
    payload = {
        "texts": [
            "Robo en la calle 60",
            "Falta agua en Kanasín",
            "El camión no pasa"
        ]
    }
    # Petición REAL
    resp = requests.post(f"{API_BASE_URL}/ai/batch-classify", headers=auth_superadmin, json=payload)
    
    # Si no está implementado, fallará con 404, lo cual es correcto.
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 3
    assert results[0]["topic"] == "Seguridad"