import os
import pytest
import requests
from typing import Dict
from dotenv import load_dotenv
from tests.state import state

load_dotenv()

API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8000/api")
SUPERADMIN_EMAIL = os.environ.get("DEFAULT_SUPERADMIN_EMAIL", "gobernador@yucatan.gob.mx")
SUPERADMIN_PASSWORD = os.environ.get("DEFAULT_SUPERADMIN_PASSWORD", "admin")

@pytest.fixture(scope="session", autouse=True)
def setup_superadmin_session():
    """Autenticación inicial del Superadmin."""
    url = f"{API_BASE_URL}/auth/token"
    payload = {
        "username": SUPERADMIN_EMAIL,
        "password": SUPERADMIN_PASSWORD,
        "grant_type": "password"
    }
    try:
        response = requests.post(url, data=payload)
        if response.status_code == 200:
            state.superadmin_token = response.json()["access_token"]
            print(f"\n[Setup] Superadmin autenticado.")
        else:
            print(f"\n[Setup] Error auth superadmin: {response.text}")
    except Exception as e:
        print(f"\n[Setup] Error conexión: {e}")
    yield

@pytest.fixture
def auth_superadmin() -> Dict[str, str]:
    return {"Authorization": f"Bearer {state.superadmin_token}"}

@pytest.fixture
def auth_official() -> Dict[str, str]:
    if not state.official_token:
        return None
    return {"Authorization": f"Bearer {state.official_token}"}

@pytest.fixture
def auth_citizen() -> Dict[str, str]:
    if not state.citizen_token:
        return {}
    return {"Authorization": f"Bearer {state.citizen_token}"}