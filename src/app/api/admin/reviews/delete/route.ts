import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL?.trim()
    if (session.user.email.trim() !== adminEmail) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { reviewId } = await request.json()

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      )
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { game: true },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    })

    // Update game statistics
    const stats = await prisma.review.aggregate({
      where: { gameId: review.gameId },
      _avg: { rating: true },
      _count: { id: true },
    })

    const verifiedCount = await prisma.review.count({
      where: {
        gameId: review.gameId,
        isVerified: true,
      },
    })

    await prisma.game.update({
      where: { id: review.gameId },
      data: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id,
        verifiedReviews: verifiedCount,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Admin review delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
