import { NextRequest, NextResponse } from 'next/server'
import { getGameById, convertIGDBGame } from '@/lib/igdb'
import { extractSteamId, getCurrentPlayers, getSteamPriceInfo, getSteamMetacritic, getSteamReviews, getSteamGameDescription, getSteamTags } from '@/lib/steam'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 10분마다 캐시 갱신
export const revalidate = 600

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const igdbId = parseInt(id)

    // Get current user session
    const session = await getServerSession(authOptions)

    if (isNaN(igdbId)) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      )
    }

    // Fetch game from IGDB (for Steam ID)
    const igdbGame = await getGameById(igdbId)

    if (!igdbGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Check if game exists in our database
    let game = await prisma.game.findUnique({
      where: { igdbId },
      include: {
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            likesCount: true,
            priceRating: true,
            graphicsRating: true,
            controlRating: true,
            directionRating: true,
            storyRating: true,
            soundRating: true,
            volumeRating: true,
            innovationRating: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                role: true,
              },
            },
            likes: session?.user?.id
              ? {
                  where: {
                    userId: session.user.id,
                  },
                  select: {
                    type: true,
                  },
                }
              : false,
          },
        },
      },
    })

    // Get Steam data if available (before creating game to get Metacritic score)
    const steamId = extractSteamId(igdbGame)
    let steamData = null
    let steamMetacriticScore: number | null = null
    let steamTags: string[] | null = null

    if (steamId) {
      const [currentPlayers, priceInfo, metacritic, reviews, description, tags] = await Promise.all([
        getCurrentPlayers(steamId),
        getSteamPriceInfo(steamId),
        getSteamMetacritic(steamId),
        getSteamReviews(steamId),
        getSteamGameDescription(steamId),
        getSteamTags(steamId),
      ])

      steamTags = tags

      // Transform price info to match frontend expectations
      let transformedPriceInfo = null
      if (priceInfo) {
        transformedPriceInfo = {
          originalPrice: Math.round(priceInfo.initialPrice / 100), // Convert cents to KRW
          finalPrice: Math.round(priceInfo.finalPrice / 100),
          discount: priceInfo.discountPercent,
          isFree: priceInfo.isFree,
        }
      }

      // Transform reviews to match frontend expectations
      let transformedReviews = null
      if (reviews && reviews.totalReviews > 0) {
        const positivePercent = Math.round(
          (reviews.totalPositive / reviews.totalReviews) * 100
        )
        transformedReviews = {
          total: reviews.totalReviews,
          positivePercent,
          scoreDesc: reviews.reviewScoreDesc,
        }
      }

      steamData = {
        steamId,
        currentPlayers,
        priceInfo: transformedPriceInfo,
        metacritic,
        reviews: transformedReviews,
        description,
      }

      steamMetacriticScore = metacritic?.score || null
      if (steamMetacriticScore) {
        console.log(`✅ Got Metacritic score from Steam for [${igdbGame.name}]: ${steamMetacriticScore}`)
      }
      if (description) {
        console.log(`✅ Got Korean description from Steam for [${igdbGame.name}]`)
      }
    }

    // If not in our DB, save it with Steam Metacritic score if available
    if (!game) {
      const gameData = await convertIGDBGame(igdbGame, steamMetacriticScore, steamTags)

      try {
        game = await prisma.game.create({
          data: gameData,
          include: {
            reviews: {
              take: 5,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                likesCount: true,
                priceRating: true,
                graphicsRating: true,
                controlRating: true,
                directionRating: true,
                storyRating: true,
                soundRating: true,
                volumeRating: true,
                innovationRating: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                    role: true,
                  },
                },
                likes: session?.user?.id
                  ? {
                      where: {
                        userId: session.user.id,
                      },
                      select: {
                        type: true,
                      },
                    }
                  : false,
              },
            },
          },
        })
      } catch (error: any) {
        // Race condition: Another request created this game at the same time
        if (error.code === 'P2002') {
          console.log(`⚠️ Race condition detected for game ${igdbId}, fetching existing game...`)
          game = await prisma.game.findUnique({
            where: { igdbId },
            include: {
              reviews: {
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  createdAt: true,
                  likesCount: true,
                  priceRating: true,
                  graphicsRating: true,
                  controlRating: true,
                  directionRating: true,
                  storyRating: true,
                  soundRating: true,
                  volumeRating: true,
                  innovationRating: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      username: true,
                      image: true,
                      role: true,
                    },
                  },
                  likes: session?.user?.id
                    ? {
                        where: {
                          userId: session.user.id,
                        },
                        select: {
                          type: true,
                        },
                      }
                    : false,
                },
              },
            },
          })

          if (!game) {
            throw new Error('Failed to fetch game after race condition')
          }
        } else {
          throw error
        }
      }
    } else if (steamData?.metacritic && game.metacriticScore !== steamData.metacritic.score) {
      // Update existing game's Metacritic score if Steam has it and it's different
      console.log(`🎯 Updating Metacritic score for [${game.title}]: ${game.metacriticScore} → ${steamData.metacritic.score}`)
      game = await prisma.game.update({
        where: { id: game.id },
        data: { metacriticScore: steamData.metacritic.score },
        include: {
          reviews: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              likesCount: true,
              priceRating: true,
              graphicsRating: true,
              controlRating: true,
              directionRating: true,
              storyRating: true,
              soundRating: true,
              volumeRating: true,
              innovationRating: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  role: true,
                },
              },
              likes: session?.user?.id
                ? {
                    where: {
                      userId: session.user.id,
                    },
                    select: {
                      type: true,
                    },
                  }
                : false,
            },
          },
        },
      })
    }

    // Get video trailer (YouTube)
    let trailer = null
    if (igdbGame.videos && igdbGame.videos.length > 0) {
      // 제외할 키워드 (개발일기, 비하인드 등)
      const excludeKeywords = ['developer diary', 'behind the scenes', 'making of', 'dev diary', 'developer log', 'dev log']

      // 필터링된 비디오 목록
      const filteredVideos = igdbGame.videos.filter((video: any) =>
        !excludeKeywords.some(keyword => video.name?.toLowerCase().includes(keyword))
      )

      // 우선순위 높은 트레일러 키워드
      const highPriorityKeywords = ['launch trailer', 'cinematic trailer', 'announcement trailer', 'reveal trailer', 'official trailer']
      const mediumPriorityKeywords = ['trailer', 'announcement', 'reveal']

      // 1순위: Launch/Cinematic/Announcement/Reveal Trailer
      let selectedVideo = filteredVideos.find((video: any) =>
        highPriorityKeywords.some(keyword => video.name?.toLowerCase().includes(keyword))
      )

      // 2순위: 일반 Trailer
      if (!selectedVideo) {
        selectedVideo = filteredVideos.find((video: any) =>
          mediumPriorityKeywords.some(keyword => video.name?.toLowerCase().includes(keyword))
        )
      }

      // 3순위: 필터링된 첫 번째 비디오
      if (!selectedVideo && filteredVideos.length > 0) {
        selectedVideo = filteredVideos[0]
      }

      // 4순위: 원본 첫 번째 비디오
      if (!selectedVideo) {
        selectedVideo = igdbGame.videos[0]
      }

      trailer = selectedVideo.video_id
    }

    // Get current user's review if logged in
    let userReview = null
    if (session?.user?.email && game) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      })

      if (user) {
        userReview = await prisma.review.findFirst({
          where: {
            gameId: game.id,
            userId: user.id,
          },
        })
      }
    }

    // Transform reviews to include userVote field
    const transformedGame = game ? {
      ...game,
      reviews: game.reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        likesCount: review.likesCount,
        priceRating: review.priceRating,
        graphicsRating: review.graphicsRating,
        controlRating: review.controlRating,
        directionRating: review.directionRating,
        storyRating: review.storyRating,
        soundRating: review.soundRating,
        volumeRating: review.volumeRating,
        innovationRating: review.innovationRating,
        user: review.user,
        userVote: review.likes && review.likes.length > 0 ? review.likes[0].type : null,
      }))
    } : null

    return NextResponse.json({
      game: transformedGame,
      steamData,
      trailer,
      userReview,
    })
  } catch (error) {
    console.error('Game fetch error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Failed to fetch game',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
