/**
 * Steam Store API Client
 * Public API - no key required
 */

/**
 * Get Korean game description from Steam
 */
export async function getSteamGameDescription(steamAppId: number): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&l=korean`,
      {
        headers: {
          'User-Agent': 'GAMERATE/1.0',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data: Record<string, SteamAppDetails> = await response.json()
    const appData = data[steamAppId.toString()]

    if (!appData?.success || !appData.data) {
      return null
    }

    // Try detailed_description first, then about_the_game, then short_description
    const description =
      (appData.data as any).detailed_description ||
      (appData.data as any).about_the_game ||
      appData.data.short_description

    if (!description) {
      return null
    }

    // Remove HTML tags
    const cleanDescription = description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()

    return cleanDescription
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ Steam description timeout for ${steamAppId}`)
    } else {
      console.error(`Failed to fetch Steam description for ${steamAppId}:`, error)
    }
    return null
  }
}

/**
 * Resolve Steam vanity URL to Steam ID
 */
export async function resolveVanityUrl(vanityUrl: string): Promise<string | null> {
  try {
    const apiKey = process.env.STEAM_API_KEY
    if (!apiKey) {
      console.error('STEAM_API_KEY is not set')
      return null
    }

    const response = await fetch(
      `http://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${vanityUrl}`
    )

    if (!response.ok) {
      console.error(`Failed to resolve vanity URL: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.response?.success === 1) {
      return data.response.steamid
    }

    return null
  } catch (error) {
    console.error('Failed to resolve vanity URL:', error)
    return null
  }
}

/**
 * Get Steam user summary (profile info)
 */
export async function getSteamUserSummary(steamId: string): Promise<{
  steamid: string
  personaname: string
  profileurl: string
  avatar: string
  avatarmedium: string
  avatarfull: string
} | null> {
  try {
    const apiKey = process.env.STEAM_API_KEY
    if (!apiKey) {
      console.error('STEAM_API_KEY is not set')
      return null
    }

    const response = await fetch(
      `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
    )

    if (!response.ok) {
      console.error(`Failed to fetch Steam user summary: ${response.status}`)
      return null
    }

    const data = await response.json()
    const players = data.response?.players

    if (!players || players.length === 0) {
      return null
    }

    return players[0]
  } catch (error) {
    console.error('Failed to fetch Steam user summary:', error)
    return null
  }
}

/**
 * Get user's owned games count and list
 */
export async function getUserOwnedGames(steamId: string): Promise<{
  gameCount: number
  games: Array<{
    appid: number
    name: string
    playtimeForever: number
    playtime2Weeks?: number
    imgIconUrl?: string
    imgLogoUrl?: string
  }>
} | null> {
  try {
    const apiKey = process.env.STEAM_API_KEY
    if (!apiKey) {
      console.error('STEAM_API_KEY is not set')
      return null
    }

    const response = await fetch(
      `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`
    )

    if (!response.ok) {
      console.error(`Failed to fetch owned games: ${response.status}`)
      return null
    }

    const data = await response.json()
    const gameCount = data.response?.game_count || 0
    const games = data.response?.games || []

    return {
      gameCount,
      games: games.map((game: any) => ({
        appid: game.appid,
        name: game.name,
        playtimeForever: game.playtime_forever || 0,
        playtime2Weeks: game.playtime_2weeks,
        imgIconUrl: game.img_icon_url,
        imgLogoUrl: game.img_logo_url,
      })),
    }
  } catch (error) {
    console.error('Failed to fetch owned games:', error)
    return null
  }
}

interface SteamAppDetails {
  success: boolean
  data?: {
    name: string
    type: string
    steam_appid: number
    short_description?: string
    detailed_description?: string
    about_the_game?: string
    header_image?: string
    developers?: string[]
    publishers?: string[]
    platforms?: {
      windows?: boolean
      mac?: boolean
      linux?: boolean
    }
    metacritic?: {
      score: number
      url: string
    }
    release_date?: {
      coming_soon: boolean
      date: string
    }
    genres?: Array<{
      id: string
      description: string
    }>
  }
}

// Cache for Steam data
const steamCache = new Map<number, { name: string; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Extract Steam App ID from IGDB websites
 */
export function extractSteamId(igdbGame: any): number | null {
  if (!igdbGame.websites || igdbGame.websites.length === 0) {
    return null
  }

  // Find Steam URL (IGDB doesn't return category field, so we check URL)
  const steamWebsite = igdbGame.websites.find((w: any) =>
    w.url && w.url.includes('store.steampowered.com/app/')
  )

  if (!steamWebsite) {
    return null
  }

  // Parse Steam URL: https://store.steampowered.com/app/570/Dota_2/
  const match = steamWebsite.url.match(/\/app\/(\d+)/)
  const steamId = match ? parseInt(match[1]) : null

  if (steamId) {
    console.log(`✅ Found Steam ID for [${igdbGame.name}]: ${steamId}`)
  }

  return steamId
}

/**
 * Get Korean game name from Steam
 */
export async function getSteamKoreanName(steamAppId: number): Promise<string | null> {
  // Check cache
  const cached = steamCache.get(steamAppId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.name
  }

  try {
    // Add timeout of 3 seconds
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&l=korean`,
      {
        headers: {
          'User-Agent': 'GAMERATE/1.0',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Steam API error for ${steamAppId}: ${response.status}`)
      return null
    }

    const data: Record<string, SteamAppDetails> = await response.json()
    const appData = data[steamAppId.toString()]

    if (!appData?.success || !appData.data) {
      console.error(`Steam app ${steamAppId} not found or not available`)
      return null
    }

    const koreanName = appData.data.name

    // Cache the result
    steamCache.set(steamAppId, {
      name: koreanName,
      timestamp: Date.now(),
    })

    console.log(`✅ Steam 한국어: ${steamAppId} → ${koreanName}`)
    return koreanName
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ Steam API timeout for ${steamAppId}`)
    } else {
      console.error(`Failed to fetch Steam data for ${steamAppId}:`, error)
    }
    return null
  }
}

/**
 * Get Korean name from Steam with fallback
 */
export async function getKoreanNameFromSteam(igdbGame: any): Promise<string | null> {
  const steamId = extractSteamId(igdbGame)
  if (!steamId) {
    console.log(`❌ No Steam ID found for: ${igdbGame.name}`)
    return null
  }

  return await getSteamKoreanName(steamId)
}

/**
 * Get current player count for a game
 */
export async function getCurrentPlayers(steamAppId: number): Promise<number | null> {
  try {
    // Add timeout of 3 seconds
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${steamAppId}`,
      {
        headers: {
          'User-Agent': 'GAMERATE/1.0',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.response?.player_count || null
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ Steam player count timeout for ${steamAppId}`)
    } else {
      console.error(`Failed to fetch player count for ${steamAppId}:`, error)
    }
    return null
  }
}

/**
 * Get price and discount info for a game
 */
export async function getSteamMetacritic(steamAppId: number): Promise<{
  score: number
  url: string
} | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}`,
      {
        headers: {
          'User-Agent': 'GAMERATE/1.0',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data: Record<string, SteamAppDetails> = await response.json()
    const appData = data[steamAppId.toString()]

    if (!appData?.success || !appData.data) {
      return null
    }

    return appData.data.metacritic || null
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ Steam API timeout for metacritic ${steamAppId}`)
    }
    return null
  }
}

export async function getSteamPriceInfo(steamAppId: number): Promise<{
  currency: string
  initialPrice: number
  finalPrice: number
  discountPercent: number
  isFree: boolean
} | null> {
  try {
    // Add timeout of 3 seconds
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${steamAppId}&cc=kr&l=korean`,
      {
        headers: {
          'User-Agent': 'GAMERATE/1.0',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data: Record<string, SteamAppDetails> = await response.json()
    const appData = data[steamAppId.toString()]

    if (!appData?.success || !appData.data) {
      return null
    }

    const priceOverview = (appData.data as any).price_overview
    const isFree = (appData.data as any).is_free || false

    if (isFree) {
      return {
        currency: 'KRW',
        initialPrice: 0,
        finalPrice: 0,
        discountPercent: 0,
        isFree: true,
      }
    }

    if (!priceOverview) {
      return null
    }

    return {
      currency: priceOverview.currency || 'KRW',
      initialPrice: priceOverview.initial || 0,
      finalPrice: priceOverview.final || 0,
      discountPercent: priceOverview.discount_percent || 0,
      isFree: false,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ Steam price info timeout for ${steamAppId}`)
    } else {
      console.error(`Failed to fetch price info for ${steamAppId}:`, error)
    }
    return null
  }
}

/**
 * Convert Steam review score description to Korean
 */
export function getKoreanReviewScore(reviewScoreDesc: string): string {
  const reviewScoreMap: Record<string, string> = {
    'Overwhelmingly Positive': '압도적으로 긍정적',
    'Very Positive': '매우 긍정적',
    'Positive': '긍정적',
    'Mostly Positive': '대체로 긍정적',
    'Mixed': '복합적',
    'Mostly Negative': '대체로 부정적',
    'Negative': '부정적',
    'Very Negative': '매우 부정적',
    'Overwhelmingly Negative': '압도적으로 부정적',
    'No user reviews': '리뷰 없음',
  }

  return reviewScoreMap[reviewScoreDesc] || reviewScoreDesc
}

/**
 * Get Steam review summary
 */
export async function getSteamReviews(steamAppId: number): Promise<{
  totalPositive: number
  totalNegative: number
  totalReviews: number
  reviewScore: number
  reviewScoreDesc: string
} | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(
      `https://store.steampowered.com/appreviews/${steamAppId}?json=1&language=korean&purchase_type=all&num_per_page=0`,
      {
        headers: {
          'User-Agent': 'GAMERATE/1.0',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.success || !data.query_summary) {
      return null
    }

    const summary = data.query_summary
    const reviewScoreDesc = summary.review_score_desc || 'No user reviews'

    return {
      totalPositive: summary.total_positive || 0,
      totalNegative: summary.total_negative || 0,
      totalReviews: summary.total_reviews || 0,
      reviewScore: summary.review_score || 0,
      reviewScoreDesc: getKoreanReviewScore(reviewScoreDesc),
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ Steam reviews timeout for ${steamAppId}`)
    } else {
      console.error(`Failed to fetch reviews for ${steamAppId}:`, error)
    }
    return null
  }
}

/**
 * Get Steam tags from Steam Spy API
 * Steam Spy provides user-generated tags that are much more detailed than official genres
 */
export async function getSteamTags(steamAppId: number): Promise<string[] | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(
      `https://steamspy.com/api.php?request=appdetails&appid=${steamAppId}`,
      {
        headers: {
          'User-Agent': 'GAMERATE/1.0',
        },
        signal: controller.signal,
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data || !data.tags) {
      return null
    }

    // Steam Spy returns tags as an object with tag names as keys and vote counts as values
    // Example: { "Roguelike": 1234, "Action": 5678, ... }
    // We'll convert this to an array sorted by vote count (most popular first)
    const tags = Object.entries(data.tags)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10) // Take top 10 tags
      .map(([tag]) => tag)

    console.log(`✅ Steam tags for ${steamAppId}: ${tags.join(', ')}`)
    return tags
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`⏱️ Steam Spy timeout for ${steamAppId}`)
    } else {
      console.error(`Failed to fetch Steam tags for ${steamAppId}:`, error)
    }
    return null
  }
}
