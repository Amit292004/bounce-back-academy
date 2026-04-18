import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

let prisma: ReturnType<typeof prismaClientSingleton>;
try {
  prisma = globalThis.prismaGlobal ?? prismaClientSingleton()
} catch (e) {
  console.error("CRITICAL PRISMA ERROR:", e);
  prisma = {} as ReturnType<typeof prismaClientSingleton>; // Fallback to avoid total crash
}

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
