import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getGameById, convertIGDBGame } from '@/lib/igdb'
import { prisma } from '@/lib/prisma'

interface RatingData {
  gameId: number
  rating: number
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

export async function DELETE(request: Request) {
  try {
    const { gameId } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Find the game in database
    const game = await prisma.game.findUnique({
      where: { igdbId: gameId },
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Delete the review
    await prisma.review.deleteMany({
      where: {
        gameId: game.id,
        userId: userId,
      },
    })

    // Update game statistics
    await updateGameStats(game.id)

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Delete rating error:', error)
    return NextResponse.json(
      { error: 'Failed to delete rating' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { ratings } = await request.json()

    if (!Array.isArray(ratings) || ratings.length === 0) {
      return NextResponse.json(
        { error: 'Invalid ratings data' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Process each rating
    const processedRatings: RatingData[] = []

    for (const rating of ratings) {
      const { gameId, rating: score } = rating

      if (typeof gameId !== 'number' || typeof score !== 'number') {
        continue
      }

      // Validate rating range (0.5 to 5.0)
      if (score < 0.5 || score > 5.0) {
        continue
      }

      processedRatings.push({ gameId, rating: score })

      // Check if game exists in database, if not, fetch from IGDB and create
      try {
        const igdbGame = await getGameById(gameId)
        if (!igdbGame) {
          console.error(`Game ${gameId} not found in IGDB`)
          continue
        }

        const converted = await convertIGDBGame(igdbGame)

        // Upsert game in database
        const game = await prisma.game.upsert({
          where: { igdbId: gameId },
          create: {
            title: converted.title,
            description: converted.description,
            coverImage: converted.coverImage,
            releaseDate: converted.releaseDate,
            platforms: converted.platforms,
            genres: converted.genres,
            developer: converted.developer,
            publisher: converted.publisher,
            igdbId: gameId,
            metacriticScore: converted.metacriticScore,
          },
          update: {
            title: converted.title,
            description: converted.description,
            coverImage: converted.coverImage,
            releaseDate: converted.releaseDate,
            platforms: converted.platforms,
            genres: converted.genres,
            developer: converted.developer,
            publisher: converted.publisher,
            metacriticScore: converted.metacriticScore,
          },
        })

        // Create or update review for this game
        const label = getRatingLabel(score)

        await prisma.review.upsert({
          where: {
            gameId_userId: {
              gameId: game.id,
              userId: userId,
            },
          },
          create: {
            gameId: game.id,
            userId: userId,
            rating: score,
            label: label,
            comment: null, // 온보딩에서는 코멘트 없음
          },
          update: {
            rating: score,
            label: label,
          },
        })

        // Update game statistics
        await updateGameStats(game.id)
      } catch (error) {
        console.error(`Failed to process game ${gameId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      count: processedRatings.length,
      message: `Successfully saved ${processedRatings.length} ratings`,
    })
  } catch (error) {
    console.error('Onboarding ratings error:', error)
    return NextResponse.json(
      { error: 'Failed to save ratings' },
      { status: 500 }
    )
  }
}
