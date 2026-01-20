'use client';

interface SidebarProps {
  activeModule: string | null;
  expandedItems: Set<string>;
  onMenuClick: (module: string) => void;
  onToggleExpand: (item: string) => void;
}

export default function Sidebar({
  activeModule,
  expandedItems,
  onMenuClick,
  onToggleExpand,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-white h-screen overflow-y-auto shadow-lg">
      <div className="p-6">
        <div className="mb-8 flex flex-col items-start">
          <img 
            src="/bnbcalc-logo.png" 
            alt="BNBCalc Logo" 
            className="h-16 w-auto mb-2"
            style={{ mixBlendMode: 'multiply' }}
          />
          <h1 className="text-2xl font-bold text-gray-900">Press Kit</h1>
        </div>
        <nav className="space-y-2">
          {/* Past Press - Parent */}
          <div>
            <button
              onClick={() => onToggleExpand('past-press')}
              className={`w-full text-left px-4 py-2 rounded flex items-center justify-between text-xs font-semibold uppercase ${
                activeModule === 'national-news' || activeModule === 'local-news'
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>Past Press</span>
              <span className={`text-gray-500 text-sm font-medium transition-transform duration-200 ${expandedItems.has('past-press') ? 'rotate-90' : ''}`}>
                ›
              </span>
            </button>
            {expandedItems.has('past-press') && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => onMenuClick('national-news')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'national-news' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  National
                </button>
                <button
                  onClick={() => onMenuClick('local-news')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'local-news' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Local
                </button>
              </div>
            )}
          </div>

          {/* Search by Market */}
          <button
            onClick={() => onMenuClick('search-by-city')}
            className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
              activeModule === 'search-by-city' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Search by Market
          </button>

          {/* Rankings - Parent */}
          <div>
            <button
              onClick={() => {
                onToggleExpand('rankings');
                onMenuClick('rankings');
              }}
              className={`w-full text-left px-4 py-2 rounded flex items-center justify-between text-xs font-semibold uppercase ${
                activeModule === 'rankings' || activeModule?.startsWith('rankings-')
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>Rankings</span>
              <span className={`text-gray-500 text-sm font-medium transition-transform duration-200 ${expandedItems.has('rankings') ? 'rotate-90' : ''}`}>
                ›
              </span>
            </button>
            {expandedItems.has('rankings') && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => onMenuClick('rankings-gross-yield')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'rankings-gross-yield' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Gross Yield
                </button>
                <button
                  onClick={() => onMenuClick('rankings-total-revenue')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'rankings-total-revenue' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Total Revenue
                </button>
                <button
                  onClick={() => onMenuClick('rankings-total-listings')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'rankings-total-listings' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Total Listings
                </button>
                <button
                  onClick={() => onMenuClick('rankings-revenue-per-listing')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'rankings-revenue-per-listing' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Revenue Per Listing
                </button>
                <button
                  onClick={() => onMenuClick('rankings-occupancy')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'rankings-occupancy' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Occupancy
                </button>
                <button
                  onClick={() => onMenuClick('rankings-nightly-rate')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'rankings-nightly-rate' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Nightly Rate
                </button>
              </div>
            )}
          </div>

          {/* Media - Parent */}
          <div>
            <button
              onClick={() => onToggleExpand('media')}
              className={`w-full text-left px-4 py-2 rounded flex items-center justify-between text-xs font-semibold uppercase ${
                activeModule === 'images' || activeModule === 'videos'
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>Media</span>
              <span className={`text-gray-500 text-sm font-medium transition-transform duration-200 ${expandedItems.has('media') ? 'rotate-90' : ''}`}>
                ›
              </span>
            </button>
            {expandedItems.has('media') && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => onMenuClick('images')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'images' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Images
                </button>
                <button
                  onClick={() => onMenuClick('videos')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'videos' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Videos
                </button>
              </div>
            )}
          </div>

          {/* Ads - Parent */}
          <div>
            <button
              onClick={() => onToggleExpand('ads')}
              className={`w-full text-left px-4 py-2 rounded flex items-center justify-between text-xs font-semibold uppercase ${
                activeModule === 'ads-images' || activeModule === 'ads-videos' || activeModule === 'ads-performance'
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>Ads</span>
              <span className={`text-gray-500 text-sm font-medium transition-transform duration-200 ${expandedItems.has('ads') ? 'rotate-90' : ''}`}>
                ›
              </span>
            </button>
            {expandedItems.has('ads') && (
              <div className="ml-4 mt-1 space-y-1">
                <button
                  onClick={() => onMenuClick('ads-images')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'ads-images' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Images
                </button>
                <button
                  onClick={() => onMenuClick('ads-videos')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'ads-videos' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Videos
                </button>
                <button
                  onClick={() => onMenuClick('ads-performance')}
                  className={`w-full text-left px-4 py-2 rounded text-xs font-semibold uppercase ${
                    activeModule === 'ads-performance' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Ad Performance
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}

