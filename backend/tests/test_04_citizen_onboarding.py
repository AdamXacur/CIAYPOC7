import pytest
import requests
import uuid
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(10)
def test_citizen_register_full_profile():
    """Registro de ciudadano"""
    email = f"citizen_{uuid.uuid4().hex[:4]}@test.com"
    payload = {
        "email": email,
        "password": "SecurePassword123!",
        "full_name": "Juan Ciudadano",
        "curp": f"CURP{uuid.uuid4().hex[:10]}".upper(),
        "phone": "5555555555",
        "municipality": "Mérida"
    }
    resp = requests.post(f"{API_BASE_URL}/auth/citizen/register", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    
    state.citizen_token = data["access_token"]

@pytest.mark.order(11)
def test_citizen_login_wrong_credentials():
    """Login fallido"""
    payload = {"username": "noexiste@test.com", "password": "wrong", "grant_type": "password"}
    resp = requests.post(f"{API_BASE_URL}/auth/token", data=payload)
    assert resp.status_code == 400