'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameCard } from '@/components/features/game-card'
import { GenreCircle } from '@/components/features/genre-circle'
import { Filter, Flame } from 'lucide-react'

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
        <div className="flex items-center justify-between mb-6">
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
            onClick={() => setShowGenreCircle(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            <Filter className="w-5 h-5" />
            장르별 검색
          </button>
        </div>

        {selectedGenres.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-sm text-muted-foreground">선택된 장르:</span>
            {selectedGenres.map(genre => (
              <span
                key={genre}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {genre}
              </span>
            ))}
            <button
              onClick={() => setSelectedGenres([])}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              초기화
            </button>
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

      {showGenreCircle && (
        <GenreCircle
          onSelectGenres={handleGenreSelect}
          onClose={() => setShowGenreCircle(false)}
        />
      )}
    </div>
  )
}
