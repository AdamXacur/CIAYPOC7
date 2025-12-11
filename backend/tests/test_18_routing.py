import pytest
import requests
from tests.conftest import API_BASE_URL

@pytest.mark.order(210)
def test_geojson_integrity(auth_superadmin):
    resp = requests.get(f"{API_BASE_URL}/routing/zones", headers=auth_superadmin)
    assert resp.status_code == 200
    zones = resp.json()
    assert len(zones) == 106

@pytest.mark.order(211)
def test_geocoding_precision(auth_superadmin):
    test_cases = [
        (20.9670, -89.6237, "Mérida"),
        (21.2820, -89.6630, "Progreso"), 
        (20.8589, -90.3989, "Celestún"),
        (21.1435, -88.1544, "Tizimín"),
        (20.1294, -88.9294, "Peto"),
    ]

    print("\n🔍 INICIANDO PRUEBAS DE GEO-RUTEO (RANKING):")
    for lat, lon, expected in test_cases:
        payload = {"lat": lat, "lon": lon}
        resp = requests.post(f"{API_BASE_URL}/routing/get-zone", headers=auth_superadmin, json=payload)
        
        data = resp.json()
        candidates = data.get('candidates', [])
        
        # Imprimir candidatos para entender qué ve el sistema
        print(f"\n📍 Punto ({lat}, {lon}) [Esperado: {expected}]")
        for i, cand in enumerate(candidates):
            print(f"   {i+1}. {cand['zone']} (Dist: {cand['distance']:.6f})")

        # VALIDACIÓN FLEXIBLE:
        # El esperado debe estar en el Top 2
        found_in_top = False
        for i in range(min(len(candidates), 2)):
            if candidates[i]['zone'] == expected:
                found_in_top = True
                break
        
        if not found_in_top:
             pytest.fail(f"❌ {expected} no apareció en los primeros candidatos.")
        else:
             print(f"✅ {expected} encontrado en candidatos viables.")