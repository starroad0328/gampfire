import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
        { status: 400 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    })

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      })

      return NextResponse.json({ following: false })
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      })

      // Create notification for the followed user
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { name: true, username: true },
      })

      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'FOLLOW',
          message: `${session.user.name || session.user.email}님이 회원님을 팔로우했습니다`,
          actorId: currentUser.id,
        },
      })

      return NextResponse.json({ following: true })
    }
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { error: 'Failed to follow/unfollow user' },
      { status: 500 }
    )
  }
}
