const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testRecommendations() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'starroad0328@naver.com' }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('🔍 Testing recommendations for:', user.name)
    console.log('User ID:', user.id)

    // Import the recommendation function
    const { getRecommendedGamesForUser } = require('./src/lib/recommendations')

    const result = await getRecommendedGamesForUser(user.id, 10)

    console.log('\n📊 Recommendation Result:')
    console.log('Games returned:', result.games?.length || 0)
    console.log('Has more:', result.hasMore)
    console.log('Error:', result.error || 'None')

    if (result.preferredGenres) {
      console.log('\n🎮 Preferred Genres:', result.preferredGenres)
    }

    if (result.preferredTags) {
      console.log('🏷️  Preferred Tags:', result.preferredTags)
    }

    if (result.games && result.games.length > 0) {
      console.log('\n✅ Recommended Games:')
      result.games.slice(0, 5).forEach((game, i) => {
        console.log(`  ${i + 1}. ${game.title} (${game.recommendReason})`)
      })
    } else {
      console.log('\n❌ No games recommended - investigating...')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testRecommendations()
