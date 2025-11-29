import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log('🔍 Session data:', JSON.stringify(session, null, 2))

    if (!session?.user?.id) {
      console.log('❌ No session or user ID')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { gameId, rating, comment, priceRating, graphicsRating, controlRating, directionRating, storyRating, soundRating, volumeRating, innovationRating } = body

    console.log('📝 Review data:', { gameId, userId: session.user.id, rating, comment, priceRating, graphicsRating, controlRating, directionRating, storyRating, soundRating, volumeRating, innovationRating })

    // Validation
    if (!gameId || typeof gameId !== 'string') {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    if (!rating || typeof rating !== 'number' || rating < 0.5 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 0.5 and 5' },
        { status: 400 }
      )
    }

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if user already reviewed this game
    const existingReview = await prisma.review.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: session.user.id,
        },
      },
    })

    let review: any

    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment || null,
          label: getRatingLabel(rating),
          // 세부 평가
          priceRating: priceRating || null,
          graphicsRating: graphicsRating || null,
          controlRating: controlRating || null,
          directionRating: directionRating || null,
          storyRating: storyRating || null,
          soundRating: soundRating || null,
          volumeRating: volumeRating || null,
          innovationRating: innovationRating || null,
        },
      })
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          gameId,
          userId: session.user.id,
          rating,
          comment: comment || null,
          label: getRatingLabel(rating),
          // 세부 평가
          priceRating: priceRating || null,
          graphicsRating: graphicsRating || null,
          controlRating: controlRating || null,
          directionRating: directionRating || null,
          storyRating: storyRating || null,
          soundRating: soundRating || null,
          volumeRating: volumeRating || null,
          innovationRating: innovationRating || null,
        },
      })

      // Create notifications for followers (only for new reviews)
      const followers = await prisma.follow.findMany({
        where: { followingId: session.user.id },
        select: { followerId: true },
      })

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: { title: true },
      })

      if (followers.length > 0 && game) {
        await prisma.notification.createMany({
          data: followers.map(f => ({
            userId: f.followerId,
            type: 'REVIEW',
            message: `${session.user.name || session.user.email}님이 "${game.title}"에 평가를 남겼습니다`,
            actorId: session.user.id,
            gameId,
            reviewId: review.id,
          })),
        })

        console.log(`✅ Created ${followers.length} notifications for new review`)
      }
    }

    // Update game statistics
    await updateGameStats(gameId)

    return NextResponse.json({
      success: true,
      review,
    })
  } catch (error) {
    console.error('Review create error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get rating label
function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return '매우 긍정적'
  if (rating >= 3.5) return '긍정적'
  if (rating >= 2.5) return '혼합'
  if (rating >= 1.5) return '부정적'
  return '매우 부정적'
}

// Helper function to update game statistics
async function updateGameStats(gameId: string) {
  const stats = await prisma.review.aggregate({
    where: { gameId },
    _avg: { rating: true },
    _count: { id: true },
  })

  const verifiedCount = await prisma.review.count({
    where: {
      gameId,
      isVerified: true,
    },
  })

  await prisma.game.update({
    where: { id: gameId },
    data: {
      averageRating: stats._avg.rating || 0,
      totalReviews: stats._count.id,
      verifiedReviews: verifiedCount,
    },
  })
}
