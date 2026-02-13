import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

interface DiscoveredOutlet {
  name: string;
  url: string;
  email: string | null;
  type: 'local_news' | 'real_estate_publication' | 'realtor_blog';
  description: string | null;
  hasBlog?: boolean;
  socialLinks?: string[];
  emailSource?: string;
}

// =============================================
// Serper.dev Google Search
// =============================================
async function searchGoogle(query: string, num = 10): Promise<{ title: string; url: string; snippet: string }[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num }),
    });
    if (!response.ok) {
      console.error(`Serper error ${response.status}`);
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
      'bbb.org', 'mapquest.com', 'yellowpages.com', 'whitepages.com',
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

// =============================================
// Fetch a page with timeout
// =============================================
async function fetchPage(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    return await response.text();
  } catch {
    return null;
  }
}

// =============================================
// Extract all emails from HTML
// =============================================
function extractEmailsFromHtml(html: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const raw = html.match(emailRegex) || [];

  const skipPatterns = [
    'noreply', 'no-reply', 'donotreply', 'unsubscribe', 'privacy',
    'example.com', 'sentry.io', 'wixpress.com', 'cloudflare', 'wordpress',
    'googleapis', 'gravatar', 'schema.org', 'w3.org',
    '.png', '.jpg', '.gif', '.svg', '.css', '.js', '.woff',
  ];

  return [...new Set(
    raw.filter((email) => {
      const lower = email.toLowerCase();
      return !skipPatterns.some((p) => lower.includes(p));
    })
  )];
}

// =============================================
// Find "submit tip" / "submit news" emails
// =============================================
function findTipEmail(emails: string[]): string | null {
  const tipPrefixes = [
    'tips', 'tip', 'newstip', 'newstips', 'news', 'submit',
    'editor', 'editorial', 'newsroom', 'newsdesk', 'desk',
    'assignment', 'breaking', 'reports', 'story', 'stories',
  ];
  for (const prefix of tipPrefixes) {
    const match = emails.find((e) => e.toLowerCase().startsWith(prefix));
    if (match) return match;
  }
  return null;
}

// =============================================
// Find contact email
// =============================================
function findContactEmail(emails: string[]): string | null {
  const contactPrefixes = [
    'contact', 'info', 'hello', 'press', 'media', 'feedback',
    'inquiries', 'inquiry', 'general', 'admin', 'support',
  ];
  for (const prefix of contactPrefixes) {
    const match = emails.find((e) => e.toLowerCase().startsWith(prefix));
    if (match) return match;
  }
  return null;
}

// =============================================
// Find blog-related email
// =============================================
function findBlogEmail(emails: string[]): string | null {
  const blogPrefixes = [
    'blog', 'content', 'marketing', 'editor', 'editorial',
    'media', 'press', 'info', 'contact', 'hello',
  ];
  for (const prefix of blogPrefixes) {
    const match = emails.find((e) => e.toLowerCase().startsWith(prefix));
    if (match) return match;
  }
  return null;
}

// =============================================
// Extract social media links from HTML
// =============================================
function extractSocialLinks(html: string): string[] {
  const socialPatterns = [
    /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._\-/]+/g,
    /https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9._\-/]+/g,
    /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._\-/]+/g,
    /https?:\/\/(www\.)?linkedin\.com\/[a-zA-Z0-9._\-/]+/g,
  ];

  const links: string[] = [];
  for (const pattern of socialPatterns) {
    const matches = html.match(pattern) || [];
    for (const match of matches) {
      // Clean up - remove trailing slashes, fragments
      const clean = match.replace(/\/+$/, '').split('#')[0].split('?')[0];
      if (!links.includes(clean) && !clean.includes('/sharer') && !clean.includes('/share') && !clean.includes('/intent')) {
        links.push(clean);
      }
    }
  }
  return links;
}

// =============================================
// Check if a site has a blog
// =============================================
function siteHasBlog(html: string, url: string): boolean {
  const lower = html.toLowerCase();
  // Check for blog links in navigation
  const blogPatterns = [
    '/blog', '/news', '/articles', '/insights', '/resources',
    '/market-updates', '/market-report', '/housing-market',
  ];
  for (const p of blogPatterns) {
    if (lower.includes(`href="${p}`) || lower.includes(`href="${url}${p}`)) {
      return true;
    }
  }
  // Check for blog-related text in nav/menus
  if (lower.includes('>blog<') || lower.includes('>news<') || lower.includes('>articles<') || lower.includes('>market updates<')) {
    return true;
  }
  return false;
}

