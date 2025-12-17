import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { extractOGData } from '@/lib/og-scraper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};

    const articles = await prisma.article.findMany({
      where,
    });

    // Sort articles: articles without meta title last, then by createdAt desc
    // IMPORTANT: Sort AFTER fetching, not using orderBy, to ensure proper sorting
    const sortedArticles = [...articles].sort((a, b) => {
      // Check if title exists and is not empty/whitespace
      const aHasTitle = a.title != null && String(a.title).trim().length > 0;
      const bHasTitle = b.title != null && String(b.title).trim().length > 0;
      
      // If a doesn't have title but b does, a comes last (return positive)
      if (!aHasTitle && bHasTitle) return 1;
      // If a has title but b doesn't, b comes last (return negative, so a comes first)
      if (aHasTitle && !bHasTitle) return -1;
      
      // Both have titles or both don't have titles, sort by createdAt desc (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(sortedArticles);
  } catch (error) {
    console.error('Error fetching articles:', error);
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

    const { url, category } = await request.json();

    if (!url || !category) {
      return NextResponse.json(
        { error: 'URL and category are required' },
        { status: 400 }
      );
    }

    const ogData = await extractOGData(url);

    const article = await prisma.article.create({
      data: {
        url,
        category,
        title: ogData.title,
        ogImage: ogData.ogImage,
        metaDescription: ogData.description,
      },
    });

    return NextResponse.json(article);
  } catch (error: any) {
    console.error('Error creating article:', error);
    const errorMessage = error?.message || 'Internal server error';
    const errorDetails = error?.toString() || 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Error creating article',
        message: errorMessage,
        details: errorDetails 
      },
      { status: 500 }
    );
  }
}

