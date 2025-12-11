import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(40)
def test_dashboard_trends_format(auth_superadmin):
    """RF-W-03: Datos para gráficas"""
    resp = requests.get(f"{API_BASE_URL}/stats/trends", headers=auth_superadmin)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)

@pytest.mark.order(41)
def test_stats_kpi_cards(auth_superadmin):
    """RF-W-02: KPIs"""
    resp = requests.get(f"{API_BASE_URL}/stats/dashboard", headers=auth_superadmin)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_requests" in data