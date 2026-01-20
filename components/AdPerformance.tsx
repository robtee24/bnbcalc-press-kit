'use client';

import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import Image from 'next/image';
import LoadingIcon from './LoadingIcon';

interface AdPerformanceRow {
  'Ad name': string;
  'Results': string;
  'Cost per results': string;
  'Amount spent (USD)': string;
  'Impressions': string;
  'Reach': string;
  'Frequency': string;
  'CPM (cost per 1,000 impressions) (USD)': string;
  'Purchases': string;
  'Bid': string;
  'Purchase ROAS (return on ad spend)': string;
}

interface MediaItem {
  id: string;
  title: string;
  url: string;
  type: string;
}

export default function AdPerformance() {
  const [data, setData] = useState<AdPerformanceRow[]>([]);
  const [adsMap, setAdsMap] = useState<Map<string, MediaItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchMappings = async () => {
    try {
      const response = await fetch('/api/ad-performance-mappings');
      const mappings = await response.json();
      
      // Create a map of ad names to media items
      const map = new Map<string, MediaItem>();
      mappings.forEach((mapping: { adName: string; media: MediaItem }) => {
        map.set(mapping.adName, mapping.media);
      });
      
      console.log('Fetched mappings:', map.size, 'total');
      setAdsMap(map);
    } catch (err) {
      console.error('Error fetching mappings:', err);
    }
  };

  const normalizeForMatching = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const findMatchingAd = (adName: string): MediaItem | null => {
    const trimmedName = adName.trim();
    
    // Direct lookup from mappings
    if (adsMap.has(trimmedName)) {
      return adsMap.get(trimmedName)!;
    }
    
    return null;
  };

  const fetchData = async () => {
    try {
      // Fetch both CSV and mappings in parallel
      await fetchMappings();
      
      const response = await fetch('/ads-performance.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch CSV file');
      }
      const text = await response.text();
      Papa.parse<AdPerformanceRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('CSV parsed, rows:', results.data.length);
          console.log('Sample CSV ad names:', results.data.slice(0, 5).map((row: AdPerformanceRow) => row['Ad name']));
          setData(results.data);
          setLoading(false);
        },
        error: (error: Error) => {
          setError(error.message);
          setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | undefined): string => {
    if (!value || value.trim() === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value: string | undefined): string => {
    if (!value || value.trim() === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatPercentage = (value: string | undefined): string => {
    if (!value || value.trim() === '') return '-';
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return `${num.toFixed(2)}%`;
  };

  if (loading) {
    return <LoadingIcon />;
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Ad Performance</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  // Debug: Count how many matches we found
  const matchedCount = data.filter(row => findMatchingAd(row['Ad name'] || '')).length;
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ad Performance</h1>
      
      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <p><strong>Debug Info:</strong></p>
          <p>Total CSV rows: {data.length}</p>
          <p>Ads in database: {adsMap.size}</p>
          <p>Matched thumbnails: {matchedCount}</p>
          <p>Sample ad titles from DB: {Array.from(adsMap.keys()).slice(0, 3).join(', ')}</p>
          <p>Sample CSV ad names: {data.slice(0, 3).map(r => r['Ad name']).join(', ')}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-12rem)] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 w-28 border-r border-gray-300">
                  Thumbnail
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-28 bg-gray-50 z-20 min-w-[200px]">
                  Ad Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost per Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Spent (USD)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPM (USD)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase ROAS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, index) => {
                const adName = row['Ad name'] || '';
                const matchingAd = findMatchingAd(adName);
                if (!matchingAd && index < 3) {
                  console.log('No match found for:', adName, '| Available titles:', Array.from(adsMap.keys()).slice(0, 3));
                }
                return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 sticky left-0 bg-white z-10 border-r border-gray-200">
                    {matchingAd ? (
                      matchingAd.type === 'image' ? (
                        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                          <Image
                            src={matchingAd.url}
                            alt={matchingAd.title}
                            fill
                            className="object-cover object-center"
                            sizes="80px"
                            unoptimized
                            style={{
                              objectFit: 'cover',
                              objectPosition: 'center',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="relative w-20 h-20 flex-shrink-0 bg-black rounded overflow-hidden border border-gray-200">
                          <video
                            src={matchingAd.url}
                            className="w-full h-full object-cover object-center"
                            muted
                            playsInline
                            preload="metadata"
                            style={{
                              objectFit: 'cover',
                              objectPosition: 'center',
                            }}
                            onMouseEnter={(e) => {
                              const video = e.currentTarget;
                              video.currentTime = 0.5; // Show frame at 0.5 second for better thumbnail
                              video.play().catch(() => {}); // Auto-play on hover
                            }}
                            onMouseLeave={(e) => {
                              const video = e.currentTarget;
                              video.pause();
                              video.currentTime = 0.5; // Keep at 0.5 second for consistent thumbnail
                            }}
                            onLoadedMetadata={(e) => {
                              // Set video to show a frame at 0.5 seconds as thumbnail
                              const video = e.currentTarget;
                              video.currentTime = 0.5;
                            }}
                          />
                        </div>
                      )
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center border border-gray-300">
                        <span className="text-xs text-gray-400 text-center px-1">No thumbnail</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 sticky left-28 bg-white z-10 min-w-[200px]">
                    {row['Ad name'] || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row['Results'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(row['Cost per results'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(row['Amount spent (USD)'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row['Impressions'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row['Reach'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row['Frequency'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(row['CPM (cost per 1,000 impressions) (USD)'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row['Purchases'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row['Bid'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(row['Purchase ROAS (return on ad spend)'])}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

