'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CityMapProps {
  city: string;
  state: string | null;
}

// Component to handle map zoom animation
function MapZoom({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    // Animate zoom to city location
    setTimeout(() => {
      map.setView(center, zoom, {
        animate: true,
        duration: 1.5,
      });
    }, 500); // Small delay for initial map load
  }, [map, center, zoom]);

  return null;
}

export default function CityMap({ city, state }: CityMapProps) {
  const [cityCoords, setCityCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const geocodeCity = async () => {
      setLoading(true);
      try {
        // Try geocoding the city
        const query = state ? `${city}, ${state}, USA` : `${city}, USA`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          {
            headers: {
              'User-Agent': 'BNBCalc Press Kit',
            },
          }
        );
        
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCityCoords([lat, lon]);
        } else {
          // Fallback to approximate USA center
          setCityCoords([39.8283, -98.5795]);
        }
      } catch (error) {
        console.error('Error geocoding city:', error);
        // Fallback to approximate USA center
        setCityCoords([39.8283, -98.5795]);
      } finally {
        setLoading(false);
      }
    };

    geocodeCity();
  }, [city, state]);

  if (loading || !cityCoords) {
    return (
      <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white">Loading map...</div>
      </div>
    );
  }

  // 400 miles radius in meters (1 mile = 1609.34 meters)
  const radiusMeters = 400 * 1609.34;

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden mb-6 border border-gray-300">
      <MapContainer
        center={[39.8283, -98.5795]} // USA center initially
        zoom={4}
        style={{ height: '100%', width: '100%', backgroundColor: '#000000' }}
        zoomControl={false}
        attributionControl={false}
        className="city-map-black"
      >
        {/* Black/dark tile layer for silhouette effect */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
          maxZoom={18}
        />
        
        {/* Zoom to city location */}
        <MapZoom center={cityCoords} zoom={7} />
        
        {/* White circle around city with 400-mile radius */}
        <Circle
          center={cityCoords}
          radius={radiusMeters}
          pathOptions={{
            color: 'white',
            fillColor: 'rgba(255, 255, 255, 0.15)',
            fillOpacity: 0.25,
            weight: 2.5,
          }}
        />
      </MapContainer>
    </div>
  );
}

