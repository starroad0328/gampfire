import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Force reload environment variables
config({ path: '.env.local', override: true })
config({ path: '.env', override: false })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Always create new instance in development to pick up environment changes
const createPrismaClient = () => new PrismaClient({
  log: ['query', 'error', 'warn']
})

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
