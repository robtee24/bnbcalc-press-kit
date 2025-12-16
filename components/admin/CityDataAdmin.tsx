'use client';

import { useState, useEffect } from 'react';

const FIELD_MAPPINGS = {
  city: 'City',
  state: 'State',
  grossYield: 'Gross Yield',
  grossYieldRank: 'Gross Yield Rank',
  totalRevenue: 'Total Revenue',
  totalRevenueRank: 'Total Revenue Rank',
  totalListings: 'Total Listings',
  totalListingsRank: 'Total Listings Rank',
  revenuePerListing: 'Revenue Per Listing',
  revenuePerListingRank: 'Revenue Per Listing Rank',
  occupancy: 'Occupancy',
  occupancyRank: 'Occupancy Rank',
  nightlyRate: 'Nightly Rate',
  nightlyRateRank: 'Nightly Rate Rank',
};

interface CityDataRow {
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

export default function CityDataAdmin() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [existingData, setExistingData] = useState<CityDataRow[]>([]);
  const [showExistingData, setShowExistingData] = useState(true);

  useEffect(() => {
    fetchExistingData();
  }, []);

  const fetchExistingData = async () => {
    try {
      const response = await fetch('/api/cities/all');
      if (response.ok) {
        const data = await response.json();
        setExistingData(data);
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/cities/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCsvData(data.data);
        setColumns(data.columns);
        
        // Initialize column mapping
        const initialMapping: Record<string, string> = {};
        data.columns.forEach((col: string) => {
          initialMapping[col] = '';
        });
        setColumnMapping(initialMapping);
      } else {
        alert('Error uploading CSV');
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Error uploading CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!csvData.length) return;

    setLoading(true);
    try {
      const response = await fetch('/api/cities/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: csvData, columnMapping }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Data imported successfully! ${result.count} records imported. All previous city data has been replaced.`);
        setUploaded(true);
        setCsvData([]);
        setColumns([]);
        setColumnMapping({});
        setFile(null);
        fetchExistingData(); // Refresh existing data
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Error importing data: ${errorData.error || 'Please check the console for details'}`);
        console.error('Import error:', errorData);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Error importing data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Upload CSV Data</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {csvData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Map Columns & Preview Data</h2>
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Click on column headers to map them to database fields. The table below shows your data preview.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="space-y-2">
                        <div>{col}</div>
                        <select
                          value={columnMapping[col] || ''}
                          onChange={(e) =>
                            setColumnMapping({ ...columnMapping, [col]: e.target.value })
                          }
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">-- Map to --</option>
                          {Object.entries(FIELD_MAPPINGS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {csvData.slice(0, 20).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {columns.map((col) => (
                      <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row[col] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {csvData.length > 20 && (
              <p className="mt-2 text-sm text-gray-500">
                Showing first 20 rows of {csvData.length} total rows
              </p>
            )}
          </div>
          <div className="mt-6">
            <button
              onClick={handleImport}
              disabled={loading || !Object.values(columnMapping).some(v => v)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Data'}
            </button>
          </div>
        </div>
      )}

      {/* Existing Data Table */}
      {showExistingData && existingData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Existing City Data</h2>
            <button
              onClick={() => setShowExistingData(!showExistingData)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              {showExistingData ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Yield</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Listings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nightly Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {existingData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.state || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.grossYield ? `${row.grossYield.toFixed(2)}%` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.totalRevenue ? `$${row.totalRevenue.toLocaleString()}` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.totalListings?.toLocaleString() || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.occupancy ? `${row.occupancy.toFixed(1)}%` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.nightlyRate ? `$${row.nightlyRate.toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

