'use client';

import { useState, useEffect } from 'react';
import LoadingIcon from './LoadingIcon';

interface MediaOutlet {
  id: string;
  name: string;
  url: string;
  email: string | null;
  type: string;
  market: string;
  description: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  local_news: 'Local News Outlets',
  real_estate_publication: 'Real Estate Publications',
  realtor_blog: 'Realtor / Brokerage Blogs',
};

const TYPE_COLORS: Record<string, string> = {
  local_news: 'bg-blue-500',
  real_estate_publication: 'bg-green-500',
  realtor_blog: 'bg-purple-500',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  local_news: 'bg-blue-100 text-blue-800',
  real_estate_publication: 'bg-green-100 text-green-800',
  realtor_blog: 'bg-purple-100 text-purple-800',
};

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'local_news', label: 'Local News Outlets' },
  { value: 'real_estate_publication', label: 'Real Estate Publications' },
  { value: 'realtor_blog', label: 'Realtor / Brokerage Blogs' },
];

export default function MediaOutlets() {
  const [outlets, setOutlets] = useState<MediaOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [searchMarket, setSearchMarket] = useState('');
  const [markets, setMarkets] = useState<string[]>([]);

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/media-outlets');
      const data = await response.json();
      setOutlets(Array.isArray(data) ? data : []);
      const uniqueMarkets = [...new Set(data.map((o: MediaOutlet) => o.market))].sort() as string[];
      setMarkets(uniqueMarkets);
    } catch (error) {
      console.error('Error fetching media outlets:', error);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutlets = outlets.filter((o) => {
    if (selectedType && o.type !== selectedType) return false;
    if (searchMarket && o.market !== searchMarket) return false;
    return true;
  });

  // Group by type for display
  const grouped = filteredOutlets.reduce((acc, outlet) => {
    if (!acc[outlet.type]) acc[outlet.type] = [];
    acc[outlet.type].push(outlet);
    return acc;
  }, {} as Record<string, MediaOutlet[]>);

  const typeCounts = {
    local_news: outlets.filter((o) => o.type === 'local_news' && (!searchMarket || o.market === searchMarket)).length,
    real_estate_publication: outlets.filter((o) => o.type === 'real_estate_publication' && (!searchMarket || o.market === searchMarket)).length,
    realtor_blog: outlets.filter((o) => o.type === 'realtor_blog' && (!searchMarket || o.market === searchMarket)).length,
  };

  if (loading) return <LoadingIcon />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Media Outlets &amp; Publications</h1>

      {/* Market filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Market</label>
        <select
          value={searchMarket}
          onChange={(e) => setSearchMarket(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
        >
          <option value="">All Markets</option>
          {markets.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Type toggle */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TYPE_OPTIONS.map((opt) => {
          const isActive = selectedType === opt.value;
          const count = opt.value ? typeCounts[opt.value as keyof typeof typeCounts] || 0 : filteredOutlets.length;
          return (
            <button
              key={opt.value}
              onClick={() => setSelectedType(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? opt.value
                    ? `${TYPE_COLORS[opt.value]} text-white`
                    : 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {opt.label}
              <span className={`ml-2 ${isActive ? 'opacity-80' : 'text-gray-500'}`}>({count})</span>
            </button>
          );
        })}
      </div>

      {outlets.length === 0 ? (
        <p className="text-gray-600">No media outlets have been added yet.</p>
      ) : filteredOutlets.length === 0 ? (
        <p className="text-gray-600">No outlets found for the selected filters.</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([type, typeOutlets]) => (
              <div key={type}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${TYPE_COLORS[type] || 'bg-gray-400'}`} />
                  {TYPE_LABELS[type] || type}
                  <span className="text-sm font-normal text-gray-500">({typeOutlets.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeOutlets.map((outlet) => (
                    <div
                      key={outlet.id}
                      className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow border-l-4"
                      style={{
                        borderLeftColor:
                          outlet.type === 'local_news'
                            ? '#3B82F6'
                            : outlet.type === 'real_estate_publication'
                            ? '#22C55E'
                            : '#A855F7',
                      }}
                    >
                      <h3 className="font-semibold text-lg mb-1">{outlet.name}</h3>
                      {outlet.description && (
                        <p className="text-sm text-gray-500 mb-2">{outlet.description}</p>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${TYPE_BADGE_COLORS[outlet.type] || 'bg-gray-100 text-gray-800'}`}>
                          {TYPE_LABELS[outlet.type] || outlet.type}
                        </span>
                        <span className="text-xs text-gray-500">{outlet.market}</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <a
                          href={outlet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline block truncate"
                        >
                          {outlet.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                        {outlet.email && (
                          <a
                            href={`mailto:${outlet.email}`}
                            className="text-gray-700 hover:text-blue-600 block"
                          >
                            {outlet.email}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
