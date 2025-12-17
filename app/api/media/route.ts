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
      
      const { data, error } = await supabase.storage
        .from('media')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return NextResponse.json(
          { error: 'Failed to upload file to storage', message: error.message || 'Storage upload failed' },
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

