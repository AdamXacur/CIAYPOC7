import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(70)
def test_alert_generation_threshold(auth_superadmin):
    """Verificar si hay alertas activas"""
    # Petición REAL al endpoint de alertas
    resp = requests.get(f"{API_BASE_URL}/alerts/active", headers=auth_superadmin)
    
    # Si el endpoint no existe, 404. Si existe, 200.
    assert resp.status_code == 200
    alerts = resp.json()
    assert isinstance(alerts, list)