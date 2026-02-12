'use client';

import { useEffect, useMemo, useState } from 'react';

export const ADS_ADMIN_UNLOCKED_STORAGE_KEY = 'bnbcalc.adsAdmin.unlocked';

const ADS_ADMIN_PASSWORD = 'tee24golf';

export default function AdsPasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(ADS_ADMIN_UNLOCKED_STORAGE_KEY) === '1');
    } catch {
      setUnlocked(false);
    }
  }, []);

  const canSubmit = useMemo(() => password.trim().length > 0, [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === ADS_ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(ADS_ADMIN_UNLOCKED_STORAGE_KEY, '1');
      } catch {
        // ignore storage failures
      }
      setUnlocked(true);
      setPassword('');
      return;
    }

    setError('Invalid password');
  };

  const handleLock = () => {
    try {
      sessionStorage.removeItem(ADS_ADMIN_UNLOCKED_STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
    setUnlocked(false);
  };

  if (unlocked === null) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="bg-white p-6 rounded-lg shadow max-w-md">
        <h2 className="text-xl font-bold mb-2">Ads area locked</h2>
        <p className="text-sm text-gray-600 mb-6">Enter the password to access Ads.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ads-password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="ads-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            Unlock Ads
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={handleLock} className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">
          Lock Ads
        </button>
      </div>
      {children}
    </div>
  );
}

