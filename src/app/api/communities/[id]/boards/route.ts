import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - 게시판 목록 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: communityId } = await context.params

    const boards = await prisma.board.findMany({
      where: { communityId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error('Failed to fetch boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
      { status: 500 }
    )
  }
}

// POST - 게시판 생성
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    console.log('[Board Create] Request received')
    const session = await getServerSession(authOptions)
    console.log('[Board Create] Session:', session?.user?.email)

    if (!session?.user?.email) {
      console.log('[Board Create] No session found')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      )
    }

    const { id: communityId } = await context.params
    const body = await request.json()
    const { name, description, categoryId, isNoticeBoard = false } = body

    console.log('[Board Create] CommunityId:', communityId)
    console.log('[Board Create] Name:', name)
    console.log('[Board Create] Description:', description)
    console.log('[Board Create] CategoryId:', categoryId)
    console.log('[Board Create] IsNoticeBoard:', isNoticeBoard)

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Get user
    console.log('[Board Create] Finding user...')
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      console.log('[Board Create] User not found for email:', session.user.email)
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    console.log('[Board Create] User found:', user.id)

    // Get community
    console.log('[Board Create] Finding community...')
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community) {
      console.log('[Board Create] Community not found:', communityId)
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    console.log('[Board Create] Community found, owner:', community.ownerId)

    // Check if user is owner
    if (community.ownerId !== user.id) {
      console.log('[Board Create] Permission denied. User:', user.id, 'Owner:', community.ownerId)
      return NextResponse.json(
        { error: 'Only community owner can create boards' },
        { status: 403 }
      )
    }

    console.log('[Board Create] Permission check passed')

    // Get max order
    console.log('[Board Create] Getting max order...')
    const lastBoard = await prisma.board.findFirst({
      where: { communityId },
      orderBy: { order: 'desc' },
    })

    const order = lastBoard ? lastBoard.order + 1 : 0
    console.log('[Board Create] Order will be:', order)

    // Create board
    console.log('[Board Create] Creating board...')
    const board = await prisma.board.create({
      data: {
        communityId,
        name,
        description,
        categoryId: categoryId || null,
        order,
        isNoticeBoard,
      },
    })

    console.log('[Board Create] Board created successfully:', board.id)
    return NextResponse.json(board)
  } catch (error) {
    console.error('[Board Create] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create board' },
      { status: 500 }
    )
  }
}
