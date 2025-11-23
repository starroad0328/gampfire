import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Users } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getPopularGames() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/games/list?type=popular&limit=60`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      console.error('❌ Popular games API failed:', response.status)
      return []
    }

    const data = await response.json()
    const games = data.games || []
    console.log('✅ Loaded', games.length, 'popular games from API')

    return games.map((game: any) => ({
      id: game.igdbId,
      name: game.title,
      cover: game.coverImage,
    }))
  } catch (error) {
    console.error('❌ Failed to fetch popular games:', error)
    return []
  }
}

export default async function Home() {
  const games = await getPopularGames()
  const session = await getServerSession(authOptions)
  console.log('🎮 Loaded games for background:', games.length)

  return (
    <div className="min-h-screen">
      {/* Hero Section with Game Covers Background */}
      <section className="relative overflow-hidden py-20">
        {/* Background Game Covers */}
        <div className="absolute inset-0 z-0">
          <div className="grid grid-cols-6 md:grid-cols-10 lg:grid-cols-14 xl:grid-cols-16 gap-2 opacity-40">
            {games.map((game, index) => (
              <div key={game.id} className="aspect-[3/4] relative">
                {game.cover && (
                  <Image
                    src={game.cover}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="150px"
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
              <Button size="lg" asChild>
                <Link href="/games">게임 둘러보기</Link>
              </Button>
              {!session && (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/signup">시작하기</Link>
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
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Link href="/games" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Star className="w-12 h-12 mb-4 text-primary" />
                  <CardTitle className="text-2xl">게임 평가하러 가기</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    수많은 게임을 둘러보고 별점과 코멘트로 평가해보세요.
                    당신의 취향에 맞는 게임을 발견할 수 있습니다.
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/communities" className="block">
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <Users className="w-12 h-12 mb-4 text-primary" />
                  <CardTitle className="text-2xl">동아리 (커뮤니티)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    같은 게임을 좋아하는 사람들과 함께 이야기하고 정보를 공유하세요.
                    다양한 게임 동아리에 참여해보세요.
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
