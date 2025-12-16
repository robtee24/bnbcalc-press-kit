'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import MediaModal from './MediaModal';

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

  // Platform logos - using actual images for Meta, emojis for others
  const platformLogos: Record<string, { type: 'image' | 'emoji'; src: string }> = {
    meta: {
      type: 'image',
      src: 'https://www.citypng.com/public/uploads/preview/hd-facebook-meta-logo-png-701751694777707v6bil7t1yh.png?v=2025090408'
    },
    reddit: {
      type: 'emoji',
      src: '🔴'
    },
    linkedin: {
      type: 'emoji',
      src: '💼'
    },
    google: {
      type: 'emoji',
      src: '🔍'
    },
  };

  const platformNames: Record<string, string> = {
    meta: 'Meta',
    reddit: 'Reddit',
    linkedin: 'LinkedIn',
    google: 'Google',
  };

  // Group items by platform
  const groupedByPlatform = mediaItems.reduce((acc, item) => {
    const platform = item.platform || 'other';
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(item);
    return acc;
  }, {} as Record<string, MediaItem[]>);

  // Sort platforms: Meta, Reddit, LinkedIn, Google, then others
  const platformOrder = ['meta', 'reddit', 'linkedin', 'google'];
  const sortedPlatforms = [
    ...platformOrder.filter(p => groupedByPlatform[p]),
    ...Object.keys(groupedByPlatform).filter(p => !platformOrder.includes(p)),
  ];

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ads - {type === 'image' ? 'Images' : 'Videos'}</h1>
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
      ) : (
        <div className="space-y-8">
          {sortedPlatforms.map((platform) => {
            const items = groupedByPlatform[platform];
            const logo = platformLogos[platform] || { type: 'emoji' as const, src: '📌' };
            return (
              <div key={platform} className="space-y-4">
                <div className="flex items-center gap-3">
                  {logo.type === 'image' ? (
                    <div className="w-[72px] h-[72px] relative">
                      <Image
                        src={logo.src}
                        alt={`${platformNames[platform] || platform} logo`}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <span className="text-6xl">{logo.src}</span>
                  )}
                  <span className="text-gray-500 text-sm">({items.length} {type}{items.length !== 1 ? 's' : ''})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item) => (
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

