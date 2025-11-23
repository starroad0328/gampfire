import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const igdbId = parseInt(id)

    if (isNaN(igdbId)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }

    // Get pagination parameters from query string
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get current user session for userVote
    const session = await getServerSession(authOptions)

    // Find the game first
    const game = await prisma.game.findUnique({
      where: { igdbId },
      select: { id: true }
    })

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Get total count for pagination
    const totalReviews = await prisma.review.count({
      where: {
        gameId: game.id,
        comment: {
          not: null,
        },
      },
    })

    // Fetch reviews with pagination
    const reviews = await prisma.review.findMany({
      where: {
        gameId: game.id,
        comment: {
          not: null,
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        likesCount: true,
        priceRating: true,
        graphicsRating: true,
        controlRating: true,
        directionRating: true,
        storyRating: true,
        soundRating: true,
        volumeRating: true,
        innovationRating: true,
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            role: true,
          },
        },
        likes: session?.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
              select: {
                type: true,
              },
            }
          : false,
      },
    })

    // Transform reviews to include userVote field
    const transformedReviews = reviews.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      likesCount: review.likesCount,
      priceRating: review.priceRating,
      graphicsRating: review.graphicsRating,
      controlRating: review.controlRating,
      directionRating: review.directionRating,
      storyRating: review.storyRating,
      soundRating: review.soundRating,
      volumeRating: review.volumeRating,
      innovationRating: review.innovationRating,
      user: review.user,
      userVote: review.likes && review.likes.length > 0 ? review.likes[0].type : null,
    }))

    const totalPages = Math.ceil(totalReviews / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        hasMore,
        currentPage: page,
        totalPages,
        totalReviews,
      },
    })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch reviews',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
