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

async function searchWeb(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );
    if (!response.ok) return [];
    const html = await response.text();
    const results: { title: string; url: string; snippet: string }[] = [];
    const resultBlocks = html.split('class="result__body"');
    for (let i = 1; i < resultBlocks.length && results.length < 10; i++) {
      const block = resultBlocks[i];
      const urlMatch = block.match(/class="result__a"[^>]*href="([^"]+)"/);
      const titleMatch = block.match(/class="result__a"[^>]*>([^<]+)</);
      const snippetMatch = block.match(/class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)/);
      if (urlMatch && titleMatch) {
        let url = urlMatch[1];
        const uddgMatch = url.match(/uddg=([^&]+)/);
        if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
        const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';
        const skipDomains = [
          'google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com',
          'facebook.com', 'twitter.com', 'instagram.com', 'youtube.com',
          'linkedin.com', 'pinterest.com', 'reddit.com', 'tiktok.com',
          'wikipedia.org', 'yelp.com', 'amazon.com',
        ];
        if (!skipDomains.some((d) => url.includes(d)) && url.startsWith('http')) {
          results.push({ title, url, snippet });
        }
      }
    }
    return results;
  } catch (error) {
    console.error(`Search error for query:`, error);
    return [];
  }
}

async function extractEmail(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const html = await response.text();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex) || [];
    const skipPatterns = [
      'noreply', 'no-reply', 'donotreply', 'unsubscribe', 'privacy',
      'example.com', 'sentry.io', 'wixpress.com', 'cloudflare',
      '.png', '.jpg', '.gif', '.svg', '.css', '.js',
    ];
    const contactEmails = emails.filter((email) => {
      const lower = email.toLowerCase();
      return !skipPatterns.some((p) => lower.includes(p));
    });
    const preferredPrefixes = [
      'news', 'editor', 'tips', 'contact', 'info', 'press',
      'editorial', 'newsroom', 'desk', 'feedback', 'hello',
    ];
    const preferred = contactEmails.find((email) =>
      preferredPrefixes.some((p) => email.toLowerCase().startsWith(p))
    );
    return preferred || contactEmails[0] || null;
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

async function discoverOutletsForMarket(market: string): Promise<DiscoveredOutlet[]> {
  const discovered: DiscoveredOutlet[] = [];
  const seenDomains = new Set<string>();

  const searches: { query: string; type: DiscoveredOutlet['type'] }[] = [
    { query: `${market} local news outlet website`, type: 'local_news' },
    { query: `${market} local newspaper`, type: 'local_news' },
    { query: `${market} TV news station`, type: 'local_news' },
    { query: `${market} business journal news`, type: 'local_news' },
    { query: `${market} real estate news publication`, type: 'real_estate_publication' },
    { query: `${market} real estate magazine`, type: 'real_estate_publication' },
    { query: `${market} housing market news site`, type: 'real_estate_publication' },
    { query: `${market} real estate agent blog`, type: 'realtor_blog' },
    { query: `${market} real estate brokerage blog`, type: 'realtor_blog' },
    { query: `${market} realtor blog`, type: 'realtor_blog' },
  ];

  for (const search of searches) {
    const results = await searchWeb(search.query);
    for (const result of results.slice(0, 5)) {
      const domain = getDomain(result.url);
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);
      let homepageUrl: string;
      try {
        const parsed = new URL(result.url);
        homepageUrl = `${parsed.protocol}//${parsed.hostname}`;
      } catch {
        homepageUrl = result.url;
      }
      discovered.push({
        name: cleanName(result.title),
        url: homepageUrl,
        email: null,
        type: search.type,
        description: result.snippet.substring(0, 200) || null,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  // Try to extract emails for top results
  const emailTasks = discovered.slice(0, 15).map(async (outlet, idx) => {
    await new Promise((resolve) => setTimeout(resolve, idx * 200));
    const email = await extractEmail(outlet.url);
    if (email) discovered[idx].email = email;
  });
  await Promise.allSettled(emailTasks);

  return discovered;
}

// GET: returns all unique markets from CityData
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    return NextResponse.json({ markets, existingCounts: countMap, total: markets.length });
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
    const discovered = await discoverOutletsForMarket(market);

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
                name: outlet.name, url: outlet.url, email: outlet.email,
                type: outlet.type, market, description: outlet.description,
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
        market, discovered: discovered.length, saved: savedCount,
        skippedDuplicates: discovered.length - savedCount, outlets: discovered,
      });
    }
    return NextResponse.json({ market, discovered: discovered.length, outlets: discovered });
  } catch (error) {
    console.error('Error crawling market:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
