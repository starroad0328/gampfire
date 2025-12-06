import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getRecommendedGamesForUser } from '@/lib/recommendations'

// Force dynamic rendering (uses headers for session)
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const limit = 10
    const result = await getRecommendedGamesForUser(session.user.id, limit)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Recommended games error:', error)
    return NextResponse.json(
      { games: [], hasMore: false, error: 'Failed to fetch recommended games' },
      { status: 500 }
    )
  }
}
