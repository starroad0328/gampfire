import { ReviewLabel, GameElement, Platform, ListType, VerificationType } from '@/lib/constants'

export type { ReviewLabel, GameElement, Platform, ListType, VerificationType }

// User types
export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

// Game types
export interface Game {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  releaseDate: Date | null
  platforms: Platform[]
  genres: string[]
  developer: string | null
  publisher: string | null
  averageRating: number
  totalReviews: number
  verifiedReviews: number
  createdAt: Date
  updatedAt: Date
}

// Review types
export interface Review {
  id: string
  gameId: string
  userId: string
  rating: number
  comment: string | null
  label: ReviewLabel
  isVerified: boolean
  verificationType: VerificationType | null
  verificationProof: string | null
  elementRatings: ElementRatings | null
  likes: number
  createdAt: Date
  updatedAt: Date
}

export interface ElementRatings {
  graphics: number | null
  sound: number | null
  combat: number | null
  story: number | null
  ui: number | null
}

// List types
export interface GameList {
  id: string
  userId: string
  name: string
  type: ListType
  games: string[] // Game IDs
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

// Developer types
export interface Developer {
  id: string
  userId: string
  companyName: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

// Statistics types
export interface GameStatistics {
  averageRating: number
  totalReviews: number
  verifiedReviews: number
  ratingDistribution: {
    [key: number]: number // rating -> count
  }
  labelDistribution: {
    [key in ReviewLabel]: number
  }
  elementAverages: ElementRatings
}
