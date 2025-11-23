import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string; boardId: string }>
}

// PUT - 게시판 수정
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

    const { id: communityId, boardId } = await context.params
    const body = await request.json()
    const { name, description, categoryId, isNoticeBoard = false } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
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
        { error: 'Only owner can update boards' },
        { status: 403 }
      )
    }

    // Check if board exists
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board || board.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    // Update board
    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: {
        name,
        description,
        categoryId: categoryId || null,
        isNoticeBoard,
      },
    })

    return NextResponse.json(updatedBoard)
  } catch (error) {
    console.error('Failed to update board:', error)
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    )
  }
}

// DELETE - 게시판 삭제
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

    const { id: communityId, boardId } = await context.params

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
        { error: 'Only owner can delete boards' },
        { status: 403 }
      )
    }

    // Check if board exists
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    })

    if (!board || board.communityId !== communityId) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    // Delete board (posts will have boardId set to null due to onDelete: SetNull)
    await prisma.board.delete({
      where: { id: boardId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete board:', error)
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    )
  }
}
