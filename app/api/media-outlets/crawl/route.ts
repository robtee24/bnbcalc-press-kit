import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

interface DiscoveredOutlet {
  name: string;
  url: string;
  email: string | null;
  type: 'local_news' | 'real_estate_publication' | 'realtor_blog';
  description: string | null;
}

// ---- Search via Serper.dev (Google Search API, free tier: 2500 searches) ----
async function searchSerper(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 10 }),
    });

    if (!response.ok) {
      console.error(`Serper API error ${response.status}: ${await response.text()}`);
      return [];
    }

    const data = await response.json();
    const organic = data.organic || [];

    const skipDomains = [
      'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
      'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'youtube.com',
      'linkedin.com', 'pinterest.com', 'reddit.com', 'tiktok.com',
      'wikipedia.org', 'yelp.com', 'amazon.com', 'zillow.com',
      'realtor.com', 'redfin.com', 'trulia.com', 'apartments.com',
    ];

    return organic
      .filter((r: { link: string }) => {
        const url = r.link || '';
        return url.startsWith('http') && !skipDomains.some((d) => url.includes(d));
      })
      .map((r: { title: string; link: string; snippet: string }) => ({
        title: r.title || '',
        url: r.link || '',
        snippet: r.snippet || '',
      }));
  } catch (error) {
    console.error('Serper search error:', error);
    return [];
  }
}

// ---- Email extraction from a website ----
async function extractEmail(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    // Try homepage first, then /contact
    for (const target of [url, `${url}/contact`, `${url}/about`]) {
      try {
        const response = await fetch(target, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
          redirect: 'follow',
        });
        if (!response.ok) continue;

        const html = await response.text();
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = html.match(emailRegex) || [];

        const skipPatterns = [
          'noreply', 'no-reply', 'donotreply', 'unsubscribe', 'privacy',
          'example.com', 'sentry.io', 'wixpress.com', 'cloudflare',
          '.png', '.jpg', '.gif', '.svg', '.css', '.js', '.woff',
          'schema.org', 'wordpress', 'googleapis',
        ];

        const contactEmails = emails.filter((email) => {
          const lower = email.toLowerCase();
          return !skipPatterns.some((p) => lower.includes(p));
        });

        // Prefer editorial/news emails
        const preferredPrefixes = [
          'news', 'editor', 'tips', 'contact', 'info', 'press',
          'editorial', 'newsroom', 'desk', 'feedback', 'hello',
        ];

        const preferred = contactEmails.find((email) =>
          preferredPrefixes.some((p) => email.toLowerCase().startsWith(p))
        );

        const foundEmail = preferred || contactEmails[0] || null;
        if (foundEmail) {
          clearTimeout(timeout);
          return foundEmail;
        }
      } catch {
        // Try next URL
      }
    }

    clearTimeout(timeout);
    return null;
  } catch {
    return null;
  }
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

function cleanName(title: string): string {
  let name = title
    .replace(/\s*[-|:].*(News|Home|Official Site|Homepage|Local News|Breaking News|Latest News).*$/i, '')
    .replace(/\s*[-|:]\s*$/, '')
    .trim();
  if (name.length > 60) {
    const sepIdx = name.search(/\s[-|:]\s/);
    if (sepIdx > 10) name = name.substring(0, sepIdx).trim();
  }
  return name || title;
}

function getHomepage(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

async function discoverOutletsForMarket(market: string): Promise<{ outlets: DiscoveredOutlet[]; searchesUsed: number; errors: string[] }> {
  const discovered: DiscoveredOutlet[] = [];
  const seenDomains = new Set<string>();
  const errors: string[] = [];
  let searchesUsed = 0;

  const hasSerperKey = !!process.env.SERPER_API_KEY;
  if (!hasSerperKey) {
    return { outlets: [], searchesUsed: 0, errors: ['SERPER_API_KEY environment variable is not set. Get a free key at serper.dev and add it to your Vercel environment variables.'] };
  }

  // Fewer, more targeted searches to conserve API credits
  const searches: { query: string; type: DiscoveredOutlet['type'] }[] = [
    { query: `"${market}" local news newspaper TV station`, type: 'local_news' },
    { query: `"${market}" local newspaper website`, type: 'local_news' },
    { query: `"${market}" real estate news publication magazine`, type: 'real_estate_publication' },
    { query: `"${market}" real estate agent blog brokerage`, type: 'realtor_blog' },
    { query: `"${market}" real estate blog`, type: 'realtor_blog' },
  ];

  for (const search of searches) {
    searchesUsed++;
    const results = await searchSerper(search.query);

    if (results.length === 0) {
      errors.push(`No results for: ${search.query}`);
    }

    for (const result of results.slice(0, 8)) {
      const domain = getDomain(result.url);
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);

      discovered.push({
        name: cleanName(result.title),
        url: getHomepage(result.url),
        email: null,
        type: search.type,
        description: result.snippet.substring(0, 200) || null,
      });
    }

    // Small delay between API calls
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Try to extract emails for discovered outlets (limit to avoid timeouts)
  const emailTasks = discovered.slice(0, 12).map(async (outlet, idx) => {
    try {
      const email = await extractEmail(outlet.url);
      if (email) discovered[idx].email = email;
    } catch {
      // Skip email extraction failures
    }
  });
  await Promise.allSettled(emailTasks);

  return { outlets: discovered, searchesUsed, errors };
}

// GET: returns all unique markets from CityData + checks if API key is configured
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasApiKey = !!process.env.SERPER_API_KEY;

    const cities = await prisma.cityData.findMany({
      select: { city: true, state: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    const markets = cities.map((c) => (c.state ? `${c.city}, ${c.state}` : c.city));

    const existingCounts = await prisma.mediaOutlet.groupBy({
      by: ['market'],
      _count: { id: true },
    });
    const countMap: Record<string, number> = {};
    existingCounts.forEach((g) => { countMap[g.market] = g._count.id; });

    return NextResponse.json({
      markets,
      existingCounts: countMap,
      total: markets.length,
      hasApiKey,
      searchProvider: hasApiKey ? 'serper' : 'none',
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: crawl a single market and save results
export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { market, autoSave } = await request.json();
    if (!market) {
      return NextResponse.json({ error: 'Market is required' }, { status: 400 });
    }

    const { outlets: discovered, searchesUsed, errors } = await discoverOutletsForMarket(market);

    if (autoSave && discovered.length > 0) {
      const existing = await prisma.mediaOutlet.findMany({
        where: { market },
        select: { url: true },
      });
      const existingUrls = new Set(existing.map((e) => getDomain(e.url)));
      let savedCount = 0;

      for (const outlet of discovered) {
        const domain = getDomain(outlet.url);
        if (!existingUrls.has(domain)) {
          try {
            await prisma.mediaOutlet.create({
              data: {
                name: outlet.name,
                url: outlet.url,
                email: outlet.email,
                type: outlet.type,
                market,
                description: outlet.description,
              },
            });
            existingUrls.add(domain);
            savedCount++;
          } catch (err) {
            console.error(`Error saving outlet ${outlet.name}:`, err);
          }
        }
      }

      return NextResponse.json({
        market,
        discovered: discovered.length,
        saved: savedCount,
        skippedDuplicates: discovered.length - savedCount,
        searchesUsed,
        errors,
        outlets: discovered,
      });
    }

    return NextResponse.json({
      market,
      discovered: discovered.length,
      searchesUsed,
      errors,
      outlets: discovered,
    });
  } catch (error) {
    console.error('Error crawling market:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
