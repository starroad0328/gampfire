/**
 * RAWG API Client
 * https://rawg.io/apidocs
 */

const RAWG_API_KEY = process.env.RAWG_API_KEY
const RAWG_BASE_URL = 'https://api.rawg.io/api'

if (!RAWG_API_KEY) {
  console.warn('RAWG_API_KEY is not set')
}

/**
 * Make a request to RAWG API
 */
async function rawgRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${RAWG_BASE_URL}${endpoint}`)

  // Add API key
  url.searchParams.append('key', RAWG_API_KEY!)

  // Add other params
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const response = await fetch(url.toString())

  if (!response.ok) {
    const errorText = await response.text()
    console.error('RAWG API error:', response.status, errorText)
    throw new Error(`RAWG API error: ${response.status} ${errorText}`)
  }

  return response.json()
}

/**
 * Search games by name
 */
export async function searchGames(query: string, limit = 50) {
  const response = await rawgRequest<RAWGGamesResponse>('/games', {
    search: query,
    page_size: limit.toString(),
  })

  return response.results
}

/**
 * Get game by ID
 */
export async function getGameById(id: number) {
  return rawgRequest<RAWGGame>(`/games/${id}`)
}

/**
 * Get popular games (by most added/popularity)
 */
export async function getPopularGames(limit = 20, page = 1) {
  const response = await rawgRequest<RAWGGamesResponse>('/games', {
    ordering: '-added', // 가장 많이 추가된 게임 = 진짜 인기 게임
    page_size: limit.toString(),
    page: page.toString(),
  })

  return response.results
}

/**
 * Get recent games (released in last 6 months)
 */
export async function getRecentGames(limit = 20) {
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)

  const response = await rawgRequest<RAWGGamesResponse>('/games', {
    dates: `${sixMonthsAgo.toISOString().split('T')[0]},${now.toISOString().split('T')[0]}`,
    ordering: '-released',
    page_size: limit.toString(),
  })

  return response.results
}

/**
 * Get game screenshots
 */
export async function getGameScreenshots(id: number) {
  const response = await rawgRequest<{ results: RAWGScreenshot[] }>(`/games/${id}/screenshots`)
  return response.results
}

/**
 * Get game trailers/movies
 */
export async function getGameMovies(id: number) {
  const response = await rawgRequest<{ results: RAWGMovie[] }>(`/games/${id}/movies`)
  return response.results
}

/**
 * RAWG Game Response Types
 */
interface RAWGGamesResponse {
  count: number
  next: string | null
  previous: string | null
  results: RAWGGame[]
}

/**
 * RAWG Game type
 */
export interface RAWGGame {
  id: number
  slug: string
  name: string
  released: string | null
  tba: boolean
  background_image: string | null
  rating: number
  rating_top: number
  ratings: Array<{
    id: number
    title: string
    count: number
    percent: number
  }>
  ratings_count: number
  reviews_text_count: number
  added: number
  metacritic: number | null
  playtime: number
  suggestions_count: number
  updated: string
  esrb_rating: {
    id: number
    name: string
    slug: string
  } | null
  platforms: Array<{
    platform: {
      id: number
      name: string
      slug: string
    }
    released_at: string | null
    requirements: {
      minimum?: string
      recommended?: string
    } | null
  }> | null
  genres: Array<{
    id: number
    name: string
    slug: string
  }> | null
  stores: Array<{
    id: number
    url: string
    store: {
      id: number
      name: string
      slug: string
    }
  }> | null
  tags: Array<{
    id: number
    name: string
    slug: string
  }> | null
  short_screenshots: Array<{
    id: number
    image: string
  }> | null
  description?: string
  description_raw?: string
  developers?: Array<{
    id: number
    name: string
    slug: string
  }>
  publishers?: Array<{
    id: number
    name: string
    slug: string
  }>
  website?: string | null
}

interface RAWGScreenshot {
  id: number
  image: string
  width: number
  height: number
}

interface RAWGMovie {
  id: number
  name: string
  preview: string
  data: {
    480?: string
    max?: string
  }
}

/**
 * Extract Steam ID from RAWG game stores
 */
export function extractSteamIdFromRAWG(rawgGame: RAWGGame): number | null {
  if (!rawgGame.stores) return null

  const steamStore = rawgGame.stores.find((store) => store.store.slug === 'steam')
  if (!steamStore) return null

  // Extract Steam app ID from URL (e.g., https://store.steampowered.com/app/1091500/)
  const match = steamStore.url.match(/\/app\/(\d+)/)
  return match ? parseInt(match[1]) : null
}

/**
 * Convert RAWG game to our Game model format
 */
export async function convertRAWGGame(rawgGame: RAWGGame) {
  return {
    rawgId: rawgGame.id,
    igdbId: null, // RAWG doesn't have IGDB ID
    title: rawgGame.name,
    description: rawgGame.description_raw || null,
    coverImage: rawgGame.background_image || null,
    releaseDate: rawgGame.released ? new Date(rawgGame.released) : null,
    platforms: JSON.stringify(rawgGame.platforms?.map((p) => p.platform.name) || []),
    genres: JSON.stringify(rawgGame.genres?.map((g) => g.name) || []),
    developer: rawgGame.developers?.[0]?.name || null,
    publisher: rawgGame.publishers?.[0]?.name || null,
    metacriticScore: rawgGame.metacritic,
  }
}

/**
 * Get high quality image URL
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '/placeholder-game.png'
  return url
}
