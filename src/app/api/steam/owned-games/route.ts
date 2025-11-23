import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserOwnedGames } from '@/lib/steam'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if user is logged in
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's Steam ID from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { steamId: true },
    })

    if (!user?.steamId) {
      return NextResponse.json(
        { error: 'Steam account not linked' },
        { status: 400 }
      )
    }

    // Fetch owned games from Steam
    const ownedGames = await getUserOwnedGames(user.steamId)

    if (!ownedGames) {
      return NextResponse.json(
        { error: 'Failed to fetch games from Steam' },
        { status: 500 }
      )
    }

    return NextResponse.json(ownedGames)
  } catch (error) {
    console.error('Steam owned games API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
