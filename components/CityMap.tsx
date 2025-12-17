'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Create a black marker icon - using SVG data URI
const createBlackMarkerIcon = () => {
  const svgString = `<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg"><path fill="#000000" stroke="#fff" stroke-width="1.5" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.596 19.404 0 12.5 0z"/></svg>`;
  const encodedSvg = encodeURIComponent(svgString);
  
  return new L.Icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodedSvg}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });
};

interface CityMapProps {
  city: string;
  state: string | null;
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
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center mb-6 border border-gray-300">
        <div className="text-gray-600">Loading map...</div>
      </div>
    );
  }

  // 400 miles radius in meters (1 mile = 1609.34 meters)
  const radiusMeters = 400 * 1609.34;

  // Calculate zoom level to show approximately 400 miles radius
  // Using a zoom level that shows roughly 400-500 miles across
  const zoomLevel = 6;

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden mb-6 border border-gray-300">
      <MapContainer
        center={cityCoords}
        zoom={zoomLevel}
        style={{ height: '100%', width: '100%', backgroundColor: '#f3f4f6' }}
        zoomControl={false}
        attributionControl={false}
        className="city-map-grey"
      >
        {/* Grey tile layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution=""
          maxZoom={18}
        />
        
        {/* White circle around city with 400-mile radius */}
        <Circle
          center={cityCoords}
          radius={radiusMeters}
          pathOptions={{
            color: 'white',
            fillColor: 'rgba(255, 255, 255, 0.2)',
            fillOpacity: 0.3,
            weight: 2,
          }}
        />
        
        {/* Black marker/flag at city location */}
        <Marker position={cityCoords} icon={createBlackMarkerIcon()} />
      </MapContainer>
    </div>
  );
}

