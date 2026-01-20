import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allData = await prisma.cityData.findMany({
      orderBy: { city: 'asc' },
    });

    return NextResponse.json(allData);
  } catch (error) {
    console.error('Error fetching all city data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



