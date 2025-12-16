'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  type: string;
  platform: string | null;
}

export default function AdsAdmin() {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadPlatform, setUploadPlatform] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlatform, setEditPlatform] = useState<string>('');

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const [imagesRes, videosRes] = await Promise.all([
        fetch('/api/media?type=image&category=ads'),
        fetch('/api/media?type=video&category=ads'),
      ]);
      const imagesData = await imagesRes.json();
      const videosData = await videosRes.json();
      setImages(Array.isArray(imagesData) ? imagesData : []);
      setVideos(Array.isArray(videosData) ? videosData : []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setImages([]);
      setVideos([]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFiles.length) return;

    setLoading(true);
    setUploadProgress({ current: 0, total: uploadFiles.length });
    
    let successCount = 0;
    let errorCount = 0;

    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        setUploadProgress({ current: i + 1, total: uploadFiles.length });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', uploadTitle || file.name.replace(/\.[^/.]+$/, ''));
        formData.append('description', uploadDescription);
        formData.append('type', activeTab.slice(0, -1)); // 'images' -> 'image', 'videos' -> 'video'
        formData.append('category', 'ads');
        if (uploadPlatform) {
          formData.append('platform', uploadPlatform);
        }

        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Error uploading ${file.name}`);
        }
      }

      if (successCount > 0) {
        alert(`Successfully uploaded ${successCount} file(s)${errorCount > 0 ? `. ${errorCount} file(s) failed.` : ''}`);
        setUploadFiles([]);
        setUploadTitle('');
        setUploadDescription('');
        setUploadPlatform('');
        fetchAds();
      } else {
        alert(`Error uploading files. ${errorCount} file(s) failed.`);
      }
    } catch (error) {
      console.error('Error uploading ad:', error);
      alert('Error uploading ad');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl) return;

    setLoading(true);
    try {
      const response = await fetch('/api/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadUrl,
          category: 'ads',
          type: 'image',
          platform: uploadPlatform || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Image uploaded successfully! Title: ${result.title}`);
        setUploadUrl('');
        setUploadPlatform('');
        fetchAds();
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        alert(`Error uploading image: ${errorData.error || 'Please check the URL'}`);
      }
    } catch (error: any) {
      console.error('Error uploading image from URL:', error);
      const errorMessage = error?.message || 'Network error. Please check your connection and try again.';
      alert(`Error uploading image from URL: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAds();
      } else {
        alert('Error deleting ad');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Error deleting ad');
    }
  };

  const handleEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditPlatform(item.platform || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/media/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          platform: editPlatform || null,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        fetchAds();
      } else {
        alert('Error updating ad');
      }
    } catch (error) {
      console.error('Error updating ad:', error);
      alert('Error updating ad');
    }
  };

  const currentMedia = Array.isArray(activeTab === 'images' ? images : videos) 
    ? (activeTab === 'images' ? images : videos) 
    : [];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('images')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'images'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'videos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Videos
          </button>
        </nav>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Upload Ads - {activeTab === 'images' ? 'Images' : 'Videos'} (Multiple files supported)</h2>
        
        {/* URL Upload Section - Only for Images */}
        {activeTab === 'images' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Upload Image from URL</h3>
            <form onSubmit={handleUrlUpload} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg or https://example.com/page-with-image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter a direct image URL or a page URL. Title and description will be auto-generated.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform (optional)
                </label>
                <select
                  value={uploadPlatform}
                  onChange={(e) => setUploadPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Platform</option>
                  <option value="meta">Meta</option>
                  <option value="reddit">Reddit</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="google">Google</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || !uploadUrl}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Downloading & Uploading...' : 'Upload from URL'}
              </button>
            </form>
          </div>
        )}

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">Upload Files</h3>
          <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Files {uploadFiles.length > 0 && `(${uploadFiles.length} selected)`}
            </label>
            <input
              type="file"
              accept={activeTab === 'images' ? 'image/*' : 'video/*'}
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setUploadFiles(files);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            {uploadFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">Selected files:</p>
                <ul className="list-disc list-inside mt-1">
                  {uploadFiles.map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (optional - will use filename if not provided)
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Leave empty to use filename for each file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform (optional)
            </label>
            <select
              value={uploadPlatform}
              onChange={(e) => setUploadPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Platform</option>
              <option value="meta">Meta</option>
              <option value="reddit">Reddit</option>
              <option value="linkedin">LinkedIn</option>
              <option value="google">Google</option>
            </select>
          </div>
          {uploadProgress && (
            <div className="text-sm text-gray-600">
              Uploading {uploadProgress.current} of {uploadProgress.total} files...
            </div>
          )}
          <button
            type="submit"
            disabled={loading || uploadFiles.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? `Uploading... (${uploadProgress?.current || 0}/${uploadProgress?.total || 0})` : `Upload ${uploadFiles.length} file(s)`}
          </button>
        </form>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Ads - {activeTab === 'images' ? 'Images' : 'Videos'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentMedia.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden">
              {activeTab === 'images' ? (
                <div className="relative w-full h-48">
                  <Image
                    src={item.url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 bg-black">
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="p-4">
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      rows={2}
                    />
                    <select
                      value={editPlatform}
                      onChange={(e) => setEditPlatform(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">No Platform</option>
                      <option value="meta">Meta</option>
                      <option value="reddit">Reddit</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="google">Google</option>
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        {currentMedia.length === 0 && (
          <p className="text-gray-500 text-center py-8">No {activeTab} yet.</p>
        )}
      </div>
    </div>
  );
}

