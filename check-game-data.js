const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkGameData() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'starroad0328@naver.com' },
      include: {
        reviews: {
          include: {
            game: true
          },
          take: 5
        }
      }
    })

    console.log('📊 Checking game data for reviewed games:\n')

    user.reviews.forEach((review, i) => {
      const game = review.game
      console.log(`${i + 1}. ${game.title}`)
      console.log(`   - igdbId: ${game.igdbId}`)
      console.log(`   - genres: ${game.genres ? 'Yes' : 'No'}`)
      console.log(`   - tags: ${game.tags ? 'Yes' : 'No'}`)

      if (game.genres) {
        try {
          const genres = JSON.parse(game.genres)
          console.log(`   - Genres: ${genres.join(', ')}`)
        } catch (e) {
          console.log(`   - Genres parse error`)
        }
      }

      if (game.tags) {
        try {
          const tags = JSON.parse(game.tags)
          console.log(`   - Tags: ${tags.slice(0, 3).join(', ')}...`)
        } catch (e) {
          console.log(`   - Tags parse error`)
        }
      }
      console.log('')
    })

    // Check total games in DB with tags
    const gamesWithTags = await prisma.game.count({
      where: {
        tags: { not: null }
      }
    })

    const gamesWithGenres = await prisma.game.count({
      where: {
        genres: { not: null }
      }
    })

    console.log(`\n📈 Database Stats:`)
    console.log(`   - Games with genres: ${gamesWithGenres}`)
    console.log(`   - Games with tags: ${gamesWithTags}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkGameData()
