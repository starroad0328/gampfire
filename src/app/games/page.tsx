'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameCard } from '@/components/features/game-card'
import { Filter, Flame, Gamepad2, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { translateGenre } from '@/lib/translations'
import Link from 'next/link'

export default function GamesPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'hot' | 'popular' | 'recent' | 'recommended'>('hot')
  const [hotGames, setHotGames] = useState<any[]>([])
  const [popularGames, setPopularGames] = useState<any[]>([])
  const [recentGames, setRecentGames] = useState<any[]>([])
  const [recommendedGames, setRecommendedGames] = useState<any[]>([])
  const [hotOffset, setHotOffset] = useState(0)
  const [popularOffset, setPopularOffset] = useState(0)
  const [recentOffset, setRecentOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasMoreHot, setHasMoreHot] = useState(true)
  const [hasMorePopular, setHasMorePopular] = useState(true)
  const [hasMoreRecent, setHasMoreRecent] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGenreCircle, setShowGenreCircle] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const observerTarget = useRef<HTMLDivElement>(null)

  // 주요 장르 목록
  const mainGenres = [
    { name: 'Action', icon: '⚔️' },
    { name: 'RPG', icon: '🎭' },
    { name: 'Adventure', icon: '🗺️' },
    { name: 'Strategy', icon: '♟️' },
    { name: 'Shooter', icon: '🎯' },
    { name: 'Simulation', icon: '✈️' },
    { name: 'Sports', icon: '⚽' },
    { name: 'Puzzle', icon: '🧩' },
    { name: 'Fighting', icon: '🥊' },
    { name: 'Racing', icon: '🏎️' },
    { name: 'Platform', icon: '🦘' },
    { name: 'Indie', icon: '💡' },
  ]

  const loadGames = useCallback(async (type: 'hot' | 'popular' | 'recent' | 'recommended', offset: number, genres?: string[]) => {
    if (loading) return

    setLoading(true)
    setError(null)
    try {
      let res: Response

      if (type === 'recommended') {
        res = await fetch(`/api/games/recommended`)
      } else if (type === 'hot') {
        res = await fetch(`/api/games/hot?offset=${offset}&limit=25`)
      } else {
        const genreQuery = genres && genres.length > 0 ? `&genres=${genres.join(',')}` : ''
        res = await fetch(`/api/games/list?type=${type}&offset=${offset}&limit=25${genreQuery}`)
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        console.error('API error:', data.error)
        setError(data.error)
        return
      }

      if (!data.games || !Array.isArray(data.games)) {
        console.error('Invalid response format:', data)
        setError('잘못된 응답 형식입니다.')
        return
      }

      if (type === 'hot') {
        setHotGames(prev => {
          const existingIds = new Set(prev.map(g => g.id))
          const newGames = data.games.filter((g: any) => !existingIds.has(g.id))
          return [...prev, ...newGames]
        })
        setHotOffset(offset + 25)
        setHasMoreHot(data.hasMore)
      } else if (type === 'popular') {
        setPopularGames(prev => {
          const existingIds = new Set(prev.map(g => g.id))
          const newGames = data.games.filter((g: any) => !existingIds.has(g.id))
          return [...prev, ...newGames]
        })
        setPopularOffset(offset + 25)
        setHasMorePopular(data.hasMore)
      } else if (type === 'recent') {
        setRecentGames(prev => {
          const existingIds = new Set(prev.map(g => g.id))
          const newGames = data.games.filter((g: any) => !existingIds.has(g.id))
          return [...prev, ...newGames]
        })
        setRecentOffset(offset + 25)
        setHasMoreRecent(data.hasMore)
      } else if (type === 'recommended') {
        setRecommendedGames(data.games)
      }
    } catch (error) {
      console.error('Failed to load games:', error)
      setError('게임을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }, [loading])

  useEffect(() => {
    loadGames('hot', 0)
    loadGames('popular', 0, selectedGenres)
    loadGames('recent', 0, selectedGenres)
    loadGames('recommended', 0)
  }, [])

  useEffect(() => {
    if (selectedGenres.length >= 0) {
      setPopularGames([])
      setRecentGames([])
      setPopularOffset(0)
      setRecentOffset(0)
      setHasMorePopular(true)
      setHasMoreRecent(true)
      loadGames('popular', 0, selectedGenres)
      loadGames('recent', 0, selectedGenres)
    }
  }, [selectedGenres])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading) {
          if (activeTab === 'hot' && hasMoreHot) {
            loadGames('hot', hotOffset)
          } else if (activeTab === 'popular' && hasMorePopular) {
            loadGames('popular', popularOffset, selectedGenres)
          } else if (activeTab === 'recent' && hasMoreRecent) {
            loadGames('recent', recentOffset, selectedGenres)
          }
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [activeTab, loading, hasMoreHot, hasMorePopular, hasMoreRecent, hotOffset, popularOffset, recentOffset, selectedGenres, loadGames])

  const handleGenreSelect = (genres: string[]) => {
    setSelectedGenres(genres)
  }

  const currentHasMore = activeTab === 'hot' ? hasMoreHot
    : activeTab === 'popular' ? hasMorePopular
    : activeTab === 'recent' ? hasMoreRecent
    : false // 추천 탭은 무한 스크롤 없음

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">게임 둘러보기</h1>
        <p className="text-muted-foreground">
          인기 게임과 최신 게임을 확인하고 리뷰를 남겨보세요
        </p>
      </div>

      <Tabs value={activeTab} className="w-full" onValueChange={(val) => setActiveTab(val as 'hot' | 'popular' | 'recent' | 'recommended')}>
        <div className="space-y-4 mb-6">
          <TabsList>
            <TabsTrigger value="hot" className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              HOT
            </TabsTrigger>
            {session && <TabsTrigger value="recommended">추천 게임</TabsTrigger>}
            <TabsTrigger value="popular">인기 게임</TabsTrigger>
            <TabsTrigger value="recent">최신 게임</TabsTrigger>
          </TabsList>

          <button
            onClick={() => setShowGenreCircle(!showGenreCircle)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            <Filter className="w-5 h-5" />
            장르별 검색
          </button>
        </div>

        {/* Genre Selection Section */}
        {showGenreCircle && (
          <div className="mb-6 p-6 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">장르 필터</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedGenres.length > 0
                      ? `${selectedGenres.length}개 장르 선택됨`
                      : '원하는 장르를 선택하세요'}
                  </p>
                </div>
              </div>
              {selectedGenres.length > 0 && (
                <button
                  onClick={() => setSelectedGenres([])}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                >
                  전체 초기화
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mainGenres.map((genre) => {
                const isSelected = selectedGenres.includes(genre.name)
                return (
                  <button
                    key={genre.name}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedGenres(selectedGenres.filter(g => g !== genre.name))
                      } else {
                        setSelectedGenres([...selectedGenres, genre.name])
                      }
                    }}
                    className={`relative group p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/15 shadow-lg shadow-primary/20 scale-[1.02]'
                        : 'border-border/50 bg-background/80 hover:border-primary/60 hover:bg-muted/50 hover:scale-[1.02] hover:shadow-md'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 bg-primary rounded-full p-1 shadow-lg">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col items-center gap-2">
                      <span className={`text-3xl transition-transform ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                        {genre.icon}
                      </span>
                      <span className={`text-sm font-semibold transition-colors ${
                        isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                      }`}>
                        {translateGenre(genre.name)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {selectedGenres.length > 0 && (
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">활성 필터</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedGenres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenres(selectedGenres.filter(g => g !== genre))}
                      className="group px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary rounded-full text-sm font-medium transition-all hover:scale-105 flex items-center gap-1.5"
                    >
                      {translateGenre(genre)}
                      <span className="opacity-60 group-hover:opacity-100">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <TabsContent value="hot">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  loadGames('hot', 0)
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                다시 시도
              </button>
            </div>
          ) : hotGames.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Steam에서 지금 가장 인기 있는 게임들
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
                {hotGames.map((game) => (
                  <GameCard
                    key={game.id}
                    id={game.id.toString()}
                    title={game.title}
                    coverImage={game.coverImage}
                    averageRating={game.averageRating || 0}
                    totalReviews={game.totalReviews || 0}
                    genres={game.genres}
                    platforms={game.platforms}
                    releaseDate={game.releaseDate}
                    isHot={game.isHot}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {loading ? '로딩 중...' : 'Steam 인기 게임 데이터가 없습니다. 배치 작업을 실행해주세요.'}
            </div>
          )}
        </TabsContent>

        {session && (
          <TabsContent value="recommended">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    loadGames('recommended', 0)
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  다시 시도
                </button>
              </div>
            ) : recommendedGames.length > 0 ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    회원님이 평가한 게임을 기반으로 추천드립니다
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
                  {recommendedGames.map((game) => (
                    <GameCard
                      key={game.id}
                      id={game.id.toString()}
                      title={game.title}
                      coverImage={game.coverImage}
                      averageRating={game.averageRating || 0}
                      totalReviews={game.totalReviews || 0}
                      genres={game.genres}
                      platforms={game.platforms}
                      releaseDate={game.releaseDate}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {loading ? '로딩 중...' : '추천할 게임이 없습니다. 온보딩에서 게임을 평가해보세요!'}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="popular">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  loadGames('popular', 0, selectedGenres)
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                다시 시도
              </button>
            </div>
          ) : popularGames.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
              {popularGames.map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id.toString()}
                  title={game.title}
                  coverImage={game.coverImage}
                  averageRating={game.averageRating || 0}
                  totalReviews={game.totalReviews || 0}
                  genres={game.genres}
                  platforms={game.platforms}
                  releaseDate={game.releaseDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {loading ? '로딩 중...' : '게임을 불러올 수 없습니다.'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recent">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  loadGames('recent', 0, selectedGenres)
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                다시 시도
              </button>
            </div>
          ) : recentGames.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
              {recentGames.map((game) => (
                <GameCard
                  key={game.id}
                  id={game.id.toString()}
                  title={game.title}
                  coverImage={game.coverImage}
                  averageRating={game.averageRating || 0}
                  totalReviews={game.totalReviews || 0}
                  genres={game.genres}
                  platforms={game.platforms}
                  releaseDate={game.releaseDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {loading ? '로딩 중...' : '게임을 불러올 수 없습니다.'}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {currentHasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          {loading && <div className="text-muted-foreground">로딩 중...</div>}
        </div>
      )}
    </div>
  )
}
