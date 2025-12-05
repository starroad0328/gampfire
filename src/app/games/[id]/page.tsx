'use client'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Star, ChevronDown, ChevronUp, MessageSquare, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { translateGenre } from '@/lib/translations'
import Link from 'next/link'
import { useState, useEffect, use } from 'react'
import { ReviewSection } from '@/components/features/review-section'
import { ReviewButton } from '@/components/features/review-button'
import { UserBadge } from '@/components/ui/user-badge'
import { StarRating } from '@/components/ui/star-rating'

interface GamePageProps {
  params: Promise<{ id: string }>
}

export default function GamePage({ params }: GamePageProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [gameData, setGameData] = useState<any>(null)
  const [reviewVotes, setReviewVotes] = useState<Map<string, 'like' | 'dislike'>>(new Map())

  // Unwrap params
  const unwrappedParams = use(params)
  const { id } = unwrappedParams

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Fetch game data from API
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/games/${id}`, {
          cache: 'no-store',
        })

        if (!res.ok) {
          console.error(`Failed to fetch game ${id}: ${res.status}`)
          return
        }

        const data = await res.json()
        setGameData(data)

        // Initialize vote state from API data
        if (data.game?.reviews) {
          const initialVotes = new Map<string, 'like' | 'dislike'>()
          data.game.reviews.forEach((review: any) => {
            if (review.userVote) {
              initialVotes.set(review.id, review.userVote)
            }
          })
          setReviewVotes(initialVotes)
        }
      } catch (error) {
        console.error('Failed to fetch game:', error)
      }
    }

    fetchData()
  }, [id])

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

        // Update likesCount in gameData
        setGameData((prev: any) => ({
          ...prev,
          game: {
            ...prev.game,
            reviews: prev.game.reviews.map((review: any) =>
              review.id === reviewId
                ? { ...review, likesCount: data.likesCount }
                : review
            ),
          },
        }))
      }
    } catch (error) {
      console.error('Failed to vote review:', error)
    }
  }

  if (!gameData) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>로딩 중...</p>
    </div>
  }

  const { game, steamData, trailer, userReview } = gameData

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_380px_1fr] gap-6 mb-8">
          {/* Game Cover */}
          <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
            {game.coverImage ? (
              <Image
                src={game.coverImage}
                alt={game.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
          </div>

          {/* Game Info */}
          <div className="flex flex-col">
            <div className="mb-auto">
              <h1 className="text-3xl font-bold mb-6">{game.title}</h1>

              {/* Rating - Larger */}
              <div className="flex items-center gap-3 mb-8">
                <Star className="w-10 h-10 fill-yellow-400 text-yellow-400" />
                <span className="text-4xl font-bold">
                  {game.averageRating > 0 ? game.averageRating.toFixed(1) : 'N/A'}
                </span>
                <span className="text-sm text-muted-foreground mt-2">
                  {game.totalReviews}개 리뷰
                </span>
              </div>
            </div>

            {/* Details moved to bottom */}
            <div className="space-y-3 mt-auto">
              {/* Release Date */}
              {game.releaseDate && (
                <p className="text-sm">
                  📅 {new Date(game.releaseDate).toLocaleDateString('ko-KR')}
                </p>
              )}

              {/* Developer */}
              {game.developer && (
                <p className="text-sm">
                  <span className="text-muted-foreground">개발사:</span> {game.developer}
                </p>
              )}

              {/* Publisher */}
              {game.publisher && (
                <p className="text-sm">
                  <span className="text-muted-foreground">배급사:</span> {game.publisher}
                </p>
              )}

              {/* Genres */}
              <div>
                <p className="text-sm font-semibold mb-2">장르</p>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(game.genres || '[]').map((genre: string) => (
                    <Badge key={genre} variant="secondary">
                      {translateGenre(genre)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div>
                <p className="text-sm font-semibold mb-2">플랫폼</p>
                <div className="flex flex-wrap gap-2">
                  {JSON.parse(game.platforms || '[]').map((platform: string) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <ReviewButton />
                <button className="border border-border hover:bg-muted px-5 py-2 rounded-md text-sm font-medium">
                  리스트에 추가
                </button>
              </div>
            </div>
          </div>

          {/* Trailer - Fill height */}
          <div className="relative h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
            {trailer ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${trailer}`}
                title="Game Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                트레일러 없음
              </div>
            )}
          </div>
        </div>

        {/* Review Form Section */}
        <ReviewSection
          gameId={game.id}
          gameName={game.title}
          existingReview={userReview}
        />

        {/* Stats Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3">통계</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rating Stats */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">평점 통계</h3>
              <div className="text-center mb-4">
                <p className="text-xs text-muted-foreground mb-2">전체 평균</p>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-6 h-6 fill-orange-500 text-orange-500" />
                  <span className="text-3xl font-bold">
                    {game.averageRating > 0 ? game.averageRating.toFixed(1) : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {game.totalReviews}개 평가
                </p>
              </div>

              {/* Metacritic Score */}
              {game.metacriticScore && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-white text-lg ${
                      game.metacriticScore >= 75
                        ? 'bg-green-500'
                        : game.metacriticScore >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}>
                      MC
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">메타크리틱 점수</p>
                      <p className={`text-xl font-bold ${
                        game.metacriticScore >= 75
                          ? 'text-green-500'
                          : game.metacriticScore >= 50
                          ? 'text-yellow-500'
                          : 'text-red-500'
                      }`}>
                        {game.metacriticScore}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Steam Info */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">🎮 Steam 정보</h3>
              {steamData?.steamId ? (
                <div className="space-y-4">
                  {/* Current Players */}
                  <div className="pb-3 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">동시 접속자</p>
                    <p className="text-2xl font-bold">
                      {steamData.currentPlayers?.toLocaleString() || '0'}명
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pb-3 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">가격</p>
                    {steamData.priceInfo?.isFree ? (
                      <p className="text-2xl font-bold text-green-500">무료</p>
                    ) : steamData.priceInfo?.discount ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                            -{steamData.priceInfo.discount}%
                          </span>
                          <span className="text-sm line-through text-muted-foreground">
                            ₩{steamData.priceInfo.originalPrice?.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-blue-500">
                          ₩{steamData.priceInfo.finalPrice?.toLocaleString()}
                        </p>
                      </div>
                    ) : steamData.priceInfo?.finalPrice ? (
                      <p className="text-2xl font-bold">₩{steamData.priceInfo.finalPrice.toLocaleString()}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">가격 정보 없음</p>
                    )}
                  </div>

                  {/* Steam Store Link */}
                  <a
                    href={`https://store.steampowered.com/app/${steamData.steamId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-md text-sm font-medium"
                  >
                    Steam에서 보기 →
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Steam 정보를 사용할 수 없습니다</p>
              )}
            </div>

            {/* Other Stores */}
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">다른 구매처</h3>
              <div className="space-y-3">
                {/* PlayStation Store */}
                {JSON.parse(game.platforms || '[]').some((p: string) =>
                  p.includes('PlayStation') || p.includes('PS4') || p.includes('PS5')
                ) && (
                  <a
                    href={`https://store.playstation.com/ko-kr/search/${encodeURIComponent(game.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-md"
                  >
                    <span className="text-sm font-medium">🎯 PlayStation Store</span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </a>
                )}

                {/* Xbox Store */}
                {JSON.parse(game.platforms || '[]').some((p: string) =>
                  p.includes('Xbox')
                ) && (
                  <a
                    href={`https://www.xbox.com/ko-KR/search?q=${encodeURIComponent(game.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-md"
                  >
                    <span className="text-sm font-medium">🎮 Xbox Store</span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </a>
                )}

                {/* Nintendo eShop */}
                {JSON.parse(game.platforms || '[]').some((p: string) =>
                  p.includes('Nintendo')
                ) && (
                  <a
                    href={`https://www.nintendo.co.kr/software/search.html?keyword=${encodeURIComponent(game.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-md"
                  >
                    <span className="text-sm font-medium">🔴 Nintendo eShop</span>
                    <span className="text-xs text-muted-foreground">→</span>
                  </a>
                )}

                {!JSON.parse(game.platforms || '[]').some((p: string) =>
                  p.includes('PlayStation') || p.includes('PS4') || p.includes('PS5') ||
                  p.includes('Xbox') || p.includes('Nintendo')
                ) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    다른 플랫폼 정보 없음
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Game Description */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3">게임 소개</h2>
          <div className="bg-muted/30 rounded-lg p-6">
            {(game.description || steamData?.description) ? (
              <>
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    !isDescriptionExpanded ? 'line-clamp-5' : ''
                  }`}
                >
                  {steamData?.description || game.description}
                </p>
                {(steamData?.description || game.description)?.split('\n').length > 5 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="flex items-center gap-2 mt-4 text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    {isDescriptionExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        접기
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        더 보기
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">게임 설명이 없습니다.</p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">
            리뷰 ({game.totalReviews})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 추천 평가 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">추천 평가</h3>
              <div className="space-y-4">
                {game.reviews && game.reviews.length > 0 ? (
                  [...game.reviews]
                    .sort((a: any, b: any) => b.likesCount - a.likesCount)
                    .slice(0, 3)
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
                            <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
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
                    ))
                ) : (
                  <div className="bg-muted/30 rounded-lg p-8 text-center text-muted-foreground">
                    아직 리뷰가 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 최신 평가 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">최신 평가</h3>
              <div className="space-y-4">
                {game.reviews && game.reviews.length > 0 ? (
                  [...game.reviews]
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3)
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
                      <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
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
                    <p className="text-sm leading-relaxed mb-4">{review.comment}</p>
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
              ))
                ) : (
                  <div className="bg-muted/30 rounded-lg p-8 text-center text-muted-foreground">
                    아직 리뷰가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>

          <Link
            href={`/games/${game.igdbId}/reviews`}
            className="block mt-6 text-center py-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors"
          >
            <div className="flex items-center justify-center gap-2 font-medium text-orange-500">
              <MessageSquare className="w-5 h-5" />
              전체 리뷰 보러가기 ({game.totalReviews}개)
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
