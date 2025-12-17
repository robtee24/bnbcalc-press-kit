import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Create Supabase client with service role key for server-side storage operations (bypasses RLS)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category') || 'media';

    const where: any = { category };
    if (type) {
      where.type = type;
    }

    const media = await prisma.media.findMany({
      where,
      orderBy: [
        { platform: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const category = formData.get('category') as string || 'media';
    const platform = formData.get('platform') as string || null;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'File and type are required' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name}`;
    let url: string;

    // Use Supabase Storage if configured, otherwise use local filesystem (for development)
    // Create client with service role key to bypass RLS
    const supabase = getSupabaseClient();
    if (supabase) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${type}s/${filename}`;
      
      console.log('Uploading to Supabase:', {
        bucket: 'media',
        path: filePath,
        size: buffer.length,
        contentType: file.type,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });

      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
          cacheControl: '3600',
        });

      if (error) {
        console.error('Supabase upload error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Provide more helpful error messages
        let errorMessage = error.message || 'Storage upload failed';
        if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          errorMessage = 'Row Level Security (RLS) policy violation. Please ensure SUPABASE_SERVICE_ROLE_KEY is set in Vercel environment variables.';
        } else if (error.message?.includes('permission') || error.message?.includes('unauthorized') || error.message?.includes('403')) {
          errorMessage = 'Permission denied. Please check Supabase storage bucket permissions and RLS policies.';
        } else if (error.message?.includes('not found') || error.message?.includes('bucket')) {
          errorMessage = 'Storage bucket "media" not found. Please create it in Supabase Dashboard > Storage.';
        }
        
        return NextResponse.json(
          { 
            error: 'Failed to upload file to storage',
            message: errorMessage,
            details: error.toString(),
            errorCode: (error as any).statusCode || (error as any).code,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
          },
          { status: 500 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      url = publicUrl;
    } else {
      // Fallback to local filesystem for development
      const uploadDir = join(process.cwd(), 'public', 'uploads', type);
      await mkdir(uploadDir, { recursive: true });
      const filepath = join(uploadDir, filename);
      await writeFile(filepath, buffer);
      url = `/uploads/${type}/${filename}`;
    }

    const media = await prisma.media.create({
      data: {
        title: title || file.name,
        description: description || null,
        url,
        type,
        category,
        platform: platform || null,
      },
    });

    return NextResponse.json(media);
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error?.message || 'An unexpected error occurred',
        details: error?.toString() || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

