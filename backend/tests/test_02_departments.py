import pytest
import requests
import uuid
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(3)
def test_create_department_under_dependency(auth_superadmin):
    """Crea un departamento y su usuario oficial"""
    assert state.dependency_id is not None
    
    official_email = f"director_{uuid.uuid4().hex[:4]}@salud.gob.mx"
    official_password = "password123"
    
    payload = {
        "name": "Dirección de Urgencias Epidemiológicas",
        "dependency_id": state.dependency_id,
        "official_email": official_email,
        "official_password": official_password,
        "is_public_facing": True
    }
    
    response = requests.post(f"{API_BASE_URL}/departments", headers=auth_superadmin, json=payload)
    assert response.status_code == 201
    data = response.json()
    
    state.department_id = data["id"]
    state.official_email = official_email
    state.official_password = official_password