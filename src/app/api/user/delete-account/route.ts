import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Get user's reviewed games before deletion
    const userReviews = await prisma.review.findMany({
      where: { userId: user.id },
      select: { gameId: true },
    })

    const affectedGameIds = [...new Set(userReviews.map(r => r.gameId))]

    // Delete user (Cascade will delete all related data: reviews, likes, etc.)
    await prisma.user.delete({
      where: { id: user.id },
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

    console.log(`✅ Deleted account ${session.user.email} and updated ${affectedGameIds.length} games`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { error: '계정 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
