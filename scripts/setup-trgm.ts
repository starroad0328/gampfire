import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Setting up pg_trgm extension...')

  // Enable pg_trgm extension
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm;`
  console.log('✅ pg_trgm extension enabled')

  // Create GIN index on title
  await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS game_title_trgm_idx ON "Game" USING gin (title gin_trgm_ops);`
  console.log('✅ GIN index created on Game.title')

  console.log('🎉 Setup complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
