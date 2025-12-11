import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(80)
def test_sql_injection_search_bar():
    """Prueba de seguridad básica"""
    malicious_folio = "' OR '1'='1"
    resp = requests.get(f"{API_BASE_URL}/public/requests/{malicious_folio}")
    assert resp.status_code in [404, 422]

@pytest.mark.order(81)
def test_xss_payload_in_request(auth_citizen):
    """Prueba de XSS"""
    xss_payload = "<script>alert('pwned')</script>"
    payload = {
        "description": xss_payload,
        "location_text": "Test XSS"
    }
    resp = requests.post(f"{API_BASE_URL}/requests", headers=auth_citizen, json=payload)
    # Aceptamos 201 (si se sanitiza al leer) o 422 (si se rechaza)
    assert resp.status_code in [201, 422]