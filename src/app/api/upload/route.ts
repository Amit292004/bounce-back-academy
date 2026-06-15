import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { put } from '@vercel/blob';
import { logger } from '@/lib/logger'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPDF) {
      // --- VERCEL BLOB FOR PDFs ---
      const blob = await put(file.name, file, {
        access: 'public',
      });
      console.log('--- VERCEL BLOB UPLOAD SUCCESS ---');
      return NextResponse.json({ url: blob.url });
    } else {
      // --- CLOUDINARY FOR IMAGES/VIDEOS ---
      // Convert file to base64 for Cloudinary
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

      // Sanitize filename for Cloudinary public_id
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const sanitizedName = fileNameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueFileName = `${sanitizedName}-${Date.now()}`;
      
      const result = await cloudinary.uploader.upload(base64File, {
        folder: 'bba_uploads',
        resource_type: 'auto', // Use auto to let Cloudinary decide
        public_id: uniqueFileName,
        use_filename: true,
        unique_filename: false
      });

      console.log('--- CLOUDINARY UPLOAD SUCCESS ---');
      return NextResponse.json({ url: result.secure_url || result.url });
    }
  } catch (error: any) {
    logger.error('--- UPLOAD ERROR ---', error);
    
    return NextResponse.json({ 
      error: error.message || 'Upload Failed',
      details: error.error?.message || error.message 
    }, { status: 500 });
  }
}

