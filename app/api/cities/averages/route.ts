import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const allCities = await prisma.cityData.findMany();

    // Calculate averages
    const validGrossYield = allCities.filter(c => c.grossYield !== null).map(c => c.grossYield!);
    const validTotalRevenue = allCities.filter(c => c.totalRevenue !== null).map(c => c.totalRevenue!);
    const validTotalListings = allCities.filter(c => c.totalListings !== null).map(c => c.totalListings!);
    const validRevenuePerListing = allCities.filter(c => c.revenuePerListing !== null).map(c => c.revenuePerListing!);
    const validOccupancy = allCities.filter(c => c.occupancy !== null).map(c => c.occupancy!);
    const validNightlyRate = allCities.filter(c => c.nightlyRate !== null).map(c => c.nightlyRate!);

    const averages = {
      grossYield: validGrossYield.length > 0 
        ? validGrossYield.reduce((a, b) => a + b, 0) / validGrossYield.length 
        : null,
      totalRevenue: validTotalRevenue.length > 0 
        ? validTotalRevenue.reduce((a, b) => a + b, 0) / validTotalRevenue.length 
        : null,
      totalListings: validTotalListings.length > 0 
        ? validTotalListings.reduce((a, b) => a + b, 0) / validTotalListings.length 
        : null,
      revenuePerListing: validRevenuePerListing.length > 0 
        ? validRevenuePerListing.reduce((a, b) => a + b, 0) / validRevenuePerListing.length 
        : null,
      occupancy: validOccupancy.length > 0 
        ? validOccupancy.reduce((a, b) => a + b, 0) / validOccupancy.length 
        : null,
      nightlyRate: validNightlyRate.length > 0 
        ? validNightlyRate.reduce((a, b) => a + b, 0) / validNightlyRate.length 
        : null,
    };

    return NextResponse.json(averages);
  } catch (error) {
    console.error('Error calculating averages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

