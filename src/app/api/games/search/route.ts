import { NextRequest, NextResponse } from 'next/server'
import { searchGames, convertIGDBGame, filterMainGamesOnly } from '@/lib/igdb'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (uses searchParams)
export const dynamic = 'force-dynamic'

// 1분마다 캐시 갱신 (검색은 짧게)
export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // 1. 먼저 우리 DB에서 pg_trgm으로 검색 (빠르고 정확)
    const dbResults = await prisma.$queryRaw<Array<{
      id: string
      title: string
      coverImage: string | null
      igdbId: number | null
      genres: string
      platforms: string
      releaseDate: Date | null
      averageRating: number
      totalReviews: number
      similarity: number
    }>>`
      SELECT
        id, title, "coverImage", "igdbId", genres, platforms, "releaseDate",
        "averageRating", "totalReviews",
        similarity(title, ${query}) as similarity
      FROM "Game"
      WHERE title ILIKE ${'%' + query + '%'}
      ORDER BY similarity(title, ${query}) DESC, "totalReviews" DESC
      LIMIT 20
    `

    console.log(`DB 검색: ${dbResults.length}개 결과 (similarity 기반)`)

    // 2. DB 결과 변환
    let allResults = dbResults.map(game => ({
      id: game.igdbId || 0,
      title: game.title,
      coverImage: game.coverImage,
      genres: game.genres ? JSON.parse(game.genres) : [],
      platforms: game.platforms ? JSON.parse(game.platforms) : [],
      releaseDate: game.releaseDate,
      averageRating: game.averageRating,
      totalReviews: game.totalReviews,
      fromDB: true,
      similarity: game.similarity,
    }))

    // 3. DB 결과가 10개 미만이면 IGDB에서 보충
    if (dbResults.length < 10) {
      console.log(`DB 결과 부족 (${dbResults.length}개), IGDB에서 보충...`)

      const igdbGames = await searchGames(query, 50)
      const mainGames = filterMainGamesOnly(igdbGames)

      // 이미 DB에 있는 게임 제외
      const dbIgdbIds = new Set(dbResults.map(g => g.igdbId).filter(Boolean))
      const newIgdbGames = mainGames.filter(g => !dbIgdbIds.has(g.id))

      console.log(`IGDB 검색: ${mainGames.length}개 → 새로운 게임 ${newIgdbGames.length}개`)

      // IGDB 게임들의 점수 계산
      const igdbWithScore = newIgdbGames.map(game => {
        let score = 0
        if (game.rating_count) score += Math.log10(game.rating_count + 1) * 10 * 0.5
        if ((game as any).follows) score += Math.log10((game as any).follows + 1) * 10 * 0.3
        return { game, score }
      })

      const sortedIgdb = igdbWithScore
        .filter(g => g.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)

      // IGDB 결과를 변환해서 추가
      const igdbResults = await Promise.all(
        sortedIgdb.map(async ({ game }) => {
          const converted = await convertIGDBGame(game)
          return {
            id: game.id,
            title: converted.title,
            coverImage: converted.coverImage,
            genres: JSON.parse(converted.genres),
            platforms: JSON.parse(converted.platforms),
            releaseDate: converted.releaseDate,
            averageRating: 0,
            totalReviews: 0,
            fromDB: false,
            similarity: 0,
          }
        })
      )

      allResults = [...allResults, ...igdbResults]
    }

    console.log(`최종 검색 결과: ${allResults.length}개 (DB: ${dbResults.length}, IGDB: ${allResults.length - dbResults.length})`)

    return NextResponse.json({ games: allResults })
  } catch (error) {
    console.error('Game search error:', error)
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    )
  }
}
