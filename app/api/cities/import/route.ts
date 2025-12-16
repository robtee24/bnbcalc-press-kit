import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, columnMapping } = await request.json();

    // Delete all previously uploaded city data before importing new data
    const deletedCount = await prisma.cityData.deleteMany({});
    console.log(`Deleted ${deletedCount.count} existing city records`);

    // Validate that city column is mapped
    const cityMapped = Object.values(columnMapping).includes('city');
    if (!cityMapped) {
      return NextResponse.json(
        { error: 'City column must be mapped. Please map at least one column to "City".' },
        { status: 400 }
      );
    }

    // Import new data
    const cityDataArray = data
      .map((row: any) => {
        const mapped: any = {};
        
        for (const [csvColumn, dbField] of Object.entries(columnMapping)) {
          const field = dbField as string;
          if (field && row[csvColumn] !== undefined && row[csvColumn] !== null && row[csvColumn] !== '') {
            const value = row[csvColumn];
            
            // Convert to appropriate type
            if (field.includes('Rank') || field === 'totalListings') {
              const parsed = parseInt(String(value));
              mapped[field] = isNaN(parsed) ? null : parsed;
            } else if (field === 'city' || field === 'state') {
              mapped[field] = String(value).trim();
            } else {
              const parsed = parseFloat(String(value));
              mapped[field] = isNaN(parsed) ? null : parsed;
            }
          }
        }

        return mapped;
      })
      .filter((row: any) => row.city); // Filter out rows without a city

    if (cityDataArray.length === 0) {
      return NextResponse.json(
        { error: 'No valid data to import. Please ensure at least one row has a city value.' },
        { status: 400 }
      );
    }

    // Use individual creates for SQLite compatibility
    // SQLite has limitations with createMany, so we'll create records in batches
    const batchSize = 100;
    let createdCount = 0;
    
    for (let i = 0; i < cityDataArray.length; i += batchSize) {
      const batch = cityDataArray.slice(i, i + batchSize);
      await Promise.all(
        batch.map((row: any) => prisma.cityData.create({ data: row }))
      );
      createdCount += batch.length;
    }

    return NextResponse.json({ success: true, count: createdCount });
  } catch (error: any) {
    console.error('Error importing city data:', error);
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, details: error?.toString() },
      { status: 500 }
    );
  }
}

