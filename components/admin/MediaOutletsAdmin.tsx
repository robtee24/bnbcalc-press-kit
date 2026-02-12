'use client';

import { useState, useEffect } from 'react';

interface MediaOutlet {
  id: string;
  name: string;
  url: string;
  email: string | null;
  type: string;
  market: string;
  description: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  local_news: 'Local News Outlet',
  real_estate_publication: 'Real Estate Publication',
  realtor_blog: 'Realtor / Brokerage Blog',
};

const TYPE_OPTIONS = [
  { value: 'local_news', label: 'Local News Outlet' },
  { value: 'real_estate_publication', label: 'Real Estate Publication' },
  { value: 'realtor_blog', label: 'Realtor / Brokerage Blog' },
];

export default function MediaOutletsAdmin() {
  const [outlets, setOutlets] = useState<MediaOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMarket, setFilterMarket] = useState('');
  const [filterType, setFilterType] = useState('');
  const [markets, setMarkets] = useState<string[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState('local_news');
  const [formMarket, setFormMarket] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editType, setEditType] = useState('');
  const [editMarket, setEditMarket] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Discover state
  const [discoverMarket, setDiscoverMarket] = useState('');
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverResults, setDiscoverResults] = useState<{
    searchLinks: { query: string; type: string; googleUrl: string }[];
    suggestions: { name: string; url: string; type: string; description: string }[];
  } | null>(null);
  const [showDiscover, setShowDiscover] = useState(false);

  // Bulk add state
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkMarket, setBulkMarket] = useState('');
  const [bulkType, setBulkType] = useState('local_news');
  const [bulkEntries, setBulkEntries] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    try {
      const response = await fetch('/api/media-outlets');
      const data = await response.json();
      setOutlets(Array.isArray(data) ? data : []);
      // Extract unique markets
      const uniqueMarkets = [...new Set(data.map((o: MediaOutlet) => o.market))].sort() as string[];
      setMarkets(uniqueMarkets);
    } catch (error) {
      console.error('Error fetching outlets:', error);
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUrl || !formType || !formMarket) return;

    setFormLoading(true);
    try {
      const response = await fetch('/api/media-outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          url: formUrl,
          email: formEmail || null,
          type: formType,
          market: formMarket,
          description: formDescription || null,
        }),
      });

      if (response.ok) {
        setFormName('');
        setFormUrl('');
        setFormEmail('');
        setFormDescription('');
        fetchOutlets();
        alert('Outlet added successfully!');
      } else {
        const err = await response.json();
        alert(`Error: ${err.error || 'Failed to add outlet'}`);
      }
    } catch (error) {
      console.error('Error adding outlet:', error);
      alert('Error adding outlet');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (outlet: MediaOutlet) => {
    setEditingId(outlet.id);
    setEditName(outlet.name);
    setEditUrl(outlet.url);
    setEditEmail(outlet.email || '');
    setEditType(outlet.type);
    setEditMarket(outlet.market);
    setEditDescription(outlet.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/media-outlets/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          url: editUrl,
          email: editEmail || null,
          type: editType,
          market: editMarket,
          description: editDescription || null,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        fetchOutlets();
      } else {
        alert('Error updating outlet');
      }
    } catch (error) {
      console.error('Error updating outlet:', error);
      alert('Error updating outlet');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this outlet?')) return;

    try {
      const response = await fetch(`/api/media-outlets/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchOutlets();
      } else {
        alert('Error deleting outlet');
      }
    } catch (error) {
      console.error('Error deleting outlet:', error);
      alert('Error deleting outlet');
    }
  };

  const handleDiscover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discoverMarket) return;

    setDiscoverLoading(true);
    try {
      const response = await fetch('/api/media-outlets/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ market: discoverMarket }),
      });
      const data = await response.json();
      setDiscoverResults(data);
    } catch (error) {
      console.error('Error discovering outlets:', error);
      alert('Error discovering outlets');
    } finally {
      setDiscoverLoading(false);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMarket || !bulkEntries.trim()) return;

    // Parse entries: each line is "Name | URL | Email (optional)"
    const lines = bulkEntries
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      alert('Please enter at least one outlet.');
      return;
    }

    setBulkLoading(true);
    let successCount = 0;
    let failedCount = 0;

    for (const line of lines) {
      const parts = line.split('|').map((p) => p.trim());
      const name = parts[0];
      const url = parts[1];
      const email = parts[2] || null;

      if (!name || !url) {
        failedCount++;
        continue;
      }

      try {
        const response = await fetch('/api/media-outlets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            url: url.startsWith('http') ? url : `https://${url}`,
            email,
            type: bulkType,
            market: bulkMarket,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    alert(
      `Bulk add complete! ${successCount} added${failedCount > 0 ? `, ${failedCount} failed` : ''}.`
    );
    setBulkEntries('');
    fetchOutlets();
    setBulkLoading(false);
  };

  const filteredOutlets = outlets.filter((o) => {
    if (filterMarket && o.market !== filterMarket) return false;
    if (filterType && o.type !== filterType) return false;
    return true;
  });

  if (loading) return <div className="text-gray-600">Loading outlets...</div>;

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setShowForm(!showForm); setShowDiscover(false); setShowBulkAdd(false); }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          {showForm ? 'Cancel' : 'Add Outlet'}
        </button>
        <button
          onClick={() => { setShowBulkAdd(!showBulkAdd); setShowForm(false); setShowDiscover(false); }}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
        >
          {showBulkAdd ? 'Cancel Bulk' : 'Bulk Add'}
        </button>
        <button
          onClick={() => { setShowDiscover(!showDiscover); setShowForm(false); setShowBulkAdd(false); }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          {showDiscover ? 'Cancel' : 'Discover Outlets'}
        </button>
      </div>

      {/* Add single outlet form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Add Media Outlet</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market *</label>
                <input
                  type="text"
                  value={formMarket}
                  onChange={(e) => setFormMarket(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={formLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {formLoading ? 'Adding...' : 'Add Outlet'}
            </button>
          </form>
        </div>
      )}

      {/* Bulk add */}
      {showBulkAdd && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Bulk Add Outlets</h3>
          <form onSubmit={handleBulkAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Market *</label>
                <input
                  type="text"
                  value={bulkMarket}
                  onChange={(e) => setBulkMarket(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={bulkType}
                  onChange={(e) => setBulkType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outlets (one per line: Name | URL | Email)
              </label>
              <textarea
                value={bulkEntries}
                onChange={(e) => setBulkEntries(e.target.value)}
                placeholder={'Austin American-Statesman | https://www.statesman.com | tips@statesman.com\nKVUE | https://www.kvue.com | news@kvue.com\nAustin Business Journal | https://www.bizjournals.com/austin'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Format: Name | URL | Email (email is optional). One outlet per line.
              </p>
            </div>
            <button
              type="submit"
              disabled={bulkLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {bulkLoading ? 'Adding...' : 'Bulk Add All'}
            </button>
          </form>
        </div>
      )}

      {/* Discover outlets */}
      {showDiscover && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-4">Discover Outlets for a Market</h3>
          <form onSubmit={handleDiscover} className="flex gap-2 mb-4">
            <input
              type="text"
              value={discoverMarket}
              onChange={(e) => setDiscoverMarket(e.target.value)}
              placeholder="Enter market name (e.g. Austin, TX)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={discoverLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {discoverLoading ? 'Searching...' : 'Discover'}
            </button>
          </form>

          {discoverResults && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{discoverResults.searchLinks.length} search queries generated for &quot;{discoverMarket}&quot;</p>

              <div>
                <h4 className="font-semibold mb-2">Google Search Links</h4>
                <p className="text-xs text-gray-500 mb-2">Click each link to search Google, then add outlets you find using the Add form above.</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {discoverResults.searchLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        link.type === 'local_news' ? 'bg-blue-100 text-blue-800' :
                        link.type === 'real_estate_publication' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {TYPE_LABELS[link.type] || link.type}
                      </span>
                      <a
                        href={link.googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {link.query}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Market</label>
          <select
            value={filterMarket}
            onChange={(e) => setFilterMarket(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Markets</option>
            {markets.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Showing {filteredOutlets.length} of {outlets.length} outlet(s)
        </div>
      </div>

      {/* Outlets table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOutlets.map((outlet) => (
              <tr key={outlet.id}>
                {editingId === outlet.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <select value={editType} onChange={(e) => setEditType(e.target.value)} className="px-2 py-1 border rounded text-sm">
                        {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={editMarket} onChange={(e) => setEditMarket(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={handleSaveEdit} className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{outlet.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        outlet.type === 'local_news' ? 'bg-blue-100 text-blue-800' :
                        outlet.type === 'real_estate_publication' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {TYPE_LABELS[outlet.type] || outlet.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{outlet.market}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {outlet.email ? (
                        <a href={`mailto:${outlet.email}`} className="text-blue-600 hover:underline">{outlet.email}</a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a href={outlet.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block max-w-[200px]">
                        {outlet.url.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => handleEdit(outlet)} className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Edit</button>
                        <button onClick={() => handleDelete(outlet.id)} className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">Delete</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOutlets.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No outlets found. {outlets.length > 0 ? 'Try adjusting your filters.' : 'Add some outlets to get started.'}
          </div>
        )}
      </div>
    </div>
  );
}
