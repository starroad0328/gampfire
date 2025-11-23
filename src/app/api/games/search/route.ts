import { NextRequest, NextResponse } from 'next/server'
import { searchGames, convertIGDBGame, filterMainGamesOnly } from '@/lib/igdb'

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

    const igdbGames = await searchGames(query, 50)

    // 1. 본편 게임만 필터링 - DLC/에디션 제외
    const mainGames = filterMainGamesOnly(igdbGames)

    // 2. rating_count가 있는 게임만 (인기 게임 우선)
    const popularGames = mainGames.filter(game => game.rating_count && game.rating_count > 0)

    console.log(`검색 결과: 전체 ${igdbGames.length}개 → 본편 ${mainGames.length}개 → 인기게임 ${popularGames.length}개`)

    // 3. 인기순으로 정렬 (rating_count가 높은 순)
    const sortedGames = popularGames.sort((a, b) => {
      const ratingA = a.rating_count || 0
      const ratingB = b.rating_count || 0
      return ratingB - ratingA
    })

    // Convert IGDB games to our format
    const games = await Promise.all(
      sortedGames.map(async (game) => {
        const converted = await convertIGDBGame(game)
        return {
          id: game.id,
          ...converted,
          genres: JSON.parse(converted.genres),
          platforms: JSON.parse(converted.platforms),
        }
      })
    )

    return NextResponse.json({ games })
  } catch (error) {
    console.error('Game search error:', error)
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    )
  }
}
