import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (city) {
      try {
        // SQLite doesn't support case-insensitive mode, so we fetch all and filter
        const allCities = await prisma.cityData.findMany();
        const cityLower = city.toLowerCase().trim();
        
        // Try exact match first, then partial match
        let cityData = allCities.find(c => 
          c.city.toLowerCase() === cityLower
        );
        
        // If no exact match, try partial match
        if (!cityData) {
          cityData = allCities.find(c => 
            c.city.toLowerCase().includes(cityLower) ||
            (c.state && `${c.city}, ${c.state}`.toLowerCase().includes(cityLower))
          );
        }

        if (!cityData) {
          return NextResponse.json(
            { error: 'City not found' },
            { status: 404 }
          );
        }

        return NextResponse.json(cityData);
      } catch (error) {
        console.error('Error in city search:', error);
        return NextResponse.json(
          { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
          { status: 500 }
        );
      }
    }

    const cities = await prisma.cityData.findMany({
      select: { city: true, state: true },
      orderBy: { city: 'asc' },
    });

    // Return unique cities with "City, State" format
    const uniqueCities = Array.from(
      new Map(
        cities.map(c => [
          c.city,
          c.state ? `${c.city}, ${c.state}` : c.city
        ])
      ).entries()
    ).map(([city, display]) => display);

    return NextResponse.json(uniqueCities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const cityData = await prisma.cityData.create({
      data,
    });

    return NextResponse.json(cityData);
  } catch (error) {
    console.error('Error creating city data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

