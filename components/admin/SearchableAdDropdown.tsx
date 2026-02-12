'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchableAdDropdownProps {
  selectedAdName: string;
  onSelect: (adName: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableAdDropdown({
  selectedAdName,
  onSelect,
  placeholder = 'Search and select an ad...',
  className = '',
}: SearchableAdDropdownProps) {
  const [csvAdNames, setCsvAdNames] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredAds, setFilteredAds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/ads-performance.csv')
      .then(res => res.text())
      .then(text => {
        // Simple CSV parsing - get first column (Ad name)
        const lines = text.split('\n');
        const adNames = lines
          .slice(1) // Skip header
          .map(line => {
            // Handle CSV where ad names might contain commas
            const match = line.match(/^"([^"]+)"|^([^,]+)/);
            return match ? (match[1] || match[2]).trim() : null;
          })
          .filter(Boolean) as string[];
        setCsvAdNames(adNames);
        setFilteredAds(adNames);
      })
      .catch(err => console.error('Error fetching CSV:', err));
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = csvAdNames.filter(adName =>
        adName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAds(filtered);
    } else {
      setFilteredAds(csvAdNames);
    }
  }, [searchTerm, csvAdNames]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (adName: string) => {
    onSelect(adName);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect('');
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedAdName || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selectedAdName && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredAds.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No ads found</div>
          ) : (
            filteredAds.slice(0, 50).map((adName) => (
              <button
                key={adName}
                type="button"
                onClick={() => handleSelect(adName)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                  selectedAdName === adName ? 'bg-blue-100 font-medium' : ''
                }`}
              >
                {adName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

