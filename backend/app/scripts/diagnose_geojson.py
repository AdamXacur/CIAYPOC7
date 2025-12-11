import json
from pathlib import Path

def diagnose():
    print("🩺 Iniciando diagnóstico de GeoJSON...")
    
    geojson_path = Path("app/data/yucatan_municipios.geojson")
    
    if not geojson_path.exists():
        print(f"❌ ERROR: No se encontró el archivo en: {geojson_path.resolve()}")
        return

    try:
        with open(geojson_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ ERROR: El archivo no es un JSON válido: {e}")
        return

    if "features" not in data or not isinstance(data["features"], list):
        print("❌ ERROR: El archivo no tiene la estructura de un FeatureCollection (falta la clave 'features').")
        return

    num_features = len(data["features"])
    print(f"✅ Archivo leído correctamente. Se encontraron {num_features} features (municipios).")

    if num_features > 0:
        first_feature = data["features"][0]
        if "properties" in first_feature and isinstance(first_feature["properties"], dict):
            properties = first_feature["properties"]
            print("\n--- Propiedades del primer municipio ---")
            for key, value in properties.items():
                print(f"  - Clave: '{key}', Valor de ejemplo: '{value}'")
            print("--------------------------------------")
            
            # Sugerencia
            if "NOMGEO" in properties:
                print("\n💡 SUGERENCIA: La clave para el nombre del municipio parece ser 'NOMGEO'.")
            else:
                print("\n⚠️  ADVERTENCIA: No se encontró la clave 'NOMGEO'. Revisa las claves de arriba y ajusta 'routing_service.py'.")
        else:
            print("❌ ERROR: El primer feature no tiene una sección de 'properties' válida.")

if __name__ == "__main__":
    diagnose()