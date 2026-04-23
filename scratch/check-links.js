
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLinks() {
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  console.log("Latest Notes Links:");
  notes.forEach(note => {
    console.log(`- Title: ${note.title}`);
    console.log(`  URL: ${note.viewUrl}`);
  });
  
  await prisma.$disconnect();
}

checkLinks();