// =============================================
// Crawl a site: fetch homepage + contact/about/tip pages
// =============================================
async function crawlSiteForEmails(baseUrl: string): Promise<{ emails: string[]; socialLinks: string[]; hasBlog: boolean }> {
  const allEmails: string[] = [];
  const allSocialLinks: string[] = [];
  let hasBlog = false;

  // Pages to try crawling
  const pagesToTry = [
    baseUrl,
    `${baseUrl}/contact`,
    `${baseUrl}/contact-us`,
    `${baseUrl}/about`,
    `${baseUrl}/about-us`,
    `${baseUrl}/submit-a-tip`,
    `${baseUrl}/tips`,
    `${baseUrl}/newstips`,
  ];

  // Fetch homepage first to find social links and blog
  const homepage = await fetchPage(baseUrl);
  if (homepage) {
    allEmails.push(...extractEmailsFromHtml(homepage));
    allSocialLinks.push(...extractSocialLinks(homepage));
    hasBlog = siteHasBlog(homepage, baseUrl);

    // Look for contact page links in the homepage HTML
    const contactLinkMatch = homepage.match(/href="(\/[^"]*(?:contact|about|tip|submit|newsroom|feedback)[^"]*)"/gi);
    if (contactLinkMatch) {
      for (const match of contactLinkMatch.slice(0, 3)) {
        const hrefMatch = match.match(/href="([^"]+)"/);
        if (hrefMatch) {
          let path = hrefMatch[1];
          if (path.startsWith('/')) path = `${baseUrl}${path}`;
          if (!pagesToTry.includes(path)) pagesToTry.push(path);
        }
      }
    }
  }

  // Fetch other pages (skip homepage since we already did it)
  for (const pageUrl of pagesToTry.slice(1).slice(0, 5)) {
    const html = await fetchPage(pageUrl, 5000);
    if (html) {
      allEmails.push(...extractEmailsFromHtml(html));
    }
  }

  // Deduplicate
  const uniqueEmails = [...new Set(allEmails)];
  const uniqueSocial = [...new Set(allSocialLinks)];

  return { emails: uniqueEmails, socialLinks: uniqueSocial, hasBlog };
}

// =============================================
// Try to get email from Facebook About page
// =============================================
async function getEmailFromFacebook(fbUrl: string): Promise<string | null> {
  try {
    // Try the about page
    let aboutUrl = fbUrl.replace(/\/+$/, '');
    if (!aboutUrl.includes('/about')) aboutUrl += '/about';

    const html = await fetchPage(aboutUrl, 5000);
    if (!html) return null;

    const emails = extractEmailsFromHtml(html);
    return emails[0] || null;
  } catch {
    return null;
  }
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

function getHomepage(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return url;
  }
}

function cleanName(title: string): string {
  let name = title
    .replace(/\s*[-|:].*(News|Home|Official Site|Homepage|Local News|Breaking News|Latest News|Weather|Traffic|Sports).*$/i, '')
    .replace(/\s*[-|:]\s*$/, '')
    .trim();
  if (name.length > 60) {
    const sepIdx = name.search(/\s[-|:]\s/);
    if (sepIdx > 10) name = name.substring(0, sepIdx).trim();
  }
  return name || title;
}

// =============================================
// DISCOVER: Local News Outlets
// =============================================
async function discoverLocalNews(market: string): Promise<DiscoveredOutlet[]> {
  const results = await searchGoogle(`Local News in ${market}`, 10);
  const outlets: DiscoveredOutlet[] = [];
  const seenDomains = new Set<string>();

  for (const result of results.slice(0, 8)) {
    const domain = getDomain(result.url);
    if (seenDomains.has(domain)) continue;
    seenDomains.add(domain);

    const homepage = getHomepage(result.url);
    const { emails, socialLinks, hasBlog } = await crawlSiteForEmails(homepage);

    // Look for tip/news submission email first
    let email = findTipEmail(emails);
    let emailSource = email ? 'tip/news submission' : '';

    // If no tip email, try contact email
    if (!email) {
      email = findContactEmail(emails);
      emailSource = email ? 'contact page' : '';
    }

    // If still no email, try Facebook about page
    if (!email) {
      const fbLink = socialLinks.find((l) => l.includes('facebook.com'));
      if (fbLink) {
        email = await getEmailFromFacebook(fbLink);
        emailSource = email ? 'Facebook about page' : '';
      }
    }

    // Fallback to first email found
    if (!email && emails.length > 0) {
      email = emails[0];
      emailSource = 'site crawl';
    }

    outlets.push({
      name: cleanName(result.title),
      url: homepage,
      email,
      type: 'local_news',
      description: result.snippet.substring(0, 200) || null,
      socialLinks: socialLinks.slice(0, 4),
      emailSource: emailSource || undefined,
    });
  }

  return outlets;
}

