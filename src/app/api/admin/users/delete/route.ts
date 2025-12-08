import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL?.trim()) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent deleting own account
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (userToDelete?.email === session.user.email) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get user's reviewed games and email before deletion
    const userWithReviews = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        reviews: { select: { gameId: true } },
      },
    })

    if (!userWithReviews) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const affectedGameIds = [...new Set(userWithReviews.reviews.map(r => r.gameId))]

    // Save deleted email to prevent re-registration
    await prisma.deletedEmail.upsert({
      where: { email: userWithReviews.email },
      update: { deletedAt: new Date() },
      create: { email: userWithReviews.email },
    })

    // Delete user (Cascade will delete all related data: reviews, likes, etc.)
    await prisma.user.delete({
      where: { id: userId },
    })

    // Recalculate statistics for affected games
    for (const gameId of affectedGameIds) {
      const reviews = await prisma.review.findMany({
        where: { gameId },
        select: { rating: true },
      })

      const totalReviews = reviews.length
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0

      await prisma.game.update({
        where: { id: gameId },
        data: { totalReviews, averageRating },
      })
    }

    console.log(`✅ Deleted user and updated ${affectedGameIds.length} games`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
