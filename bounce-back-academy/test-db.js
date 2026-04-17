const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log("Testing connection with DATABASE_URL:", process.env.DATABASE_URL);
  try {
    const start = Date.now();
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    const end = Date.now();
    console.log(`✅ CONNECTED SUCCESSFULLY in ${end - start}ms!`);
    console.log("Result:", result);
  } catch (e) {
    console.error("❌ CONNECTION FAILED!");
    console.error("Error Code:", e.code);
    console.error("Error Message:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
