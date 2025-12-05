'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { UserBadge } from '@/components/ui/user-badge'
import { Search, X, MessageSquare, Trash2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { StarRating } from '@/components/ui/star-rating'

interface ReviewData {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    username: string | null
    email: string
    role: string
  }
  game: {
    id: string
    igdbId: number | null
    title: string
  }
}

export default function AdminReviewsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    fetchReviews()
  }, [session, status, router])

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews')
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          setError('Admin access required')
          setIsAdmin(false)
        } else {
          setError(data.error || 'Failed to fetch reviews')
        }
        setLoading(false)
        return
      }

      setReviews(data.reviews)
      setIsAdmin(true)
      setLoading(false)
    } catch (err) {
      setError('Error fetching reviews')
      setLoading(false)
    }
  }

  const handleDeleteReview = async (reviewId: string, gameName: string) => {
    if (!confirm(`정말로 "${gameName}" 게임의 리뷰를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/reviews/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.error || 'Failed to delete review',
          variant: "destructive",
        })
        return
      }

      setReviews(reviews.filter(r => r.id !== reviewId))
      toast({
        title: "Success",
        description: '리뷰가 삭제되었습니다',
      })
    } catch (err) {
      toast({
        title: "Error",
        description: 'Error deleting review',
        variant: "destructive",
      })
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      review.game.title.toLowerCase().includes(query) ||
      review.user.name?.toLowerCase().includes(query) ||
      review.user.username?.toLowerCase().includes(query) ||
      review.user.email.toLowerCase().includes(query) ||
      review.comment?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">리뷰 관리</h1>
          <p className="text-muted-foreground">
            모든 사용자의 리뷰를 관리합니다
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">전체 리뷰</p>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="게임명, 사용자, 리뷰 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {reviews.length}개 중 {filteredReviews.length}개 표시
          </p>
        </div>

        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-card border border-border rounded-lg p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Link
                      href={`/games/${review.game.igdbId}`}
                      className="font-semibold text-lg hover:text-primary hover:underline"
                      target="_blank"
                    >
                      {review.game.title}
                    </Link>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Link
                      href={`/profile?userId=${review.user.id}`}
                      className="hover:text-primary"
                    >
                      {review.user.username || review.user.name || review.user.email}
                    </Link>
                    <UserBadge role={review.user.role} size="sm" />
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} size="sm" showNumber />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteReview(review.id, review.game.title)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded">
                  {review.comment}
                </p>
              )}
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
