'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PastPress from '@/components/PastPress';
import SearchByCity from '@/components/SearchByCity';
import Media from '@/components/Media';
import Ads from '@/components/Ads';
import Rankings from '@/components/Rankings';
import RankingDetail from '@/components/RankingDetail';
import AdPerformance from '@/components/AdPerformance';

export default function Home() {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [cityToView, setCityToView] = useState<string | null>(null);
  const [previousRanking, setPreviousRanking] = useState<string | null>(null);

  const toggleExpand = (item: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(item)) {
      newExpanded.delete(item);
    } else {
      newExpanded.add(item);
    }
    setExpandedItems(newExpanded);
  };

  const handleMenuClick = (module: string) => {
    setActiveModule(module);
    // Extract metric from module name for rankings
    if (module.startsWith('rankings-')) {
      const metric = module.replace('rankings-', '');
      setSelectedMetric(metric);
    } else if (module === 'rankings') {
      setSelectedMetric(null);
    } else {
      setSelectedMetric(null);
    }
    setCityToView(null);
  };

  const handleSelectMetric = (metric: string) => {
    setSelectedMetric(metric);
    setActiveModule(`rankings-${metric}`);
  };

  const handleBackToRankings = () => {
    setSelectedMetric(null);
    setActiveModule('rankings');
  };

  const handleViewCity = (city: string) => {
    setCityToView(city);
    setPreviousRanking(selectedMetric); // Store the current ranking metric
    setActiveModule('search-by-city');
  };

  const handleBackToRanking = () => {
    if (previousRanking) {
      setSelectedMetric(previousRanking);
      setActiveModule(`rankings-${previousRanking}`);
      setCityToView(null);
      setPreviousRanking(null);
    } else {
      setActiveModule('rankings');
      setCityToView(null);
    }
  };

  // Auto-search city when cityToView is set
  useEffect(() => {
    if (cityToView && activeModule === 'search-by-city') {
      // The SearchByCity component will handle the search via props
    }
  }, [cityToView, activeModule]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        activeModule={activeModule}
        expandedItems={expandedItems}
        onMenuClick={handleMenuClick}
        onToggleExpand={toggleExpand}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {activeModule === 'national-news' && <PastPress category="national" />}
        {activeModule === 'local-news' && <PastPress category="local" />}
        {activeModule === 'search-by-city' && (
          <SearchByCity 
            initialCity={cityToView} 
            showBackButton={!!previousRanking}
            onBack={handleBackToRanking}
          />
        )}
        {activeModule === 'images' && <Media type="image" />}
        {activeModule === 'videos' && <Media type="video" />}
        {activeModule === 'ads-images' && <Ads type="image" />}
        {activeModule === 'ads-videos' && <Ads type="video" />}
        {activeModule === 'ads-performance' && <AdPerformance />}
        {activeModule === 'rankings' && !selectedMetric && (
          <Rankings onSelectMetric={handleSelectMetric} />
        )}
        {selectedMetric && activeModule?.startsWith('rankings-') && (
          <RankingDetail
            metric={selectedMetric}
            onBack={handleBackToRankings}
            onViewCity={handleViewCity}
          />
        )}
        {!activeModule && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-4">Welcome to BNBCalc Press Kit</h1>
            <p className="text-lg text-gray-600">
              Select a menu item from the sidebar to get started.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

