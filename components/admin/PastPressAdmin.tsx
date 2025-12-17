'use client';

import { useState, useEffect } from 'react';

interface Article {
  id: string;
  title: string;
  ogImage: string | null;
  metaDescription: string | null;
  url: string;
  category: string;
}

export default function PastPressAdmin() {
  const [nationalArticles, setNationalArticles] = useState<Article[]>([]);
  const [localArticles, setLocalArticles] = useState<Article[]>([]);
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<'national' | 'local'>('national');
  const [loading, setLoading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkCategory, setBulkCategory] = useState<'national' | 'local'>('national');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; success: number; failed: number } | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const [nationalRes, localRes] = await Promise.all([
        fetch('/api/articles?category=national'),
        fetch('/api/articles?category=local'),
      ]);
      
      if (!nationalRes.ok || !localRes.ok) {
        throw new Error('Failed to fetch articles');
      }
      
      const national = await nationalRes.json();
      const local = await localRes.json();
      setNationalArticles(Array.isArray(national) ? national : []);
      setLocalArticles(Array.isArray(local) ? local : []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setNationalArticles([]);
      setLocalArticles([]);
    }
  };

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, category }),
      });

      if (response.ok) {
        setUrl('');
        fetchArticles();
      } else {
        alert('Error adding article');
      }
    } catch (error) {
      console.error('Error adding article:', error);
      alert('Error adding article');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchArticles();
      } else {
        alert('Error deleting article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Error deleting article');
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkUrls.trim()) return;

    // Parse URLs from textarea (one per line)
    const urlLines = bulkUrls
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://')))
      .slice(0, 100); // Limit to 100 URLs

    if (urlLines.length === 0) {
      alert('Please enter at least one valid URL (starting with http:// or https://)');
      return;
    }

    if (urlLines.length > 100) {
      alert('Maximum 100 URLs allowed. Only the first 100 will be processed.');
    }

    setBulkLoading(true);
    setBulkProgress({ current: 0, total: urlLines.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    try {
      // Process URLs sequentially to avoid overwhelming the server
      for (let i = 0; i < urlLines.length; i++) {
        const url = urlLines[i];
        setBulkProgress({ current: i + 1, total: urlLines.length, success: successCount, failed: failedCount });

        try {
          const response = await fetch('/api/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url,
              category: bulkCategory,
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            failedCount++;
            const errorText = await response.text().catch(() => 'Unknown error');
            console.error(`Failed to upload ${url}:`, errorText);
          }
        } catch (error) {
          failedCount++;
          console.error(`Error uploading ${url}:`, error);
        }

        // Small delay to avoid overwhelming the server
        if (i < urlLines.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setBulkProgress({ current: urlLines.length, total: urlLines.length, success: successCount, failed: failedCount });

      if (successCount > 0) {
        alert(`Bulk upload complete! ${successCount} article(s) uploaded successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}.`);
        setBulkUrls('');
        setShowBulkUpload(false);
        fetchArticles();
      } else {
        alert(`Bulk upload failed. All ${failedCount} article(s) failed to upload. Please check the URLs and try again.`);
      }
    } catch (error) {
      console.error('Error during bulk upload:', error);
      alert('Error during bulk upload. Please try again.');
    } finally {
      setBulkLoading(false);
      setTimeout(() => setBulkProgress(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Article</h2>
          <button
            type="button"
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            {showBulkUpload ? 'Cancel Bulk Add' : 'Bulk Add'}
          </button>
        </div>

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <h4 className="font-semibold mb-3">Bulk Add Articles (up to 100 URLs)</h4>
            <form onSubmit={handleBulkUpload} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category (applies to all URLs)
                </label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as 'national' | 'local')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="national">National</option>
                  <option value="local">Local</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article URLs (one per line)
                </label>
                <textarea
                  value={bulkUrls}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').length;
                    if (lines <= 101) { // Allow up to 100 URLs + 1 empty line
                      setBulkUrls(e.target.value);
                    }
                  }}
                  placeholder="https://example.com/article1&#10;https://example.com/article2&#10;https://example.com/article3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Paste up to 100 article URLs, one per line. Page title, OG image, and meta description will be auto-extracted.
                </p>
                {bulkUrls && (
                  <p className="mt-1 text-xs text-gray-600">
                    {bulkUrls.split('\n').filter(l => l.trim().length > 0).length} URL(s) detected
                  </p>
                )}
              </div>
              {bulkProgress && (
                <div className="text-sm text-gray-600">
                  <div>Processing {bulkProgress.current} of {bulkProgress.total}...</div>
                  <div className="mt-1">
                    <span className="text-green-600">✓ {bulkProgress.success} successful</span>
                    {bulkProgress.failed > 0 && (
                      <span className="ml-4 text-red-600">✗ {bulkProgress.failed} failed</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={bulkLoading || !bulkUrls.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {bulkLoading ? 'Uploading...' : 'Upload All URLs'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkUrls('');
                    setBulkProgress(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Single URL Upload Form */}
        {!showBulkUpload && (
          <form onSubmit={handleAddArticle} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'national' | 'local')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="national">National</option>
                <option value="local">Local</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Article'}
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">National</h2>
          <div className="space-y-4">
            {nationalArticles.map((article) => (
              <div key={article.id} className="border-b pb-4">
                <h3 className="font-semibold mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{article.url}</p>
                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
            {nationalArticles.length === 0 && (
              <p className="text-gray-500">No articles yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Local</h2>
          <div className="space-y-4">
            {localArticles.map((article) => (
              <div key={article.id} className="border-b pb-4">
                <h3 className="font-semibold mb-2">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{article.url}</p>
                <button
                  onClick={() => handleDeleteArticle(article.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
            {localArticles.length === 0 && (
              <p className="text-gray-500">No articles yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

