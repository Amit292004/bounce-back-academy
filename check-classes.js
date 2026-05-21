const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const classes = await prisma.questionPaper.findMany({
    select: { className: true },
    distinct: ['className']
  });
  console.log(classes);
}
main().catch(console.error).finally(() => prisma.$disconnect());
