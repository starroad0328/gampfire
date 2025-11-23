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
    const body = await request.json()
    const { title, content, boardId, tags = [], isNotice: clientIsNotice = false } = body

    if (!title || !content || !boardId) {
      return NextResponse.json(
        { error: 'Title, content, and board are required' },
        { status: 400 }
      )
    }

    // Validate boardId
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board || board.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Invalid board selected' },
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

    // Check if user is member
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId: user.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to post' },
        { status: 403 }
      )
    }

    // Get community to check owner
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // Check if board is notice board - if so, only owner can post
    if (board.isNoticeBoard && community.ownerId !== user.id) {
      return NextResponse.json(
        { error: '공지사항 게시판은 동아리장만 글을 쓸 수 있습니다' },
        { status: 403 }
      )
    }

    // Determine isNotice: true if board is notice board, otherwise use client value (but only if owner)
    let isNotice = board.isNoticeBoard // Auto-set to true for notice boards
    if (!board.isNoticeBoard && clientIsNotice && community.ownerId !== user.id) {
      // If trying to set isNotice manually but not owner, deny
      return NextResponse.json(
        { error: 'Only community owner can create notice posts' },
        { status: 403 }
      )
    }
    if (!board.isNoticeBoard && clientIsNotice) {
      isNotice = true // Owner manually marking as notice
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        tags,
        communityId,
        userId: user.id,
        boardId,
        isNotice,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        board: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
