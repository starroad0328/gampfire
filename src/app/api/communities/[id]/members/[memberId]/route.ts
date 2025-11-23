import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: communityId, memberId } = await context.params

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get community
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Check if user is owner
    if (community.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only owner can remove members' },
        { status: 403 }
      )
    }

    // Cannot remove owner
    const member = await prisma.communityMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    if (member.userId === community.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove owner' },
        { status: 400 }
      )
    }

    // Remove member
    await prisma.communityMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
