import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Sparkles, Settings2 } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPopularGames as getPopularGamesAPI } from '@/lib/igdb'
import { getRecommendedGamesForUser } from '@/lib/recommendations'
import { translateGenre } from '@/lib/translations'

async function getPopularGames() {
  try {
    // 캐싱된 데이터 사용 (30개로 축소)
    const games = await getPopularGamesAPI(30, 0)

    return games.map((game: any) => ({
      id: game.id,
      name: game.name,
      cover: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_cover_big')}` : null,
    }))
  } catch (error) {
    console.error('❌ Failed to fetch popular games:', error)
    return []
  }
}

async function getRecommendedGames(userId: string) {
  try {
    const result = await getRecommendedGamesForUser(userId, 4)
    const games = result.games || []
    return games
  } catch (error) {
    console.error('❌ Failed to fetch recommended games:', error)
    return []
  }
}

// 페이지 캐싱 설정 (1시간)
export const revalidate = 3600

export default async function Home() {
  const session = await getServerSession(authOptions)

  // 병렬로 데이터 가져오기
  const [games, recommendedGames] = await Promise.all([
    getPopularGames(),
    session?.user?.id ? getRecommendedGames(session.user.id) : Promise.resolve([])
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section with Game Covers Background */}
      <section className="relative overflow-hidden py-20">
        {/* Background Game Covers */}
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-14 gap-2 opacity-40">
            {games.map((game: any, index: number) => (
              <div key={game.id} className={`aspect-[3/4] relative ${index >= 15 ? 'hidden md:block' : ''}`}>
                {game.cover && (
                  <Image
                    src={game.cover}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                    priority={index < 20}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/75 to-background" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              신뢰할 수 있는
              <br />
              게임 평가 플랫폼
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              원터치 별점과 숏 코멘트로 간편하게.
              <br />
              인증 시스템으로 신뢰도 높게.
            </p>
            <div className="flex gap-4 justify-center">
              {!session && (
                <Button size="lg" asChild>
                  <Link href="/games">시작하기</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            지금 바로 시작하세요
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* 취향 찾기 */}
            <Link href="/onboarding" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Settings2 className="w-12 h-12 mb-4 text-primary mx-auto" />
                  <CardTitle className="text-2xl text-center">취향 찾기</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    10개 게임을 평가하고 당신의 취향을 분석해보세요.
                    맞춤형 게임 추천을 받을 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* 게임 평가하러 가기 */}
            <Link href="/games" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Star className="w-12 h-12 mb-4 text-primary mx-auto" />
                  <CardTitle className="text-2xl text-center">게임 평가하러 가기</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center">
                    수많은 게임을 둘러보고 별점과 코멘트로 평가해보세요.
                    당신의 취향에 맞는 게임을 발견할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Recommended Games Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">
                {session ? `${session.user?.name}님을 위한 추천 게임` : '추천 게임'}
              </h2>
            </div>
            {session && recommendedGames.length > 0 && (
              <Button variant="outline" asChild>
                <Link href="/games?tab=recommended">더 보기</Link>
              </Button>
            )}
          </div>

          {session === null || session === undefined ? (
            <div className="max-w-md mx-auto text-center">
              <Card className="p-8">
                <CardContent className="space-y-4">
                  <Sparkles className="w-16 h-16 text-muted-foreground mx-auto" />
                  <h3 className="text-xl font-semibold">로그인이 필요합니다</h3>
                  <p className="text-muted-foreground">
                    회원가입하고 게임을 평가하면 당신의 취향에 맞는 게임을 추천해드립니다.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/login">로그인하기</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : recommendedGames.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {recommendedGames.slice(0, 4).map((game: any) => (
                <Link
                  key={game.id}
                  href={`/games/${game.id}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                    <div className="aspect-[3/4] relative bg-muted">
                      {game.coverImage && (
                        <Image
                          src={game.coverImage}
                          alt={game.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                        {game.title}
                      </h3>
                      {game.averageRating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{game.averageRating.toFixed(1)}</span>
                          <span>({game.totalReviews})</span>
                        </div>
                      )}
                      {game.genres && game.genres.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game.genres.slice(0, 2).map((genre: string) => (
                            <span
                              key={genre}
                              className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                            >
                              {translateGenre(genre)}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto text-center">
              <Card className="p-8">
                <CardContent className="space-y-4">
                  <Sparkles className="w-16 h-16 text-muted-foreground mx-auto" />
                  <h3 className="text-xl font-semibold">추천할 게임이 없습니다</h3>
                  <p className="text-muted-foreground">
                    게임을 평가하면 당신의 취향에 맞는 게임을 추천해드립니다.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/games">게임 평가하러 가기</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
