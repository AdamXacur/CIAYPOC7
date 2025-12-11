import json
import folium
from pathlib import Path

def visualize():
    print("🗺️  Generando mapa de diagnóstico visual...")
    
    geojson_path = Path("app/data/yucatan_municipios.geojson")
    if not geojson_path.exists():
        print("❌ No se encontró el GeoJSON.")
        return

    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)

    # Puntos de prueba del test
    test_points = [
        {"name": "Mérida", "coords": [20.9754, -89.6169]},
        {"name": "Progreso", "coords": [21.2850, -89.6650]},
        {"name": "Valladolid", "coords": [20.6870, -88.2020]},
    ]

    # Crear mapa centrado en Yucatán
    m = folium.Map(location=[20.7, -89.0], zoom_start=9)

    # Añadir capa GeoJSON
    folium.GeoJson(
        geojson_data,
        style_function=lambda feature: {
            'fillColor': '#C49B64',
            'color': '#624E32',
            'weight': 1,
            'fillOpacity': 0.3,
        },
        tooltip=folium.GeoJsonTooltip(fields=['NOMGEO'], aliases=['Municipio:'])
    ).add_to(m)

    # Añadir marcadores de prueba
    for point in test_points:
        folium.Marker(
            location=point["coords"],
            popup=f"<b>Punto de Prueba:</b><br>{point['name']}",
            icon=folium.Icon(color='red', icon='info-sign')
        ).add_to(m)

    output_path = "map_diagnostic.html"
    m.save(output_path)
    print(f"✅ Mapa guardado en: {output_path}")
    print("👉 Abre este archivo en tu navegador para inspeccionar visualmente.")

if __name__ == "__main__":
    visualize()