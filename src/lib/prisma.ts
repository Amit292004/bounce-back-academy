import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

// Use event-based logging so DB errors go to stdout without triggering
// the Next.js dev error overlay (which fires on console.error calls).
const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn',  emit: 'event' },
    ],
  })

  client.$on('error' as never, (e: Prisma.LogEvent) => {
    process.stdout.write(`[prisma:error] ${e.message}\n`)
  })
  client.$on('warn' as never, (e: Prisma.LogEvent) => {
    process.stdout.write(`[prisma:warn]  ${e.message}\n`)
  })

  return client
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
