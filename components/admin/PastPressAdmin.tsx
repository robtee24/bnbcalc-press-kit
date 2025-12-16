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

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Add Article</h2>
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

