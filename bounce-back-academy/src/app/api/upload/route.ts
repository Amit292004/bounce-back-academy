import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

    // Upload to Vercel Blob
    const blob = await put(uniqueName, file, {
      access: 'public',
      multipart: true // Recommended for larger files
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error('Vercel Blob Upload Error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload file. Please make sure Vercel Blob is configured.',
      details: error.message 
    }, { status: 500 });
  }
}
