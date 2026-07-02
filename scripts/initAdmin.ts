import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || "file:./dev.db"
})

async function main() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  if (!username || !password) {
    console.error('Error: ADMIN_USERNAME and ADMIN_PASSWORD environment variables must be set.')
    process.exit(1)
  }

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
