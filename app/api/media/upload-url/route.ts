import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { extractOGData } from '@/lib/og-scraper';

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { imageUrl, category, type, platform } = await request.json();

    if (!imageUrl || !type) {
      return NextResponse.json(
        { error: 'Image URL and type are required' },
        { status: 400 }
      );
    }

    if (type !== 'image') {
      return NextResponse.json(
        { error: 'URL upload is only supported for images' },
        { status: 400 }
      );
    }

    let imageBuffer: Buffer;
    let contentType: string;
    let title: string;
    let description: string | null = null;
    let urlFilename: string;
    let imageUrlToDownload = imageUrl;

    // Check if it's a direct image URL by:
    // 1. Checking if URL has image extension (even with query params)
    // 2. Or by checking the Content-Type header
    const hasImageExtension = imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|#|$)/i);
    
    // First, try a HEAD request to check Content-Type
    let isDirectImage = false;
    try {
      const headResponse = await fetch(imageUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (headResponse.ok) {
        const contentTypeHeader = headResponse.headers.get('content-type');
        isDirectImage = contentTypeHeader?.startsWith('image/') || false;
      }
    } catch (headError) {
      // If HEAD fails, we'll try GET below
      console.log('HEAD request failed, will try GET:', headError);
    }
    
    // Also check if it has an image extension (handles URLs with query params)
    if (!isDirectImage && hasImageExtension) {
      isDirectImage = true;
    }
    
    if (isDirectImage) {
      // Direct image URL - download it
      try {
        const imageResponse = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*;q=0.8',
          },
        });
        
        if (!imageResponse.ok) {
          return NextResponse.json(
            { error: `Failed to download image from URL: ${imageResponse.status} ${imageResponse.statusText}` },
            { status: 400 }
          );
        }
        
        contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        // Only proceed if it's actually an image
        if (!contentType.startsWith('image/')) {
          return NextResponse.json(
            { error: 'URL does not point to an image file' },
            { status: 400 }
          );
        }
        
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        
        // Extract filename from URL (remove query params)
        const urlObj = new URL(imageUrl);
        urlFilename = urlObj.pathname.split('/').pop() || 'image.jpg';
        // Remove query params from filename if any got included
        urlFilename = urlFilename.split('?')[0].split('#')[0];
        title = urlFilename.replace(/\.[^/.]+$/, '') || 'Image from URL';
      } catch (fetchError: any) {
        return NextResponse.json(
          { error: `Failed to fetch image: ${fetchError.message}` },
          { status: 400 }
        );
      }
    } else {
      // Page URL - extract OG image and metadata
      try {
        const ogData = await extractOGData(imageUrl);
        title = ogData.title || 'Image from URL';
        description = ogData.description;
        
        if (!ogData.ogImage) {
          return NextResponse.json(
            { error: 'No image found on the page. Please provide a direct image URL or a page with an OG image.' },
            { status: 400 }
          );
        }

        imageUrlToDownload = ogData.ogImage;
        
        // Download the OG image
        const imageResponse = await fetch(imageUrlToDownload, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*,*/*;q=0.8',
          },
        });
        
        if (!imageResponse.ok) {
          return NextResponse.json(
            { error: `Failed to download image from page: ${imageResponse.status} ${imageResponse.statusText}` },
            { status: 400 }
          );
        }
        
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const ogImagePath = new URL(imageUrlToDownload).pathname;
        urlFilename = ogImagePath.split('/').pop() || 'image.jpg';
      } catch (error: any) {
        console.error('Error extracting/downloading image:', error);
        return NextResponse.json(
          { error: `Failed to extract image from URL: ${error.message || 'Unknown error'}` },
          { status: 400 }
        );
      }
    }

    const filename = `${Date.now()}-${urlFilename}`;

    let url: string;

    // Use Supabase Storage if configured, otherwise use local filesystem
    if (supabase) {
      const filePath = `images/${filename}`;
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, imageBuffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return NextResponse.json(
          { error: 'Failed to upload file to storage' },
          { status: 500 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      url = publicUrl;
    } else {
      // Fallback to local filesystem for development
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'image');
      await mkdir(uploadDir, { recursive: true });
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, imageBuffer);
      url = `/uploads/image/${filename}`;
    }

    const media = await prisma.media.create({
      data: {
        title,
        description,
        url,
        type: 'image',
        category: category || 'media',
        platform: platform || null,
      },
    });

    return NextResponse.json(media);
  } catch (error: any) {
    console.error('Error uploading image from URL:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

