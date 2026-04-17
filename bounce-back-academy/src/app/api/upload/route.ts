import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const publicPath = join(process.cwd(), 'public', 'uploads');
    const filePath = join(publicPath, uniqueName);
    
    try {
      await writeFile(filePath, buffer);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        const fs = require('fs');
        fs.mkdirSync(publicPath, { recursive: true });
        await writeFile(filePath, buffer);
      } else {
        throw e;
      }
    }

    const fileUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
