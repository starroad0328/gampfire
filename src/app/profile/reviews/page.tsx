import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Star, Heart, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

interface AllReviewsPageProps {
  searchParams: Promise<{ userId?: string }>
}

export default async function AllReviewsPage({ searchParams }: AllReviewsPageProps) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  const { userId } = params

  // If viewing someone else's reviews, don't require login
  // If viewing own reviews (no userId), require login
  if (!userId && !session?.user?.email) {
    redirect('/login')
  }

  // Get user with all reviews
  let user
  if (userId) {
    // Viewing another user's reviews
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reviews: {
          include: {
            likes: true,
            game: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      redirect('/profile')
    }
  } else {
    // Viewing own reviews
    user = await prisma.user.findUnique({
      where: { email: session!.user!.email },
      include: {
        reviews: {
          include: {
            likes: true,
            game: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!user) {
      redirect('/login')
    }
  }

  const reviewsCount = user.reviews.length
  const backUrl = userId ? `/profile?userId=${userId}` : '/profile'

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          프로필로 돌아가기
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Sidebar - User Profile Card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-card border border-border rounded-lg p-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 bg-muted">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || user.username || '프로필'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {(user.name || user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  {user.name || user.username || '사용자'}
                </h1>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <span className="text-sm text-muted-foreground">총 평가</span>
                  <span className="text-xl font-bold text-foreground">{reviewsCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
                  <span className="text-sm text-muted-foreground">평균 별점</span>
                  <span className="text-xl font-bold text-foreground">
                    {reviewsCount > 0
                      ? (user.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - All Reviews */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              모든 평가 ({reviewsCount})
            </h2>

            {reviewsCount === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>아직 평가한 게임이 없습니다</p>
                <p className="text-sm mt-1">게임을 검색하고 평가를 남겨보세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {user.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-5 bg-secondary/30 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    {/* Game Title */}
                    <Link
                      href={`/games/${review.game.igdbId}`}
                      className="block mb-3 hover:underline"
                    >
                      <h3 className="font-semibold text-lg text-foreground">
                        {review.game.title}
                      </h3>
                    </Link>

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < Math.round(review.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-base font-semibold text-foreground">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
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

                    {/* Detailed Ratings */}
                    {(review.priceRating || review.graphicsRating || review.controlRating || review.directionRating ||
                      review.storyRating || review.soundRating || review.volumeRating || review.innovationRating) && (
                      <div className="mb-3">
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

                    {/* Likes */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      <span>{review.likesCount} 추천</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
