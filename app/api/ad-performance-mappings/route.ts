import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const mappings = await prisma.adPerformanceMapping.findMany({
      include: {
        media: true,
      },
      orderBy: {
        adName: 'asc',
      },
    });

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error fetching ad performance mappings:', error);
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

    const { adName, mediaId } = await request.json();

    if (!adName || !mediaId) {
      return NextResponse.json(
        { error: 'adName and mediaId are required' },
        { status: 400 }
      );
    }

    // Check if media exists
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Upsert mapping (create or update if exists)
    const mapping = await prisma.adPerformanceMapping.upsert({
      where: {
        adName: adName,
      },
      update: {
        mediaId: mediaId,
        updatedAt: new Date(),
      },
      create: {
        adName: adName,
        mediaId: mediaId,
      },
      include: {
        media: true,
      },
    });

    return NextResponse.json(mapping);
  } catch (error: any) {
    console.error('Error creating/updating ad performance mapping:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const adName = searchParams.get('adName');

    if (!adName) {
      return NextResponse.json(
        { error: 'adName is required' },
        { status: 400 }
      );
    }

    await prisma.adPerformanceMapping.delete({
      where: {
        adName: adName,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting ad performance mapping:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

