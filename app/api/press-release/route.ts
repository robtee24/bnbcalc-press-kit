import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { city } = await request.json();

    if (!city) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      );
    }

    // SQLite doesn't support case-insensitive mode, so we fetch all and filter
    const allCities = await prisma.cityData.findMany();
    const cityData = allCities.find(c => 
      c.city.toLowerCase().includes(city.toLowerCase())
    );

    if (!cityData) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    // Generate press release
    const pressRelease = generatePressRelease(cityData);

    return NextResponse.json({ pressRelease });
  } catch (error) {
    console.error('Error generating press release:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePressRelease(data: any): string {
  const market = data.state ? `${data.city}, ${data.state}` : data.city;
  const marketName = data.city;

  // Find the best (lowest) ranking
  const rankings = [
    { name: 'Airbnb Revenue', rank: data.totalRevenueRank, value: data.totalRevenue, metric: 'totalRevenue' },
    { name: 'Gross Yield', rank: data.grossYieldRank, value: data.grossYield, metric: 'grossYield' },
    { name: 'Revenue Per Listing', rank: data.revenuePerListingRank, value: data.revenuePerListing, metric: 'revenuePerListing' },
    { name: 'Occupancy Rate', rank: data.occupancyRank, value: data.occupancy, metric: 'occupancy' },
    { name: 'Nightly Rate', rank: data.nightlyRateRank, value: data.nightlyRate, metric: 'nightlyRate' },
    { name: 'Total Listings', rank: data.totalListingsRank, value: data.totalListings, metric: 'totalListings' },
  ].filter(r => r.rank !== null && r.rank !== undefined);

  if (rankings.length === 0) {
    return `FOR IMMEDIATE RELEASE\n\n${market.toUpperCase()} MARKET DATA AVAILABLE\n\n${market} - ${new Date().getFullYear()} - Market data is available for this region.`;
  }

  // Sort by rank (best first)
  rankings.sort((a, b) => a.rank! - b.rank!);
  const bestRanking = rankings[0];

  // Get ordinal suffix for rank
  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const rankSuffix = getOrdinalSuffix(bestRanking.rank!);

  // Collect all strong rankings (top 25)
  const strongRankings = rankings.filter(r => r.rank! <= 25);
  const otherRankings = rankings.filter(r => r.rank! > 25 && r !== bestRanking);

  // Format value based on metric type
  const formatValue = (value: number | null, metric: string): string => {
    if (value === null) return '';
    if (metric === 'grossYield' || metric === 'occupancy') {
      return value.toFixed(metric === 'grossYield' ? 2 : 1) + '%';
    }
    if (metric === 'totalRevenue' || metric === 'revenuePerListing' || metric === 'nightlyRate') {
      const formatted = value.toLocaleString(undefined, {
        minimumFractionDigits: metric === 'nightlyRate' ? 2 : 0,
        maximumFractionDigits: metric === 'nightlyRate' ? 2 : 0,
      });
      return '$' + formatted;
    }
    return value.toLocaleString();
  };

  // Title based on best ranking
  const title = `The ${market} Market Ranks <strong>${rankSuffix}</strong> in ${bestRanking.name}`;

  // Build the press release
  let release = `FOR IMMEDIATE RELEASE\n\n${title}\n\n${market} - ${new Date().getFullYear()} - `;
  
  // Opening paragraph
  release += `The <strong>${marketName} market</strong> has emerged as one of the premier short-term rental destinations in the United States, achieving the <strong>${rankSuffix} national ranking</strong> in ${bestRanking.name.toLowerCase()}. `;
  
  if (bestRanking.value !== null) {
    release += `With <strong>${formatValue(bestRanking.value, bestRanking.metric)}</strong> in ${bestRanking.name.toLowerCase()}, `;
  }
  
  release += `the ${marketName} market demonstrates <strong>exceptional performance</strong> that positions it among the <strong>top markets</strong> for Airbnb investors and hosts heading into 2026.\n\n`;

  // Market Performance Overview
  release += `<strong>Market Performance Overview:</strong>\n\n`;
  release += `The ${marketName} market's <strong>outstanding rankings</strong> reflect a comprehensive strength across multiple <strong>key performance indicators</strong>. `;
  
  if (strongRankings.length > 1) {
    release += `Beyond the <strong>${rankSuffix} ranking</strong> in ${bestRanking.name.toLowerCase()}, the market also excels in `;
    const otherStrong = strongRankings.slice(1, 3).map(r => {
      const suffix = getOrdinalSuffix(r.rank!);
      return `<strong>${suffix}</strong> in ${r.name.toLowerCase()}${r.value !== null ? ` (<strong>${formatValue(r.value, r.metric)}</strong>)` : ''}`;
    }).join(' and ');
    release += `${otherStrong}. `;
  }

  release += `This <strong>multi-dimensional excellence</strong> demonstrates that ${marketName} isn't just strong in one area, but represents a <strong>well-rounded, high-performing market</strong> that offers <strong>sustainable opportunities</strong> for short-term rental operators.\n\n`;

  // Regional Market Dynamics
  release += `<strong>Regional Market Dynamics:</strong>\n\n`;
  release += `The success of the ${marketName} market extends beyond city limits, with <strong>strong performance indicators</strong> reflecting the broader <strong>regional economy and tourism ecosystem</strong>. `;
  
  if (data.totalRevenue && data.totalRevenueRank && data.totalRevenueRank <= 25) {
    release += `The market's total revenue of <strong>${formatValue(data.totalRevenue, 'totalRevenue')}</strong> `;
    release += `ranks <strong>${getOrdinalSuffix(data.totalRevenueRank)} nationally</strong>, indicating <strong>robust economic activity</strong> across the region. `;
  }
  
  if (data.totalListings) {
    release += `With <strong>${data.totalListings.toLocaleString()} active listings</strong>, `;
  }
  
  release += `the ${marketName} market and surrounding metropolitan area provide a <strong>diverse range of accommodation options</strong> that cater to various traveler preferences, from business professionals to leisure tourists. `;
  
  release += `This diversity, combined with the market's <strong>strong performance metrics</strong>, creates a <strong>dynamic environment</strong> where both established hosts and new entrants can thrive.\n\n`;

  // Detailed Performance Metrics
  release += `<strong>Detailed Performance Metrics:</strong>\n\n`;
  
  strongRankings.forEach(ranking => {
    const suffix = getOrdinalSuffix(ranking.rank!);
    release += `• <strong>${ranking.name}:</strong> <strong>${suffix} nationally</strong>`;
    if (ranking.value !== null) {
      release += ` (<strong>${formatValue(ranking.value, ranking.metric)}</strong>)`;
    }
    release += '\n';
  });

  if (otherRankings.length > 0) {
    release += '\n<strong>Additional Rankings:</strong>\n';
    otherRankings.forEach(ranking => {
      const suffix = getOrdinalSuffix(ranking.rank!);
      release += `• <strong>${ranking.name}:</strong> <strong>${suffix} nationally</strong>`;
      if (ranking.value !== null) {
        release += ` (<strong>${formatValue(ranking.value, ranking.metric)}</strong>)`;
      }
      release += '\n';
    });
  }

  release += '\n';

  // Market Strengths and Contributing Factors
  release += `<strong>Market Strengths and Contributing Factors:</strong>\n\n`;
  release += `The ${marketName} market's <strong>exceptional rankings</strong> are the result of several <strong>interconnected factors</strong>. `;
  
  if (data.occupancy && data.occupancyRank && data.occupancyRank <= 25) {
    release += `With an occupancy rate of <strong>${data.occupancy.toFixed(1)}%</strong>, ranking <strong>${getOrdinalSuffix(data.occupancyRank)} nationally</strong>, `;
    release += `the market demonstrates <strong>consistent demand</strong> throughout the year. `;
  }
  
  if (data.grossYield && data.grossYieldRank && data.grossYieldRank <= 25) {
    release += `The gross yield of <strong>${data.grossYield.toFixed(2)}%</strong> (<strong>${getOrdinalSuffix(data.grossYieldRank)} nationally</strong>) `;
    release += `indicates <strong>strong return potential</strong> for property investors, making it an <strong>attractive market</strong> for those looking to enter or expand their short-term rental portfolio. `;
  }
  
  if (data.nightlyRate) {
    release += `The average nightly rate of <strong>${formatValue(data.nightlyRate, 'nightlyRate')}</strong> `;
    release += `positions the ${marketName} market as a <strong>premium destination</strong> that attracts quality-conscious travelers while maintaining <strong>competitive pricing</strong>. `;
  }

  release += `The surrounding cities and metropolitan area contribute <strong>significantly</strong> to this success, creating a <strong>synergistic effect</strong> where `;
  release += `<strong>tourism infrastructure, accessibility, and regional economic growth</strong> amplify the market's performance. `;
  release += `This <strong>regional strength</strong> ensures that the ${marketName} market's success is built on a <strong>solid foundation</strong> that extends beyond temporary trends.\n\n`;

  // Outlook for 2026
  release += `<strong>2026 Outlook:</strong>\n\n`;
  release += `Looking ahead to 2026, the ${marketName} market is <strong>exceptionally well-positioned</strong> for <strong>continued growth and success</strong>. `;
  release += `The market's <strong>top-tier rankings</strong> across multiple metrics, combined with <strong>strong fundamentals</strong>, suggest a <strong>promising trajectory</strong> for Airbnb hosts and investors. `;
  release += `<strong>Key factors</strong> supporting this positive outlook include:\n\n`;
  release += `• <strong>Sustained demand</strong> driven by the market's ranking as a top destination for both business and leisure travel\n`;
  release += `• <strong>Strong economic fundamentals</strong> that support continued investment and development\n`;
  release += `• <strong>Favorable market dynamics</strong> that benefit both new and experienced short-term rental operators\n`;
  release += `• <strong>Regional growth</strong> that enhances accessibility and expands the addressable market\n`;
  release += `• <strong>Diverse accommodation offerings</strong> that appeal to a broad range of traveler segments\n\n`;

  release += `The combination of these factors, supported by the market's current <strong>exceptional rankings</strong>, creates an environment where `;
  release += `short-term rental operators can expect <strong>strong performance, healthy returns, and sustainable growth</strong> throughout 2026 and beyond.\n\n`;

  // About section
  release += `<strong>About BNBCalc:</strong>\n`;
  release += `BNBCalc provides <strong>comprehensive market analysis</strong> and data insights for short-term rental markets, helping investors and hosts make <strong>informed decisions</strong> based on real performance data.\n\n`;
  release += `###\n`;
  release += `Contact: BNBCalc Media Relations\n`;
  release += `Email: media@bnbcalc.com`;

  return release;
}

