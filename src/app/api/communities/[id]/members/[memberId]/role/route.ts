import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string; memberId: string }>
}

export async function PUT(
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
    const body = await request.json()
    const { role } = body

    if (!role || !['member', 'moderator'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

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
        { error: 'Only owner can change member roles' },
        { status: 403 }
      )
    }

    // Get member
    const member = await prisma.communityMember.findUnique({
      where: { id: memberId },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Cannot change owner's role
    if (member.userId === community.ownerId) {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      )
    }

    // Update role
    const updatedMember = await prisma.communityMember.update({
      where: { id: memberId },
      data: { role },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Failed to change role:', error)
    return NextResponse.json(
      { error: 'Failed to change role' },
      { status: 500 }
    )
  }
}
