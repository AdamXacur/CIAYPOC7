import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(90)
def test_export_csv_headers(auth_superadmin):
    """Descargar reporte CSV real"""
    resp = requests.get(f"{API_BASE_URL}/reports/export/csv", headers=auth_superadmin)
    
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "Folio" in resp.text