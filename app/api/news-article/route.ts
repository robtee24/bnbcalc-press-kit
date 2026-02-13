import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { city, variant = 0 } = await request.json();

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    const allCities = await prisma.cityData.findMany();
    const cityData = allCities.find(c =>
      c.city.toLowerCase().includes(city.toLowerCase())
    );

    if (!cityData) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    const count = allCities.length;
    const avg = {
      grossYield: allCities.reduce((s, c) => s + (c.grossYield || 0), 0) / count,
      totalRevenue: allCities.reduce((s, c) => s + (c.totalRevenue || 0), 0) / count,
      occupancy: allCities.reduce((s, c) => s + (c.occupancy || 0), 0) / count,
      nightlyRate: allCities.reduce((s, c) => s + (c.nightlyRate || 0), 0) / count,
      revenuePerListing: allCities.reduce((s, c) => s + (c.revenuePerListing || 0), 0) / count,
      totalListings: allCities.reduce((s, c) => s + (c.totalListings || 0), 0) / count,
    };

    const article = generateNewsArticle(cityData, avg, count, variant);
    return NextResponse.json({ article, variant });
  } catch (error) {
    console.error('Error generating news article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const BNBCALC_LINK = '<a href="https://bnbcalc.com" target="_blank" rel="noopener noreferrer">BNBCalc</a>';
const BNBCALC_DESC = `${BNBCALC_LINK}, an <a href="https://bnbcalc.com" target="_blank" rel="noopener noreferrer">Airbnb calculator</a> and analytics platform`;

function generateNewsArticle(data: any, avg: any, totalMarkets: number, variant: number): string {
  const market = data.state ? `${data.city}, ${data.state}` : data.city;
  const cityName = data.city;
  const year = new Date().getFullYear();

  const rankings = [
    { label: 'gross yield', rank: data.grossYieldRank, value: data.grossYield, metric: 'grossYield' },
    { label: 'total Airbnb revenue', rank: data.totalRevenueRank, value: data.totalRevenue, metric: 'totalRevenue' },
    { label: 'revenue per listing', rank: data.revenuePerListingRank, value: data.revenuePerListing, metric: 'revenuePerListing' },
    { label: 'occupancy', rank: data.occupancyRank, value: data.occupancy, metric: 'occupancy' },
    { label: 'average nightly rate', rank: data.nightlyRateRank, value: data.nightlyRate, metric: 'nightlyRate' },
    { label: 'total listings', rank: data.totalListingsRank, value: data.totalListings, metric: 'totalListings' },
  ].filter(r => r.rank != null);

  rankings.sort((a, b) => a.rank - b.rank);
  const best = rankings[0];
  const second = rankings[1];
  const top25 = rankings.filter(r => r.rank <= 25);
  const top50 = rankings.filter(r => r.rank <= 50);

  const ordinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const fmtCurrency = (v: number, decimals = 0): string =>
    '$' + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const fmtPct = (v: number, decimals = 1): string => v.toFixed(decimals) + '%';

  const aboveAvgPct = (value: number, avgValue: number): string => {
    const pct = ((value - avgValue) / avgValue) * 100;
    return pct.toFixed(0) + '%';
  };

  // Use variant to pick different structures
  const v = variant % 3;

  let headline = '';
  let leadParagraph = '';
  let body = '';

  // ============================================
  // VARIANT 0: Lead with best ranking
  // ============================================
  if (v === 0) {
    if (best.rank <= 10) {
      headline = `${cityName} Is Now a Top-10 Airbnb Market in America — Here's What That Means for Local Real Estate`;
      leadParagraph = `${market} has landed the ${ordinal(best.rank)} spot nationally for ${best.label} among short-term rental markets, according to new data from ${BNBCALC_DESC} that tracks performance across hundreds of U.S. metros. The number puts ${cityName} ahead of the vast majority of markets and raises fresh questions about what's driving demand in the area — and what it means for homeowners, investors, and the broader real estate picture.`;
    } else if (best.rank <= 25) {
      headline = `${cityName} Quietly Became One of America's Hottest Short-Term Rental Markets`;
      leadParagraph = `New data out of ${BNBCALC_DESC}'s ${year} market rankings places ${market} at No. ${best.rank} nationally for ${best.label}, putting it firmly in the top tier of short-term rental markets across the country. For a metro that doesn't always make national real estate headlines, the ranking is worth a closer look.`;
    } else if (best.rank <= 50) {
      headline = `The Surprising Airbnb Data That Shows ${cityName}'s Real Estate Market Is Stronger Than You Think`;
      leadParagraph = `${market} may not be the first city that comes to mind when people talk about booming Airbnb markets, but data from ${BNBCALC_DESC} tells an interesting story. The metro ranks ${ordinal(best.rank)} nationally in ${best.label} — and when you dig into the rest of the numbers, a picture starts to form of a market with real momentum.`;
    } else {
      headline = `What ${cityName}'s Short-Term Rental Boom Tells Us About the Future of Its Housing Market`;
      leadParagraph = `Every housing market has a story to tell, and ${market}'s short-term rental data offers a window into what's happening on the ground. ${BNBCALC_DESC}'s ${year} rankings place the metro at ${ordinal(best.rank)} for ${best.label}, but the full picture is more nuanced than any single number suggests.`;
    }

    // Revenue / yield paragraph
    if (data.totalRevenue && data.grossYield) {
      const revAbove = data.totalRevenue > avg.totalRevenue;
      const yieldAbove = data.grossYield > avg.grossYield;

      body += `The local Airbnb market generated ${fmtCurrency(data.totalRevenue)} in total revenue, `;
      if (revAbove) {
        body += `which runs about ${aboveAvgPct(data.totalRevenue, avg.totalRevenue)} above the national average. `;
      } else {
        body += `tracking near the national average for metros of its size. `;
      }
      body += `Gross yield — essentially the return an investor can expect relative to property prices — `;
      if (yieldAbove) {
        body += `comes in at ${fmtPct(data.grossYield, 2)}, beating the national average of ${fmtPct(avg.grossYield, 2)}. That's a meaningful gap, and it's the kind of number that gets investors' attention.`;
      } else {
        body += `sits at ${fmtPct(data.grossYield, 2)} compared to a ${fmtPct(avg.grossYield, 2)} national average. It's a competitive number, even if it doesn't blow the doors off.`;
      }
      body += '\n\n';
    }

    body += buildWhyItMatters(cityName, top25, top50);
    body += buildOccupancyRate(cityName, data, avg);
    body += buildRevenuePerListing(cityName, data, avg);
    body += buildBiggerPicture(cityName, data, year);
  }

  // ============================================
  // VARIANT 1: Lead with real estate angle
  // ============================================
  if (v === 1) {
    if (best.rank <= 25) {
      headline = `${cityName}'s Airbnb Boom Is Reshaping the Local Real Estate Landscape`;
      leadParagraph = `Real estate investors have been watching ${market} closely, and the latest short-term rental data gives them plenty to talk about. According to ${BNBCALC_DESC}, the ${cityName} metro ranks ${ordinal(best.rank)} in the nation for ${best.label} — a number that reflects more than just vacation rental performance. It speaks to the underlying strength of the local property market itself.`;
    } else if (best.rank <= 50) {
      headline = `Behind the Numbers: Why ${cityName}'s Short-Term Rental Surge Matters for Every Homeowner`;
      leadParagraph = `There's a reason real estate analysts pay attention to short-term rental numbers, and ${market}'s latest figures from ${BNBCALC_DESC} are a case in point. Ranking ${ordinal(best.rank)} nationally for ${best.label}, the metro's performance offers a useful lens into what's happening in the broader housing market.`;
    } else {
      headline = `The Hidden Signal in ${cityName}'s Housing Market That Investors Are Watching Closely`;
      leadParagraph = `Short-term rental data has become one of the more reliable barometers for local real estate health, and ${market}'s numbers — tracked by ${BNBCALC_DESC} — paint a nuanced picture. The metro sits at ${ordinal(best.rank)} nationally for ${best.label}, with additional data points that round out the story.`;
    }

    // Start with why STR data matters for RE
    body += `The connection between short-term rental performance and housing market strength isn't coincidental. Markets that attract visitors tend to attract investment. Property values get bolstered by income-producing potential, and local economies benefit from the spending that comes with tourism. That's the backdrop against which ${cityName}'s numbers start to make sense.\n\n`;

    if (data.occupancy && data.nightlyRate) {
      body += `Properties in ${cityName} average a ${fmtPct(data.occupancy, 1)} occupancy rate with a nightly rate of ${fmtCurrency(data.nightlyRate, 2)}. `;
      const occAbove = data.occupancy > avg.occupancy;
      const rateAbove = data.nightlyRate > avg.nightlyRate;
      if (occAbove && rateAbove) {
        body += `Both sit above the national average, a combination that's harder to pull off than it sounds. High rates usually push occupancy down. When a market holds both up, it means people genuinely want to be there and are willing to pay for it.`;
      } else if (occAbove) {
        body += `The occupancy stands out — visitors are booking consistently, and that kind of demand doesn't appear out of nowhere. It reflects a metro that people actively choose as a destination.`;
      } else if (rateAbove) {
        body += `The rate is what catches the eye. Guests are paying above-average prices to stay in ${cityName}, which suggests perceived value in the area as a destination.`;
      } else {
        body += `Neither leads the country, but together they sketch a picture of steady, reliable demand — the kind of thing long-term investors tend to prefer over flashy spikes.`;
      }
      body += '\n\n';
    }

    if (data.totalRevenue && data.grossYield) {
      body += `The aggregate numbers add context. Total Airbnb revenue in the market hit ${fmtCurrency(data.totalRevenue)}, `;
      body += data.totalRevenue > avg.totalRevenue
        ? `about ${aboveAvgPct(data.totalRevenue, avg.totalRevenue)} above the national average. `
        : `near the national average. `;
      body += `Gross yield sits at ${fmtPct(data.grossYield, 2)}, `;
      body += data.grossYield > avg.grossYield
        ? `clearing the ${fmtPct(avg.grossYield, 2)} national benchmark — a meaningful edge for property investors.`
        : `compared to a ${fmtPct(avg.grossYield, 2)} national average.`;
      body += '\n\n';
    }

    body += buildRevenuePerListing(cityName, data, avg);
    body += buildBiggerPicture(cityName, data, year);
  }

  // ============================================
  // VARIANT 2: Lead with investment / data angle
  // ============================================
  if (v === 2) {
    if (best.rank <= 25) {
      headline = `${cityName} Climbs the National Rankings — and the Data Backs Up the Hype`;
      leadParagraph = `Investors hunting for the next strong Airbnb market might want to look at ${market}. Data published by ${BNBCALC_DESC} ranks the metro ${ordinal(best.rank)} in the country for ${best.label}${second ? ` and ${ordinal(second.rank)} for ${second.label}` : ''} — figures that position it as one of the more compelling opportunities in the current landscape.`;
    } else if (best.rank <= 50) {
      headline = `Why Smart Money Is Paying Attention to ${cityName}'s Short-Term Rental Numbers`;
      leadParagraph = `For anyone trying to gauge the health of ${cityName}'s real estate market, the latest short-term rental data from ${BNBCALC_DESC} offers a useful snapshot. At ${ordinal(best.rank)} nationally for ${best.label}, the metro isn't leading the pack, but the details under the surface are more interesting than the headline number.`;
    } else {
      headline = `Overlooked No More: The Data That Puts ${cityName} on the Real Estate Investment Map`;
      leadParagraph = `Data from ${BNBCALC_DESC} reveals where ${market} stands among the nation's short-term rental markets in ${year}. The metro's ${ordinal(best.rank)} ranking for ${best.label} is a starting point — but the more telling story lives in the combination of metrics that define what's actually happening on the ground.`;
    }

    // Data dump paragraph
    body += `Here's what the numbers look like. `;
    if (data.totalRevenue) body += `Total short-term rental revenue: ${fmtCurrency(data.totalRevenue)}. `;
    if (data.grossYield) body += `Gross yield: ${fmtPct(data.grossYield, 2)}. `;
    if (data.occupancy) body += `Average occupancy: ${fmtPct(data.occupancy, 1)}. `;
    if (data.nightlyRate) body += `Average nightly rate: ${fmtCurrency(data.nightlyRate, 2)}. `;
    if (data.revenuePerListing) body += `Revenue per listing: ${fmtCurrency(data.revenuePerListing)}. `;
    if (data.totalListings) body += `Active listings: ${data.totalListings.toLocaleString()}. `;
    body += `Each of those has a national ranking attached, and ${cityName}'s range from ${ordinal(best.rank)} to ${ordinal(rankings[rankings.length - 1].rank)} — a spread that tells you this isn't a one-trick market.\n\n`;

    // Analysis
    if (data.grossYield && data.grossYield > avg.grossYield) {
      body += `The gross yield figure — ${fmtPct(data.grossYield, 2)} against a ${fmtPct(avg.grossYield, 2)} national average — is the one most likely to catch an investor's eye. Yield is what separates a property that cash-flows from one that just sits there appreciating on paper. In ${cityName}'s case, the number suggests real income potential relative to purchase prices.\n\n`;
    } else if (data.revenuePerListing && data.revenuePerListing > avg.revenuePerListing) {
      body += `The per-listing revenue of ${fmtCurrency(data.revenuePerListing)} stands out. It's ${aboveAvgPct(data.revenuePerListing, avg.revenuePerListing)} above the national average, which means individual properties in ${cityName} are outearning their counterparts in most other metros. For a single-property investor, that's the number that matters.\n\n`;
    }

    body += buildWhyItMatters(cityName, top25, top50);
    body += buildBiggerPicture(cityName, data, year);
  }

  const article = `<h1>${headline}</h1>\n\n${leadParagraph}\n\n${body}`;
  return article;
}

// ---- Shared section builders ----

function buildWhyItMatters(cityName: string, top25: any[], top50: any[]): string {
  let s = `<strong>Why This Matters for the Local Real Estate Market</strong>\n\n`;
  s += `Short-term rental performance isn't just an Airbnb story — it's a proxy for how attractive an area is to visitors, how strong local demand is, and ultimately, how healthy the housing market is. `;

  if (top25.length >= 2) {
    s += `When a market ranks in the top 25 across ${top25.length} different metrics, as ${cityName} does, it tells you something broader: people want to be here. They're booking stays, they're paying competitive rates, and the supply of listings hasn't outpaced demand. That kind of balance is exactly what real estate economists look for when assessing market health.\n\n`;
  } else if (top50.length >= 2) {
    s += `A market that performs in the top 50 across multiple categories — ${cityName} does so in ${top50.length} — tends to have the fundamentals working in its favor. Demand is solid, pricing holds up, and there's enough economic activity to support continued growth without the overheating you see in some flashier markets.\n\n`;
  } else {
    s += `Even in markets that aren't grabbing national headlines, steady short-term rental numbers often signal underlying stability — the kind of demand that doesn't evaporate when interest rates shift or a new development breaks ground down the street.\n\n`;
  }
  return s;
}

function buildOccupancyRate(cityName: string, data: any, avg: any): string {
  const fmtPct = (v: number, d = 1) => v.toFixed(d) + '%';
  const fmtCurrency = (v: number, d = 0) => '$' + v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const ordinal = (n: number) => { const s = ['th','st','nd','rd']; const v = n % 100; return n + (s[(v-20)%10]||s[v]||s[0]); };

  if (!data.occupancy || !data.nightlyRate) return '';

  let s = `Look at the numbers another way: ${cityName} properties average a ${fmtPct(data.occupancy, 1)} occupancy rate`;
  if (data.occupancyRank && data.occupancyRank <= 50) s += ` (${ordinal(data.occupancyRank)} nationally)`;
  s += ` with a nightly rate of ${fmtCurrency(data.nightlyRate, 2)}`;
  if (data.nightlyRateRank && data.nightlyRateRank <= 50) s += ` (${ordinal(data.nightlyRateRank)} nationally)`;
  s += `. `;

  const occAbove = data.occupancy > avg.occupancy;
  const rateAbove = data.nightlyRate > avg.nightlyRate;

  if (occAbove && rateAbove) {
    s += `Both numbers sit above the national average, which is unusual — typically, markets trade off between high rates and high occupancy. The fact that ${cityName} manages both suggests the area has real pricing power without scaring off bookings.`;
  } else if (occAbove) {
    s += `The occupancy figure stands out especially. Properties are getting booked consistently, which reduces risk for anyone holding short-term rental inventory and signals sustained visitor interest in the area.`;
  } else if (rateAbove) {
    s += `The nightly rate is the eye-catcher here — guests are willing to pay a premium for ${cityName} stays, which speaks to the perceived value of the area as a destination.`;
  } else {
    s += `While neither number leads the pack nationally, the combination tells a story of a stable, workhorse market where operators can count on predictable demand.`;
  }
  return s + '\n\n';
}

function buildRevenuePerListing(cityName: string, data: any, avg: any): string {
  const fmtCurrency = (v: number, d = 0) => '$' + v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const aboveAvgPct = (value: number, avgValue: number) => (((value - avgValue) / avgValue) * 100).toFixed(0) + '%';
  const ordinal = (n: number) => { const s = ['th','st','nd','rd']; const v = n % 100; return n + (s[(v-20)%10]||s[v]||s[0]); };

  if (!data.revenuePerListing) return '';

  let s = `For individual hosts, the per-listing revenue of ${fmtCurrency(data.revenuePerListing)} `;
  if (data.revenuePerListing > avg.revenuePerListing) {
    s += `(${aboveAvgPct(data.revenuePerListing, avg.revenuePerListing)} above the national average) `;
  }
  s += `is the metric that arguably matters most. `;
  s += `It's one thing for a market to post big aggregate numbers — that can just mean there are a lot of listings. Per-listing revenue strips that noise away and shows what an individual property actually earns. `;

  if (data.revenuePerListingRank && data.revenuePerListingRank <= 30) {
    s += `${cityName}'s ${ordinal(data.revenuePerListingRank)} ranking here is a strong signal for anyone thinking about entering the market.`;
  } else {
    s += `In ${cityName}'s case, the figure suggests a healthy market where well-managed properties can generate solid returns.`;
  }
  return s + '\n\n';
}

function buildBiggerPicture(cityName: string, data: any, year: number): string {
  let s = `<strong>The Bigger Picture</strong>\n\n`;

  if (data.totalListings) {
    s += `With ${data.totalListings.toLocaleString()} active short-term rental listings in the metro, ${cityName} has a supply base that reflects genuine market maturity — not a speculative bubble. `;
  }

  s += `Strong short-term rental performance tends to correlate with broader housing market health for a few reasons. `;
  s += `It signals that an area attracts visitors (tourism dollars flow into local businesses), that property values are supported by income-producing potential, and that the local economy generates enough activity to keep beds filled year-round.\n\n`;

  s += `None of that happens in a vacuum. Infrastructure, job growth, quality of life, and accessibility all feed into these numbers. `;
  s += `When a market like ${cityName} shows up in ${BNBCALC_LINK}'s rankings, it's reflecting all of those forces at once.\n\n`;

  s += `Whether you're a homeowner curious about your property's potential, an investor scouting new markets, or a local official trying to understand the economic footprint of short-term rentals, the ${year} data from ${cityName} is worth paying attention to. `;
  s += `The rankings don't tell the whole story — they never do — but they point in a direction that's hard to ignore.`;
  return s;
}

function capitalize(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}
