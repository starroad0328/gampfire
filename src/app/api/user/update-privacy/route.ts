import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { profileVisibility, reviewVisibility } = body

    // Validation
    const validProfileVisibility = ['public', 'private']
    const validReviewVisibility = ['public', 'followers', 'private']

    if (!validProfileVisibility.includes(profileVisibility)) {
      return NextResponse.json(
        { error: '잘못된 프로필 공개 범위입니다' },
        { status: 400 }
      )
    }

    if (!validReviewVisibility.includes(reviewVisibility)) {
      return NextResponse.json(
        { error: '잘못된 리뷰 공개 범위입니다' },
        { status: 400 }
      )
    }

    // Find current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Update privacy settings
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        profileVisibility,
        reviewVisibility,
      },
    })

    return NextResponse.json({
      success: true,
      profileVisibility: updatedUser.profileVisibility,
      reviewVisibility: updatedUser.reviewVisibility,
    })
  } catch (error) {
    console.error('Privacy update error:', error)
    return NextResponse.json(
      { error: '설정 저장에 실패했습니다' },
      { status: 500 }
    )
  }
}
