import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(30)
def test_workflow_state_transition_valid(auth_official):
    """RF-W-02: Flujo de atención (Recibida -> Atendida)"""
    if not state.request_id:
        pytest.skip("No hay solicitud creada.")
    if not auth_official:
        pytest.fail("No hay token de funcionario.")

    req_id = state.request_id
    
    # 1. En revisión
    payload_review = {"status": "En revisión", "internal_notes": "Revisando"}
    requests.put(f"{API_BASE_URL}/requests/{req_id}/status", headers=auth_official, json=payload_review)
    
    # 2. Atendida
    payload_resolve = {"status": "Atendida", "official_response": "Listo"}
    resp = requests.put(f"{API_BASE_URL}/requests/{req_id}/status", headers=auth_official, json=payload_resolve)
    assert resp.status_code == 200
    assert resp.json()["status"] == "Atendida"

@pytest.mark.order(31)
def test_workflow_state_transition_invalid(auth_official):
    """Intentar poner un estado que no existe"""
    if not state.request_id: pytest.skip()
    
    payload = {"status": "ESTADO_FALSO_INVENTADO"}
    resp = requests.put(f"{API_BASE_URL}/requests/{state.request_id}/status", headers=auth_official, json=payload)
    
    # Debe fallar por validación de Pydantic (422)
    assert resp.status_code == 422

@pytest.mark.order(32)
def test_citizen_sees_updates(auth_citizen):
    """RF-W-06: Ciudadano ve el cambio de estatus"""
    if not state.last_folio: pytest.skip()
    
    resp = requests.get(f"{API_BASE_URL}/public/requests/{state.last_folio}")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["status"] == "Atendida"