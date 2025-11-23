// Review labels
export const REVIEW_LABELS = {
  VERY_POSITIVE: '매우 긍정적',
  POSITIVE: '긍정적',
  MIXED: '혼합',
  NEGATIVE: '부정적',
  VERY_NEGATIVE: '매우 부정적',
} as const

export type ReviewLabel = keyof typeof REVIEW_LABELS

// Rating calculation
export const RATING_THRESHOLDS = {
  VERY_POSITIVE: 4.5,
  POSITIVE: 3.5,
  MIXED: 2.5,
  NEGATIVE: 1.5,
} as const

// Game element categories
export const GAME_ELEMENTS = {
  GRAPHICS: '그래픽',
  SOUND: '사운드',
  COMBAT: '전투',
  STORY: '스토리',
  UI: 'UI',
} as const

export type GameElement = keyof typeof GAME_ELEMENTS

// Platforms
export const PLATFORMS = {
  PC: 'PC',
  PS5: 'PlayStation 5',
  PS4: 'PlayStation 4',
  XBOX_SERIES: 'Xbox Series X/S',
  XBOX_ONE: 'Xbox One',
  SWITCH: 'Nintendo Switch',
  IOS: 'iOS',
  ANDROID: 'Android',
} as const

export type Platform = keyof typeof PLATFORMS

// List types
export const LIST_TYPES = {
  PLAYING: '하고 있는',
  PLAN_TO_PLAY: '깰 예정',
  COMPLETED: '깼음',
  TOP10: 'TOP 10',
  YEAR_BEST: '올해의 게임',
} as const

export type ListType = keyof typeof LIST_TYPES

// Review comment max length
export const REVIEW_COMMENT_MAX_LENGTH = 120

// Verification types
export const VERIFICATION_TYPES = {
  STEAM: 'Steam',
  PLAYSTATION: 'PlayStation',
  XBOX: 'Xbox',
  SCREENSHOT: '스크린샷',
} as const

export type VerificationType = keyof typeof VERIFICATION_TYPES

// Trust weight for verified reviews
export const VERIFIED_REVIEW_WEIGHT = 1.5
export const UNVERIFIED_REVIEW_WEIGHT = 1.0

// Bayesian rating constants
export const BAYESIAN_PRIOR_COUNT = 10
export const BAYESIAN_PRIOR_RATING = 3.0
