import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (uses searchParams)
export const dynamic = 'force-dynamic'

/**
 * Get hot games based on Steam concurrent players
 * These are games with highest current player count on Steam
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '25')

    // DB에서 동시 접속자 수가 높은 게임들 조회
    const hotGames = await prisma.game.findMany({
      where: {
        currentPlayers: { gt: 0 },
        igdbId: { not: null },
      },
      orderBy: { currentPlayers: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        coverImage: true,
        igdbId: true,
        genres: true,
        platforms: true,
        releaseDate: true,
        averageRating: true,
        totalReviews: true,
        currentPlayers: true,
        playersUpdatedAt: true,
      },
    })

    // 다음 페이지 존재 여부 확인
    const totalCount = await prisma.game.count({
      where: {
        currentPlayers: { gt: 0 },
        igdbId: { not: null },
      },
    })

    const games = hotGames.map(game => ({
      id: game.igdbId,
      title: game.title,
      coverImage: game.coverImage,
      genres: game.genres ? JSON.parse(game.genres) : [],
      platforms: game.platforms ? JSON.parse(game.platforms) : [],
      releaseDate: game.releaseDate,
      averageRating: game.averageRating,
      totalReviews: game.totalReviews,
      currentPlayers: game.currentPlayers,
      isHot: true, // 프론트엔드에서 🔥 뱃지 표시용
    }))

    return NextResponse.json({
      games,
      hasMore: offset + limit < totalCount,
      total: totalCount,
    })
  } catch (error) {
    console.error('Hot games error:', error)
    return NextResponse.json(
      { games: [], hasMore: false, error: 'Failed to fetch hot games' },
      { status: 500 }
    )
  }
}
