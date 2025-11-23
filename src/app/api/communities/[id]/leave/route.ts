import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(
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

    const { id: communityId } = await context.params

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

    // Check if community exists
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Cannot leave if you're the owner
    if (community.ownerId === user.id) {
      return NextResponse.json(
        { error: 'Owner cannot leave community' },
        { status: 400 }
      )
    }

    // Find membership
    const member = await prisma.communityMember.findFirst({
      where: {
        communityId,
        userId: user.id,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member' },
        { status: 400 }
      )
    }

    // Delete membership
    await prisma.communityMember.delete({
      where: { id: member.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to leave community:', error)
    return NextResponse.json(
      { error: 'Failed to leave community' },
      { status: 500 }
    )
  }
}
