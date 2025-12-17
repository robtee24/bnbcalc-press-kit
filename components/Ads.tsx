'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import MediaModal from './MediaModal';
import LoadingIcon from './LoadingIcon';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  platform: string | null;
}

interface AdsProps {
  type: 'image' | 'video';
}

export default function Ads({ type }: AdsProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, [type]);

  const fetchAds = async () => {
    try {
      const response = await fetch(`/api/media?type=${type}&category=ads`);
      const data = await response.json();
      setMediaItems(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Platform logos - using actual images for all platforms
  const platformLogos: Record<string, { type: 'image'; src: string }> = {
    meta: {
      type: 'image',
      src: 'https://www.citypng.com/public/uploads/preview/hd-facebook-meta-logo-png-701751694777707v6bil7t1yh.png?v=2025090408'
    },
    reddit: {
      type: 'image',
      src: 'https://1000logos.net/wp-content/uploads/2017/05/Reddit-Logo.png'
    },
    tiktok: {
      type: 'image',
      src: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg'
    },
    linkedin: {
      type: 'image',
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/LinkedIn_2021.svg/1200px-LinkedIn_2021.svg.png'
    },
    google: {
      type: 'image',
      src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png'
    },
  };

  const platformNames: Record<string, string> = {
    meta: 'Meta',
    reddit: 'Reddit',
    tiktok: 'TikTok',
    linkedin: 'LinkedIn',
    google: 'Google',
  };

  // Define the order of platforms for tabs
  const platformOrder = ['meta', 'reddit', 'tiktok', 'linkedin', 'google'];

  // Group items by platform
  const groupedByPlatform = mediaItems.reduce((acc, item) => {
    const platform = item.platform || 'other';
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  // Filter items based on selected platform
  const filteredItems = selectedPlatform 
    ? (groupedByPlatform[selectedPlatform] || [])
    : mediaItems;

  if (loading) {
    return <LoadingIcon />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ads - {type === 'image' ? 'Images' : 'Videos'}</h1>
      
      {/* Platform Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-4">
          {platformOrder.map((platform) => {
            const logo = platformLogos[platform];
            const isActive = selectedPlatform === platform;
            const itemCount = groupedByPlatform[platform]?.length || 0;
            
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(isActive ? null : platform)}
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {logo && (
                  <div className="w-6 h-6 relative flex-shrink-0">
                    <Image
                      src={logo.src}
                      alt={`${platformNames[platform]} logo`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <span>{platformNames[platform]}</span>
                {itemCount > 0 && (
                  <span className="text-xs text-gray-400">({itemCount})</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {selectedMedia && (
        <MediaModal
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          mediaUrl={selectedMedia.url}
          mediaType={type}
          title={selectedMedia.title}
        />
      )}
      
      {mediaItems.length === 0 ? (
        <p className="text-gray-600">No {type}s found.</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-gray-600">
          No {type}s found for {selectedPlatform ? platformNames[selectedPlatform] : 'selected platform'}.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedMedia(item)}
            >
              {type === 'image' ? (
                <div className="relative w-full h-64">
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              ) : (
                <div className="relative w-full h-64 bg-black rounded">
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-contain rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

