import { prisma } from '@/lib/prisma'
import { getPopularGames, convertIGDBGame } from '@/lib/igdb'

// 협업 필터링: 유사 사용자 찾기
async function findSimilarUsers(userId: string, userReviews: any[]) {
  const userRatings = new Map<string, number>()
  for (const review of userReviews) {
    userRatings.set(review.gameId, review.rating)
  }

  const otherReviews = await prisma.review.findMany({
    where: {
      gameId: { in: Array.from(userRatings.keys()) },
      userId: { not: userId }
    },
    select: { userId: true, gameId: true, rating: true }
  })

  const userSimilarity = new Map<string, { score: number, commonGames: number }>()
  const otherUserRatings = new Map<string, Map<string, number>>()

  for (const review of otherReviews) {
    if (!otherUserRatings.has(review.userId)) {
      otherUserRatings.set(review.userId, new Map())
    }
    otherUserRatings.get(review.userId)!.set(review.gameId, review.rating)
  }

  for (const [otherUserId, otherRatings] of otherUserRatings) {
    let sumDiffSq = 0
    let commonCount = 0

    for (const [gameId, myRating] of userRatings) {
      const otherRating = otherRatings.get(gameId)
      if (otherRating !== undefined) {
        sumDiffSq += Math.pow(myRating - otherRating, 2)
        commonCount++
      }
    }

    if (commonCount >= 3) {
      const avgDiff = Math.sqrt(sumDiffSq / commonCount)
      const similarityScore = (1 / (1 + avgDiff)) * Math.log(commonCount + 1)
      userSimilarity.set(otherUserId, { score: similarityScore, commonGames: commonCount })
    }
  }

  return Array.from(userSimilarity.entries())
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 20)
}

