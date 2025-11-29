import { NextRequest, NextResponse } from 'next/server'
import { getPopularGames, getRecentGames, convertIGDBGame } from '@/lib/igdb'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'popular'
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '25')
    const genresParam = searchParams.get('genres')
    const genres = genresParam ? genresParam.split(',') : undefined

    console.log(`[API] Fetching games: type=${type}, limit=${limit}, offset=${offset}, genres=${genres?.join(', ') || 'all'}`)

    let games: any[] = []

    if (type === 'popular') {
      games = await getPopularGames(limit, offset, genres)
    } else if (type === 'recent') {
      games = await getRecentGames(limit, offset, genres)
    }

    console.log(`[API] Fetched ${games.length} games from IGDB`)

    // Fetch all game ratings from DB in a single query (배치 쿼리로 성능 개선)
    const igdbIds = games.map(game => game.id)
    let dbGames: { igdbId: number | null; averageRating: number; totalReviews: number }[] = []

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
      console.log(`[API] Loaded ratings for ${dbGames.length}/${games.length} games from DB`)
    } catch (error) {
      console.error('DB batch query error:', error)
    }

    // Create a map for quick lookup
    const ratingsMap = new Map(
      dbGames.map(game => [game.igdbId, { averageRating: game.averageRating, totalReviews: game.totalReviews }])
    )

    // Convert IGDB games to our format with rating info
    const convertedGames = await Promise.all(
      games.map(async (game) => {
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

    console.log(`[API] Returning ${convertedGames.length} converted games`)

    return NextResponse.json({
      games: convertedGames,
      hasMore: convertedGames.length === limit,
    })
  } catch (error) {
    console.error('Games list error:', error)
    return NextResponse.json(
      { games: [], hasMore: false, error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}
