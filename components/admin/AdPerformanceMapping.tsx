'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Papa from 'papaparse';

interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: string;
}

interface AdPerformanceRow {
  'Ad name': string;
}

interface Mapping {
  id: string;
  adName: string;
  mediaId: string;
  media: MediaItem;
}

export default function AdPerformanceMapping() {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [csvAdNames, setCsvAdNames] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Map<string, Mapping>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedAdName, setSelectedAdName] = useState<string>('');
  const [selectedMediaId, setSelectedMediaId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch images
      const imagesRes = await fetch('/api/media?type=image&category=ads');
      const imagesData = await imagesRes.json();
      setImages(Array.isArray(imagesData) ? imagesData : []);

      // Fetch CSV to get ad names
      const csvRes = await fetch('/ads-performance.csv');
      const csvText = await csvRes.text();
      Papa.parse<AdPerformanceRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const adNames = results.data.map((row) => row['Ad name']).filter(Boolean);
          setCsvAdNames(adNames);
        },
      });

      // Fetch existing mappings
      const mappingsRes = await fetch('/api/ad-performance-mappings');
      const mappingsData = await mappingsRes.json();
      const mappingsMap = new Map<string, Mapping>();
      mappingsData.forEach((mapping: Mapping) => {
        mappingsMap.set(mapping.adName, mapping);
      });
      setMappings(mappingsMap);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAdName || !selectedMediaId) {
      alert('Please select both an ad name and an image');
      return;
    }

    try {
      const response = await fetch('/api/ad-performance-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adName: selectedAdName,
          mediaId: selectedMediaId,
        }),
      });

      if (response.ok) {
        const newMapping = await response.json();
        const newMappings = new Map(mappings);
        newMappings.set(selectedAdName, newMapping);
        setMappings(newMappings);
        setSelectedAdName('');
        setSelectedMediaId('');
        alert('Image assigned successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to assign image'}`);
      }
    } catch (error) {
      console.error('Error assigning image:', error);
      alert('Error assigning image');
    }
  };

  const handleRemove = async (adName: string) => {
    if (!confirm(`Remove image assignment for "${adName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/ad-performance-mappings?adName=${encodeURIComponent(adName)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const newMappings = new Map(mappings);
        newMappings.delete(adName);
        setMappings(newMappings);
        alert('Assignment removed successfully!');
      } else {
        alert('Error removing assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Error removing assignment');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Assign Images to Ad Performance</h2>
        <p className="text-gray-600 mb-6">
          Assign images from your ad library to specific ads in the performance table. 
          These images will appear as thumbnails in the Ad Performance section.
        </p>
      </div>

      {/* Assignment Form */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Assign Image to Ad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Ad Name
            </label>
            <select
              value={selectedAdName}
              onChange={(e) => setSelectedAdName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select an ad --</option>
              {csvAdNames.map((adName) => (
                <option key={adName} value={adName}>
                  {adName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image
            </label>
            <select
              value={selectedMediaId}
              onChange={(e) => setSelectedMediaId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select an image --</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  {image.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAssign}
          disabled={!selectedAdName || !selectedMediaId}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Assign Image
        </button>
      </div>

      {/* Current Assignments */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Current Assignments ({mappings.size})</h3>
        {mappings.size === 0 ? (
          <p className="text-gray-500">No assignments yet. Assign images above to get started.</p>
        ) : (
          <div className="space-y-4">
            {Array.from(mappings.entries()).map(([adName, mapping]) => (
              <div
                key={mapping.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                    <Image
                      src={mapping.media.url}
                      alt={mapping.media.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{adName}</p>
                    <p className="text-sm text-gray-500">Image: {mapping.media.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(adName)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

