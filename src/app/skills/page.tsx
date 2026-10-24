import React from 'react';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import SkillsClient, { DbPremiumItem } from './SkillsClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Practical Skill Courses – AI Tools, Web Development & Coding | Bounce Back Academy',
  description:
    'Master real-world technical skills beyond textbooks: Artificial Intelligence tools, prompt engineering, modern web engineering, and programming fundamentals with Bounce Back Academy.',
  alternates: {
    canonical: '/skills',
  },
};

export default async function SkillsPage() {
  const premiumItems = await prisma.premiumItem.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  const dbItems: DbPremiumItem[] = premiumItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    price: item.price,
    originalPrice: item.originalPrice,
    imageUrl: item.imageUrl,
    features: item.features,
    className: item.className,
  }));

  return <SkillsClient dbItems={dbItems} />;
}
