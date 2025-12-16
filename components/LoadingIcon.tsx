'use client';

export default function LoadingIcon() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-32 h-32 mb-4">
        {/* House */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
          <svg
            width="80"
            height="60"
            viewBox="0 0 80 60"
            className="text-gray-700"
          >
            {/* Roof */}
            <path
              d="M40 0 L0 20 L40 20 Z M40 0 L80 20 L40 20 Z"
              fill="currentColor"
            />
            {/* House body */}
            <rect x="15" y="20" width="50" height="40" fill="currentColor" />
            {/* Door */}
            <rect x="30" y="35" width="20" height="25" fill="white" />
            <circle cx="45" cy="47" r="2" fill="currentColor" />
            {/* Window */}
            <rect x="20" y="25" width="12" height="12" fill="white" />
            <rect x="48" y="25" width="12" height="12" fill="white" />
          </svg>
        </div>

        {/* Person walking in (from left) */}
        <div className="absolute bottom-8 left-4 animate-walk-in">
          <svg
            width="24"
            height="32"
            viewBox="0 0 24 32"
            className="text-blue-600"
          >
            {/* Head */}
            <circle cx="12" cy="6" r="4" fill="currentColor" />
            {/* Body */}
            <rect x="9" y="10" width="6" height="10" fill="currentColor" rx="2" />
            {/* Legs walking */}
            <path
              d="M10 20 L8 28 M14 20 L16 28"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arms swinging */}
            <path
              d="M9 12 L6 16 M15 12 L18 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Person walking out (to right) */}
        <div className="absolute bottom-8 right-4 animate-walk-out">
          <svg
            width="24"
            height="32"
            viewBox="0 0 24 32"
            className="text-blue-600"
          >
            {/* Head */}
            <circle cx="12" cy="6" r="4" fill="currentColor" />
            {/* Body */}
            <rect x="9" y="10" width="6" height="10" fill="currentColor" rx="2" />
            {/* Legs walking */}
            <path
              d="M10 20 L12 28 M14 20 L12 28"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arms swinging */}
            <path
              d="M9 12 L6 16 M15 12 L18 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </div>
      <div className="mt-4">
        <img 
          src="/bnbcalc-logo.png" 
          alt="BNBCalc Logo" 
          className="h-8 w-auto mx-auto"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>
      <p className="text-gray-600 text-sm mt-2">Loading...</p>
    </div>
  );
}

