import json
from pathlib import Path

def find_exact_location():
    print("🧮 Calculando centroide matemático (Sin librerías GIS)...")
    
    # Rutas
    paths = [
        Path("/app/app/data/yucatan_municipios.geojson"),
        Path("app/data/yucatan_municipios.geojson")
    ]
    
    geojson_path = None
    for p in paths:
        if p.exists():
            geojson_path = p
            break
            
    if not geojson_path:
        print("❌ No se encontró el archivo.")
        return

    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for feature in data['features']:
        name = feature['properties'].get('NOMGEO')
        
        if name == "Progreso":
            geom = feature['geometry']
            coords = geom['coordinates']
            geom_type = geom['type']
            
            # Extraer el primer anillo del polígono principal
            # Progreso es MultiPolygon (tiene islas), tomamos el pedazo más grande (usualmente el primero)
            main_ring = []
            
            if geom_type == 'Polygon':
                main_ring = coords[0]
            elif geom_type == 'MultiPolygon':
                # Buscamos el polígono con más puntos (el continente)
                longest_ring = []
                for poly in coords:
                    ring = poly[0]
                    if len(ring) > len(longest_ring):
                        longest_ring = ring
                main_ring = longest_ring
            
            if not main_ring:
                print("❌ Geometría vacía.")
                return

            # Calcular promedio simple (Centroide aproximado)
            sum_lon = 0
            sum_lat = 0
            count = len(main_ring)
            
            for point in main_ring:
                sum_lon += point[0]
                sum_lat += point[1]
                
            avg_lon = sum_lon / count
            avg_lat = sum_lat / count
            
            print(f"\n✅ ¡PROGRESO ENCONTRADO!")
            print("-" * 30)
            print(f"🎯 COORDENADA MATEMÁTICA:")
            print(f"Latitud:  {avg_lat}")
            print(f"Longitud: {avg_lon}")
            print("-" * 30)
            return

    print("❌ No se encontró Progreso en el archivo.")

if __name__ == "__main__":
    find_exact_location()