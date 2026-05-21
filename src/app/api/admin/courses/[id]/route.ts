import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // Next.js 15: params must be awaited before accessing properties.
    const { id } = await context.params;
    // Delete the course
    await (prisma as any).course.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    
    const { name, imageUrl, caption } = body;
    
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (caption !== undefined) data.caption = caption;

    const course = await (prisma as any).course.update({
      where: { id },
      data
    });
    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}
