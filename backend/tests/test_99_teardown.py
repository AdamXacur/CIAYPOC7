import pytest
import requests
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(999)
def test_global_cleanup(auth_superadmin):
    """Limpieza final REAL (Borrar dependencia creada)"""
    if state.dependency_id:
        print(f"\n[Teardown] Limpiando Dependencia ID: {state.dependency_id}...")
        resp = requests.delete(f"{API_BASE_URL}/dependencies/{state.dependency_id}", headers=auth_superadmin)
        
        # Si el borrado no está implementado, dará 404 o 405, y el test fallará (correcto).
        # Si está implementado, dará 204 o 200.
        assert resp.status_code in [200, 204]
    
    print("\n=== SUITE DE PRUEBAS COMPLETADA ===")