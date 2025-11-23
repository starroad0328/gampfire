import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const { searchParams } = new URL(request.url)
    const nickname = searchParams.get('nickname')

    if (!nickname) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      )
    }

    // Check if nickname is already taken in this community (as nickname)
    const existingNickname = await prisma.communityMember.findFirst({
      where: {
        communityId,
        nickname,
      },
    })

    if (existingNickname) {
      return NextResponse.json({
        available: false,
        message: '이미 사용 중인 별명입니다.',
      })
    }

    // Check if nickname conflicts with any member's username in this community
    const members = await prisma.communityMember.findMany({
      where: {
        communityId,
      },
      include: {
        user: {
          select: {
            username: true,
            name: true,
          },
        },
      },
    })

    const usernameConflict = members.some(
      (member) => member.user.username === nickname || member.user.name === nickname
    )

    if (usernameConflict) {
      return NextResponse.json({
        available: false,
        message: '이미 사용 중인 이름입니다.',
      })
    }

    return NextResponse.json({
      available: true,
      message: '사용할 수 있는 별명입니다.',
    })
  } catch (error) {
    console.error('Check nickname error:', error)
    return NextResponse.json(
      { error: 'Failed to check nickname' },
      { status: 500 }
    )
  }
}
