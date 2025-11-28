'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Game {
  id: number
  title: string
  coverImage: string | null
  releaseDate: Date | null
  genres: string[]
}

interface GameRating {
  gameId: number
  rating: number
}

type GameFilter = 'popular' | 'recent'

export default function OnboardingPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [ratings, setRatings] = useState<Map<number, number>>(new Map())
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingGames, setSavingGames] = useState<Set<number>>(new Set()) // 현재 저장 중인 게임 ID
  const [filter, setFilter] = useState<GameFilter>('popular') // 인기 게임 / 최신 게임 필터
  const [totalReviewCount, setTotalReviewCount] = useState<number>(0) // 사용자의 총 리뷰 개수
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastGameRef = useRef<HTMLDivElement | null>(null)

  // 게임 데이터 로드
  const loadGames = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      // 필터에 따라 다른 API 호출 (IGDB는 offset 방식)
      const endpoint = filter === 'popular' ? '/api/games/popular' : '/api/games/recent'
      const response = await fetch(`${endpoint}?limit=10&offset=${page * 10}`)
      const data = await response.json()

      if (data.games && data.games.length > 0) {
        setGames((prev) => {
          // 중복 제거: 이미 존재하는 게임 ID 확인
          const existingIds = new Set(prev.map(g => g.id))
          const newGames = data.games.filter((game: Game) => !existingIds.has(game.id))
          return [...prev, ...newGames]
        })
        setPage((prev) => prev + 1)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load games:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, filter])

  // 필터 변경 시 리셋
  const handleFilterChange = (newFilter: GameFilter) => {
    if (newFilter === filter) return

    setFilter(newFilter)
    setGames([])
    setPage(0)
    setHasMore(true)
  }

  // 초기 로드: 사용자의 총 리뷰 개수 가져오기
  useEffect(() => {
    const fetchTotalReviewCount = async () => {
      try {
        const response = await fetch('/api/user/review-count')
        if (response.ok) {
          const data = await response.json()
          setTotalReviewCount(data.count || 0)
          console.log(`✅ 사용자 총 리뷰 개수: ${data.count}`)
        }
      } catch (error) {
        console.error('Failed to fetch review count:', error)
      }
    }

    fetchTotalReviewCount()
  }, [])

  // 초기 로드 및 필터 변경 시 로드
  useEffect(() => {
    loadGames()
  }, [filter]) // filter가 변경되면 다시 로드

  // 무한 스크롤 설정
  useEffect(() => {
    if (loading) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        loadGames()
      }
    })

    if (lastGameRef.current) {
      observerRef.current.observe(lastGameRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, loadGames])

  // 별점 설정 및 실시간 저장
  const handleRating = async (gameId: number, rating: number) => {
    const isSameRating = ratings.get(gameId) === rating
    const hadPreviousRating = ratings.has(gameId)

    // 로컬 상태 업데이트
    setRatings((prev) => {
      const newRatings = new Map(prev)
      if (isSameRating) {
        // 같은 별점 클릭 시 제거
        newRatings.delete(gameId)
      } else {
        newRatings.set(gameId, rating)
      }
      return newRatings
    })

    // 실시간 저장 또는 삭제
    setSavingGames((prev) => new Set(prev).add(gameId))

    try {
      if (isSameRating) {
        // 같은 별점 클릭 시 삭제
        const response = await fetch('/api/onboarding/ratings', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId }),
        })

        const data = await response.json()

        if (response.ok) {
          console.log(`✅ ${gameId} 평가 삭제 완료`)
        } else {
          console.error(`❌ ${gameId} 평가 삭제 실패:`, data.error)
        }
      } else {
        // 기존 평가가 있으면 먼저 삭제
        if (hadPreviousRating) {
          await fetch('/api/onboarding/ratings', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId }),
          })
          console.log(`✅ ${gameId} 기존 평가 삭제`)
        }

        // 새로운 별점 저장
        const response = await fetch('/api/onboarding/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ratings: [{ gameId, rating }]
          }),
        })

        const data = await response.json()

        if (response.ok) {
          console.log(`✅ ${gameId} 평가 저장 완료 (${rating}점)`)
        } else {
          console.error(`❌ ${gameId} 평가 저장 실패:`, data.error)
        }
      }
    } catch (error) {
      console.error(`❌ ${gameId} 평가 처리 에러:`, error)
    } finally {
      setSavingGames((prev) => {
        const newSet = new Set(prev)
        newSet.delete(gameId)
        return newSet
      })
    }
  }

  // 완료 처리 (실시간 저장되므로 홈으로만 이동)
  const handleComplete = () => {
    console.log(`✅ 온보딩 완료! 총 ${ratings.size}개 게임 평가`)
    router.refresh()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <div className="sticky top-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">점화 세팅</h1>
              <p className="text-sm text-muted-foreground">
                {totalReviewCount >= 10
                  ? '게임에 평점을 매겨주세요. 평점을 많이 매길수록 더 정확한 추천을 받을 수 있어요.'
                  : '최소 10개의 게임에 평점을 매겨주세요. 이를 바탕으로 맞춤 추천을 제공합니다.'}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-5xl font-bold">
                  {ratings.size}
                  {totalReviewCount < 10 && (
                    <span className="text-2xl text-muted-foreground"> / 10</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {totalReviewCount >= 10 ? '추가 평가한 게임' : '평가한 게임'}
                </div>
              </div>
              <Button
                onClick={handleComplete}
                disabled={totalReviewCount < 10 && ratings.size < 10}
                size="lg"
              >
                완료
              </Button>
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={filter === 'popular' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('popular')}
              size="sm"
            >
              인기 게임
            </Button>
            <Button
              variant={filter === 'recent' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('recent')}
              size="sm"
            >
              최신 게임
            </Button>
          </div>
        </div>
      </div>

      {/* 게임 리스트 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {games.map((game, index) => {
            const isLast = index === games.length - 1
            const userRating = ratings.get(game.id)

            return (
              <div
                key={game.id}
                ref={isLast ? lastGameRef : null}
                className="group"
              >
                <Card className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    {/* 게임 커버 */}
                    <div className="relative w-24 h-32 flex-shrink-0 bg-muted rounded overflow-hidden">
                      {game.coverImage ? (
                        <Image
                          src={game.coverImage}
                          alt={game.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* 게임 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1 truncate">
                        {game.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-2">
                        {game.releaseDate && (
                          <span className="text-sm text-muted-foreground">
                            {new Date(game.releaseDate).getFullYear()}
                          </span>
                        )}
                        {game.genres.length > 0 && (
                          <span className="text-sm text-muted-foreground">·</span>
                        )}
                        {game.genres.slice(0, 2).map((genre) => (
                          <Badge key={genre} variant="secondary" className="text-xs">
                            {genre}
                          </Badge>
                        ))}
                      </div>

                      {/* 별점 평가 */}
                      <div className="flex gap-1 mt-3">
                        {[1, 2, 3, 4, 5].map((starIndex) => {
                          const fullRating = starIndex
                          const halfRating = starIndex - 0.5

                          // 현재 별의 채워진 상태 확인
                          const isFull = userRating && userRating >= fullRating
                          const isHalf =
                            userRating &&
                            userRating >= halfRating &&
                            userRating < fullRating

                          return (
                            <button
                              key={starIndex}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const x = e.clientX - rect.left
                                const isLeftHalf = x < rect.width / 2

                                const newRating = isLeftHalf ? halfRating : fullRating
                                handleRating(game.id, newRating)
                              }}
                              className="relative w-8 h-8 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded cursor-pointer"
                            >
                              {isHalf ? (
                                // 반쪽만 채워진 별
                                <div className="relative w-8 h-8">
                                  <Star
                                    className="absolute inset-0 w-8 h-8 fill-yellow-400 text-yellow-400"
                                    style={{
                                      clipPath: 'inset(0 50% 0 0)',
                                    }}
                                  />
                                  <Star
                                    className="absolute inset-0 w-8 h-8 text-muted-foreground"
                                    style={{
                                      clipPath: 'inset(0 0 0 50%)',
                                    }}
                                  />
                                </div>
                              ) : (
                                // 완전히 채워지거나 비어있는 별
                                <Star
                                  className={`w-8 h-8 transition-colors ${
                                    isFull
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground hover:text-yellow-300'
                                  }`}
                                />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}

          {/* 로딩 표시 */}
          {loading && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          )}

          {/* 더 이상 게임이 없을 때 */}
          {!hasMore && games.length > 0 && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                모든 게임을 확인했습니다
              </div>
              <Button
                onClick={handleComplete}
                className="mt-4"
                size="lg"
                disabled={ratings.size < 10}
              >
                {ratings.size >= 10 ? '평가 완료' : `${10 - ratings.size}개 더 평가해주세요`}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
