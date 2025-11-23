'use client'

import { useState, useEffect, use, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ArrowLeft, Loader2, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { UserBadge } from '@/components/ui/user-badge'
import { Button } from '@/components/ui/button'

interface ReviewsPageProps {
  params: Promise<{ id: string }>
}

export default function ReviewsPage({ params }: ReviewsPageProps) {
  const router = useRouter()
  const unwrappedParams = use(params)
  const { id: gameId } = unwrappedParams

  const [gameData, setGameData] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [reviewVotes, setReviewVotes] = useState<Map<string, 'like' | 'dislike'>>(new Map())
  const [reviewSort, setReviewSort] = useState<'likes' | 'recent'>('likes')
  const observerTarget = useRef<HTMLDivElement>(null)

  // Fetch game basic info
  useEffect(() => {
    async function fetchGame() {
      try {
        const res = await fetch(`/api/games/${gameId}`)
        if (res.ok) {
          const data = await res.json()
          setGameData(data.game)
        }
      } catch (error) {
        console.error('Failed to fetch game:', error)
      }
    }
    fetchGame()
  }, [gameId])

  // Fetch reviews
  const fetchReviews = useCallback(async (pageNum: number) => {
    if (loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}/reviews?page=${pageNum}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        if (pageNum === 1) {
          setReviews(data.reviews)
        } else {
          setReviews(prev => [...prev, ...data.reviews])
        }
        setHasMore(data.pagination.hasMore)

        // Initialize vote state from API data
        setReviewVotes(prev => {
          const newMap = new Map(prev)
          data.reviews.forEach((review: any) => {
            if (review.userVote) {
              newMap.set(review.id, review.userVote)
            }
          })
          return newMap
        })
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [gameId, loading])

  // Initial load
  useEffect(() => {
    fetchReviews(1)
  }, [gameId])

  const handleVoteReview = async (reviewId: string, type: 'like' | 'dislike') => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      if (res.ok) {
        const data = await res.json()

        // Update vote state
        setReviewVotes(prev => {
          const newMap = new Map(prev)
          if (data.type) {
            newMap.set(reviewId, data.type)
          } else {
            newMap.delete(reviewId)
          }
          return newMap
        })

        // Update likesCount in reviews
        setReviews(prev =>
          prev.map(review =>
            review.id === reviewId
              ? { ...review, likesCount: data.likesCount }
              : review
          )
        )
      }
    } catch (error) {
      console.error('Failed to vote review:', error)
    }
  }

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1
            fetchReviews(nextPage)
            return nextPage
          })
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, loading, fetchReviews])

  if (!gameData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4 gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>

          <div className="flex items-start gap-6">
            {/* Game Cover */}
            <div className="relative w-32 h-44 bg-muted rounded-lg overflow-hidden flex-shrink-0">
              {gameData.coverImage ? (
                <Image
                  src={gameData.coverImage}
                  alt={gameData.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  No Image
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="flex-1">
              <Link
                href={`/games/${gameData.id}`}
                className="text-2xl font-bold hover:text-orange-500 transition-colors"
              >
                {gameData.title}
              </Link>
              <div className="flex items-center gap-2 mt-3">
                <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                <span className="text-2xl font-bold">
                  {gameData.averageRating > 0 ? gameData.averageRating.toFixed(1) : 'N/A'}
                </span>
                <span className="text-sm text-muted-foreground mt-1">
                  ({gameData.totalReviews}개 리뷰)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-4">전체 리뷰</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReviewSort('likes')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  reviewSort === 'likes'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                추천 평가
              </button>
              <button
                onClick={() => setReviewSort('recent')}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  reviewSort === 'recent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                최신순
              </button>
            </div>
          </div>

          {reviews.length > 0 ? (
            <>
              {[...reviews]
                .sort((a: any, b: any) => {
                  if (reviewSort === 'likes') {
                    return b.likesCount - a.likesCount
                  } else {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  }
                })
                .map((review: any) => (
                <div key={review.id} className="bg-muted/30 rounded-lg p-5">
                  {/* Recommendation Badge - Top */}
                  <div className="flex items-center gap-2 mb-3">
                    {review.rating > 3 ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-500">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-bold">추천</span>
                      </div>
                    ) : review.rating >= 2.5 ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 border border-gray-500/30 rounded-md text-gray-500">
                        <Minus className="w-4 h-4" />
                        <span className="text-sm font-bold">보통</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-red-500">
                        <ThumbsDown className="w-4 h-4" />
                        <span className="text-sm font-bold">비추천</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${
                        review.user.role === 'expert' || review.user.role === 'influencer'
                          ? 'fill-blue-500 text-blue-500'
                          : 'fill-orange-500 text-orange-500'
                      }`} />
                      <span className="text-sm font-bold">{review.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Profile Picture */}
                      <Link href={`/profile?userId=${review.user.id}`}>
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all">
                          {review.user.image ? (
                            <Image
                              src={review.user.image}
                              alt={review.user.name || review.user.username}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                              {(review.user.name || review.user.username || 'U')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Username */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile?userId=${review.user.id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {review.user.name || review.user.username}
                        </Link>
                        <UserBadge role={review.user.role} size="sm" />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Review Content */}
                  {review.comment && (
                    <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">{review.comment}</p>
                  )}

                  {/* Detailed Ratings */}
                  {(review.priceRating || review.graphicsRating || review.controlRating || review.directionRating ||
                    review.storyRating || review.soundRating || review.volumeRating || review.innovationRating) && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-3 text-xs">
                        {review.priceRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">💰 가격</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.priceRating % 1 === 0 ? review.priceRating : review.priceRating.toFixed(1)}</span>
                          </div>
                        )}
                        {review.graphicsRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">🎨 그래픽</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.graphicsRating % 1 === 0 ? review.graphicsRating : review.graphicsRating.toFixed(1)}</span>
                          </div>
                        )}
                        {review.controlRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">🎮 조작감</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.controlRating % 1 === 0 ? review.controlRating : review.controlRating.toFixed(1)}</span>
                          </div>
                        )}
                        {review.directionRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">🎬 연출</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.directionRating % 1 === 0 ? review.directionRating : review.directionRating.toFixed(1)}</span>
                          </div>
                        )}
                        {review.storyRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">📖 스토리</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.storyRating % 1 === 0 ? review.storyRating : review.storyRating.toFixed(1)}</span>
                          </div>
                        )}
                        {review.soundRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">🎵 OST</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.soundRating % 1 === 0 ? review.soundRating : review.soundRating.toFixed(1)}</span>
                          </div>
                        )}
                        {review.volumeRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">📦 볼륨</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.volumeRating % 1 === 0 ? review.volumeRating : review.volumeRating.toFixed(1)}</span>
                          </div>
                        )}
                        {review.innovationRating && (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded">
                            <span className="text-muted-foreground">💡 혁신성</span>
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{review.innovationRating % 1 === 0 ? review.innovationRating : review.innovationRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Like/Dislike Section */}
                  <div className="border-t border-border pt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVoteReview(review.id, 'like')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm transition-colors ${
                          reviewVotes.get(review.id) === 'like'
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        추천 {review.likesCount > 0 && <span className="ml-1 font-medium">{review.likesCount}</span>}
                      </button>
                      <button
                        onClick={() => handleVoteReview(review.id, 'dislike')}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded text-sm transition-colors ${
                          reviewVotes.get(review.id) === 'dislike'
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        비추천
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Intersection observer target */}
              <div ref={observerTarget} className="h-4" />

              {/* No more reviews */}
              {!hasMore && reviews.length > 0 && (
                <p className="text-center text-muted-foreground py-8">
                  모든 리뷰를 불러왔습니다
                </p>
              )}
            </>
          ) : (
            <div className="bg-muted/30 rounded-lg p-8 text-center text-muted-foreground">
              아직 리뷰가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
