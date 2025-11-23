import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPopularGames, convertIGDBGame } from '@/lib/igdb'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '25')

    console.log(`[API] Fetching recommended games for user ${session.user.id}`)

    // 1. 사용자가 평가한 게임들 조회
    const userReviews = await prisma.review.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        game: true,
      },
    })

    console.log(`[API] User has reviewed ${userReviews.length} games`)

    // 평가한 게임이 없으면 인기 게임 반환
    if (userReviews.length === 0) {
      console.log('[API] No reviews found, returning popular games')
      const games = await getPopularGames(limit, offset)

      const convertedGames = await Promise.all(
        games.map(async (game) => {
          const converted = await convertIGDBGame(game)
          return {
            id: game.id,
            ...converted,
            genres: converted.genres ? JSON.parse(converted.genres) : [],
            platforms: converted.platforms ? JSON.parse(converted.platforms) : [],
            averageRating: 0,
            totalReviews: 0,
          }
        })
      )

      return NextResponse.json({
        games: convertedGames,
        hasMore: convertedGames.length === limit,
      })
    }

    // 2. 장르 및 태그 분석: 평가한 게임들의 장르와 태그를 카운트
    const genreCount: Record<string, number> = {}
    const tagCount: Record<string, number> = {}

    for (const review of userReviews) {
      if (review.game.genres) {
        const genres = JSON.parse(review.game.genres) as string[]
        for (const genre of genres) {
          genreCount[genre] = (genreCount[genre] || 0) + 1
        }
      }

      // 태그 분석 추가
      if (review.game.tags) {
        const tags = JSON.parse(review.game.tags) as string[]
        for (const tag of tags) {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        }
      }
    }

    console.log('[API] Genre analysis:', genreCount)
    console.log('[API] Tag analysis:', tagCount)

    // 3. 가장 많이 평가한 장르 상위 3개 및 태그 상위 5개 추출
    const topGenres = Object.entries(genreCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre)

    const topTags = Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)

    console.log('[API] Top 3 preferred genres:', topGenres)
    console.log('[API] Top 5 preferred tags:', topTags)

    // 장르가 없으면 인기 게임 반환
    if (topGenres.length === 0) {
      console.log('[API] No genres found, returning popular games')
      const games = await getPopularGames(limit, offset)

      const convertedGames = await Promise.all(
        games.map(async (game) => {
          const converted = await convertIGDBGame(game)
          return {
            id: game.id,
            ...converted,
            genres: converted.genres ? JSON.parse(converted.genres) : [],
            platforms: converted.platforms ? JSON.parse(converted.platforms) : [],
            averageRating: 0,
            totalReviews: 0,
          }
        })
      )

      return NextResponse.json({
        games: convertedGames,
        hasMore: convertedGames.length === limit,
      })
    }

    // 4. 이미 평가한 게임 ID 목록
    const reviewedGameIds = new Set(userReviews.map(r => r.game.igdbId))

    // 5. DB에서 태그 기반 추천 게임 찾기
    let recommendedGames: any[] = []

    if (topTags.length > 0) {
      console.log('[API] Querying DB for games with matching tags...')
      // 태그를 포함하는 게임 찾기 (JSON 필드 검색)
      const dbMatchingGames = await prisma.game.findMany({
        where: {
          AND: [
            {
              igdbId: {
                notIn: Array.from(reviewedGameIds)
              }
            },
            {
              tags: {
                not: null
              }
            }
          ]
        },
        orderBy: {
          averageRating: 'desc'
        },
        take: limit * 3,
      })

      // 태그 매칭 점수 계산 및 정렬
      const scoredGames = dbMatchingGames.map(game => {
        const gameTags = game.tags ? JSON.parse(game.tags) as string[] : []
        const gameGenres = game.genres ? JSON.parse(game.genres) as string[] : []

        // 태그 매칭 점수 (더 높은 가중치)
        const tagMatchCount = topTags.filter(tag => gameTags.includes(tag)).length
        // 장르 매칭 점수
        const genreMatchCount = topGenres.filter(genre => gameGenres.includes(genre)).length

        const score = tagMatchCount * 2 + genreMatchCount

        return {
          ...game,
          matchScore: score,
          tagMatches: tagMatchCount,
          genreMatches: genreMatchCount,
        }
      })

      // 매칭 점수 순으로 정렬
      recommendedGames = scoredGames
        .filter(game => game.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit)

      console.log(`[API] Found ${recommendedGames.length} games from DB with tag/genre matches`)
    }

    // 6. DB에서 충분한 게임을 못 찾았으면 IGDB에서 보충
    if (recommendedGames.length < limit) {
      console.log(`[API] Need more games, fetching from IGDB...`)
      const neededCount = limit - recommendedGames.length
      const igdbGames = await getPopularGames(neededCount * 2, offset, topGenres)

      // IGDB 게임 필터링 및 변환
      const filteredIgdbGames = igdbGames.filter(game => !reviewedGameIds.has(game.id))

      for (const igdbGame of filteredIgdbGames.slice(0, neededCount)) {
        const converted = await convertIGDBGame(igdbGame)
        recommendedGames.push({
          igdbId: igdbGame.id,
          ...converted,
          averageRating: 0,
          totalReviews: 0,
          matchScore: 1, // 기본 점수
        })
      }

      console.log(`[API] Added ${filteredIgdbGames.slice(0, neededCount).length} games from IGDB`)
    }

    // 7. 최종 게임 목록 포맷팅
    const convertedGames = recommendedGames.map(game => ({
      id: game.igdbId,
      title: game.title,
      description: game.description,
      coverImage: game.coverImage,
      releaseDate: game.releaseDate,
      platforms: game.platforms ? JSON.parse(game.platforms) : [],
      genres: game.genres ? JSON.parse(game.genres) : [],
      tags: game.tags ? JSON.parse(game.tags) : [],
      developer: game.developer,
      publisher: game.publisher,
      metacriticScore: game.metacriticScore,
      averageRating: game.averageRating || 0,
      totalReviews: game.totalReviews || 0,
    }))

    console.log(`[API] Returning ${convertedGames.length} recommended games`)

    return NextResponse.json({
      games: convertedGames,
      hasMore: recommendedGames.length >= limit,
      preferredGenres: topGenres, // 디버깅용
      preferredTags: topTags, // 디버깅용
    })
  } catch (error) {
    console.error('Recommended games error:', error)
    return NextResponse.json(
      { games: [], hasMore: false, error: 'Failed to fetch recommended games' },
      { status: 500 }
    )
  }
}
