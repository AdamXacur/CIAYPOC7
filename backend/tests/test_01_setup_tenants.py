import pytest
import requests
import uuid
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(1)
def test_create_dependency_success(auth_superadmin):
    """RF-W-02: Crear Dependencia (Tenant)"""
    name = f"Secretaría de Salud {uuid.uuid4().hex[:4]}"
    payload = {
        "name": name,
        "admin_email": f"admin_{uuid.uuid4().hex[:6]}@yucatan.gob.mx",
        "admin_password": "SecurePassword123!",
        "contact_phone": "9991234567",
        "acronym": "SSY",
        "website_url": "https://salud.yucatan.gob.mx"
    }
    response = requests.post(f"{API_BASE_URL}/dependencies", headers=auth_superadmin, json=payload)
    assert response.status_code == 201, f"Error: {response.text}"
    data = response.json()
    
    assert data["name"] == name
    assert "id" in data
    state.dependency_id = data["id"]

@pytest.mark.order(2)
def test_create_dependency_duplicate_email_fails(auth_superadmin):
    """Seguridad: No permitir emails duplicados"""
    email_collision = f"collision_{uuid.uuid4().hex[:4]}@test.com"
    
    # Primer intento
    payload_1 = {
        "name": f"Dep 1 {uuid.uuid4().hex}",
        "admin_email": email_collision,
        "admin_password": "SecurePassword123!"
    }
    requests.post(f"{API_BASE_URL}/dependencies", headers=auth_superadmin, json=payload_1)
    
    # Segundo intento (Debe fallar)
    payload_2 = {
        "name": f"Dep 2 {uuid.uuid4().hex}",
        "admin_email": email_collision,
        "admin_password": "SecurePassword123!"
    }
    response = requests.post(f"{API_BASE_URL}/dependencies", headers=auth_superadmin, json=payload_2)
    assert response.status_code == 409