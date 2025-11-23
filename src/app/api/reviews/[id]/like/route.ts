import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: reviewId } = await params
    const body = await request.json()
    const { type } = body // 'like' or 'dislike'

    if (!type || (type !== 'like' && type !== 'dislike')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "like" or "dislike"' },
        { status: 400 }
      )
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if user already liked/disliked this review
    const existingVote = await prisma.reviewLike.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.user.id,
        },
      },
    })

    if (existingVote) {
      // If same type, remove the vote (toggle off)
      if (existingVote.type === type) {
        await prisma.reviewLike.delete({
          where: { id: existingVote.id },
        })

        // Only decrement if it was a like
        if (type === 'like') {
          await prisma.review.update({
            where: { id: reviewId },
            data: {
              likesCount: {
                decrement: 1,
              },
            },
          })
        }

        return NextResponse.json({
          success: true,
          type: null,
          likesCount: type === 'like' ? review.likesCount - 1 : review.likesCount,
        })
      } else {
        // Different type - update the vote
        await prisma.reviewLike.update({
          where: { id: existingVote.id },
          data: { type },
        })

        // Update likesCount based on change
        let newLikesCount = review.likesCount
        if (existingVote.type === 'like' && type === 'dislike') {
          // Switching from like to dislike
          newLikesCount = review.likesCount - 1
          await prisma.review.update({
            where: { id: reviewId },
            data: {
              likesCount: {
                decrement: 1,
              },
            },
          })
        } else if (existingVote.type === 'dislike' && type === 'like') {
          // Switching from dislike to like
          newLikesCount = review.likesCount + 1
          await prisma.review.update({
            where: { id: reviewId },
            data: {
              likesCount: {
                increment: 1,
              },
            },
          })
        }

        return NextResponse.json({
          success: true,
          type,
          likesCount: newLikesCount,
        })
      }
    } else {
      // New vote
      await prisma.reviewLike.create({
        data: {
          reviewId,
          userId: session.user.id,
          type,
        },
      })

      // Only increment if it's a like
      if (type === 'like') {
        const updatedReview = await prisma.review.update({
          where: { id: reviewId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
        })

        return NextResponse.json({
          success: true,
          type,
          likesCount: updatedReview.likesCount,
        })
      } else {
        return NextResponse.json({
          success: true,
          type,
          likesCount: review.likesCount,
        })
      }
    }
  } catch (error) {
    console.error('Review vote error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
