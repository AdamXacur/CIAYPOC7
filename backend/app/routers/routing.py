from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
from app.services.routing_service import routing_service
from app.core.deps import get_current_active_user
from app.models.users import User

router = APIRouter(prefix="/routing", tags=["Geocodificación y Ruteo"])

class Coords(BaseModel):
    lat: float
    lon: float

@router.post("/get-zone")
def get_zone_from_coordinates(
    coords: Coords,
    current_user: User = Depends(get_current_active_user)
):
    # Obtenemos la lista de candidatos
    candidates = routing_service.get_candidates_from_coords(coords.lat, coords.lon)
    
    # El "ganador" es el primero de la lista
    best_match = candidates[0]["zone"] if candidates else None
    
    return {
        "zone": best_match,
        "candidates": candidates # Enviamos todo para debug y frontend
    }

@router.get("/zones", response_model=List[str])
def get_available_zones(
    current_user: User = Depends(get_current_active_user)
):
    if not routing_service.zones: return []
    zone_names = [
        feature["properties"].get("NOMGEO")
        for feature in routing_service.zones
        if "properties" in feature and "NOMGEO" in feature["properties"]
    ]
    return sorted(list(set(zone_names)))

@router.get("/yucatan-geojson")
def get_yucatan_geojson():
    geojson_path = Path("/app/app/data/yucatan_municipios.geojson")
    if not geojson_path.exists():
        geojson_path = Path("app/data/yucatan_municipios.geojson")
    if not geojson_path.exists():
        raise HTTPException(status_code=404, detail="Mapa no disponible")
    return FileResponse(geojson_path, media_type="application/geo+json")