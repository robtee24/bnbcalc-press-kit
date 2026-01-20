import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    if (!token || !verifyToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabase) {
      return NextResponse.json({
        error: 'Supabase not configured',
        details: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      }, { status: 500 });
    }

    // Test bucket access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      return NextResponse.json({
        error: 'Failed to list buckets',
        message: listError.message,
        details: JSON.stringify(listError)
      }, { status: 500 });
    }

    const mediaBucket = buckets?.find(b => b.name === 'media');
    
    if (!mediaBucket) {
      return NextResponse.json({
        error: 'Media bucket not found',
        availableBuckets: buckets?.map(b => b.name) || [],
        instructions: 'Please create a bucket named "media" in Supabase Dashboard > Storage'
      }, { status: 404 });
    }

    // Test upload with a small test file
    const testContent = Buffer.from('test');
    const testPath = `test/${Date.now()}-test.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });

    if (uploadError) {
      // Try to clean up if upload failed
      await supabase.storage.from('media').remove([testPath]).catch(() => {});
      
      return NextResponse.json({
        error: 'Upload test failed',
        message: uploadError.message,
        details: JSON.stringify(uploadError),
        bucketInfo: {
          name: mediaBucket.name,
          id: mediaBucket.id,
          public: mediaBucket.public,
        },
        troubleshooting: [
          '1. Make sure the bucket is set to "Public" in Supabase Dashboard',
          '2. Check RLS policies allow INSERT operations',
          '3. Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables',
          '4. Verify the service role key has storage access'
        ]
      }, { status: 500 });
    }

    // Clean up test file
    await supabase.storage.from('media').remove([testPath]).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Storage is configured correctly',
      bucketInfo: {
        name: mediaBucket.name,
        id: mediaBucket.id,
        public: mediaBucket.public,
      },
      testUpload: 'Successfully uploaded and deleted test file'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      details: error?.toString()
    }, { status: 500 });
  }
}



