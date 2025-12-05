import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminEmail = process.env.ADMIN_EMAIL?.trim()
    if (session.user.email.trim() !== adminEmail) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all reviews with user and game info
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // 최근 100개만
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
          },
        },
        game: {
          select: {
            id: true,
            igdbId: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      reviews,
    })
  } catch (error) {
    console.error('Admin reviews fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
