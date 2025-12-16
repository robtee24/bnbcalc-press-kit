import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');

    if (!metric) {
      return NextResponse.json(
        { error: 'Metric parameter is required' },
        { status: 400 }
      );
    }

    // Map metric names to database fields and rank fields
    const metricMap: Record<string, { valueField: string; rankField: string }> = {
      'gross-yield': { valueField: 'grossYield', rankField: 'grossYieldRank' },
      'total-revenue': { valueField: 'totalRevenue', rankField: 'totalRevenueRank' },
      'total-listings': { valueField: 'totalListings', rankField: 'totalListingsRank' },
      'revenue-per-listing': { valueField: 'revenuePerListing', rankField: 'revenuePerListingRank' },
      'occupancy': { valueField: 'occupancy', rankField: 'occupancyRank' },
      'nightly-rate': { valueField: 'nightlyRate', rankField: 'nightlyRateRank' },
    };

    const fields = metricMap[metric];
    if (!fields) {
      return NextResponse.json(
        { error: 'Invalid metric' },
        { status: 400 }
      );
    }

    // Fetch all cities (SQLite doesn't support not: null in where clause easily)
    const allCities = await prisma.cityData.findMany();

    // Format the data - filter and sort
    const rankings = allCities
      .filter(city => {
        const rank = city[fields.rankField as keyof typeof city];
        return rank !== null && rank !== undefined;
      })
      .sort((a, b) => {
        const rankA = a[fields.rankField as keyof typeof a] as number;
        const rankB = b[fields.rankField as keyof typeof b] as number;
        return rankA - rankB;
      })
      .slice(0, 100) // Limit to top 100
      .map(city => ({
        id: city.id,
        city: city.city,
        state: city.state,
        rank: city[fields.rankField as keyof typeof city],
        value: city[fields.valueField as keyof typeof city],
        // Include all other metrics for the expanded view
        grossYield: city.grossYield,
        grossYieldRank: city.grossYieldRank,
        totalRevenue: city.totalRevenue,
        totalRevenueRank: city.totalRevenueRank,
        totalListings: city.totalListings,
        totalListingsRank: city.totalListingsRank,
        revenuePerListing: city.revenuePerListing,
        revenuePerListingRank: city.revenuePerListingRank,
        occupancy: city.occupancy,
        occupancyRank: city.occupancyRank,
        nightlyRate: city.nightlyRate,
        nightlyRateRank: city.nightlyRateRank,
      }));

    return NextResponse.json(rankings);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

