import folium
import json
from pathlib import Path

def generate_debug_map():
    print("🗺️  Generando mapa forense de Progreso...")
    
    # 1. Cargar el GeoJSON que usa el sistema
    # Intentamos ruta Docker y local
    geojson_path = Path("/app/app/data/yucatan_municipios.geojson")
    if not geojson_path.exists():
        geojson_path = Path("app/data/yucatan_municipios.geojson")
        
    if not geojson_path.exists():
        print("❌ No se encontró el GeoJSON.")
        return

    with open(geojson_path, 'r', encoding='utf-8') as f:
        geo_data = json.load(f)

    # 2. El punto que está fallando en el test
    # Lat: 21.282, Lon: -89.663
    fail_point = [21.282, -89.663]

    # 3. Crear mapa centrado en ese punto
    m = folium.Map(location=fail_point, zoom_start=15, tiles="CartoDB positron")

    # 4. Dibujar Polígonos del INEGI (Azul)
    folium.GeoJson(
        geo_data,
        name="Municipios INEGI",
        style_function=lambda x: {
            'color': '#0000FF', 
            'weight': 2, 
            'fillOpacity': 0.1
        },
        tooltip=folium.GeoJsonTooltip(fields=['NOMGEO'])
    ).add_to(m)

    # 5. Dibujar el Punto del Test (Marcador Rojo)
    folium.Marker(
        fail_point,
        popup="Punto del Test (Falla)",
        icon=folium.Icon(color="red", icon="times", prefix='fa')
    ).add_to(m)

    # 6. Dibujar el Buffer de Búsqueda (Círculo Rojo)
    # 0.002 grados son aprox 220 metros
    folium.Circle(
        location=fail_point,
        radius=220, 
        color="red",
        fill=True,
        fill_opacity=0.3,
        popup="Buffer de Búsqueda (Lo que ve el sistema)"
    ).add_to(m)

    # Guardar
    output_file = "debug_progreso.html"
    m.save(output_file)
    print(f"✅ Mapa generado: {output_file}")
    print("👉 Abre este archivo en tu navegador para ver por qué falla.")

if __name__ == "__main__":
    generate_debug_map()