import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string; postId: string }>
}

export async function PATCH(
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

    const { id: communityId, postId } = await context.params
    const body = await request.json()
    const { title, content, boardId, tags = [], isNotice: clientIsNotice = false } = body

    if (!title || !content || !boardId) {
      return NextResponse.json(
        { error: 'Title, content, and board are required' },
        { status: 400 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get post
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post || post.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user is the author
    if (post.userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
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

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        boardId,
        tags,
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
      },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Failed to update post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}
