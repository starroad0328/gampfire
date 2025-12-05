'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, StarHalf, Loader2, Trash2 } from 'lucide-react'

interface ReviewFormProps {
  gameId: string
  gameName: string
  existingReview?: {
    rating: number
    comment: string | null
    priceRating?: number | null
    graphicsRating?: number | null
    controlRating?: number | null
    directionRating?: number | null
    storyRating?: number | null
    soundRating?: number | null
    volumeRating?: number | null
    innovationRating?: number | null
  } | null
}

export function ReviewForm({ gameId, gameName, existingReview }: ReviewFormProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 세부 평가 항목
  const [priceRating, setPriceRating] = useState(0)
  const [graphicsRating, setGraphicsRating] = useState(0)
  const [controlRating, setControlRating] = useState(0)
  const [directionRating, setDirectionRating] = useState(0)
  const [storyRating, setStoryRating] = useState(0)
  const [ostRating, setOstRating] = useState(0)
  const [volumeRating, setVolumeRating] = useState(0)
  const [innovationRating, setInnovationRating] = useState(0)

  // Update form when existingReview changes
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setComment(existingReview.comment || '')
      // 세부 평가 항목 초기화
      setPriceRating(existingReview.priceRating || 0)
      setGraphicsRating(existingReview.graphicsRating || 0)
      setControlRating(existingReview.controlRating || 0)
      setDirectionRating(existingReview.directionRating || 0)
      setStoryRating(existingReview.storyRating || 0)
      setOstRating(existingReview.soundRating || 0)
      setVolumeRating(existingReview.volumeRating || 0)
      setInnovationRating(existingReview.innovationRating || 0)
    }
  }, [existingReview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!session) {
      router.push('/login')
      return
    }

    if (rating === 0) {
      setError('별점을 선택해주세요')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          rating,
          comment: comment.trim() || null,
          // 세부 평가 (0이면 null로 전송)
          priceRating: priceRating > 0 ? priceRating : null,
          graphicsRating: graphicsRating > 0 ? graphicsRating : null,
          controlRating: controlRating > 0 ? controlRating : null,
          directionRating: directionRating > 0 ? directionRating : null,
          storyRating: storyRating > 0 ? storyRating : null,
          soundRating: ostRating > 0 ? ostRating : null,
          volumeRating: volumeRating > 0 ? volumeRating : null,
          innovationRating: innovationRating > 0 ? innovationRating : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '리뷰 작성에 실패했습니다')
        return
      }

      setSuccess(existingReview ? '리뷰가 수정되었습니다!' : '리뷰가 작성되었습니다!')

      // Immediately refresh the page to show updated review
      window.location.reload()
    } catch (err) {
      setError('리뷰 작성 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      return
    }

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch(`/api/reviews/delete?gameId=${gameId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '리뷰 삭제에 실패했습니다')
        return
      }

      setSuccess('리뷰가 삭제되었습니다!')

      // Immediately refresh the page to show updated review list
      window.location.reload()
    } catch (err) {
      setError('리뷰 삭제 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleStarClick = (value: number, event: React.MouseEvent<HTMLButtonElement>) => {
    // Get click position relative to button
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const buttonWidth = rect.width

    // If clicked on left half, set half star
    if (clickX < buttonWidth / 2) {
      setRating(value - 0.5)
    } else {
      setRating(value)
    }
  }

  const handleStarHover = (value: number, event: React.MouseEvent<HTMLButtonElement>) => {
    // Get hover position relative to button
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const hoverX = event.clientX - rect.left
    const buttonWidth = rect.width

    // If hovering on left half, show half star
    if (hoverX < buttonWidth / 2) {
      setHoveredRating(value - 0.5)
    } else {
      setHoveredRating(value)
    }
  }

  const renderStars = () => {
    const stars = []
    const displayRating = hoveredRating || rating

    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= displayRating
      const isHalf = i - 0.5 === displayRating

      stars.push(
        <button
          key={i}
          type="button"
          onClick={(e) => handleStarClick(i, e)}
          onMouseMove={(e) => handleStarHover(i, e)}
          onMouseLeave={() => setHoveredRating(0)}
          className="transition-transform hover:scale-110"
        >
          {isHalf ? (
            <StarHalf className="w-10 h-10 fill-yellow-400 text-yellow-400" />
          ) : (
            <Star
              className={`w-10 h-10 ${
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          )}
        </button>
      )
    }

    return stars
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingReview ? '내 리뷰 수정' : '리뷰 작성'}</CardTitle>
        <CardDescription>
          {gameName}에 대한 평가를 남겨주세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
            {/* Left Column - Star Rating & Comment */}
            <div className="space-y-6">
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  별점 <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {renderStars()}
                  <span className="ml-2 text-2xl font-bold">
                    {rating > 0 ? rating.toFixed(1) : '-'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  별을 클릭하면 0.5점 단위로 평가할 수 있습니다
                </p>
              </div>

              {/* Comment (Optional) */}
              <div className="space-y-2">
                <label htmlFor="comment" className="text-sm font-medium">
                  코멘트 (선택)
                </label>
                <Textarea
                  id="comment"
                  placeholder="게임에 대한 자세한 의견을 남겨주세요 (선택사항)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={8}
                  maxLength={1000}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {comment.length}/1000
                </p>
                <p className="text-xs text-muted-foreground">
                  💡 코멘트를 작성하면 리뷰 목록에 표시됩니다
                </p>
              </div>
            </div>

            {/* Right Column - 세부 평가 */}
            <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20 h-fit">
              <label className="text-sm font-medium">세부 평가 (선택)</label>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* 가격 만족도 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">💰 가격 만족도</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPriceRating(priceRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= priceRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {priceRating > 0 ? priceRating : '-'}
                    </span>
                  </div>
                </div>

                {/* 그래픽 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">🎨 그래픽</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGraphicsRating(graphicsRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= graphicsRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {graphicsRating > 0 ? graphicsRating : '-'}
                    </span>
                  </div>
                </div>

                {/* 조작감 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">🎮 조작감</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setControlRating(controlRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= controlRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {controlRating > 0 ? controlRating : '-'}
                    </span>
                  </div>
                </div>

                {/* 연출 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">🎬 연출</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setDirectionRating(directionRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= directionRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {directionRating > 0 ? directionRating : '-'}
                    </span>
                  </div>
                </div>

                {/* 스토리 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">📖 스토리</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStoryRating(storyRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= storyRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {storyRating > 0 ? storyRating : '-'}
                    </span>
                  </div>
                </div>

                {/* OST */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">🎵 OST</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOstRating(ostRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= ostRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {ostRating > 0 ? ostRating : '-'}
                    </span>
                  </div>
                </div>

                {/* 컨텐츠 볼륨 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">📦 컨텐츠 볼륨</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setVolumeRating(volumeRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= volumeRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {volumeRating > 0 ? volumeRating : '-'}
                    </span>
                  </div>
                </div>

                {/* 혁신성과 독창성 */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">💡 혁신성과 독창성</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setInnovationRating(innovationRating === value ? 0 : value)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= innovationRating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium min-w-[2rem]">
                      {innovationRating > 0 ? innovationRating : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                💡 평가하고 싶은 항목만 선택하세요
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {existingReview ? '수정 중...' : '작성 중...'}
                </>
              ) : (
                existingReview ? '리뷰 수정' : '리뷰 작성'
              )}
            </Button>
            {existingReview && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="gap-1"
              >
                <Trash2 className="w-4 h-4" />
                리뷰 삭제
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
