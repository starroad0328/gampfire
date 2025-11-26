import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSteamTopSellers, getSteamMostPlayed, calculateHotScore } from '@/lib/steam'
import { searchGames, getGameById, convertIGDBGame, searchGameBySteamId } from '@/lib/igdb'

// 배치 작업 보안을 위한 시크릿 키 (환경 변수로 설정)
const BATCH_SECRET = process.env.BATCH_SECRET || 'dev-batch-secret'

/**
 * Steam App ID로 IGDB 게임 찾기
 */
async function findIgdbGameBySteamId(steamAppId: number, steamName: string): Promise<number | null> {
  try {
    // 1. IGDB에서 Steam URL로 직접 검색 (가장 정확)
    const gameByUrl = await searchGameBySteamId(steamAppId)
    if (gameByUrl) {
      console.log(`✅ Found by Steam URL: ${steamName} → IGDB ${gameByUrl}`)
      return gameByUrl
    }

    // 2. 이름으로 검색 (fallback)
    if (steamName) {
      // 이름 정규화: 특수문자 제거, 소문자 변환
      const normalizedName = steamName
        .replace(/[™®©]/g, '')
        .replace(/[:：]/g, ' ')
        .trim()

      const games = await searchGames(normalizedName, 10)

      // 정확한 매칭 찾기
      for (const game of games) {
        const igdbName = game.name.toLowerCase().replace(/[™®©:：]/g, '').trim()
        const searchName = normalizedName.toLowerCase()

        if (igdbName === searchName || igdbName.includes(searchName) || searchName.includes(igdbName)) {
          console.log(`✅ Found by name: ${steamName} → ${game.name} (IGDB ${game.id})`)
          return game.id
        }
      }

      // 첫 번째 결과 사용 (비슷한 이름)
      if (games.length > 0) {
        console.log(`⚠️ Using first result: ${steamName} → ${games[0].name} (IGDB ${games[0].id})`)
        return games[0].id
      }
    }

    console.log(`❌ Not found: ${steamName} (Steam ${steamAppId})`)
    return null
  } catch (error) {
    console.error(`Failed to find IGDB game for Steam ${steamAppId}:`, error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // 보안 체크
    const authHeader = request.headers.get('authorization')
    const providedSecret = authHeader?.replace('Bearer ', '')

    if (providedSecret !== BATCH_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔥 Starting hot score update batch job...')

    // 1. Steam Top Sellers와 Most Played 데이터 가져오기
    const [topSellers, mostPlayed] = await Promise.all([
      getSteamTopSellers(),
      getSteamMostPlayed(),
    ])

    console.log(`📊 Fetched ${topSellers.length} top sellers, ${mostPlayed.length} most played`)

    // 2. Steam App ID를 키로 하는 맵 생성
    const topSellerMap = new Map<number, number>()
    topSellers.forEach(item => {
      topSellerMap.set(item.appId, item.rank)
    })

    const mostPlayedMap = new Map<number, number>()
    mostPlayed.forEach(item => {
      mostPlayedMap.set(item.appId, item.rank)
    })

    // 3. 모든 Steam App ID 수집 (중복 제거)
    const allSteamAppIds = new Set<number>([
      ...topSellers.map(s => s.appId),
      ...mostPlayed.map(m => m.appId),
    ])

    console.log(`🎮 Processing ${allSteamAppIds.size} unique Steam games...`)

    // 4. 각 게임에 대해 hot score 계산 및 DB 업데이트
    let updatedCount = 0
    let createdCount = 0
    const errors: string[] = []

    // Steam 이름 매핑 (Top Sellers에서 가져옴)
    const steamNameMap = new Map<number, string>()
    topSellers.forEach(item => {
      steamNameMap.set(item.appId, item.name)
    })

    for (const steamAppId of allSteamAppIds) {
      try {
        const topSellerRank = topSellerMap.get(steamAppId) || null
        const mostPlayedRank = mostPlayedMap.get(steamAppId) || null
        const hotScore = calculateHotScore(topSellerRank, mostPlayedRank)

        if (hotScore === 0) continue // 점수가 없으면 스킵

        const steamName = steamNameMap.get(steamAppId) || ''

        // IGDB 게임 ID 찾기
        const igdbId = await findIgdbGameBySteamId(steamAppId, steamName)

        if (igdbId) {
          // DB에서 게임 찾기 또는 생성
          const existingGame = await prisma.game.findUnique({
            where: { igdbId },
            select: { id: true, coverImage: true },
          })

          if (existingGame) {
            // 기존 게임 업데이트
            // 커버 이미지가 없으면 IGDB에서 상세 정보 가져오기
            if (!existingGame.coverImage) {
              const igdbGame = await getGameById(igdbId)
              if (igdbGame) {
                const converted = await convertIGDBGame(igdbGame)
                await prisma.game.update({
                  where: { igdbId },
                  data: {
                    title: converted.title,
                    description: converted.description,
                    coverImage: converted.coverImage,
                    releaseDate: converted.releaseDate,
                    platforms: converted.platforms,
                    genres: converted.genres,
                    developer: converted.developer,
                    publisher: converted.publisher,
                    hotScore,
                    hotScoreUpdatedAt: new Date(),
                  },
                })
              } else {
                await prisma.game.update({
                  where: { igdbId },
                  data: {
                    hotScore,
                    hotScoreUpdatedAt: new Date(),
                  },
                })
              }
            } else {
              await prisma.game.update({
                where: { igdbId },
                data: {
                  hotScore,
                  hotScoreUpdatedAt: new Date(),
                },
              })
            }
            updatedCount++
          } else {
            // 새 게임 생성 - IGDB에서 상세 정보 가져오기
            const igdbGame = await getGameById(igdbId)
            if (igdbGame) {
              const converted = await convertIGDBGame(igdbGame)
              await prisma.game.create({
                data: {
                  title: converted.title,
                  description: converted.description,
                  coverImage: converted.coverImage,
                  releaseDate: converted.releaseDate,
                  platforms: converted.platforms,
                  genres: converted.genres,
                  developer: converted.developer,
                  publisher: converted.publisher,
                  igdbId,
                  hotScore,
                  hotScoreUpdatedAt: new Date(),
                },
              })
            } else {
              // IGDB 정보 없으면 기본 정보만
              await prisma.game.create({
                data: {
                  title: steamName || `Steam Game ${steamAppId}`,
                  igdbId,
                  platforms: '[]',
                  genres: '[]',
                  hotScore,
                  hotScoreUpdatedAt: new Date(),
                },
              })
            }
            createdCount++
          }

          console.log(`✅ Updated ${steamName || steamAppId}: hotScore=${hotScore.toFixed(3)}`)
        }
      } catch (error) {
        const errorMsg = `Failed to process Steam ${steamAppId}: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }

      // Rate limiting - Steam API 제한 방지
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 5. 오래된 hot score 감소 (24시간 이상 업데이트 안 된 게임)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const decayedCount = await prisma.game.updateMany({
      where: {
        hotScore: { gt: 0 },
        OR: [
          { hotScoreUpdatedAt: null },
          { hotScoreUpdatedAt: { lt: oneDayAgo } },
        ],
      },
      data: {
        hotScore: { multiply: 0.9 }, // 10% 감소
      },
    })

    console.log(`📉 Decayed ${decayedCount.count} old hot scores`)

    return NextResponse.json({
      success: true,
      stats: {
        topSellersCount: topSellers.length,
        mostPlayedCount: mostPlayed.length,
        uniqueGames: allSteamAppIds.size,
        updatedCount,
        createdCount,
        decayedCount: decayedCount.count,
        errors: errors.length,
      },
      errors: errors.slice(0, 10), // 처음 10개 에러만 반환
    })
  } catch (error) {
    console.error('Hot score batch job failed:', error)
    return NextResponse.json(
      { error: 'Batch job failed', details: String(error) },
      { status: 500 }
    )
  }
}

// GET 요청으로 현재 상태 확인
export async function GET() {
  try {
    const hotGames = await prisma.game.findMany({
      where: { hotScore: { gt: 0 } },
      orderBy: { hotScore: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        igdbId: true,
        hotScore: true,
        hotScoreUpdatedAt: true,
      },
    })

    const totalHotGames = await prisma.game.count({
      where: { hotScore: { gt: 0 } },
    })

    return NextResponse.json({
      totalHotGames,
      topHotGames: hotGames,
    })
  } catch (error) {
    console.error('Failed to get hot scores:', error)
    return NextResponse.json(
      { error: 'Failed to get hot scores' },
      { status: 500 }
    )
  }
}
