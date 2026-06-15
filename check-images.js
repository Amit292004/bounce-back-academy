const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const items = await prisma.premiumItem.findMany();
  console.log("Images:", items.map(r => r.imageUrl));
  await prisma.$disconnect();
}
check();
