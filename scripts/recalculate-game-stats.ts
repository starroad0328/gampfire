import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Recalculating game statistics...')

  // Get all games
  const games = await prisma.game.findMany({
    select: {
      id: true,
      title: true,
      igdbId: true,
      totalReviews: true,
      averageRating: true,
    },
  })

  console.log(`Found ${games.length} games`)

  let updatedCount = 0

  for (const game of games) {
    // Calculate actual statistics from reviews
    const reviews = await prisma.review.findMany({
      where: { gameId: game.id },
      select: { rating: true },
    })

    const totalReviews = reviews.length
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    // Update if different
    if (game.totalReviews !== totalReviews || Math.abs(game.averageRating - averageRating) > 0.01) {
      await prisma.game.update({
        where: { id: game.id },
        data: {
          totalReviews,
          averageRating,
        },
      })

      console.log(`✅ Updated ${game.title}: ${game.totalReviews} → ${totalReviews} reviews, ${game.averageRating.toFixed(2)} → ${averageRating.toFixed(2)} rating`)
      updatedCount++
    }
  }

  console.log(`✅ Recalculation complete! Updated ${updatedCount} games`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
