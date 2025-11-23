import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET - 카테고리 목록 조회
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: communityId } = await context.params

    const categories = await prisma.category.findMany({
      where: { communityId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST - 카테고리 생성
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
    const { name } = body

    if (!name) {
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

    // Check if user is owner
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!community || community.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Only community owner can create categories' },
        { status: 403 }
      )
    }

    // Get max order
    const maxOrderCategory = await prisma.category.findFirst({
      where: { communityId },
      orderBy: { order: 'desc' },
    })

    const newOrder = (maxOrderCategory?.order ?? -1) + 1

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        communityId,
        order: newOrder,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Failed to create category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
