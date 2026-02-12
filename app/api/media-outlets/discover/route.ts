import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';

// Curated list of common search patterns for discovering media outlets
const SEARCH_TEMPLATES = {
  local_news: [
    '{market} local news',
    '{market} newspaper',
    '{market} TV news station',
    '{market} news outlet',
    '{market} daily news',
    '{market} business journal',
    '{market} patch.com',
  ],
  real_estate_publication: [
    '{market} real estate news',
    '{market} real estate magazine',
    '{market} real estate publication',
    '{market} housing market news',
    '{market} commercial real estate news',
    '{market} real estate journal',
  ],
  realtor_blog: [
    '{market} real estate blog',
    '{market} realtor blog',
    '{market} real estate agent blog',
    '{market} brokerage blog',
    '{market} realty blog',
    '{market} best real estate agents',
  ],
};

interface DiscoveredOutlet {
  name: string;
  url: string;
  type: string;
  description: string;
}

// Extract domain name as a readable outlet name
function domainToName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    // Convert domain to readable name: "austin-business-journal.com" -> "Austin Business Journal"
    const name = hostname
      .split('.')[0]
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return name;
  } catch {
    return url;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { market, types } = await request.json();

    if (!market) {
      return NextResponse.json({ error: 'Market is required' }, { status: 400 });
    }

    const typesToSearch = types && types.length > 0 ? types : Object.keys(SEARCH_TEMPLATES);

    // Build search queries
    const searchQueries: { query: string; type: string }[] = [];
    for (const type of typesToSearch) {
      const templates = SEARCH_TEMPLATES[type as keyof typeof SEARCH_TEMPLATES];
      if (templates) {
        for (const template of templates) {
          searchQueries.push({
            query: template.replace('{market}', market),
            type,
          });
        }
      }
    }

    // Return the search queries so the admin can use them manually,
    // plus provide a Google search URL for each
    const searchLinks = searchQueries.map((sq) => ({
      query: sq.query,
      type: sq.type,
      googleUrl: `https://www.google.com/search?q=${encodeURIComponent(sq.query)}`,
    }));

    // Also provide common well-known outlets that often exist per market
    const wellKnownPatterns: DiscoveredOutlet[] = [
      {
        name: `${market} Patch`,
        url: `https://patch.com`,
        type: 'local_news',
        description: 'Hyperlocal news',
      },
      {
        name: `${market} Business Journal`,
        url: `https://www.bizjournals.com`,
        type: 'local_news',
        description: 'Local business news',
      },
      {
        name: `Redfin ${market} Blog`,
        url: `https://www.redfin.com/blog`,
        type: 'realtor_blog',
        description: 'Redfin real estate blog',
      },
      {
        name: `Zillow ${market}`,
        url: `https://www.zillow.com`,
        type: 'real_estate_publication',
        description: 'Real estate listings and market data',
      },
      {
        name: `Realtor.com ${market}`,
        url: `https://www.realtor.com`,
        type: 'real_estate_publication',
        description: 'Real estate listings and news',
      },
    ];

    return NextResponse.json({
      market,
      searchLinks,
      suggestions: wellKnownPatterns,
      message: `Generated ${searchLinks.length} search queries for "${market}". Use the Google links to discover outlets, then add them via the admin panel.`,
    });
  } catch (error) {
    console.error('Error discovering outlets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
