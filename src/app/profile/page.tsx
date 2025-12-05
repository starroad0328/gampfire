import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Calendar, Heart, Star, Gamepad2, Shield, Settings, Users } from 'lucide-react'
import { ProfileAvatarEditor } from '@/components/features/profile-avatar-editor'
import { getUserOwnedGames } from '@/lib/steam'
import { UserBadge } from '@/components/ui/user-badge'
import { SteamLinkMessage } from '@/components/features/steam-link-message'
import { SteamAccountSection } from '@/components/features/steam-account-section'
import { FollowButton } from '@/components/features/follow-button'
import { StarRating } from '@/components/ui/star-rating'

interface ProfilePageProps {
  searchParams: Promise<{ userId?: string }>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const session = await getServerSession(authOptions)
  const params = await searchParams
  const { userId } = params

  // If viewing someone else's profile, don't require login
  // If viewing own profile (no userId), require login
  if (!userId && !session?.user?.email) {
    redirect('/login')
  }

  // Determine which user to show
  let user
  if (userId) {
    // Viewing another user's profile
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        reviews: {
          include: {
            likes: true,
            game: true,
          },
        },
      },
    })

    if (!user) {
      redirect('/profile')
    }
  } else {
    // Viewing own profile
    user = await prisma.user.findUnique({
      where: { email: session!.user!.email! },
      include: {
        reviews: {
          include: {
            likes: true,
            game: true,
          },
        },
      },
    })

    if (!user) {
      redirect('/login')
    }
  }

  // Check if viewing own profile
  const isOwnProfile = session?.user?.email === user.email

  // Check if current user is following this profile
  let isFollowing = false
  if (session && !isOwnProfile) {
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    })

    if (currentUser) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        },
      })
      isFollowing = !!follow
    }
  }

  // Calculate stats
  const reviewsCount = user.reviews.length
  const totalLikesReceived = user.reviews.reduce((sum, review) => sum + review.likesCount, 0)
  const joinDate = new Date(user.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Get follower and following counts
  const followersCount = await prisma.follow.count({
    where: { followingId: user.id },
  })
  const followingCount = await prisma.follow.count({
    where: { followerId: user.id },
  })

  // Get Steam game count if Steam is linked
  let steamGameCount: number | null = null
  if (user.steamId) {
    const ownedGames = await getUserOwnedGames(user.steamId)
    steamGameCount = ownedGames?.gameCount || null
  }

  // Check if user is admin
  const isAdmin = user.email === process.env.ADMIN_EMAIL?.trim()

  return (
    <div className="min-h-screen bg-background">
      <SteamLinkMessage />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Profile Info */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
              {/* Profile Picture */}
              <div className="flex flex-col items-center mb-6">
                <div className="mb-4">
                  {isOwnProfile ? (
                    <ProfileAvatarEditor
                      currentImage={user.image}
                      name={user.name}
                      username={user.username}
                      email={user.email}
                      hasSteamLinked={!!user.steamId}
                    />
                  ) : (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || user.username || '사용자'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                          {(user.name || user.username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.name || user.username || '사용자'}
                  </h1>
                  <UserBadge role={user.role} size="md" />
                </div>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="mb-4 px-4 py-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-foreground">{user.bio}</p>
                </div>
              )}

              {/* Preferred Platform */}
              {user.preferredPlatform && (
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{user.preferredPlatform}</span>
                </div>
              )}

              {/* Follow Button (for other users) */}
              {!isOwnProfile && session && (
                <div className="mb-4">
                  <FollowButton targetUserId={user.id} initialFollowing={isFollowing} />
                </div>
              )}

              {/* Settings Button */}
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="flex items-center justify-center gap-2 w-full mb-4 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors font-medium"
                >
                  <Settings className="w-4 h-4" />
                  계정 설정
                </Link>
              )}

              {/* Stats */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">팔로워 · 팔로잉</p>
                    <p className="text-2xl font-bold text-foreground">
                      {followersCount.toLocaleString()} · {followingCount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {steamGameCount !== null && (
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Gamepad2 className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">보유 Steam 게임</p>
                      <p className="text-2xl font-bold text-foreground">{steamGameCount.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">평가한 게임</p>
                    <p className="text-2xl font-bold text-foreground">{reviewsCount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">받은 추천</p>
                    <p className="text-2xl font-bold text-foreground">{totalLikesReceived}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">가입일</p>
                    <p className="text-sm font-medium text-foreground">{joinDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Reviews & Activity */}
          <div className="flex-1 space-y-6">
            {/* Admin Panel - Only visible to admins viewing their own profile */}
            {isOwnProfile && isAdmin && (
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-2 border-purple-500/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">관리자 패널</h2>
                    <p className="text-sm text-muted-foreground">사용자 관리 및 배지 부여</p>
                  </div>
                </div>
                <Link
                  href="/admin/users"
                  className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 rounded-md font-medium transition-colors"
                >
                  관리자 페이지 열기 →
                </Link>
              </div>
            )}

            {/* Steam Account Section */}
            {isOwnProfile && (
              <SteamAccountSection
                steamId={user.steamId}
                steamUsername={user.steamUsername}
              />
            )}

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">최근 평가</h2>
                {reviewsCount > 3 && (
                  <Link
                    href={userId ? `/profile/reviews?userId=${userId}` : '/profile/reviews'}
                    className="text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    모든 평가 보기 ({reviewsCount})
                  </Link>
                )}
              </div>

              {reviewsCount === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>아직 평가한 게임이 없습니다</p>
                  <p className="text-sm mt-1">게임을 검색하고 평가를 남겨보세요!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {user.reviews
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((review) => (
                      <div
                        key={review.id}
                        className="p-4 bg-secondary/30 rounded-lg border border-border"
                      >
                        {/* Game Title */}
                        <Link
                          href={`/games/${review.game.igdbId}`}
                          className="block mb-3 hover:underline"
                        >
                          <h3 className="font-semibold text-foreground">
                            {review.game.title}
                          </h3>
                        </Link>

                        <div className="flex items-start justify-between mb-2">
                          <StarRating rating={review.rating} size="sm" showNumber />
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{review.comment}</p>
                        )}

                        {/* Detailed Ratings */}
                        {(review.priceRating || review.graphicsRating || review.controlRating || review.directionRating ||
                          review.storyRating || review.soundRating || review.volumeRating || review.innovationRating) && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-2 text-xs">
                              {review.priceRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">💰 가격</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.priceRating % 1 === 0 ? review.priceRating : review.priceRating.toFixed(1)}</span>
                                </div>
                              )}
                              {review.graphicsRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">🎨 그래픽</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.graphicsRating % 1 === 0 ? review.graphicsRating : review.graphicsRating.toFixed(1)}</span>
                                </div>
                              )}
                              {review.controlRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">🎮 조작감</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.controlRating % 1 === 0 ? review.controlRating : review.controlRating.toFixed(1)}</span>
                                </div>
                              )}
                              {review.directionRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">🎬 연출</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.directionRating % 1 === 0 ? review.directionRating : review.directionRating.toFixed(1)}</span>
                                </div>
                              )}
                              {review.storyRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">📖 스토리</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.storyRating % 1 === 0 ? review.storyRating : review.storyRating.toFixed(1)}</span>
                                </div>
                              )}
                              {review.soundRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">🎵 OST</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.soundRating % 1 === 0 ? review.soundRating : review.soundRating.toFixed(1)}</span>
                                </div>
                              )}
                              {review.volumeRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">📦 볼륨</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.volumeRating % 1 === 0 ? review.volumeRating : review.volumeRating.toFixed(1)}</span>
                                </div>
                              )}
                              {review.innovationRating && (
                                <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                  <span className="text-muted-foreground">💡 혁신성</span>
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{review.innovationRating % 1 === 0 ? review.innovationRating : review.innovationRating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Heart className="w-3 h-3" />
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
    </div>
  )
}
