import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { extractOGData } from '@/lib/og-scraper';

// Create Supabase client with service role key for this route (bypasses RLS)
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl) return null;
  
  // Always prefer service role key for server-side storage operations
  const keyToUse = supabaseServiceKey || supabaseAnonKey;
  if (!keyToUse) return null;
  
  return createClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
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

    const { imageUrl, videoUrl, category, type, platform } = await request.json();

    // Support both imageUrl and videoUrl for backwards compatibility
    const url = imageUrl || videoUrl;

    if (!url || !type) {
      return NextResponse.json(
        { error: 'URL and type are required' },
        { status: 400 }
      );
    }

    if (type !== 'image' && type !== 'video') {
      return NextResponse.json(
        { error: 'URL upload is only supported for images and videos' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return NextResponse.json(
        { error: `Invalid URL format: ${url}. Please provide a valid URL starting with http:// or https://` },
        { status: 400 }
      );
    }

    if (type === 'video') {
      // Handle video URL upload
      try {
        console.log('Downloading video from URL:', url);
        const videoResponse = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'video/*,*/*;q=0.8',
          },
        });

        if (!videoResponse.ok) {
          const errorText = await videoResponse.text().catch(() => '');
          console.error('Video download failed:', videoResponse.status, videoResponse.statusText, errorText);
          return NextResponse.json(
            { 
              error: `Failed to download video from URL: ${videoResponse.status} ${videoResponse.statusText}`,
              details: errorText || 'No additional error details'
            },
            { status: 400 }
          );
        }

        const contentTypeHeader = videoResponse.headers.get('content-type');
        if (!contentTypeHeader?.startsWith('video/')) {
          return NextResponse.json(
            { 
              error: 'URL does not point to a video file',
              details: `Content-Type is: ${contentTypeHeader}`
            },
            { status: 400 }
          );
        }

        const arrayBuffer = await videoResponse.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);
        console.log('Video downloaded successfully, size:', videoBuffer.length, 'bytes');

        // Extract filename from URL
        let urlFilename: string;
        try {
          const urlObj = new URL(url);
          urlFilename = urlObj.pathname.split('/').pop() || 'video.mp4';
          urlFilename = urlFilename.split('?')[0].split('#')[0];
          // Ensure .mp4 extension
          if (!urlFilename.toLowerCase().endsWith('.mp4')) {
            urlFilename = urlFilename.replace(/\.[^/.]+$/, '') + '.mp4';
          }
        } catch (urlError) {
          const urlParts = url.split('/');
          urlFilename = (urlParts[urlParts.length - 1].split('?')[0].split('#')[0] || 'video.mp4');
          if (!urlFilename.toLowerCase().endsWith('.mp4')) {
            urlFilename = urlFilename.replace(/\.[^/.]+$/, '') + '.mp4';
          }
        }
        
        // Sanitize filename: remove/replace invalid characters for storage
        urlFilename = urlFilename
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
          .replace(/\s+/g, '_') // Replace spaces with underscore
          .replace(/_{2,}/g, '_') // Replace multiple underscores with single
          .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

        const filename = `${Date.now()}-${urlFilename}`;
        const filePath = `videos/${filename}`;
        let fileUrl: string;

        // Upload to Supabase Storage if configured, otherwise use local filesystem
        const supabase = getSupabaseClient();
        if (supabase) {
          console.log('Uploading video to Supabase:', {
            bucket: 'media',
            path: filePath,
            size: videoBuffer.length,
            contentType: contentTypeHeader
          });

          const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, videoBuffer, {
              contentType: contentTypeHeader || 'video/mp4',
              upsert: false,
              cacheControl: '3600',
            });

          if (error) {
            console.error('Supabase upload error:', error);
            return NextResponse.json(
              { 
                error: 'Failed to upload video to storage',
                message: error.message || 'Storage upload failed',
                details: error.toString()
              },
              { status: 500 }
            );
          }

          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);

          fileUrl = publicUrl;
        } else {
          // Fallback to local filesystem for development
          const uploadDir = join(process.cwd(), 'public', 'uploads', 'video');
          await mkdir(uploadDir, { recursive: true });
          const filepath = join(uploadDir, filename);
          await writeFile(filepath, videoBuffer);
          fileUrl = `/uploads/video/${filename}`;
        }

        const media = await prisma.media.create({
          data: {
            title: urlFilename.replace(/\.mp4$/i, '') || 'Video from URL',
            description: null,
            url: fileUrl,
            type: 'video',
            category: category || 'media',
            platform: platform || null,
          },
        });

        return NextResponse.json(media);
      } catch (error: any) {
        console.error('Error downloading/uploading video:', error);
        return NextResponse.json(
          { error: `Failed to process video URL: ${error.message || 'Unknown error'}` },
          { status: 400 }
        );
      }
    }

    // Handle image URL upload (existing code)
    let imageBuffer: Buffer;
    let contentType: string;
    let title: string;
    let description: string | null = null;
    let urlFilename: string;
    let imageUrlToDownload = url;

    // Check if it's a direct image URL by:
    // 1. Checking if URL has image extension (even with query params)
    // 2. Or by checking the Content-Type header
    const hasImageExtension = url.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|#|$)/i);
    
    // First, try a HEAD request to check Content-Type
    let isDirectImage = false;
    try {
      const headResponse = await fetch(url, {
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
        console.log('Downloading direct image from URL:', imageUrlToDownload);
        const imageResponse = await fetch(imageUrlToDownload, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8',
            'Referer': url,
          },
        });
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text().catch(() => '');
          console.error('Image download failed:', imageResponse.status, imageResponse.statusText, errorText);
          return NextResponse.json(
            { 
              error: `Failed to download image from URL: ${imageResponse.status} ${imageResponse.statusText}`,
              details: errorText || 'No additional error details'
            },
            { status: 400 }
          );
        }
        
        contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        console.log('Image content type:', contentType);
        
        // Only proceed if it's actually an image
        if (!contentType.startsWith('image/')) {
          return NextResponse.json(
            { 
              error: 'URL does not point to an image file',
              details: `Content-Type is: ${contentType}`
            },
            { status: 400 }
          );
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        console.log('Image downloaded successfully, size:', imageBuffer.length, 'bytes');
        
        // Extract filename from URL (remove query params)
        try {
          const urlObj = new URL(imageUrlToDownload);
          urlFilename = urlObj.pathname.split('/').pop() || 'image.jpg';
          // Remove query params from filename if any got included
          urlFilename = urlFilename.split('?')[0].split('#')[0];
        } catch (urlError) {
          // If URL parsing fails, try to extract from the URL string directly
          const urlParts = url.split('/');
          urlFilename = urlParts[urlParts.length - 1].split('?')[0].split('#')[0] || 'image.jpg';
        }
        
        // Sanitize filename: remove/replace invalid characters for storage
        urlFilename = urlFilename
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
          .replace(/\s+/g, '_') // Replace spaces with underscore
          .replace(/_{2,}/g, '_') // Replace multiple underscores with single
          .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
        
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
        const ogData = await extractOGData(url);
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
        console.log('Downloading OG image from URL:', imageUrlToDownload);
        const imageResponse = await fetch(imageUrlToDownload, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/*,*/*;q=0.8',
            'Referer': url,
          },
        });
        
        if (!imageResponse.ok) {
          const errorText = await imageResponse.text().catch(() => '');
          console.error('OG image download failed:', imageResponse.status, imageResponse.statusText, errorText);
          return NextResponse.json(
            { 
              error: `Failed to download image from page: ${imageResponse.status} ${imageResponse.statusText}`,
              details: errorText || 'No additional error details'
            },
            { status: 400 }
          );
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        console.log('OG image downloaded successfully, size:', imageBuffer.length, 'bytes');
        try {
          const ogImagePath = new URL(imageUrlToDownload).pathname;
          urlFilename = ogImagePath.split('/').pop() || 'image.jpg';
        } catch (urlError) {
          // If URL parsing fails, try to extract from the URL string directly
          const urlParts = imageUrlToDownload.split('/');
          urlFilename = urlParts[urlParts.length - 1].split('?')[0].split('#')[0] || 'image.jpg';
        }
        
        // Sanitize filename: remove/replace invalid characters for storage
        urlFilename = urlFilename
          .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
          .replace(/\s+/g, '_') // Replace spaces with underscore
          .replace(/_{2,}/g, '_') // Replace multiple underscores with single
          .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
      } catch (error: any) {
        console.error('Error extracting/downloading image:', error);
        return NextResponse.json(
          { error: `Failed to extract image from URL: ${error.message || 'Unknown error'}` },
          { status: 400 }
        );
      }
    }

        const filename = `${Date.now()}-${urlFilename}`;

        let fileUrl: string;

    // Use Supabase Storage if configured, otherwise use local filesystem
    // Create client with service role key to bypass RLS
    const supabase = getSupabaseClient();
    if (supabase) {
      const filePath = `images/${filename}`;
      
      console.log('Uploading to Supabase:', {
        bucket: 'media',
        path: filePath,
        size: imageBuffer.length,
        contentType,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        usingServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'not set'
      });
      
      // Test if bucket exists first (but don't fail if check fails - bucket might exist but listBuckets might fail due to permissions)
      try {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
          console.warn('Could not list buckets (this is OK if using service role key):', listError.message);
          // Don't fail here - the bucket might exist but we just can't list it
          // We'll try to upload anyway and let that error be more specific
        } else {
          const mediaBucket = buckets?.find(b => b.name === 'media');
          console.log('Media bucket exists:', !!mediaBucket);
          if (!mediaBucket) {
            console.warn('Media bucket not found in list, but will attempt upload anyway');
            // Don't fail here - try upload and let it fail with a more specific error
          }
        }
      } catch (bucketCheckError) {
        console.warn('Error checking bucket (will attempt upload anyway):', bucketCheckError);
        // Continue with upload attempt
      }
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, imageBuffer, {
          contentType,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Supabase upload error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('File size:', imageBuffer.length, 'bytes');
        console.error('Content type:', contentType);
        console.error('File path:', filePath);
        
        // Provide more helpful error messages
        let errorMessage = error.message || 'Storage upload failed';
        let helpfulMessage = errorMessage;
        
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          helpfulMessage = 'A file with this name already exists. Please try again.';
        } else if (error.message?.includes('not found') || error.message?.includes('bucket')) {
          helpfulMessage = 'Storage bucket "media" not found. Please create it in Supabase Dashboard > Storage.';
        } else if (error.message?.includes('permission') || error.message?.includes('unauthorized') || error.message?.includes('403') || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          helpfulMessage = 'Row Level Security (RLS) policy violation. The anon key is being blocked by RLS policies. Solution: Add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables. Get it from Supabase Dashboard > Settings > API > service_role key.';
        } else if (error.message?.includes('401') || error.message?.includes('JWT')) {
          helpfulMessage = 'Authentication failed. Please check your Supabase credentials (NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY).';
        }
        
        // Log the full error for debugging
        console.error('Full Supabase error object:', {
          message: error.message,
          statusCode: (error as any).statusCode,
          error: (error as any).error,
          name: (error as any).name,
          stack: (error as any).stack
        });
        
        return NextResponse.json(
          { 
            error: 'Failed to upload file to storage',
            message: helpfulMessage,
            originalError: errorMessage,
            details: error.toString(),
            errorCode: (error as any).statusCode || (error as any).code,
            errorName: (error as any).name,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            fileSize: imageBuffer.length,
            contentType,
            troubleshooting: 'If this persists, check: 1) Supabase bucket "media" exists and is public, 2) SUPABASE_SERVICE_ROLE_KEY is set in Vercel, 3) Bucket RLS policies allow uploads'
          },
          { status: 500 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

        fileUrl = publicUrl;
    } else {
      // Fallback to local filesystem for development
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'image');
      await mkdir(uploadDir, { recursive: true });
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, imageBuffer);
          fileUrl = `/uploads/image/${filename}`;
    }

      const media = await prisma.media.create({
        data: {
          title,
          description,
          url: fileUrl,
          type: 'image',
          category: category || 'media',
          platform: platform || null,
        },
      });

    return NextResponse.json(media);
  } catch (error: any) {
    console.error('Error uploading image from URL:', error);
    const errorMessage = error?.message || error?.toString() || 'Internal server error';
    return NextResponse.json(
      { 
        error: 'Error uploading image from URL',
        message: errorMessage,
        details: error?.stack || 'No additional details available'
      },
      { status: 500 }
    );
  }
}

