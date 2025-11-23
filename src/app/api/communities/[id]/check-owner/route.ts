import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
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

    // Get community
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        id: true,
        ownerId: true,
      },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    const isOwner = community.ownerId === user.id

    return NextResponse.json({
      community,
      isOwner,
    })
  } catch (error) {
    console.error('Failed to check owner:', error)
    return NextResponse.json(
      { error: 'Failed to check owner' },
      { status: 500 }
    )
  }
}
