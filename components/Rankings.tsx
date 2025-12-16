'use client';

import { useState } from 'react';

interface RankingsProps {
  onSelectMetric: (metric: string) => void;
}

const METRICS = [
  { id: 'gross-yield', name: 'Gross Yield', description: 'Average return on investment for a property' },
  { id: 'total-revenue', name: 'Total Revenue', description: 'Total revenue of Airbnbs in the market' },
  { id: 'total-listings', name: 'Total Listings', description: 'Total number of homes listed on Airbnb' },
  { id: 'revenue-per-listing', name: 'Revenue Per Listing', description: 'Average revenue a listing generates per year' },
  { id: 'occupancy', name: 'Occupancy', description: 'Average number of nights per year occupied (percentage)' },
  { id: 'nightly-rate', name: 'Nightly Rate', description: 'Average price a home rents per night' },
];

export default function Rankings({ onSelectMetric }: RankingsProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Rankings</h1>
      <p className="text-gray-600 mb-8">
        Select a metric to view city rankings from 1 to 100.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {METRICS.map((metric) => (
          <button
            key={metric.id}
            onClick={() => onSelectMetric(metric.id)}
            className="bg-white rounded-lg shadow-md p-6 text-left hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{metric.name}</h2>
            <p className="text-sm text-gray-600">{metric.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

