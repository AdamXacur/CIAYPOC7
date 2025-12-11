import pytest
import requests
import io
from tests.conftest import API_BASE_URL
from tests.state import state

@pytest.mark.order(100)
def test_upload_image_success(auth_citizen):
    """
    Valida la subida de evidencia fotográfica.
    """
    if not auth_citizen:
        pytest.skip("No hay token de ciudadano.")

    # Crear una imagen falsa en memoria
    fake_image = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")
    files = {'file': ('test_image.png', fake_image, 'image/png')}
    
    resp = requests.post(f"{API_BASE_URL}/uploads", headers=auth_citizen, files=files)
    
    assert resp.status_code == 200, f"Error subiendo archivo: {resp.text}"
    data = resp.json()
    
    assert "file_url" in data
    assert data["file_url"].startswith("/api/uploads/")
    
    # Verificar que el archivo es accesible
    file_url = data["file_url"]
    resp_get = requests.get(f"{API_BASE_URL}{file_url.replace('/api', '')}")
    assert resp_get.status_code == 200
    assert resp_get.headers['content-type'] == 'image/png'

@pytest.mark.order(101)
def test_upload_invalid_file_type(auth_citizen):
    """
    Valida que el sistema rechace archivos que no son imágenes.
    """
    if not auth_citizen:
        pytest.skip("No hay token de ciudadano.")

    fake_text_file = io.BytesIO(b"esto no es una imagen")
    files = {'file': ('documento.txt', fake_text_file, 'text/plain')}
    
    resp = requests.post(f"{API_BASE_URL}/uploads", headers=auth_citizen, files=files)
    
    assert resp.status_code == 400
    assert "Solo se permiten imágenes" in resp.json()["detail"]