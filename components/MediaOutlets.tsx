'use client';

import { useState, useEffect, useRef } from 'react';
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

interface CrawlMarketResult {
  market: string;
  discovered: number;
  saved: number;
  status: 'pending' | 'crawling' | 'done' | 'error';
  error?: string;
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

  // Crawl state
  const [crawlRunning, setCrawlRunning] = useState(false);
  const [crawlMarkets, setCrawlMarkets] = useState<string[]>([]);
  const [crawlExistingCounts, setCrawlExistingCounts] = useState<Record<string, number>>({});
  const [crawlResults, setCrawlResults] = useState<CrawlMarketResult[]>([]);
  const [crawlLoadingMarkets, setCrawlLoadingMarkets] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const crawlPauseRef = useRef(false);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOutlets();
  }, []);

  // Auto-scroll to bottom of results as they come in
  useEffect(() => {
    if (crawlRunning && resultsEndRef.current) {
      resultsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [crawlResults, crawlRunning]);

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

  const fetchCrawlMarkets = async () => {
    setCrawlLoadingMarkets(true);
    try {
      const response = await fetch('/api/media-outlets/crawl');
      if (!response.ok) throw new Error('Failed to fetch markets');
      const data = await response.json();
      setCrawlMarkets(data.markets || []);
      setCrawlExistingCounts(data.existingCounts || {});
      setHasApiKey(data.hasApiKey ?? false);
    } catch (error) {
      console.error('Error fetching markets:', error);
      alert('Error fetching markets list.');
    } finally {
      setCrawlLoadingMarkets(false);
    }
  };

  const startCrawl = async (onlyNew: boolean) => {
    let targetMarkets = crawlMarkets;
    if (onlyNew) {
      targetMarkets = crawlMarkets.filter((m) => !crawlExistingCounts[m]);
    }
    if (targetMarkets.length === 0) {
      alert('No markets to crawl.');
      return;
    }

    setCrawlRunning(true);
    crawlPauseRef.current = false;

    // Initialize all results as pending
    setCrawlResults(
      targetMarkets.map((m) => ({ market: m, discovered: 0, saved: 0, status: 'pending' }))
    );

    for (let i = 0; i < targetMarkets.length; i++) {
      if (crawlPauseRef.current) {
        setCrawlRunning(false);
        return;
      }

      const market = targetMarkets[i];

      // Mark current as crawling
      setCrawlResults((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: 'crawling' } : r))
      );

      try {
        const response = await fetch('/api/media-outlets/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ market, autoSave: true }),
        });

        if (response.ok) {
          const data = await response.json();
          setCrawlResults((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? { ...r, status: 'done', discovered: data.discovered, saved: data.saved }
                : r
            )
          );
        } else {
          setCrawlResults((prev) =>
            prev.map((r, idx) =>
              idx === i ? { ...r, status: 'error', error: `HTTP ${response.status}` } : r
            )
          );
        }
      } catch (error) {
        setCrawlResults((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: 'error', error: String(error) } : r
          )
        );
      }

      // Small delay between markets
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setCrawlRunning(false);
    fetchOutlets(); // Refresh the outlets list with new data
  };

  const stopCrawl = () => {
    crawlPauseRef.current = true;
  };

  const completedCount = crawlResults.filter((r) => r.status === 'done' || r.status === 'error').length;
  const totalSaved = crawlResults.reduce((a, r) => a + r.saved, 0);
  const totalDiscovered = crawlResults.reduce((a, r) => a + r.discovered, 0);
  const progressPercent = crawlResults.length > 0 ? (completedCount / crawlResults.length) * 100 : 0;

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

      {/* Crawl Markets Section */}
      <div className="mb-8 bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Discover Publications</h2>
            <p className="text-sm text-gray-500">
              Crawl all markets in the database to find local news, real estate publications, and blogs.
            </p>
          </div>
          {!crawlRunning && crawlMarkets.length === 0 && (
            <button
              onClick={fetchCrawlMarkets}
              disabled={crawlLoadingMarkets}
              className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 font-medium text-sm transition-colors"
            >
              {crawlLoadingMarkets ? 'Loading Markets...' : 'Load Markets'}
            </button>
          )}
        </div>

        {/* API key warning */}
        {hasApiKey === false && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-medium text-yellow-800">Search API key not configured</p>
            <p className="text-sm text-yellow-700 mt-1">
              To crawl markets, you need a free Serper.dev API key:
            </p>
            <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside space-y-1">
              <li>Go to <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline font-medium">serper.dev</a> and sign up (free - 2,500 searches)</li>
              <li>Copy your API key from the dashboard</li>
              <li>In Vercel, go to Settings &rarr; Environment Variables</li>
              <li>Add <code className="bg-yellow-100 px-1 rounded font-mono text-xs">SERPER_API_KEY</code> with your key</li>
              <li>Redeploy the project</li>
            </ol>
          </div>
        )}

        {/* Market count + action buttons */}
        {crawlMarkets.length > 0 && hasApiKey && !crawlRunning && crawlResults.length === 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{crawlMarkets.length} markets</span>
              <span>{Object.keys(crawlExistingCounts).length} already have outlets</span>
              <span>{crawlMarkets.filter((m) => !crawlExistingCounts[m]).length} new</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => startCrawl(false)}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium text-sm transition-colors"
              >
                Crawl All {crawlMarkets.length} Markets
              </button>
              <button
                onClick={() => startCrawl(true)}
                className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm transition-colors"
              >
                Crawl Only New Markets ({crawlMarkets.filter((m) => !crawlExistingCounts[m]).length})
              </button>
            </div>
          </div>
        )}

        {/* Progress bar + stop button */}
        {(crawlRunning || crawlResults.length > 0) && (
          <div className="space-y-4">
            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">
                  {completedCount} / {crawlResults.length} markets
                </span>
                <span className="text-green-600">{totalSaved} saved</span>
                <span className="text-gray-500">{totalDiscovered} discovered</span>
              </div>
              {crawlRunning ? (
                <button
                  onClick={stopCrawl}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
                >
                  Stop Crawl
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCrawlResults([]);
                    fetchCrawlMarkets();
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ease-out ${
                  crawlRunning ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Results table */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">#</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Market</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Found</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Saved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {crawlResults.map((result, idx) => (
                    <tr
                      key={result.market}
                      className={
                        result.status === 'crawling'
                          ? 'bg-orange-50'
                          : result.status === 'error'
                          ? 'bg-red-50'
                          : result.status === 'done'
                          ? 'bg-green-50/50'
                          : ''
                      }
                    >
                      <td className="px-4 py-2 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{result.market}</td>
                      <td className="px-4 py-2">
                        {result.status === 'pending' && (
                          <span className="text-gray-400">Waiting...</span>
                        )}
                        {result.status === 'crawling' && (
                          <span className="text-orange-600 font-medium flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            Crawling...
                          </span>
                        )}
                        {result.status === 'done' && (
                          <span className="text-green-600 font-medium">Done</span>
                        )}
                        {result.status === 'error' && (
                          <span className="text-red-600 font-medium" title={result.error}>Error</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        {result.status === 'done' || result.status === 'error' ? result.discovered : ''}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-green-700">
                        {result.status === 'done' ? result.saved : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div ref={resultsEndRef} />
            </div>
          </div>
        )}
      </div>

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

      {outlets.length === 0 && crawlResults.length === 0 ? (
        <p className="text-gray-600">No media outlets have been added yet. Use the Discover section above to crawl all markets.</p>
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
