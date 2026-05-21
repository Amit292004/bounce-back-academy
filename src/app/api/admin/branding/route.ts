import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    if (prisma && prisma.branding) {
      const branding = await prisma.branding.findFirst();
      return NextResponse.json(branding || {});
    }
    return NextResponse.json({});
  } catch {
    // Branding is optional — return empty object so callers can gracefully degrade
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!prisma || !prisma.branding) {
      throw new Error('Database client not initialized');
    }

    const existing = await prisma.branding.findFirst();

    const cleanData = {
      siteLogo: data.siteLogo !== undefined ? data.siteLogo : null,
      adminPhoto: data.adminPhoto !== undefined ? data.adminPhoto : null,
      whatsappMessage: data.whatsappMessage !== undefined ? data.whatsappMessage : null,
      whatsappImageUrl: data.whatsappImageUrl !== undefined ? data.whatsappImageUrl : null,
      adMessage: data.adMessage !== undefined ? data.adMessage : null,
      adImageUrl: data.adImageUrl !== undefined ? data.adImageUrl : null,
    };

    let branding;
    if (existing) {
      branding = await prisma.branding.update({
        where: { id: existing.id },
        data: cleanData,
      });
    } else {
      branding = await prisma.branding.create({ data: cleanData });
    }

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Branding save error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
