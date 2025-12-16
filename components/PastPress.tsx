'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Article {
  id: string;
  title: string;
  ogImage: string | null;
  metaDescription: string | null;
  url: string;
  category: string;
}

interface PastPressProps {
  category: 'national' | 'local';
}

export default function PastPress({ category }: PastPressProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [category]);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`/api/articles?category=${category}`);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {category === 'national' ? 'National' : 'Local'}
      </h1>
      {articles.length === 0 ? (
        <p className="text-gray-600">No articles found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {article.ogImage && (
                <div className="relative w-full h-48">
                  <Image
                    src={article.ogImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                  {article.title}
                </h2>
                {article.metaDescription && (
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {article.metaDescription}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

