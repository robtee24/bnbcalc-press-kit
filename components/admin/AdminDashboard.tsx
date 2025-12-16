'use client';

import { useState } from 'react';
import PastPressAdmin from './PastPressAdmin';
import CityDataAdmin from './CityDataAdmin';
import MediaAdmin from './MediaAdmin';
import AdsAdmin from './AdsAdmin';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'past-press' | 'city-data' | 'media' | 'ads'>('past-press');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('past-press')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past-press'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Past Press
            </button>
            <button
              onClick={() => setActiveTab('city-data')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'city-data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search By City
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'media'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Ads
            </button>
          </nav>
        </div>

        {activeTab === 'past-press' && <PastPressAdmin />}
        {activeTab === 'city-data' && <CityDataAdmin />}
        {activeTab === 'media' && <MediaAdmin />}
        {activeTab === 'ads' && <AdsAdmin />}
      </div>
    </div>
  );
}

