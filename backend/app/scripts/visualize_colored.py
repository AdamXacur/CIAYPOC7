import json
import folium
from folium.plugins import MousePosition
import random
from pathlib import Path

def get_random_color():
    return "#{:06x}".format(random.randint(0, 0xFFFFFF))

def visualize():
    print("🎨 Generando mapa de diagnóstico de precisión...")
    
    # 1. Cargar GeoJSON
    # Intentar ruta Docker y luego local
    geojson_path = Path("/app/app/data/yucatan_municipios.geojson")
    if not geojson_path.exists():
        geojson_path = Path("app/data/yucatan_municipios.geojson")
        
    if not geojson_path.exists():
        print("❌ No se encontró el GeoJSON.")
        return

    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 2. Punto de Falla (Progreso)
    fail_point = [21.2820, -89.6630]

    # 3. Crear Mapa
    m = folium.Map(location=fail_point, zoom_start=13, tiles="CartoDB positron")

    # --- NUEVO: RASTREADOR DE MOUSE ---
    formatter = "function(num) {return L.Util.formatNum(num, 5);};"
    MousePosition(
        position='topright',
        separator=' | ',
        empty_string='NaN',
        lng_first=False,
        num_digits=20,
        prefix='📍 Coordenadas Cursor:',
        lat_formatter=formatter,
        lng_formatter=formatter,
    ).add_to(m)

    # --- NUEVO: CLIC PARA OBTENER COORDENADAS (Corregido) ---
    folium.LatLngPopup().add_to(m)

    # 4. Estilo Coloreado
    color_map = {}
    for feature in data['features']:
        name = feature['properties'].get('NOMGEO', 'Unknown')
        hash_val = hash(name)
        r = (hash_val & 0xFF0000) >> 16
        g = (hash_val & 0x00FF00) >> 8
        b = (hash_val & 0x0000FF)
        color_map[name] = f"#{r:02x}{g:02x}{b:02x}"

    folium.GeoJson(
        data,
        style_function=lambda feature: {
            'fillColor': color_map.get(feature['properties'].get('NOMGEO'), 'gray'),
            'color': 'black',
            'weight': 0.5,
            'fillOpacity': 0.5,
        },
        tooltip=folium.GeoJsonTooltip(
            fields=['NOMGEO'],
            aliases=['Municipio:'],
            style="font-size: 14px; font-weight: bold;"
        )
    ).add_to(m)

    # 5. Marcador del Punto Problemático
    folium.Marker(
        fail_point,
        popup=folium.Popup(f"<b>Punto Buscado</b><br>Lat: {fail_point[0]}<br>Lon: {fail_point[1]}", max_width=300),
        tooltip=f"TEST: {fail_point[0]}, {fail_point[1]}",
        icon=folium.Icon(color="red", icon="crosshairs", prefix='fa')
    ).add_to(m)

    # 6. Radio de Búsqueda (Buffer visual de 500m)
    folium.Circle(
        location=fail_point,
        radius=500, 
        color="red",
        fill=False,
        dash_array='5, 5',
        popup="Radio de Búsqueda (500m)"
    ).add_to(m)

    output_path = "mapa_coloreado.html"
    m.save(output_path)
    print(f"✅ Mapa guardado en: {output_path}")

if __name__ == "__main__":
    visualize()