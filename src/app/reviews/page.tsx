'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StarRating } from '@/components/ui/star-rating'
import { UserBadge } from '@/components/ui/user-badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, TrendingUp, Clock, Heart, ThumbsUp, ThumbsDown } from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string | null
  label: string | null
  createdAt: string
  likesCount: number
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    role: string
  }
  game: {
    id: string
    igdbId: number | null
    title: string
    coverImage: string | null
  }
  userVote: 'like' | 'dislike' | null
}

export default function ReviewsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'recent' | 'top'>('recent')
  const [recentReviews, setRecentReviews] = useState<Review[]>([])
  const [topReviews, setTopReviews] = useState<Review[]>([])
  const [recentOffset, setRecentOffset] = useState(0)
  const [topOffset, setTopOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMoreRecent, setHasMoreRecent] = useState(true)
  const [hasMoreTop, setHasMoreTop] = useState(true)
  const [reviewVotes, setReviewVotes] = useState<Map<string, 'like' | 'dislike'>>(new Map())
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadReviews = useCallback(async (type: 'recent' | 'top', offset: number) => {
    if (loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/reviews/list?type=${type}&offset=${offset}&limit=20`)
      const data = await res.json()

      if (!res.ok) {
        console.error('Failed to fetch reviews:', data.error)
        return
      }

      if (type === 'recent') {
        setRecentReviews(prev => [...prev, ...data.reviews])
        setRecentOffset(offset + 20)
        setHasMoreRecent(data.hasMore)
      } else {
        setTopReviews(prev => [...prev, ...data.reviews])
        setTopOffset(offset + 20)
        setHasMoreTop(data.hasMore)
      }

      // Initialize vote state
      const newVotes = new Map(reviewVotes)
      data.reviews.forEach((review: Review) => {
        if (review.userVote) {
          newVotes.set(review.id, review.userVote)
        }
      })
      setReviewVotes(newVotes)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setLoading(false)
    }
  }, [loading, reviewVotes])

  useEffect(() => {
    loadReviews('recent', 0)
    loadReviews('top', 0)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          if (activeTab === 'recent' && hasMoreRecent) {
            loadReviews('recent', recentOffset)
          } else if (activeTab === 'top' && hasMoreTop) {
            loadReviews('top', topOffset)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [activeTab, loading, hasMoreRecent, hasMoreTop, recentOffset, topOffset, loadReviews])

  const handleVote = async (reviewId: string, type: 'like' | 'dislike') => {
    if (!session) {
      return
    }

    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const data = await res.json()

      if (res.ok) {
        // Update vote state
        const newVotes = new Map(reviewVotes)
        if (data.type === null) {
          newVotes.delete(reviewId)
        } else {
          newVotes.set(reviewId, data.type)
        }
        setReviewVotes(newVotes)

        // Update like count in reviews
        const updateReviews = (reviews: Review[]) =>
          reviews.map(r =>
            r.id === reviewId ? { ...r, likesCount: data.likesCount } : r
          )

        setRecentReviews(updateReviews)
        setTopReviews(updateReviews)
      }
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const renderReview = (review: Review) => (
    <div key={review.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
      <div className="flex gap-4">
        {/* Game Cover */}
        <Link href={`/games/${review.game.igdbId}`} className="flex-shrink-0">
          <div className="w-24 h-32 relative bg-muted rounded overflow-hidden hover:ring-2 hover:ring-primary transition-all">
            {review.game.coverImage && (
              <Image
                src={review.game.coverImage}
                alt={review.game.title}
                fill
                className="object-cover"
              />
            )}
          </div>
        </Link>

        {/* Review Content */}
        <div className="flex-1">
          {/* Game Title */}
          <Link
            href={`/games/${review.game.igdbId}`}
            className="block mb-2 hover:underline"
          >
            <h3 className="font-bold text-lg text-foreground">
              {review.game.title}
            </h3>
          </Link>

          {/* User Info */}
          <div className="flex items-center gap-2 mb-3">
            <Link
              href={`/profile?userId=${review.user.id}`}
              className="flex items-center gap-2 hover:underline"
            >
              <div className="relative w-6 h-6 rounded-full overflow-hidden bg-muted">
                {review.user.image ? (
                  <Image
                    src={review.user.image}
                    alt={review.user.name || review.user.username || 'User'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {(review.user.name || review.user.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium">{review.user.username || review.user.name}</span>
            </Link>
            <UserBadge role={review.user.role} size="sm" />
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>

          {/* Rating */}
          <div className="mb-3">
            <StarRating rating={review.rating} size="sm" showNumber />
          </div>

          {/* Label */}
          {review.label && (
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {review.label}
              </span>
            </div>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-foreground mb-3 leading-relaxed whitespace-pre-wrap">
              {review.comment}
            </p>
          )}

          {/* Like/Dislike Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={reviewVotes.get(review.id) === 'like' ? 'default' : 'outline'}
              onClick={() => handleVote(review.id, 'like')}
              disabled={!session}
              className="gap-1"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{review.likesCount}</span>
            </Button>
            <Button
              size="sm"
              variant={reviewVotes.get(review.id) === 'dislike' ? 'default' : 'outline'}
              onClick={() => handleVote(review.id, 'dislike')}
              disabled={!session}
              className="gap-1"
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">모든 리뷰</h1>
          <p className="text-muted-foreground">
            커뮤니티의 최신 리뷰와 인기 리뷰를 확인하세요
          </p>
        </div>

        <Tabs value={activeTab} className="w-full" onValueChange={(val) => setActiveTab(val as 'recent' | 'top')}>
          <TabsList className="mb-6">
            <TabsTrigger value="recent" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              최근 리뷰
            </TabsTrigger>
            <TabsTrigger value="top" className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              추천 리뷰
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            {recentReviews.length > 0 ? (
              <div className="space-y-4">
                {recentReviews.map(renderReview)}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>아직 리뷰가 없습니다</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="top">
            {topReviews.length > 0 ? (
              <div className="space-y-4">
                {topReviews.map(renderReview)}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>아직 추천받은 리뷰가 없습니다</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="h-20 flex items-center justify-center">
          {loading && <p className="text-muted-foreground">로딩 중...</p>}
        </div>
      </div>
    </div>
  )
}
