'use client';

import { useState, useEffect } from 'react';
import LoadingIcon from './LoadingIcon';
import AnimatedNumber from './AnimatedNumber';
import React from 'react';

interface CityRanking {
  id: string;
  city: string;
  state: string | null;
  rank: number | null;
  value: number | null;
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

interface RankingDetailProps {
  metric: string;
  onBack: () => void;
  onViewCity: (city: string) => void;
}

const METRIC_NAMES: Record<string, string> = {
  'gross-yield': 'Gross Yield',
  'total-revenue': 'Total Revenue',
  'total-listings': 'Total Listings',
  'revenue-per-listing': 'Revenue Per Listing',
  'occupancy': 'Occupancy',
  'nightly-rate': 'Nightly Rate',
};

const METRIC_TOOLTIPS: Record<string, string> = {
  'gross-yield': 'This is the metric to determine the average return on investment for a property. This is a calculation using the average annual return over the purchase price of the property.',
  'total-revenue': 'This is total revenue of Airbnbs in this market.',
  'total-listings': 'The total number of homes listed on Airbnb in this market.',
  'revenue-per-listing': 'The average revenue a listing generates per year in this market.',
  'occupancy': 'This is the average number of nights per year the listing is occupied shown as a percentage.',
  'nightly-rate': 'This is the average price a home rents per night in the market.',
};

export default function RankingDetail({ metric, onBack, onViewCity }: RankingDetailProps) {
  const [rankings, setRankings] = useState<CityRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  useEffect(() => {
    fetchRankings();
  }, [metric]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rankings?metric=${metric}`);
      if (response.ok) {
        const data = await response.json();
        setRankings(data);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number | null, metricType: string): JSX.Element | string => {
    if (value === null) return 'N/A';
    
    switch (metricType) {
      case 'gross-yield':
        return <AnimatedNumber value={value} decimals={2} suffix="%" />;
      case 'occupancy':
        return <AnimatedNumber value={value} decimals={1} suffix="%" />;
      case 'total-revenue':
      case 'revenue-per-listing':
        return <AnimatedNumber value={value} decimals={0} prefix="$" />;
      case 'nightly-rate':
        return <AnimatedNumber value={value} decimals={2} prefix="$" />;
      case 'total-listings':
        return <AnimatedNumber value={value} decimals={0} />;
      default:
        return <AnimatedNumber value={value} decimals={0} />;
    }
  };

  const getMetricDescription = (metricType: string, value: number | null, rank: number | null) => {
    if (value === null || rank === null) return 'Data not available for this metric.';
    
    const isGoodRank = rank <= 50;
    const isExcellentRank = rank <= 20;
    
    const descriptions: Record<string, string> = {
      'gross-yield': `The ${value.toFixed(2)}% gross yield indicates ${isExcellentRank ? 'excellent' : isGoodRank ? 'strong' : 'moderate'} return potential for investors. With a rank of #${rank}, this market ${isExcellentRank ? 'stands out as one of the top performers' : isGoodRank ? 'shows competitive performance' : 'has room for growth'} in generating returns relative to property values.`,
      'total-revenue': `Total revenue of $${value.toLocaleString()} places this market at rank #${rank}, ${isExcellentRank ? 'demonstrating exceptional market size and economic activity' : isGoodRank ? 'indicating a healthy and active short-term rental market' : 'suggesting potential for market expansion'}.`,
      'total-listings': `With ${value.toLocaleString()} listings ranking #${rank}, this market ${isExcellentRank ? 'offers extensive accommodation options' : isGoodRank ? 'provides good variety for travelers' : 'has growing inventory'}, ${isExcellentRank ? 'making it a mature and well-established destination' : 'indicating ongoing market development'}.`,
      'revenue-per-listing': `Average revenue per listing of $${value.toLocaleString()} (rank #${rank}) ${isExcellentRank ? 'demonstrates exceptional host profitability' : isGoodRank ? 'shows strong earning potential for hosts' : 'indicates moderate performance'}, ${isExcellentRank ? 'making this an attractive market for new hosts' : 'suggesting competitive opportunities'}.`,
      'occupancy': `An occupancy rate of ${value.toFixed(1)}% (rank #${rank}) ${isExcellentRank ? 'indicates exceptional demand consistency' : isGoodRank ? 'shows strong and steady demand' : 'suggests seasonal or variable demand patterns'}, ${isExcellentRank ? 'ensuring reliable income streams for hosts' : 'highlighting opportunities for strategic pricing'}.`,
      'nightly-rate': `The average nightly rate of $${value.toFixed(2)} (rank #${rank}) ${isExcellentRank ? 'positions this market as a premium destination' : isGoodRank ? 'reflects competitive pricing in a strong market' : 'suggests value-oriented positioning'}, ${isExcellentRank ? 'attracting quality-conscious travelers' : 'offering good value for guests'}.`,
    };
    
    return descriptions[metricType] || 'This metric provides important insights into market performance.';
  };

