import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get gameId from query params
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json(
        { error: 'Game ID is required' },
        { status: 400 }
      )
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: session.user.id,
        },
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: review.id },
    })

    // Update game statistics
    await updateGameStats(gameId)

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Review delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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
