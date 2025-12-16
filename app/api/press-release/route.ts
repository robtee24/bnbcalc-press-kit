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
  const city = data.state ? `${data.city}, ${data.state}` : data.city;
  const cityName = data.city; // Use just city name for references in text
  const metrics = [];
  
  if (data.grossYieldRank) metrics.push(`Gross Yield Rank: ${data.grossYieldRank}`);
  if (data.totalRevenueRank) metrics.push(`Total Revenue Rank: ${data.totalRevenueRank}`);
  if (data.totalListingsRank) metrics.push(`Total Listings Rank: ${data.totalListingsRank}`);
  if (data.revenuePerListingRank) metrics.push(`Revenue Per Listing Rank: ${data.revenuePerListingRank}`);
  if (data.occupancyRank) metrics.push(`Occupancy Rank: ${data.occupancyRank}`);
  if (data.nightlyRateRank) metrics.push(`Nightly Rate Rank: ${data.nightlyRateRank}`);

  return `FOR IMMEDIATE RELEASE

${city.toUpperCase()} SHOWS STRONG AIRBNB MARKET PERFORMANCE HEADING INTO 2026

${city} - ${new Date().getFullYear()} - ${cityName} demonstrates exceptional growth potential in the short-term rental market, positioning itself as a top destination for Airbnb investors and hosts in 2026.

Key Performance Metrics:
${metrics.join('\n')}

Market Analysis:
${cityName}'s Airbnb market continues to show robust performance across multiple key indicators. With ${data.totalListings ? data.totalListings.toLocaleString() : 'significant'} active listings, the market demonstrates strong supply to meet growing demand. The market's ${data.grossYield ? `${data.grossYield.toFixed(2)}%` : 'strong'} gross yield indicates healthy returns for property investors, while the ${data.occupancy ? `${data.occupancy.toFixed(1)}%` : 'high'} occupancy rate reflects consistent demand throughout the year.

The average nightly rate of $${data.nightlyRate ? data.nightlyRate.toFixed(2) : 'competitive'} positions ${cityName} as an attractive destination for travelers seeking quality accommodations. Combined with strong revenue per listing metrics, this market offers compelling opportunities for both new and experienced hosts.

Growth Outlook for 2026:
Industry trends suggest that ${cityName}'s short-term rental market is well-positioned for continued growth in 2026. Factors contributing to this positive outlook include:

- Strong demand fundamentals driven by tourism and business travel
- Favorable regulatory environment supporting short-term rentals
- Growing recognition of ${cityName} as a premier destination
- Infrastructure improvements enhancing accessibility
- Diverse accommodation options meeting various traveler preferences

The combination of these factors, along with the market's current performance metrics, indicates a promising trajectory for Airbnb hosts and investors in ${cityName} throughout 2026.

About BNBCalc:
BNBCalc provides comprehensive market analysis and data insights for short-term rental markets, helping investors and hosts make informed decisions.

###
Contact: BNBCalc Media Relations
Email: media@bnbcalc.com`;
}

