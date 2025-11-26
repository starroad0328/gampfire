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
    const { name, username } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: '이름을 입력해주세요' },
        { status: 400 }
      )
    }

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: '사용자명을 입력해주세요' },
        { status: 400 }
      )
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: '사용자명은 영문 소문자, 숫자, 밑줄(_)만 사용 가능합니다' },
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

    // Check if username is taken by another user
    if (username !== currentUser.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: username,
          NOT: {
            id: currentUser.id,
          },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: '이미 사용 중인 사용자명입니다' },
          { status: 400 }
        )
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name: name.trim(),
        username: username.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        name: updatedUser.name,
        username: updatedUser.username,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: '프로필 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}
