import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(20)
def test_create_request_validation_errors(auth_citizen):
    """Validar errores 422"""
    payload_short = {"description": "Hola", "location_text": "Merida"}
    resp = requests.post(f"{API_BASE_URL}/requests", headers=auth_citizen, json=payload_short)
    assert resp.status_code == 422

@pytest.mark.order(21)
def test_create_request_success_full_data(auth_citizen):
    """RF-W-01: Crear solicitud completa"""
    payload = {
        "description": "Hay un poste de luz a punto de caerse en la esquina.",
        "location_text": "Calle 60 x 45, Centro, Mérida",
        "latitude": 20.967376,
        "longitude": -89.623740,
        "department_id": state.department_id
    }
    
    response = requests.post(f"{API_BASE_URL}/requests", headers=auth_citizen, json=payload)
    assert response.status_code == 201
    data = response.json()
    
    state.request_id = data["id"]
    state.last_folio = data["folio"]

@pytest.mark.order(22)
def test_create_request_auto_assignment(auth_citizen):
    """Crear solicitud sin departamento (asignación auto)"""
    payload = {
        "description": "No pasó la basura hoy.",
        "location_text": "Colonia México"
    }
    response = requests.post(f"{API_BASE_URL}/requests", headers=auth_citizen, json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["department_id"] is None