  if (loading) {
    return (
      <div>
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          ← Back to Rankings
        </button>
        <div className="text-center py-8">Loading rankings...</div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
      >
        ← Back to Rankings
      </button>
      
      <h1 className="text-3xl font-bold mb-6">{METRIC_NAMES[metric]} Rankings</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rankings.map((city) => (
              <React.Fragment key={city.id}>
                <tr
                  onClick={() => setExpandedCity(expandedCity === city.id ? null : city.id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{city.rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const cityName = city.state ? `${city.city}, ${city.state}` : city.city;
                        onViewCity(cityName);
                      }}
                      className="font-medium hover:underline"
                    >
                      {city.city}{city.state ? `, ${city.state}` : ''}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(city.value, metric)}
                  </td>
                </tr>
                {expandedCity === city.id && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">{METRIC_NAMES[metric]}</h3>
                          <p className="text-sm text-gray-700">
                            {getMetricDescription(metric, city.value, city.rank)}
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-2">All Metrics for {city.city}{city.state ? `, ${city.state}` : ''}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {city.grossYield !== null && (
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500">Gross Yield</div>
                                <div className="font-semibold">{formatValue(city.grossYield, 'gross-yield')}</div>
                                {city.grossYieldRank && <div className="text-xs text-gray-400">Rank: #{city.grossYieldRank}</div>}
                              </div>
                            )}
                            {city.totalRevenue !== null && (
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500">Total Revenue</div>
                                <div className="font-semibold">{formatValue(city.totalRevenue, 'total-revenue')}</div>
                                {city.totalRevenueRank && <div className="text-xs text-gray-400">Rank: #{city.totalRevenueRank}</div>}
                              </div>
                            )}
                            {city.totalListings !== null && (
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500">Total Listings</div>
                                <div className="font-semibold">{formatValue(city.totalListings, 'total-listings')}</div>
                                {city.totalListingsRank && <div className="text-xs text-gray-400">Rank: #{city.totalListingsRank}</div>}
                              </div>
                            )}
                            {city.revenuePerListing !== null && (
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500">Revenue Per Listing</div>
                                <div className="font-semibold">{formatValue(city.revenuePerListing, 'revenue-per-listing')}</div>
                                {city.revenuePerListingRank && <div className="text-xs text-gray-400">Rank: #{city.revenuePerListingRank}</div>}
                              </div>
                            )}
                            {city.occupancy !== null && (
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500">Occupancy</div>
                                <div className="font-semibold">{formatValue(city.occupancy, 'occupancy')}</div>
                                {city.occupancyRank && <div className="text-xs text-gray-400">Rank: #{city.occupancyRank}</div>}
                              </div>
                            )}
                            {city.nightlyRate !== null && (
                              <div className="bg-white p-3 rounded border">
                                <div className="text-xs text-gray-500">Nightly Rate</div>
                                <div className="font-semibold">{formatValue(city.nightlyRate, 'nightly-rate')}</div>
                                {city.nightlyRateRank && <div className="text-xs text-gray-400">Rank: #{city.nightlyRateRank}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

