import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPopularGames, convertIGDBGame } from '@/lib/igdb'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get current user session
    const session = await getServerSession(authOptions)

    // Get user's rated game IDs if logged in
    let ratedGameIds: Set<number> = new Set()
    if (session?.user?.id) {
      const userReviews = await prisma.review.findMany({
        where: { userId: session.user.id },
        select: { game: { select: { igdbId: true } } },
      })
      ratedGameIds = new Set(
        userReviews
          .map(r => r.game?.igdbId)
          .filter((id): id is number => id !== null)
      )
    }

    // Fetch more games to compensate for filtering
    const fetchLimit = ratedGameIds.size > 0 ? limit * 2 : limit
    const igdbGames = await getPopularGames(fetchLimit, offset)

    // Filter out already rated games
    const filteredGames = ratedGameIds.size > 0
      ? igdbGames.filter(game => !ratedGameIds.has(game.id))
      : igdbGames

    // Convert IGDB games to our format
    const games = await Promise.all(
      filteredGames.slice(0, limit).map(async (game) => {
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
    console.error('Popular games error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular games' },
      { status: 500 }
    )
  }
}
