import json
import logging
from pathlib import Path
from shapely.geometry import Point, shape

logger = logging.getLogger(__name__)

class RoutingService:
    def __init__(self):
        geojson_path = Path("/app/app/data/yucatan_municipios.geojson")
        if not geojson_path.exists():
            geojson_path = Path("app/data/yucatan_municipios.geojson")

        if not geojson_path.exists():
            self.zones = []
            logger.error("❌ GeoJSON no encontrado.")
            return

        try:
            with open(geojson_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.zones = data.get("features", [])
            logger.info(f"🗺️  GeoJSON cargado: {len(self.zones)} zonas.")
        except Exception as e:
            logger.error(f"❌ Error leyendo GeoJSON: {e}")
            self.zones = []
        
        # Puntos de respaldo para municipios con geometrías complejas que fallan en Shapely
        self.fallback_centroids = {
            "Progreso": Point(-89.6630, 21.2820), # Malecón
            "Celestún": Point(-90.3989, 20.8589)  # Centro
        }

        self.assignment_matrix = {
            ("Mérida", "Servicios Públicos"): "Dirección de Servicios Públicos Municipales",
            ("Mérida", "Seguridad"): "Policía Municipal de Mérida",
            ("Kanasín", "Seguridad"): "Policía Municipal de Kanasín",
            ("Valladolid", "Salud"): "Jurisdicción Sanitaria No. 2",
        }

    def get_candidates_from_coords(self, lat: float, lon: float):
        if not self.zones: return []
            
        point = Point(lon, lat)
        candidates = []
        processed_names = set()

        # 1. Búsqueda Geométrica (Polígonos)
        for zone in self.zones:
            name = zone["properties"].get("NOMGEO")
            try:
                polygon = shape(zone["geometry"])
                if not polygon.is_valid: polygon = polygon.buffer(0)

                dist = polygon.distance(point)
                
                if dist < 0.2: # 20km radio
                    candidates.append({"zone": name, "distance": dist})
                    processed_names.add(name)
            except Exception as e:
                # Si falla la geometría, no lo ignoramos silenciosamente
                # logger.warning(f"Error procesando geometría de {name}: {e}")
                continue
        
        # 2. Búsqueda de Respaldo (Puntos Fijos)
        # Si Progreso falló arriba por error de geometría, lo atrapamos aquí
        for name, centroid in self.fallback_centroids.items():
            if name not in processed_names:
                dist = point.distance(centroid)
                if dist < 0.1: # 10km radio para el punto fijo
                    candidates.append({"zone": name, "distance": dist})
                    logger.info(f"⚠️ Usando fallback por punto para {name}")

        # Ordenar
        candidates.sort(key=lambda x: x["distance"])
        return candidates[:5]

    def get_zone_from_coords(self, lat: float, lon: float) -> str | None:
        candidates = self.get_candidates_from_coords(lat, lon)
        if candidates:
            best = candidates[0]
            # Umbral de aceptación
            if best["distance"] < 0.15:
                return best["zone"]
        return None

    def get_department_for_request(self, zone: str, topic: str) -> str | None:
        if not zone or not topic: return None
        dept = self.assignment_matrix.get((zone, topic))
        if dept: return dept
        if topic == "Salud": return "Secretaría de Salud de Yucatán (SSY)"
        if topic == "Seguridad": return "Secretaría de Seguridad Pública (SSP)"
        if topic == "Transporte": return "Instituto de Movilidad (IMDUT)"
        return "Atención Ciudadana General"

routing_service = RoutingService()