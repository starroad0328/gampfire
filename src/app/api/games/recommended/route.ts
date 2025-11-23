import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPopularGames, convertIGDBGame } from '@/lib/igdb'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '25')

    console.log(`[API] Fetching recommended games for user ${session.user.id}`)

    // 1. 사용자가 평가한 게임들 조회
    const userReviews = await prisma.review.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        game: true,
      },
    })

    console.log(`[API] User has reviewed ${userReviews.length} games`)

    // 평가한 게임이 없으면 인기 게임 반환
    if (userReviews.length === 0) {
      console.log('[API] No reviews found, returning popular games')
      const games = await getPopularGames(limit, offset)

      const convertedGames = await Promise.all(
        games.map(async (game) => {
          const converted = await convertIGDBGame(game)
          return {
            id: game.id,
            ...converted,
            genres: converted.genres ? JSON.parse(converted.genres) : [],
            platforms: converted.platforms ? JSON.parse(converted.platforms) : [],
            averageRating: 0,
            totalReviews: 0,
          }
        })
      )

      return NextResponse.json({
        games: convertedGames,
        hasMore: convertedGames.length === limit,
      })
    }

    // 2. 장르 분석: 평가한 게임들의 장르를 카운트
    const genreCount: Record<string, number> = {}

    for (const review of userReviews) {
      if (review.game.genres) {
        const genres = JSON.parse(review.game.genres) as string[]
        for (const genre of genres) {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        }
      }
    }

    console.log('[API] Genre analysis:', genreCount)

    // 3. 가장 많이 평가한 장르 상위 3개 추출
    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre)

    console.log('[API] Top 3 preferred genres:', topGenres)

    // 장르가 없으면 인기 게임 반환
    if (topGenres.length === 0) {
      console.log('[API] No genres found, returning popular games')
      const games = await getPopularGames(limit, offset)

      const convertedGames = await Promise.all(
        games.map(async (game) => {
          const converted = await convertIGDBGame(game)
          return {
            id: game.id,
            ...converted,
            genres: converted.genres ? JSON.parse(converted.genres) : [],
            platforms: converted.platforms ? JSON.parse(converted.platforms) : [],
            averageRating: 0,
            totalReviews: 0,
          }
        })
      )

      return NextResponse.json({
        games: convertedGames,
        hasMore: convertedGames.length === limit,
      })
    }

    // 4. 선호 장르에 맞는 게임 검색
    const games = await getPopularGames(limit * 2, offset, topGenres)
    console.log(`[API] Fetched ${games.length} games from IGDB with preferred genres`)

    // 5. 이미 평가한 게임 ID 목록
    const reviewedGameIds = new Set(userReviews.map(r => r.game.igdbId))

    // 6. 이미 평가한 게임 제외
    const filteredGames = games.filter(game => !reviewedGameIds.has(game.id))
    console.log(`[API] Filtered out reviewed games: ${games.length} -> ${filteredGames.length}`)

    // 7. limit 개수만큼 자르기
    const limitedGames = filteredGames.slice(0, limit)

    // 8. DB에서 평점 정보 가져오기
    const igdbIds = limitedGames.map(game => game.id)
    let dbGames: { igdbId: number; averageRating: number; totalReviews: number }[] = []

    try {
      dbGames = await prisma.game.findMany({
        where: {
          igdbId: { in: igdbIds }
        },
        select: {
          igdbId: true,
          averageRating: true,
          totalReviews: true,
        }
      })
      console.log(`[API] Loaded ratings for ${dbGames.length}/${limitedGames.length} games from DB`)
    } catch (error) {
      console.error('DB batch query error:', error)
    }

    // 평점 맵 생성
    const ratingsMap = new Map(
      dbGames.map(game => [game.igdbId, { averageRating: game.averageRating, totalReviews: game.totalReviews }])
    )

    // 9. 게임 변환 및 평점 정보 추가
    const convertedGames = await Promise.all(
      limitedGames.map(async (game) => {
        const converted = await convertIGDBGame(game)
        const ratings = ratingsMap.get(game.id)

        return {
          id: game.id,
          ...converted,
          genres: converted.genres ? JSON.parse(converted.genres) : [],
          platforms: converted.platforms ? JSON.parse(converted.platforms) : [],
          averageRating: ratings?.averageRating || 0,
          totalReviews: ratings?.totalReviews || 0,
        }
      })
    )

    console.log(`[API] Returning ${convertedGames.length} recommended games`)

    return NextResponse.json({
      games: convertedGames,
      hasMore: filteredGames.length > limit,
      preferredGenres: topGenres, // 디버깅용
    })
  } catch (error) {
    console.error('Recommended games error:', error)
    return NextResponse.json(
      { games: [], hasMore: false, error: 'Failed to fetch recommended games' },
      { status: 500 }
    )
  }
}
