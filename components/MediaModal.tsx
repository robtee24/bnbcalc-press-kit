'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  title?: string;
}

export default function MediaModal({ isOpen, onClose, mediaUrl, mediaType, title }: MediaModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use default
      const urlPath = new URL(mediaUrl).pathname;
      const filename = urlPath.split('/').pop() || (mediaType === 'image' ? 'image.jpg' : 'video.mp4');
      link.download = title ? `${title}_${filename}` : filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct download
      const link = document.createElement('a');
      link.href = mediaUrl;
      link.download = title || (mediaType === 'image' ? 'image.jpg' : 'video.mp4');
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-7xl max-h-[90vh] w-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{title || 'Media Viewer'}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
          {mediaType === 'image' ? (
            <div className="relative w-full max-w-full max-h-[calc(90vh-120px)] flex items-center justify-center">
              <Image
                src={mediaUrl}
                alt={title || 'Image'}
                width={1200}
                height={800}
                className="object-contain max-w-full max-h-full"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-full max-w-full">
              <video
                src={mediaUrl}
                controls
                className="w-full max-h-[calc(90vh-120px)]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

