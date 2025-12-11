import fiona
import os
from pathlib import Path
from fiona.transform import transform_geom

def convert_shp_to_geojson():
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    SOURCE_PATH = BASE_DIR / "31_yucatan" / "conjunto_de_datos" / "31mun.shp"
    OUTPUT_PATH = BASE_DIR / "app" / "data" / "yucatan_municipios.geojson"

    print(f"🔄 Procesando: {SOURCE_PATH}")

    if not SOURCE_PATH.exists():
        print("❌ Archivo no encontrado.")
        return

    try:
        if OUTPUT_PATH.exists():
            os.remove(OUTPUT_PATH)
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

        with fiona.open(str(SOURCE_PATH), 'r') as source:
            print(f"ℹ️  Total Municipios en origen: {len(source)}")
            
            # --- CONFIGURACIÓN DEL ARCHIVO DE SALIDA ---
            meta = source.meta.copy()
            meta['driver'] = 'GeoJSON'
            meta['crs'] = 'EPSG:4326' 
            
            # EL FIX: Permitir cualquier tipo de geometría (Polygon o MultiPolygon)
            meta['schema']['geometry'] = 'Unknown' 
            
            # Limpieza de columnas
            new_schema_props = {}
            if 'CVEGEO' in meta['schema']['properties']: new_schema_props['CVEGEO'] = 'str'
            if 'NOMGEO' in meta['schema']['properties']: new_schema_props['NOMGEO'] = 'str'
            meta['schema']['properties'] = new_schema_props

            print("🚀 Transformando coordenadas...")
            count = 0
            
            with fiona.open(str(OUTPUT_PATH), 'w', **meta) as sink:
                for feature in source:
                    try:
                        # Transformar de ITRF92 a WGS84
                        new_geom = transform_geom(source.crs, 'EPSG:4326', feature['geometry'])
                        
                        new_props = {}
                        if 'CVEGEO' in feature['properties']: 
                            new_props['CVEGEO'] = feature['properties']['CVEGEO']
                        if 'NOMGEO' in feature['properties']: 
                            new_props['NOMGEO'] = feature['properties']['NOMGEO']
                        
                        new_feature = {
                            'type': 'Feature',
                            'geometry': new_geom,
                            'properties': new_props
                        }
                        
                        sink.write(new_feature)
                        count += 1
                    except Exception as e_row:
                        print(f"⚠️ Error en municipio {feature['id']}: {e_row}")

            print(f"✅ ¡ÉXITO! Se guardaron {count} de {len(source)} municipios.")
            print(f"💾 GeoJSON listo en: {OUTPUT_PATH}")

    except Exception as e:
        print(f"❌ Error crítico: {e}")

if __name__ == "__main__":
    convert_shp_to_geojson()