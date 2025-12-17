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
  const title = `The ${market} Market Ranks ${rankSuffix} in ${bestRanking.name}`;

  // Build the press release
  let release = `FOR IMMEDIATE RELEASE\n\n${title}\n\n${market} - ${new Date().getFullYear()} - `;
  
  // Opening paragraph
  release += `The ${marketName} market has emerged as one of the premier short-term rental destinations in the United States, achieving the ${rankSuffix} national ranking in ${bestRanking.name.toLowerCase()}. `;
  
  if (bestRanking.value !== null) {
    release += `With ${formatValue(bestRanking.value, bestRanking.metric)} in ${bestRanking.name.toLowerCase()}, `;
  }
  
  release += `the ${marketName} market demonstrates exceptional performance that positions it among the top markets for Airbnb investors and hosts heading into 2026.\n\n`;

  // Market Performance Overview
  release += `Market Performance Overview:\n\n`;
  release += `The ${marketName} market's outstanding rankings reflect a comprehensive strength across multiple key performance indicators. `;
  
  if (strongRankings.length > 1) {
    release += `Beyond the ${rankSuffix} ranking in ${bestRanking.name.toLowerCase()}, the market also excels in `;
    const otherStrong = strongRankings.slice(1, 3).map(r => {
      const suffix = getOrdinalSuffix(r.rank!);
      return `${suffix} in ${r.name.toLowerCase()}${r.value !== null ? ` (${formatValue(r.value, r.metric)})` : ''}`;
    }).join(' and ');
    release += `${otherStrong}. `;
  }

  release += `This multi-dimensional excellence demonstrates that ${marketName} isn't just strong in one area, but represents a well-rounded, high-performing market that offers sustainable opportunities for short-term rental operators.\n\n`;

  // Regional Market Dynamics
  release += `Regional Market Dynamics:\n\n`;
  release += `The success of the ${marketName} market extends beyond city limits, with strong performance indicators reflecting the broader regional economy and tourism ecosystem. `;
  
  if (data.totalRevenue && data.totalRevenueRank && data.totalRevenueRank <= 25) {
    release += `The market's total revenue of ${formatValue(data.totalRevenue, 'totalRevenue')} `;
    release += `ranks ${getOrdinalSuffix(data.totalRevenueRank)} nationally, indicating robust economic activity across the region. `;
  }
  
  if (data.totalListings) {
    release += `With ${data.totalListings.toLocaleString()} active listings, `;
  }
  
  release += `the ${marketName} market and surrounding metropolitan area provide a diverse range of accommodation options that cater to various traveler preferences, from business professionals to leisure tourists. `;
  
  release += `This diversity, combined with the market's strong performance metrics, creates a dynamic environment where both established hosts and new entrants can thrive.\n\n`;

  // Detailed Performance Metrics
  release += `Detailed Performance Metrics:\n\n`;
  
  strongRankings.forEach(ranking => {
    const suffix = getOrdinalSuffix(ranking.rank!);
    release += `• ${ranking.name}: ${suffix} nationally`;
    if (ranking.value !== null) {
      release += ` (${formatValue(ranking.value, ranking.metric)})`;
    }
    release += '\n';
  });

  if (otherRankings.length > 0) {
    release += '\nAdditional Rankings:\n';
    otherRankings.forEach(ranking => {
      const suffix = getOrdinalSuffix(ranking.rank!);
      release += `• ${ranking.name}: ${suffix} nationally`;
      if (ranking.value !== null) {
        release += ` (${formatValue(ranking.value, ranking.metric)})`;
      }
      release += '\n';
    });
  }

  release += '\n';

  // Market Strengths and Contributing Factors
  release += `Market Strengths and Contributing Factors:\n\n`;
  release += `The ${marketName} market's exceptional rankings are the result of several interconnected factors. `;
  
  if (data.occupancy && data.occupancyRank && data.occupancyRank <= 25) {
    release += `With an occupancy rate of ${data.occupancy.toFixed(1)}%, ranking ${getOrdinalSuffix(data.occupancyRank)} nationally, `;
    release += `the market demonstrates consistent demand throughout the year. `;
  }
  
  if (data.grossYield && data.grossYieldRank && data.grossYieldRank <= 25) {
    release += `The gross yield of ${data.grossYield.toFixed(2)}% (${getOrdinalSuffix(data.grossYieldRank)} nationally) `;
    release += `indicates strong return potential for property investors, making it an attractive market for those looking to enter or expand their short-term rental portfolio. `;
  }
  
  if (data.nightlyRate) {
    release += `The average nightly rate of ${formatValue(data.nightlyRate, 'nightlyRate')} `;
    release += `positions the ${marketName} market as a premium destination that attracts quality-conscious travelers while maintaining competitive pricing. `;
  }

  release += `The surrounding cities and metropolitan area contribute significantly to this success, creating a synergistic effect where `;
  release += `tourism infrastructure, accessibility, and regional economic growth amplify the market's performance. `;
  release += `This regional strength ensures that the ${marketName} market's success is built on a solid foundation that extends beyond temporary trends.\n\n`;

  // Outlook for 2026
  release += `2026 Outlook:\n\n`;
  release += `Looking ahead to 2026, the ${marketName} market is exceptionally well-positioned for continued growth and success. `;
  release += `The market's top-tier rankings across multiple metrics, combined with strong fundamentals, suggest a promising trajectory for Airbnb hosts and investors. `;
  release += `Key factors supporting this positive outlook include:\n\n`;
  release += `• Sustained demand driven by the market's ranking as a top destination for both business and leisure travel\n`;
  release += `• Strong economic fundamentals that support continued investment and development\n`;
  release += `• Favorable market dynamics that benefit both new and experienced short-term rental operators\n`;
  release += `• Regional growth that enhances accessibility and expands the addressable market\n`;
  release += `• Diverse accommodation offerings that appeal to a broad range of traveler segments\n\n`;

  release += `The combination of these factors, supported by the market's current exceptional rankings, creates an environment where `;
  release += `short-term rental operators can expect strong performance, healthy returns, and sustainable growth throughout 2026 and beyond.\n\n`;

  // About section
  release += `About BNBCalc:\n`;
  release += `BNBCalc provides comprehensive market analysis and data insights for short-term rental markets, helping investors and hosts make informed decisions based on real performance data.\n\n`;
  release += `###\n`;
  release += `Contact: BNBCalc Media Relations\n`;
  release += `Email: media@bnbcalc.com`;

  return release;
}

