/**
 * IGDB (Internet Game Database) API Client
 * Requires Twitch Client ID and Client Secret
 */

import { getKoreanNameFromSteam } from './steam'

interface IGDBToken {
  access_token: string
  expires_in: number
  token_type: string
}

let cachedToken: { token: string; expiresAt: number } | null = null

/**
 * Get IGDB access token (cached)
 */
async function getAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token
  }

  const clientId = process.env.IGDB_CLIENT_ID
  const clientSecret = process.env.IGDB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('IGDB_CLIENT_ID and IGDB_CLIENT_SECRET must be set')
  }

  // Get new token from Twitch
  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: 'POST' }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('IGDB token error:', response.status, errorText)
    throw new Error(`Failed to get IGDB access token: ${response.status} ${errorText}`)
  }

  const data: IGDBToken = await response.json()

  // Cache the token (expires in ~60 days, but we'll refresh it earlier)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000 - 60000, // Refresh 1 min early
  }

  return data.access_token
}

/**
 * Make a request to IGDB API
 */
async function igdbRequest<T>(endpoint: string, body: string): Promise<T> {
  const token = await getAccessToken()
  const clientId = process.env.IGDB_CLIENT_ID

  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': clientId!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`IGDB API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Filter out DLCs, editions, and special content from game list
 */
export function filterMainGamesOnly(games: IGDBGame[]): IGDBGame[] {
  // DLC, 에디션, 확장팩 키워드 목록
  const excludeKeywords = [
    'DLC',
    'Expansion',
    'Season Pass',
    'Game of the Year',
    'GOTY',
    'Complete Edition',
    'Definitive Edition',
    'Deluxe Edition',
    'Collector\'s Edition',
    'Premium Edition',
    'Ultimate Edition',
    'Enhanced Edition',
    'Remastered',
    'Redux',
    'Blood and Wine',
    'Hearts of Stone',
    'The Old Hunters',
    'Ashes of Ariandel',
    'The Ringed City',
  ]

  // OST, 특별 콘텐츠를 나타내는 패턴
  const specialContentPatterns = [
    /: (As|Original|Soundtrack|OST|Theme|Music)/i,
    /\(OST\)/i,
    /\(Soundtrack\)/i,
    /: (The |A )[A-Z][^:]+$/,  // "Genshin Impact: The Something" 같은 패턴
  ]

  return games.filter(game => {
    const gameName = game.name

    // " - " 패턴 체크 (DLC는 보통 "게임 - DLC 이름" 형식)
    if (gameName.includes(' - ')) {
      return false
    }

    // 키워드 체크
    const hasExcludeKeyword = excludeKeywords.some(keyword =>
      gameName.includes(keyword)
    )

    if (hasExcludeKeyword) {
      return false
    }

    // 특별 콘텐츠 패턴 체크
    const isSpecialContent = specialContentPatterns.some(pattern =>
      pattern.test(gameName)
    )

    if (isSpecialContent) {
      return false
    }

    // 콜론 뒤에 긴 제목이 있는 경우 (이벤트/업데이트)
    // 예: "Genshin Impact: Masquerade of the Guilty" (4단어)
    const colonSplit = gameName.split(':')
    if (colonSplit.length === 2) {
      const subtitle = colonSplit[1].trim()
      // 부제목이 4단어 이상이면 이벤트/업데이트로 간주
      const wordCount = subtitle.split(/\s+/).length
      if (wordCount >= 4) {
        return false
      }
    }

    return true
  })
}

/**
 * Search games by name (부분 문자열 매칭 지원)
 */
export async function searchGames(query: string, limit = 50) {
  // where name ~ *"query"* 로 부분 문자열 매칭
  // ~ 는 대소문자 구분 없는 매칭
  // * 는 와일드카드
  const body = `
    fields name, cover.url, first_release_date, summary, genres.name, platforms.name, involved_companies.company.name, rating, rating_count, aggregated_rating, follows, alternative_names.name, alternative_names.comment, websites.url, websites.category, category;
    where name ~ *"${query}"*;
    limit ${limit};
  `

  return igdbRequest<IGDBGame[]>('games', body)
}

/**
 * Search game by Steam App ID (using IGDB websites field)
 */
export async function searchGameBySteamId(steamAppId: number): Promise<number | null> {
  try {
    // 정확한 Steam App ID 매칭을 위해 websites 정보 포함
    const body = `
      fields id, name, websites.url;
      where websites.url ~ *"store.steampowered.com/app/${steamAppId}"*;
      limit 10;
    `

    const games = await igdbRequest<IGDBGame[]>('games', body)

    // 정확히 매칭되는 게임만 선택
    for (const game of games) {
      if (game.websites) {
        for (const website of game.websites) {
          const url = website.url || ''
          // 정확한 매칭 확인: /app/730/ 또는 /app/730? 또는 /app/730 (URL 끝)
          const exactMatch =
            url.includes(`/app/${steamAppId}/`) ||
            url.includes(`/app/${steamAppId}?`) ||
            url.endsWith(`/app/${steamAppId}`)

          if (exactMatch) {
            return game.id
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error(`Failed to search IGDB by Steam ID ${steamAppId}:`, error)
    return null
  }
}

/**
 * Get game by ID
 */
export async function getGameById(id: number) {
  const body = `
    fields name, cover.url, first_release_date, summary, storyline, genres.name, platforms.name,
           involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
           rating, rating_count, aggregated_rating, screenshots.url, videos.video_id, videos.name, websites.url, websites.category,
           alternative_names.name, alternative_names.comment;
    where id = ${id};
  `

  const games = await igdbRequest<IGDBGame[]>('games', body)
  return games[0] || null
}

/**
 * Get popular games (최근 1년 이내 게임 우선)
 */
export async function getPopularGames(limit = 20, offset = 0, genres?: string[]) {
  // Fetch significantly more games to ensure we get enough after filtering
  const fetchLimit = Math.min(limit * 10, 500)  // Increased to 10x, max 500

  // 최근 1년 타임스탬프 계산
  const now = Math.floor(Date.now() / 1000)
  const oneYearAgo = now - 365 * 24 * 60 * 60

  // Build genre filter
  let genreFilter = ''
  if (genres && genres.length > 0) {
    const genreNames = genres.map(g => `"${g}"`).join(',')
    genreFilter = ` & genres.name = (${genreNames})`
  }

  // 1단계: 최근 1년 이내 인기 게임 우선 조회
  const recentBody = `
    fields name, cover.url, first_release_date, summary, genres.name, platforms.name, rating, rating_count, aggregated_rating, alternative_names.name, alternative_names.comment, websites.url, websites.category, category;
    where rating_count > 50 & first_release_date >= ${oneYearAgo} & first_release_date <= ${now}${genreFilter};
    sort rating_count desc;
    limit ${fetchLimit};
    offset ${offset};
  `

  let games = await igdbRequest<IGDBGame[]>('games', recentBody)
  let mainGames = filterMainGamesOnly(games)

  // 최근 게임이 부족하면 전체 인기 게임에서 보충
  if (mainGames.length < limit) {
    const classicBody = `
      fields name, cover.url, first_release_date, summary, genres.name, platforms.name, rating, rating_count, aggregated_rating, alternative_names.name, alternative_names.comment, websites.url, websites.category, category;
      where rating_count > 100${genreFilter};
      sort rating desc;
      limit ${fetchLimit};
      offset ${offset};
    `

    const classicGames = await igdbRequest<IGDBGame[]>('games', classicBody)
    const classicMainGames = filterMainGamesOnly(classicGames)

    // 중복 제거하고 합치기
    const existingIds = new Set(mainGames.map(g => g.id))
    const additionalGames = classicMainGames.filter(g => !existingIds.has(g.id))
    mainGames = [...mainGames, ...additionalGames]
  }

  // Return only the requested limit
  return mainGames.slice(0, limit)
}

/**
 * Get recent games
 */
export async function getRecentGames(limit = 20, offset = 0, genres?: string[]) {
  const now = Math.floor(Date.now() / 1000)
  const sixMonthsAgo = now - 6 * 30 * 24 * 60 * 60

  // Fetch significantly more games to ensure we get enough after filtering
  const fetchLimit = Math.min(limit * 10, 500)  // Increased to 10x, max 500

  // Build genre filter
  let genreFilter = ''
  if (genres && genres.length > 0) {
    const genreNames = genres.map(g => `"${g}"`).join(',')
    genreFilter = ` & genres.name = (${genreNames})`
  }

  const body = `
    fields name, cover.url, first_release_date, summary, genres.name, platforms.name, rating, rating_count, aggregated_rating, alternative_names.name, alternative_names.comment, websites.url, websites.category, category;
    where first_release_date >= ${sixMonthsAgo} & first_release_date <= ${now}${genreFilter};
    sort first_release_date desc;
    limit ${fetchLimit};
    offset ${offset};
  `

  const games = await igdbRequest<IGDBGame[]>('games', body)

  // Filter out DLCs and editions
  const mainGames = filterMainGamesOnly(games)

  // Return only the requested limit
  return mainGames.slice(0, limit)
}

/**
 * IGDB Game type
 */
export interface IGDBGame {
  id: number
  name: string
  summary?: string
  storyline?: string
  rating?: number
  rating_count?: number
  aggregated_rating?: number
  first_release_date?: number
  category?: number // 0 = main_game, 1 = dlc_addon, 2 = expansion, etc.
  cover?: {
    id: number
    url: string
  }
  screenshots?: Array<{
    id: number
    url: string
  }>
  genres?: Array<{
    id: number
    name: string
  }>
  platforms?: Array<{
    id: number
    name: string
  }>
  involved_companies?: Array<{
    id: number
    company: {
      id: number
      name: string
    }
    developer: boolean
    publisher: boolean
  }>
  videos?: Array<{
    id: number
    video_id: string
    name?: string
  }>
  websites?: Array<{
    id: number
    url: string
    category: number
  }>
  alternative_names?: Array<{
    id: number
    name: string
    comment?: string
  }>
}

/**
 * Convert IGDB image URL to high quality
 */
export function getImageUrl(url: string | undefined, size: 'thumb' | 'cover_small' | 'cover_big' | '1080p' = 'cover_big'): string {
  if (!url) return '/placeholder-game.png'

  // IGDB returns URLs like "//images.igdb.com/igdb/image/upload/t_thumb/..."
  // We need to replace t_thumb with desired size and add https:
  return `https:${url.replace('t_thumb', `t_${size}`)}`
}

/**
 * Get Korean title from Steam or IGDB alternative names
 */
async function getKoreanTitle(igdbGame: IGDBGame): Promise<string | null> {
  // 1. Steam에서 한국어 이름 먼저 시도
  const steamName = await getKoreanNameFromSteam(igdbGame)
  if (steamName) {
    return steamName
  }

  // 2. IGDB alternative_names에서 한국어 찾기
  if (igdbGame.alternative_names) {
    const koreanName = igdbGame.alternative_names.find(
      (alt) =>
        alt.comment?.toLowerCase() === 'kr' ||
        alt.comment?.toLowerCase() === 'korean' ||
        alt.comment?.toLowerCase() === 'ko'
    )

    if (koreanName) {
      console.log(`✅ IGDB 한국어: ${igdbGame.name} → ${koreanName.name}`)
      return koreanName.name
    }
  }

  // 3. 한국어 이름이 없으면 null 반환 (영어 이름 사용)
  return null
}

/**
 * Convert IGDB game to our Game model format
 */
export async function convertIGDBGame(
  igdbGame: IGDBGame,
  metacriticScore?: number | null,
  steamTags?: string[] | null
) {
  const developers = igdbGame.involved_companies
    ?.filter((ic) => ic.developer)
    .map((ic) => ic.company.name)

  const publishers = igdbGame.involved_companies
    ?.filter((ic) => ic.publisher)
    .map((ic) => ic.company.name)

  // 한국어 제목 가져오기 (IGDB 데이터 우선, 없으면 자동 번역)
  const koreanTitle = await getKoreanTitle(igdbGame)

  return {
    igdbId: igdbGame.id,
    title: koreanTitle || igdbGame.name,
    description: igdbGame.summary || null,
    coverImage: igdbGame.cover ? getImageUrl(igdbGame.cover.url) : null,
    releaseDate: igdbGame.first_release_date
      ? new Date(igdbGame.first_release_date * 1000)
      : null,
    platforms: JSON.stringify(igdbGame.platforms?.map((p) => p.name) || []),
    genres: JSON.stringify(igdbGame.genres?.map((g) => g.name) || []),
    tags: steamTags ? JSON.stringify(steamTags) : null,
    developer: developers?.[0] || null,
    publisher: publishers?.[0] || null,
    metacriticScore: metacriticScore !== undefined
      ? metacriticScore
      : (igdbGame.aggregated_rating ? Math.round(igdbGame.aggregated_rating) : null),
  }
}
