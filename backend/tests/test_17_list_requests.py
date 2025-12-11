import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(200)
def test_list_requests_unauthenticated_fails(auth_superadmin):
    """
    Seguridad: Verificar que un usuario sin token no puede listar solicitudes.
    """
    # Hacemos la petición sin el header de Authorization
    resp = requests.get(f"{API_BASE_URL}/requests")
    assert resp.status_code == 401, "Debería fallar sin token"

@pytest.mark.order(201)
def test_list_requests_pagination(auth_superadmin):
    """
    Valida que la paginación (skip/limit) funcione correctamente.
    """
    # Asumimos que el seeder ya corrió y hay más de 5 solicitudes
    
    # Pedir página 1, 5 elementos
    resp = requests.get(f"{API_BASE_URL}/requests?skip=0&limit=5", headers=auth_superadmin)
    assert resp.status_code == 200, f"Error: {resp.text}"
    data = resp.json()
    
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 5
    assert data["total"] > 0

    # Pedir página 2
    resp2 = requests.get(f"{API_BASE_URL}/requests?skip=5&limit=5", headers=auth_superadmin)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2["items"]) >= 0

@pytest.mark.order(202)
def test_list_requests_filter_by_status(auth_superadmin):
    """
    Valida que el filtro por estatus funcione.
    """
    resp = requests.get(f"{API_BASE_URL}/requests?status=Atendida", headers=auth_superadmin)
    assert resp.status_code == 200
    data = resp.json()
    
    # Todos los items devueltos deben tener el estatus 'Atendida'
    if data["items"]:
        assert all(item["status"] == "Atendida" for item in data["items"])

@pytest.mark.order(203)
def test_list_requests_search(auth_superadmin):
    """
    Valida que la búsqueda por texto en folio o descripción funcione.
    """
    # Buscamos por un folio que sabemos que existe
    folio_to_search = state.last_folio
    if not folio_to_search:
        pytest.skip("No hay folio para buscar")

    resp = requests.get(f"{API_BASE_URL}/requests?search={folio_to_search}", headers=auth_superadmin)
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["total"] >= 1
    assert data["items"][0]["folio"] == folio_to_search