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
}

interface MediaProps {
  type: 'image' | 'video';
}

export default function Media({ type }: MediaProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    fetchMedia();
  }, [type]);

  const fetchMedia = async () => {
    try {
      const response = await fetch(`/api/media?type=${type}&category=media`);
      const data = await response.json();
      setMediaItems(data);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingIcon />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 capitalize">{type}s</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaItems.map((item) => (
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

