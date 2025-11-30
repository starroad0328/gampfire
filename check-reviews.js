const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkReviews() {
  try {
    // starroad0328 이메일로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: 'starroad0328@naver.com' },
      include: {
        reviews: {
          include: {
            game: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', user.name, `(${user.email})`)
    console.log('📊 Total reviews:', user.reviews.length)

    if (user.reviews.length > 0) {
      console.log('\n📝 Recent reviews:')
      user.reviews.slice(0, 5).forEach((review, i) => {
        console.log(`  ${i + 1}. ${review.game.title} - Rating: ${review.rating}`)
      })
    } else {
      console.log('\n⚠️  No reviews found. User needs to rate games to get recommendations.')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkReviews()
