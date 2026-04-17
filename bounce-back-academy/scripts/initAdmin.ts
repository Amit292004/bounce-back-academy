import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || "file:./dev.db"
})

async function main() {
  const username = process.env.ADMIN_USERNAME || 'Amitsharmabouncebackacademy@2026'
  const password = process.env.ADMIN_PASSWORD || 'Amitsharmanagalanduniversity@2027'

  const existingAdmin = await prisma.admin.findUnique({
    where: { username }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.admin.create({
      data: {
        username,
        password: hashedPassword
      }
    })
    console.log('Admin created successfully.')
  } else {
    console.log('Admin already exists.')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
