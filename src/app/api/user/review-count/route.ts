import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // 사용자의 총 리뷰 개수 조회
    const count = await prisma.review.count({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Review count fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review count' },
      { status: 500 }
    )
  }
}
