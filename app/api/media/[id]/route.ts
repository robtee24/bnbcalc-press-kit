import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { title, description, platform } = await request.json();

    const media = await prisma.media.update({
      where: { id },
      data: {
        title,
        description,
        platform: platform || null,
      },
    });

    return NextResponse.json(media);
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (media) {
      // Delete file from storage
      if (supabase && media.url.startsWith('http')) {
        // Supabase Storage URL
        try {
          const urlParts = new URL(media.url);
          const filePath = urlParts.pathname.split('/storage/v1/object/public/media/')[1];
          if (filePath) {
            await supabase.storage.from('media').remove([filePath]);
          }
        } catch (error) {
          console.error('Error deleting file from Supabase:', error);
        }
      } else {
        // Local filesystem
        const filepath = join(process.cwd(), 'public', media.url);
        try {
          await unlink(filepath);
        } catch (error) {
          console.error('Error deleting file:', error);
        }
      }

      // Delete from database
      await prisma.media.delete({
        where: { id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

