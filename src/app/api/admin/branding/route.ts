import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const branding = await prisma.branding.findFirst();
    return NextResponse.json(branding || {});
  } catch {
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id: dataId, updatedAt, ...cleanData } = await request.json();
    const existing = await prisma.branding.findFirst();

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
  } catch {
    return NextResponse.json({ error: 'Failed to save branding' }, { status: 500 });
  }
}
