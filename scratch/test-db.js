const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Initializing Prisma Client with IPv4 and no SSL...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.xupavgfnakjgeeqtcjpz:AmitSharma2027@52.65.247.42:5432/postgres?sslmode=disable"
      }
    }
  });

  try {
    console.log('Sending raw query SELECT 1...');
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('SUCCESS: Connected to database via IPv4 without SSL! Query result:', result);
  } catch (err) {
    console.error('FAILED: Prisma connection error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
