"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, useMap, GeoJSON } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.heat"
import { Request } from "@/components/requests/columns"
import { api } from "@/lib/api"

// Mapeo de Urgencia a Intensidad
const urgencyToIntensity = (urgency: string): number => {
    switch(urgency) {
        case 'Crítica': return 1.0;
        case 'Alta': return 0.8;
        case 'Media': return 0.5;
        case 'Baja': return 0.2;
        default: return 0.1;
    }
}

const HeatmapLayer = ({ points }: { points: any[] }) => {
    const map = useMap()

    useEffect(() => {
        if (!map || points.length === 0) return;

        // @ts-ignore
        const heatLayer = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 18,
            gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, points]);

    return null;
}

interface RequestMapProps {
    requests: Request[]
}

export default function RequestMap({ requests }: RequestMapProps) {
    const [geoJsonData, setGeoJsonData] = useState(null)

    // Cargar el mapa vectorial de municipios desde nuestro Backend
    useEffect(() => {
        api.get('/routing/yucatan-geojson')
            .then(res => setGeoJsonData(res.data))
            .catch(err => console.error("Error cargando mapa base:", err));
    }, []);

    const heatmapData = requests
        .filter(r => (r as any).latitude && (r as any).longitude)
        .map((r: any) => [r.latitude, r.longitude, urgencyToIntensity(r.urgency)])

    const defaultCenter: [number, number] = [20.967376, -89.623740]

    // Estilo visual: Bordes dorados, relleno casi invisible
    const geoJsonStyle = {
        color: "#C49B64", // Dorado Institucional
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.05, 
        fillColor: "#C49B64"
    };

    return (
        <MapContainer 
            center={defaultCenter} 
            zoom={9} 
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Capa de Municipios (Fronteras) */}
            {geoJsonData && (
                <GeoJSON 
                    data={geoJsonData} 
                    style={geoJsonStyle}
                    onEachFeature={(feature, layer) => {
                        if (feature.properties && feature.properties.NOMGEO) {
                            // Tooltip al pasar el mouse: Nombre del Municipio
                            layer.bindTooltip(feature.properties.NOMGEO, {
                                direction: 'center',
                                className: 'font-bold text-xs bg-transparent border-0 shadow-none text-ciay-brown'
                            });
                        }
                    }}
                />
            )}
            
            {/* Capa de Calor (Puntos Rojos) */}
            <HeatmapLayer points={heatmapData} />
        </MapContainer>
    )
}