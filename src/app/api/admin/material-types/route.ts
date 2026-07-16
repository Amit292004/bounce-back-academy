import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let types = await prisma.materialType.findMany({
      orderBy: { name: 'asc' }
    });

    // Ensure default ones have the correct short user-friendly names
    const checkNames = [
      { code: 'NOTE', name: 'Study Notes' },
      { code: 'PYQ', name: 'Board PYQ' },
      { code: 'COURSE', name: 'Full Course' },
      { code: 'LECTURE', name: 'Lecture' }
    ];

    let checkChanged = false;
    for (const cn of checkNames) {
      const existing = await prisma.materialType.findUnique({
        where: { code: cn.code }
      });
      if (existing) {
        if (existing.name !== cn.name) {
          await prisma.materialType.update({
            where: { code: cn.code },
            data: { name: cn.name }
          });
          checkChanged = true;
        }
      } else {
        await prisma.materialType.create({
          data: { name: cn.name, code: cn.code }
        });
        checkChanged = true;
      }
    }

    if (checkChanged || types.length === 0) {
      types = await prisma.materialType.findMany({
        orderBy: { name: 'asc' }
      });
    }

    return NextResponse.json(types);
  } catch (error) {
    logger.error('Failed to fetch material types:', error);
    return NextResponse.json({ error: 'Failed to fetch material types' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    // Generate code from name, e.g. "Mock Tests" -> "MOCK_TESTS"
    const code = trimmedName
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '');

    if (!code) {
      return NextResponse.json({ error: 'Invalid name for generating code' }, { status: 400 });
    }

    const existing = await prisma.materialType.findFirst({
      where: {
        OR: [
          { name: trimmedName },
          { code }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Material type already exists' }, { status: 400 });
    }

    const newType = await prisma.materialType.create({
      data: {
        name: trimmedName,
        code
      }
    });

    return NextResponse.json(newType);
  } catch (error) {
    logger.error('Failed to create material type:', error);
    return NextResponse.json({ error: 'Failed to create material type' }, { status: 500 });
  }
}