// =============================================
// DISCOVER: Real Estate Publications
// =============================================
async function discoverREPublications(market: string): Promise<DiscoveredOutlet[]> {
  const results = await searchGoogle(`Real Estate publications in ${market}`, 10);
  const outlets: DiscoveredOutlet[] = [];
  const seenDomains = new Set<string>();

  for (const result of results.slice(0, 8)) {
    const domain = getDomain(result.url);
    if (seenDomains.has(domain)) continue;
    seenDomains.add(domain);

    const homepage = getHomepage(result.url);
    const { emails } = await crawlSiteForEmails(homepage);

    // Look for tip email first, then contact
    let email = findTipEmail(emails);
    let emailSource = email ? 'tip/submit' : '';

    if (!email) {
      email = findContactEmail(emails);
      emailSource = email ? 'contact page' : '';
    }

    if (!email && emails.length > 0) {
      email = emails[0];
      emailSource = 'site crawl';
    }

    outlets.push({
      name: cleanName(result.title),
      url: homepage,
      email,
      type: 'real_estate_publication',
      description: result.snippet.substring(0, 200) || null,
      emailSource: emailSource || undefined,
    });
  }

  return outlets;
}

// =============================================
// DISCOVER: Real Estate Brokerages (with blogs)
// =============================================
async function discoverBrokerages(market: string): Promise<DiscoveredOutlet[]> {
  const results = await searchGoogle(`Real Estate Brokers in ${market}`, 10);
  const outlets: DiscoveredOutlet[] = [];
  const seenDomains = new Set<string>();

  for (const result of results.slice(0, 8)) {
    const domain = getDomain(result.url);
    if (seenDomains.has(domain)) continue;
    seenDomains.add(domain);

    const homepage = getHomepage(result.url);
    const { emails, hasBlog } = await crawlSiteForEmails(homepage);

    // Only include if the site has a blog
    if (!hasBlog) continue;

    // Find email most closely related to the blog
    let email = findBlogEmail(emails);
    let emailSource = email ? 'blog/content' : '';

    if (!email) {
      email = findContactEmail(emails);
      emailSource = email ? 'contact page' : '';
    }

    if (!email && emails.length > 0) {
      email = emails[0];
      emailSource = 'site crawl';
    }

    outlets.push({
      name: cleanName(result.title),
      url: homepage,
      email,
      type: 'realtor_blog',
      description: result.snippet.substring(0, 200) || null,
      hasBlog: true,
      emailSource: emailSource || undefined,
    });
  }

  return outlets;
}

// =============================================
// Main: Discover all outlet types for a market
// =============================================
async function discoverOutletsForMarket(market: string): Promise<{
  outlets: DiscoveredOutlet[];
  searchesUsed: number;
  errors: string[];
}> {
  const errors: string[] = [];

  if (!process.env.SERPER_API_KEY) {
    return {
      outlets: [],
      searchesUsed: 0,
      errors: ['SERPER_API_KEY not set. Get a free key at serper.dev and add it to Vercel env vars.'],
    };
  }

  // Run all three discovery types
  const [newsOutlets, reOutlets, brokerOutlets] = await Promise.all([
    discoverLocalNews(market).catch((e) => { errors.push(`News error: ${e}`); return [] as DiscoveredOutlet[]; }),
    discoverREPublications(market).catch((e) => { errors.push(`RE pub error: ${e}`); return [] as DiscoveredOutlet[]; }),
    discoverBrokerages(market).catch((e) => { errors.push(`Broker error: ${e}`); return [] as DiscoveredOutlet[]; }),
  ]);

  const allOutlets = [...newsOutlets, ...reOutlets, ...brokerOutlets];

  // Deduplicate across types by domain
  const seenDomains = new Set<string>();
  const deduped = allOutlets.filter((o) => {
    const d = getDomain(o.url);
    if (seenDomains.has(d)) return false;
    seenDomains.add(d);
    return true;
  });

  return { outlets: deduped, searchesUsed: 3, errors };
}

// =============================================
// GET: returns all unique markets from CityData
// =============================================
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
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =============================================
// POST: crawl a single market and save results
// =============================================
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
