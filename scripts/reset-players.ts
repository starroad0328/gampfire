import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Resetting currentPlayers for all games...')

  const result = await prisma.game.updateMany({
    data: {
      currentPlayers: 0,
      playersUpdatedAt: null,
    },
  })

  console.log(`✅ Reset ${result.count} games`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
