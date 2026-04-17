import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { year: 'desc' }
    });
    return NextResponse.json(years);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch years' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { year } = await request.json();
    if (!year) return NextResponse.json({ error: 'Year is required' }, { status: 400 });

    const newYear = await prisma.academicYear.create({
      data: { year }
    });
    return NextResponse.json(newYear);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create year' }, { status: 500 });
  }
}
