'use client';

import { useState, useEffect, useRef } from 'react';
import LoadingIcon from './LoadingIcon';
import AnimatedNumber from './AnimatedNumber';

interface CityData {
  id: string;
  city: string;
  state: string | null;
  grossYield: number | null;
  grossYieldRank: number | null;
  totalRevenue: number | null;
  totalRevenueRank: number | null;
  totalListings: number | null;
  totalListingsRank: number | null;
  revenuePerListing: number | null;
  revenuePerListingRank: number | null;
  occupancy: number | null;
  occupancyRank: number | null;
  nightlyRate: number | null;
  nightlyRateRank: number | null;
}

interface Averages {
  grossYield: number | null;
  totalRevenue: number | null;
  totalListings: number | null;
  revenuePerListing: number | null;
  occupancy: number | null;
  nightlyRate: number | null;
}

interface SearchByCityProps {
  initialCity?: string | null;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function SearchByCity({ initialCity, showBackButton, onBack }: SearchByCityProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [pressRelease, setPressRelease] = useState<string | null>(null);
  const [newsArticle, setNewsArticle] = useState<string | null>(null);
  const [articleVariant, setArticleVariant] = useState(0);
  const [articleLoading, setArticleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAverages, setLoadingAverages] = useState(true);
  const [averages, setAverages] = useState<Averages | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchCities();
    fetchAverages();
  }, []);

  // Auto-search when initialCity is provided
  useEffect(() => {
    if (initialCity && !selectedCity) {
      const searchCity = async () => {
        setLoading(true);
        setShowDropdown(false);
        try {
          const cityName = initialCity.includes(',') 
            ? initialCity.split(',')[0].trim() 
            : initialCity.trim();
          
          const response = await fetch(`/api/cities?city=${encodeURIComponent(cityName)}`);
          if (response.ok) {
            const data = await response.json();
            setSelectedCity(data);
            setSearchTerm('');
            generatePressRelease(cityName);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Error fetching city data:', errorData.error || 'City not found');
          }
        } catch (error) {
          console.error('Error fetching city data:', error);
        } finally {
          setLoading(false);
        }
      };
      searchCity();
    }
  }, [initialCity, selectedCity]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const fetchAverages = async () => {
    setLoadingAverages(true);
    try {
      const response = await fetch('/api/cities/averages');
      if (response.ok) {
        const data = await response.json();
        setAverages(data);
      }
    } catch (error) {
      console.error('Error fetching averages:', error);
    } finally {
      setLoadingAverages(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/cities');
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleSearch = async (cityInput: string) => {
    setLoading(true);
    setShowDropdown(false); // Hide dropdown when searching
    try {
      // Extract city name from "City, State" format if present
      const cityName = cityInput.includes(',') 
        ? cityInput.split(',')[0].trim() 
        : cityInput.trim();
      
      const response = await fetch(`/api/cities?city=${encodeURIComponent(cityName)}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedCity(data);
        setSearchTerm(''); // Clear search term after selection
        generatePressRelease(cityName);
      } else {
        alert('Market not found');
      }
    } catch (error) {
      console.error('Error fetching city data:', error);
      alert('Error fetching market data');
    } finally {
      setLoading(false);
    }
  };

  const generatePressRelease = async (city: string) => {
    try {
      const [prResponse, articleResponse] = await Promise.all([
        fetch('/api/press-release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city }),
        }),
        fetch('/api/news-article', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city, variant: 0 }),
        }),
      ]);
      const prData = await prResponse.json();
      setPressRelease(prData.pressRelease);

      const articleData = await articleResponse.json();
      setNewsArticle(articleData.article || null);
      setArticleVariant(0);
    } catch (error) {
      console.error('Error generating press release:', error);
    }
  };

  const rewriteArticle = async () => {
    if (!selectedCity) return;
    setArticleLoading(true);
    try {
      const nextVariant = articleVariant + 1;
      const cityName = selectedCity.city;
      const response = await fetch('/api/news-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cityName, variant: nextVariant }),
      });
      const data = await response.json();
      setNewsArticle(data.article || null);
      setArticleVariant(nextVariant);
    } catch (error) {
      console.error('Error rewriting article:', error);
    } finally {
      setArticleLoading(false);
    }
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const MetricCard = ({
    title,
    value,
    rank,
    tooltip,
    description,
    average,
    valueType,
  }: {
    title: string;
    value: number | string | null;
    rank: number | null;
    tooltip: string;
    description: string;
    average: number | null;
    valueType: 'percentage' | 'currency' | 'number' | 'currencyNoSymbol';
  }) => {
    const formatAverage = (avg: number | null, type: string, title?: string) => {
      if (avg === null) return null;
      if (type === 'percentage') {
        // Occupancy uses 1 decimal, gross yield uses 2 decimals
        const decimals = title === 'Occupancy' ? 1 : 2;
        return `${avg.toFixed(decimals)}%`;
      }
      if (type === 'currency' || type === 'currencyNoSymbol') {
        // Nightly rate uses 2 decimals, others use 0
        const decimals = title === 'Nightly Rate' ? 2 : 0;
        return `$${avg.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
      }
      return avg.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    // Extract numeric value from formatted string or use number directly
    const getNumericValue = (): number | null => {
      if (value === null) return null;
      if (typeof value === 'number') return value;
      // Parse formatted strings like "12.34%" or "$1,234"
      const cleaned = value.toString().replace(/[$,%]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    const numericValue = getNumericValue();
    
    // Determine decimals based on valueType and title
    const getDecimals = (): number => {
      if (valueType === 'percentage') {
        return title === 'Occupancy' ? 1 : 2;
      }
      if (valueType === 'currency' || valueType === 'currencyNoSymbol') {
        return title === 'Nightly Rate' ? 2 : 0;
      }
      return 0;
    };

    const decimals = getDecimals();
    const prefix = (valueType === 'currency' || valueType === 'currencyNoSymbol') ? '$' : '';
    const suffix = valueType === 'percentage' ? '%' : '';

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="relative group">
            <div className="w-5 h-5 rounded-full bg-black text-white text-xs font-semibold flex items-center justify-center cursor-help">
              i
            </div>
            <div className="absolute right-0 top-6 w-64 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {tooltip}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-2xl font-bold">
              {numericValue !== null ? (
                <AnimatedNumber 
                  value={numericValue} 
                  decimals={decimals}
                  prefix={prefix}
                  suffix={suffix}
                />
              ) : (
                'N/A'
              )}
            </span>
            {average !== null && (
              <span className="ml-2 text-xs text-gray-400 font-normal">
                (avg: {formatAverage(average, valueType, title)})
              </span>
            )}
          </div>
          {rank !== null && (
            <div className="text-sm text-gray-600">
              Rank: <span className="font-semibold">#{rank}</span>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-3">{description}</p>
        </div>
      </div>
    );
  };

  const getMetricDescription = (metric: string, value: number | null, rank: number | null) => {
    if (value === null || rank === null) return 'Data not available for this metric.';
    
    const isGoodRank = rank <= 50;
    const isExcellentRank = rank <= 20;
    
    const descriptions: Record<string, string> = {
      grossYield: `The ${value.toFixed(2)}% gross yield indicates ${isExcellentRank ? 'excellent' : isGoodRank ? 'strong' : 'moderate'} return potential for investors. With a rank of #${rank}, this market ${isExcellentRank ? 'stands out as one of the top performers' : isGoodRank ? 'shows competitive performance' : 'has room for growth'} in generating returns relative to property values.`,
      totalRevenue: `Total revenue of $${value.toLocaleString()} places this market at rank #${rank}, ${isExcellentRank ? 'demonstrating exceptional market size and economic activity' : isGoodRank ? 'indicating a healthy and active short-term rental market' : 'suggesting potential for market expansion'}.`,
      totalListings: `With ${value.toLocaleString()} listings ranking #${rank}, this market ${isExcellentRank ? 'offers extensive accommodation options' : isGoodRank ? 'provides good variety for travelers' : 'has growing inventory'}, ${isExcellentRank ? 'making it a mature and well-established destination' : 'indicating ongoing market development'}.`,
      revenuePerListing: `Average revenue per listing of $${value.toLocaleString()} (rank #${rank}) ${isExcellentRank ? 'demonstrates exceptional host profitability' : isGoodRank ? 'shows strong earning potential for hosts' : 'indicates moderate performance'}, ${isExcellentRank ? 'making this an attractive market for new hosts' : 'suggesting competitive opportunities'}.`,
      occupancy: `An occupancy rate of ${value.toFixed(1)}% (rank #${rank}) ${isExcellentRank ? 'indicates exceptional demand consistency' : isGoodRank ? 'shows strong and steady demand' : 'suggests seasonal or variable demand patterns'}, ${isExcellentRank ? 'ensuring reliable income streams for hosts' : 'highlighting opportunities for strategic pricing'}.`,
      nightlyRate: `The average nightly rate of $${value.toFixed(2)} (rank #${rank}) ${isExcellentRank ? 'positions this market as a premium destination' : isGoodRank ? 'reflects competitive pricing in a strong market' : 'suggests value-oriented positioning'}, ${isExcellentRank ? 'attracting quality-conscious travelers' : 'offering good value for guests'}.`,
    };
    
    return descriptions[metric] || 'This metric provides important insights into market performance.';
  };

  // Show loading icon when fetching averages and no city is selected
  if (loadingAverages && !selectedCity && !loading) {
    return (
      <div>
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Back to Rankings
          </button>
        )}
        <LoadingIcon />
      </div>
    );
  }

  // Show loading icon when loading city data
  if (loading) {
    return (
      <div>
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            ← Back to Rankings
          </button>
        )}
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div>
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          ← Back to Rankings
        </button>
      )}
      <h1 className="text-3xl font-bold mb-6">Search by Market</h1>
      
      <div className="mb-8 search-container">
        <input
          type="text"
          placeholder="Search Market"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true); // Show dropdown when typing
          }}
          onFocus={() => {
            if (searchTerm && filteredCities.length > 0) {
              setShowDropdown(true);
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && filteredCities.length > 0) {
              handleSearch(filteredCities[0]);
            }
          }}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {showDropdown && searchTerm && filteredCities.length > 0 && (
          <div className="mt-2 max-w-md bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredCities.slice(0, 10).map((city) => (
              <button
                key={city}
                onClick={() => {
                  handleSearch(city);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                {city}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <LoadingIcon />}

      {!selectedCity && !loading && averages && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">National Averages</h2>
          <p className="text-gray-600">Search for a market above to see specific metrics, or view national averages below. Market names are typically the largest city for a given area.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Gross Yield"
              value={averages.grossYield}
              rank={null}
              tooltip="This is the metric to determine the average return on investment for a property. This is a calculation using the average annual return over the purchase price of the property."
              description="This represents the national average gross yield across all markets, providing a benchmark for comparing individual city performance."
              average={null}
              valueType="percentage"
            />
            
            <MetricCard
              title="Total Revenue"
              value={averages.totalRevenue}
              rank={null}
              tooltip="This is total revenue of Airbnbs in this market."
              description="This represents the national average total revenue across all markets, indicating the overall economic activity in the short-term rental industry."
              average={null}
              valueType="currency"
            />
            
            <MetricCard
              title="Total Listings"
              value={averages.totalListings}
              rank={null}
              tooltip="The total number of homes listed on Airbnb in this market."
              description="This represents the national average number of listings per market, showing the typical supply of accommodation options."
              average={null}
              valueType="number"
            />
            
            <MetricCard
              title="Revenue Per Listing"
              value={averages.revenuePerListing}
              rank={null}
              tooltip="The average revenue a listing generates per year in this market."
              description="This represents the national average revenue per listing, indicating typical host profitability across markets."
              average={null}
              valueType="currency"
            />
            
            <MetricCard
              title="Occupancy"
              value={averages.occupancy}
              rank={null}
              tooltip="This is the average number of nights per year the listing is occupied shown as a percentage."
              description="This represents the national average occupancy rate, showing typical demand levels across short-term rental markets."
              average={null}
              valueType="percentage"
            />
            
            <MetricCard
              title="Nightly Rate"
              value={averages.nightlyRate}
              rank={null}
              tooltip="This is the average price a home rents per night in the market."
              description="This represents the national average nightly rate, indicating typical pricing across markets."
              average={null}
              valueType="currency"
            />
          </div>
        </div>
      )}

      {selectedCity && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {selectedCity.city} Market
            </h2>
            <button
              onClick={() => {
                setSelectedCity(null);
                setPressRelease(null);
                setNewsArticle(null);
                setArticleVariant(0);
                setSearchTerm('');
              }}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear & View Averages
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Gross Yield"
              value={selectedCity.grossYield}
              rank={selectedCity.grossYieldRank}
              tooltip="This is the metric to determine the average return on investment for a property. This is a calculation using the average annual return over the purchase price of the property."
              description={getMetricDescription('grossYield', selectedCity.grossYield, selectedCity.grossYieldRank)}
              average={averages?.grossYield ?? null}
              valueType="percentage"
            />
            
            <MetricCard
              title="Total Revenue"
              value={selectedCity.totalRevenue}
              rank={selectedCity.totalRevenueRank}
              tooltip="This is total revenue of Airbnbs in this market."
              description={getMetricDescription('totalRevenue', selectedCity.totalRevenue, selectedCity.totalRevenueRank)}
              average={averages?.totalRevenue ?? null}
              valueType="currency"
            />
            
            <MetricCard
              title="Total Listings"
              value={selectedCity.totalListings}
              rank={selectedCity.totalListingsRank}
              tooltip="The total number of homes listed on Airbnb in this market."
              description={getMetricDescription('totalListings', selectedCity.totalListings, selectedCity.totalListingsRank)}
              average={averages?.totalListings ?? null}
              valueType="number"
            />
            
            <MetricCard
              title="Revenue Per Listing"
              value={selectedCity.revenuePerListing}
              rank={selectedCity.revenuePerListingRank}
              tooltip="The average revenue a listing generates per year in this market."
              description={getMetricDescription('revenuePerListing', selectedCity.revenuePerListing, selectedCity.revenuePerListingRank)}
              average={averages?.revenuePerListing ?? null}
              valueType="currency"
            />
            
            <MetricCard
              title="Occupancy"
              value={selectedCity.occupancy}
              rank={selectedCity.occupancyRank}
              tooltip="This is the average number of nights per year the listing is occupied shown as a percentage."
              description={getMetricDescription('occupancy', selectedCity.occupancy, selectedCity.occupancyRank)}
              average={averages?.occupancy ?? null}
              valueType="percentage"
            />
            
            <MetricCard
              title="Nightly Rate"
              value={selectedCity.nightlyRate}
              rank={selectedCity.nightlyRateRank}
              tooltip="This is the average price a home rents per night in the market."
              description={getMetricDescription('nightlyRate', selectedCity.nightlyRate, selectedCity.nightlyRateRank)}
              average={averages?.nightlyRate ?? null}
              valueType="currency"
            />
          </div>

          {pressRelease && (() => {
            // Extract title (line after "FOR IMMEDIATE RELEASE\n\n")
            const parts = pressRelease.split('\n\n');
            const title = parts[1] || '';
            const restOfRelease = parts.slice(2).join('\n\n');
            
            // Process the rest to convert <strong> tags and line breaks
            const processedContent = restOfRelease
              .replace(/\n/g, '<br>')
              .replace(/<strong>(.*?)<\/strong>/g, '<strong class="font-bold">$1</strong>');
            
            return (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-2xl font-bold mb-4">Press Release</h3>
                <div className="space-y-4">
                  <div className="text-lg font-semibold mb-2">FOR IMMEDIATE RELEASE</div>
                  {title && (
                    <div 
                      className="text-4xl font-bold mb-6"
                      dangerouslySetInnerHTML={{ 
                        __html: title.replace(/<strong>/g, '<strong class="font-bold">')
                      }}
                    />
                  )}
                  <div 
                    className="whitespace-pre-wrap text-base text-gray-700 font-sans leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: processedContent }}
                  />
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pressRelease.replace(/<strong>/g, '').replace(/<\/strong>/g, ''));
                    alert('Press release copied to clipboard!');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Copy to Clipboard
                </button>
              </div>
            );
          })()}

          {newsArticle && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">Example News Article</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Version {articleVariant + 1}</span>
                </div>
                <button
                  onClick={rewriteArticle}
                  disabled={articleLoading}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 text-sm font-medium"
                >
                  {articleLoading ? 'Rewriting...' : 'Rewrite Article'}
                </button>
              </div>
              <div
                className="prose prose-lg max-w-none text-gray-800 leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:mb-6 [&_h1]:text-gray-900"
                dangerouslySetInnerHTML={{
                  __html: newsArticle
                    .replace(/\n\n/g, '</p><p class="mb-4">')
                    .replace(/\n/g, '<br>')
                    .replace(/^/, '<p class="mb-4">')
                    .replace(/$/, '</p>'),
                }}
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    const plain = newsArticle
                      .replace(/<h1>(.*?)<\/h1>/g, '$1\n\n')
                      .replace(/<strong>(.*?)<\/strong>/g, '$1')
                      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '$2 ($1)')
                      .replace(/<[^>]*>/g, '')
                      .trim();
                    navigator.clipboard.writeText(plain);
                    alert('Article copied to clipboard!');
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Copy Article
                </button>
                <button
                  onClick={() => {
                    const plain = newsArticle
                      .replace(/<h1>(.*?)<\/h1>/g, '$1\n\n')
                      .replace(/<strong>(.*?)<\/strong>/g, '$1')
                      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '$2 ($1)')
                      .replace(/<[^>]*>/g, '')
                      .trim();
                    const blob = new Blob([plain], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedCity?.city || 'market'}-news-article.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Download as Text
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

