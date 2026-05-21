const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const courses = await prisma.course.findMany();
  console.log("Courses:", courses);
  const papers = await prisma.questionPaper.findMany({ select: { className: true }, distinct: ['className'] });
  console.log("Paper classes:", papers);
}
main().catch(console.error).finally(() => prisma.$disconnect());
