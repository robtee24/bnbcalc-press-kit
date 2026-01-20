'use client';

import { useEffect, useState } from 'react';
import Papa from 'papaparse';
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

export default function AdPerformance() {
  const [data, setData] = useState<AdPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/ads-performance.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch CSV file');
      }
      const text = await response.text();
      Papa.parse<AdPerformanceRow>(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ad Performance</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-12rem)] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20">
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
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 sticky left-0 bg-white z-10">
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

