import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!user.steamId) {
      return NextResponse.json(
        { error: '연동된 Steam 계정이 없습니다' },
        { status: 400 }
      )
    }

    // Disconnect Steam account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        steamId: null,
        steamUsername: null,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Steam 계정 연동이 해제되었습니다',
    })
  } catch (error) {
    console.error('Steam disconnect error:', error)
    return NextResponse.json(
      { error: 'Steam 연동 해제에 실패했습니다' },
      { status: 500 }
    )
  }
}
