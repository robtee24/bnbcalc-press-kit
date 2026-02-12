import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (market) where.market = market;
    if (type) where.type = type;

    const outlets = await prisma.mediaOutlet.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(outlets);
  } catch (error) {
    console.error('Error fetching media outlets:', error);
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

    const body = await request.json();
    const { name, url, email, type, market, description } = body;

    if (!name || !url || !type || !market) {
      return NextResponse.json(
        { error: 'Name, URL, type, and market are required' },
        { status: 400 }
      );
    }

    const validTypes = ['local_news', 'real_estate_publication', 'realtor_blog'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const outlet = await prisma.mediaOutlet.create({
      data: { name, url, email: email || null, type, market, description: description || null },
    });

    return NextResponse.json(outlet);
  } catch (error) {
    console.error('Error creating media outlet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
