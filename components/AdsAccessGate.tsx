'use client';

import { useEffect, useMemo, useState } from 'react';

export const ADS_AREA_UNLOCKED_STORAGE_KEY = 'bnbcalc.adsArea.unlocked';

const ADS_AREA_PASSWORD = 'tee24golf';

export default function AdsAccessGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setUnlocked(sessionStorage.getItem(ADS_AREA_UNLOCKED_STORAGE_KEY) === '1');
    } catch {
      setUnlocked(false);
    }
  }, []);

  const canSubmit = useMemo(() => password.trim().length > 0, [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === ADS_AREA_PASSWORD) {
      try {
        sessionStorage.setItem(ADS_AREA_UNLOCKED_STORAGE_KEY, '1');
      } catch {
        // ignore storage failures
      }
      setUnlocked(true);
      setPassword('');
      return;
    }

    setError('Invalid password');
  };

  if (unlocked === null) {
    return <div className="text-gray-600">Loading…</div>;
  }

  if (!unlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2 text-center">Ads area</h1>
          <p className="text-sm text-gray-600 mb-6 text-center">Enter the password to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="ads-area-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="ads-area-password"
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
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