// 유사 사용자 기반 추천 게임 찾기
async function getCollaborativeRecommendations(
  similarUsers: [string, { score: number, commonGames: number }][],
  reviewedGameIds: Set<number | null>,
  limit: number
) {
  if (similarUsers.length === 0) return []

  const similarUserIds = similarUsers.map(([id]) => id)
  const similarityScores = new Map(similarUsers)

  const candidateReviews = await prisma.review.findMany({
    where: {
      userId: { in: similarUserIds },
      rating: { gte: 3.5 },
      game: {
        igdbId: { notIn: Array.from(reviewedGameIds).filter((id): id is number => id !== null) }
      }
    },
    include: { game: true }
  })

  const gameScores = new Map<string, { game: any, score: number, reviewCount: number }>()

  for (const review of candidateReviews) {
    const similarity = similarityScores.get(review.userId)
    if (!similarity) continue

    const gameId = review.gameId
    const existing = gameScores.get(gameId)
    const ratingContribution = similarity.score * ((review.rating - 2.5) / 2.5)

    if (existing) {
      existing.score += ratingContribution
      existing.reviewCount++
    } else {
      gameScores.set(gameId, { game: review.game, score: ratingContribution, reviewCount: 1 })
    }
  }

  return Array.from(gameScores.values())
    .filter(g => g.reviewCount >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(g => ({ ...g.game, collaborativeScore: g.score, similarUserReviews: g.reviewCount }))
}

export async function getRecommendedGamesForUser(userId: string, limit: number = 10) {
  try {
    console.log(`[Recommendations] Fetching recommended games for user ${userId}`)

    // 1. 사용자가 평가한 게임들 조회
    const userReviews = await prisma.review.findMany({
      where: { userId },
      include: { game: true },
    })

    console.log(`[Recommendations] User has reviewed ${userReviews.length} games`)

    // 평가한 게임이 없으면 인기 게임 반환
    if (userReviews.length === 0) {
      console.log('[Recommendations] No reviews found, returning popular games')
      const games = await getPopularGames(limit)

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

      return {
        games: convertedGames,
        hasMore: convertedGames.length === limit,
      }
    }

    // 2. 장르 및 태그 분석 (평점 가중치 적용)
    const genreCount: Record<string, number> = {}
    const tagCount: Record<string, number> = {}

    for (const review of userReviews) {
      const ratingWeight = review.rating >= 4 ? 2 : review.rating >= 3 ? 1 : review.rating >= 2.5 ? 0 : -1

      if (review.game.genres) {
        const genres = JSON.parse(review.game.genres) as string[]
        for (const genre of genres) {
          genreCount[genre] = (genreCount[genre] || 0) + ratingWeight
        }
      }

      if (review.game.tags) {
        const tags = JSON.parse(review.game.tags) as string[]
        for (const tag of tags) {
          tagCount[tag] = (tagCount[tag] || 0) + ratingWeight
        }
      }
    }

    console.log('[Recommendations] Genre analysis (weighted):', genreCount)
    console.log('[Recommendations] Tag analysis (weighted):', tagCount)

    // 3. 상위 장르/태그 추출
    const topGenres = Object.entries(genreCount)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([genre]) => genre)

    const topTags = Object.entries(tagCount)
      .filter(([, score]) => score > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)

    const dislikedGenres = Object.entries(genreCount)
      .filter(([, score]) => score < 0)
      .map(([genre]) => genre)

    console.log('[Recommendations] Disliked genres:', dislikedGenres)
    console.log('[Recommendations] Top 3 preferred genres:', topGenres)
    console.log('[Recommendations] Top 5 preferred tags:', topTags)

    if (topGenres.length === 0) {
      console.log('[Recommendations] No genres found, returning popular games')
      const games = await getPopularGames(limit)

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

      return {
        games: convertedGames,
        hasMore: convertedGames.length === limit,
      }
    }

    // 4. 이미 평가한 게임 ID 목록
    const reviewedGameIds = new Set(userReviews.map(r => r.game.igdbId))

    // 5. 협업 필터링: 유사 사용자 찾기
    console.log('[Recommendations] Finding similar users for collaborative filtering...')
    const similarUsers = await findSimilarUsers(userId, userReviews)
    console.log(`[Recommendations] Found ${similarUsers.length} similar users`)

    // 6. 협업 필터링 기반 추천 (60%)
    const collaborativeGames = await getCollaborativeRecommendations(
      similarUsers,
      reviewedGameIds,
      Math.ceil(limit * 0.6)
    )
    console.log(`[Recommendations] Collaborative filtering found ${collaborativeGames.length} games`)

    // 7. 태그 기반 추천 (나머지 40%)
    let tagBasedGames: any[] = []
    const collaborativeGameIds = new Set(collaborativeGames.map(g => g.igdbId))
    const contentBasedLimit = limit - collaborativeGames.length

    if (topTags.length > 0 && contentBasedLimit > 0) {
      console.log('[Recommendations] Querying DB for games with matching tags...')
      const dbMatchingGames = await prisma.game.findMany({
        where: {
          AND: [
            {
              igdbId: {
                notIn: [...Array.from(reviewedGameIds), ...Array.from(collaborativeGameIds)]
                  .filter((id): id is number => id !== null)
              }
            },
            { tags: { not: null } }
          ]
        },
        orderBy: { averageRating: 'desc' },
        take: contentBasedLimit * 3,
      })

      const scoredGames = dbMatchingGames.map(game => {
        const gameTags = game.tags ? JSON.parse(game.tags) as string[] : []
        const gameGenres = game.genres ? JSON.parse(game.genres) as string[] : []

        const hasDislikedGenre = dislikedGenres.some(genre => gameGenres.includes(genre))
        if (hasDislikedGenre) {
          return { ...game, matchScore: -1, tagMatches: 0, genreMatches: 0 }
        }

        const tagMatchCount = topTags.filter(tag => gameTags.includes(tag)).length
        const genreMatchCount = topGenres.filter(genre => gameGenres.includes(genre)).length
        const score = tagMatchCount * 2 + genreMatchCount

        return { ...game, matchScore: score, tagMatches: tagMatchCount, genreMatches: genreMatchCount }
      })

      tagBasedGames = scoredGames
        .filter(game => game.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, contentBasedLimit)

      console.log(`[Recommendations] Found ${tagBasedGames.length} games from DB with tag/genre matches`)
    }

    // 8. 결과 합치기
    let recommendedGames = [...collaborativeGames, ...tagBasedGames]

    // 9. IGDB에서 보충
    if (recommendedGames.length < limit) {
      console.log('[Recommendations] Need more games, fetching from IGDB...')
      const neededCount = limit - recommendedGames.length
      const igdbGames = await getPopularGames(neededCount * 3, 0, topGenres)

      const existingIds = new Set(recommendedGames.map(g => g.igdbId))
      const filteredIgdbGames = igdbGames.filter(
        game => !reviewedGameIds.has(game.id) && !existingIds.has(game.id)
      )

      let addedCount = 0
      for (const igdbGame of filteredIgdbGames) {
        if (addedCount >= neededCount) break

        const converted = await convertIGDBGame(igdbGame)
        const gameGenres = converted.genres ? JSON.parse(converted.genres) as string[] : []

        const hasDislikedGenre = dislikedGenres.some(genre => gameGenres.includes(genre))
        if (hasDislikedGenre) {
          console.log(`[Recommendations] Skipping ${converted.title} - contains disliked genre`)
          continue
        }

        recommendedGames.push({
          ...converted,
          averageRating: 0,
          totalReviews: 0,
          matchScore: 1,
        })
        addedCount++
      }

      console.log(`[Recommendations] Added ${addedCount} games from IGDB`)
    }

    // 10. 최종 포맷팅
    const convertedGames = recommendedGames.map(game => ({
      id: game.igdbId,
      title: game.title,
      description: game.description,
      coverImage: game.coverImage,
      releaseDate: game.releaseDate,
      platforms: game.platforms ? (typeof game.platforms === 'string' ? JSON.parse(game.platforms) : game.platforms) : [],
      genres: game.genres ? (typeof game.genres === 'string' ? JSON.parse(game.genres) : game.genres) : [],
      tags: game.tags ? (typeof game.tags === 'string' ? JSON.parse(game.tags) : game.tags) : [],
      developer: game.developer,
      publisher: game.publisher,
      metacriticScore: game.metacriticScore,
      averageRating: game.averageRating || 0,
      totalReviews: game.totalReviews || 0,
      recommendReason: game.collaborativeScore
        ? 'collaborative'
        : game.matchScore > 1
          ? 'content-based'
          : 'popular',
    }))

    console.log(`[Recommendations] Returning ${convertedGames.length} recommended games`)
    console.log(`[Recommendations] Breakdown: ${collaborativeGames.length} collaborative, ${tagBasedGames.length} content-based`)

    return {
      games: convertedGames.slice(0, limit),
      hasMore: false,
      preferredGenres: topGenres,
      preferredTags: topTags,
      similarUsersCount: similarUsers.length,
    }
  } catch (error) {
    console.error('[Recommendations] Error:', error)
    return {
      games: [],
      hasMore: false,
      error: 'Failed to fetch recommended games'
    }
  }
}
