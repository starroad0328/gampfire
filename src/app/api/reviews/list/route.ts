import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering (uses headers for session)
export const dynamic = 'force-dynamic'

// 5분마다 캐시 갱신
export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'recent' // recent or top
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let reviews

    if (type === 'top') {
      // 추천 수가 많은 리뷰 (좋아요 기준)
      reviews = await prisma.review.findMany({
        orderBy: {
          likesCount: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              role: true,
            },
          },
          game: {
            select: {
              id: true,
              igdbId: true,
              title: true,
              coverImage: true,
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
    } else {
      // 최근 리뷰
      reviews = await prisma.review.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              role: true,
            },
          },
          game: {
            select: {
              id: true,
              igdbId: true,
              title: true,
              coverImage: true,
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
    }

    // Transform reviews to include userVote
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      label: review.label,
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
      game: review.game,
      userVote: review.likes && review.likes.length > 0 ? review.likes[0].type : null,
    }))

    // Check if there are more reviews
    const totalCount = await prisma.review.count()
    const hasMore = offset + limit < totalCount

    return NextResponse.json({
      reviews: transformedReviews,
      hasMore,
      total: totalCount,
    })
  } catch (error) {
    console.error('Reviews list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
