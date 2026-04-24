import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing course ordering...');
  
  const defaultClasses = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'CUET', 'JEE', 'NEET'];
  
  // Set a base date from 2020 so they are definitely older than any custom ones
  let baseDate = new Date('2020-01-01T00:00:00Z');

  for (let i = 0; i < defaultClasses.length; i++) {
    const className = defaultClasses[i];
    // Add minutes to keep them ordered relative to each other
    const createdAt = new Date(baseDate.getTime() + i * 60000); 
    
    await prisma.course.updateMany({
      where: { name: className },
      data: { createdAt }
    });
    console.log(`Updated ${className} createdAt to ${createdAt}`);
  }

  console.log('Ordering fixed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
