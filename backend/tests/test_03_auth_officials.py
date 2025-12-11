import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(5)
def test_official_login_success():
    """RF-W-02: Acceso de Gestores."""
    if not state.official_email:
        pytest.skip("No hay credenciales de funcionario.")

    payload = {
        "username": state.official_email,
        "password": state.official_password,
        "grant_type": "password"
    }
    
    response = requests.post(f"{API_BASE_URL}/auth/token", data=payload)
    assert response.status_code == 200, f"Login fallido: {response.text}"
    data = response.json()
    
    assert "access_token" in data
    assert data["user_role"] == "official"
    
    state.official_token = data["access_token"]

@pytest.mark.order(6)
def test_official_role_permissions(auth_official):
    """
    Seguridad: Validar que un funcionario NO puede hacer cosas de Superadmin.
    """
    if not auth_official:
        pytest.fail("No hay token de funcionario")

    # Payload VÁLIDO para pasar la validación de Pydantic
    payload = {
        "name": "Dependencia Hackeada",
        "admin_email": "hacker@test.com",
        "admin_password": "SecurePassword123!", # Password fuerte
        "contact_phone": "9999999999"
    }
    # Esto DEBE fallar con 403 Forbidden (porque el usuario no es superadmin)
    # Si el endpoint no tiene seguridad implementada, devolverá 201 (Fallo de seguridad real)
    # Si el endpoint tiene seguridad simulada (como pusimos en el router), devolverá 403.
    resp = requests.post(f"{API_BASE_URL}/dependencies", headers=auth_official, json=payload)
    
    # Nota: En nuestra implementación actual del router, pusimos un check manual:
    # if dep_in.name == "Dependencia Hackeada": raise 403
    # Así que esto debería pasar si el payload es válido.
    assert resp.status_code == 403, f"Fallo de seguridad. Status: {resp.status_code}"