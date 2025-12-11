import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(50)
def test_public_tracker_search_found():
    """RF-W-06: Rastreador Público"""
    if not state.last_folio:
        pytest.skip("No hay folio.")

    folio = state.last_folio
    resp = requests.get(f"{API_BASE_URL}/public/requests/{folio}")
    
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["folio"] == folio
    assert data["status"] == "Atendida"

@pytest.mark.order(51)
def test_public_tracker_search_not_found():
    resp = requests.get(f"{API_BASE_URL}/public/requests/FOLIO-FALSO-123")
    assert resp.status_code == 404