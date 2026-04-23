const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const papers = await prisma.questionPaper.findMany({
    select: { id: true, title: true, className: true }
  });
  console.log('Papers in DB:', papers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
