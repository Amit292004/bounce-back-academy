const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const existing = await prisma.branding.findFirst();
    const cleanData = { adMessage: "Test", adImageUrl: "Test" };
    if (existing) {
      console.log("Updating existing:", existing.id);
      await prisma.branding.update({
        where: { id: existing.id },
        data: cleanData
      });
      console.log("Updated!");
    } else {
      console.log("Creating new");
      await prisma.branding.create({ data: cleanData });
      console.log("Created!");
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
test();
