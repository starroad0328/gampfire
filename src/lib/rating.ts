import {
  RATING_THRESHOLDS,
  REVIEW_LABELS,
  VERIFIED_REVIEW_WEIGHT,
  UNVERIFIED_REVIEW_WEIGHT,
  BAYESIAN_PRIOR_COUNT,
  BAYESIAN_PRIOR_RATING,
  ReviewLabel,
} from '@/lib/constants'

/**
 * Calculate the label based on rating
 */
export function getRatingLabel(rating: number): ReviewLabel {
  if (rating >= RATING_THRESHOLDS.VERY_POSITIVE) return 'VERY_POSITIVE'
  if (rating >= RATING_THRESHOLDS.POSITIVE) return 'POSITIVE'
  if (rating >= RATING_THRESHOLDS.MIXED) return 'MIXED'
  if (rating >= RATING_THRESHOLDS.NEGATIVE) return 'NEGATIVE'
  return 'VERY_NEGATIVE'
}

/**
 * Calculate weighted average rating
 */
export function calculateWeightedAverage(
  reviews: Array<{ rating: number; isVerified: boolean }>
): number {
  if (reviews.length === 0) return 0

  const totalWeight = reviews.reduce((sum, review) => {
    const weight = review.isVerified ? VERIFIED_REVIEW_WEIGHT : UNVERIFIED_REVIEW_WEIGHT
    return sum + weight
  }, 0)

  const weightedSum = reviews.reduce((sum, review) => {
    const weight = review.isVerified ? VERIFIED_REVIEW_WEIGHT : UNVERIFIED_REVIEW_WEIGHT
    return sum + review.rating * weight
  }, 0)

  return weightedSum / totalWeight
}

/**
 * Calculate Bayesian average rating to prevent manipulation
 * Formula: (C × m + Σ(rating × weight)) / (C + Σ(weight))
 * where C = confidence (prior count), m = prior average
 */
export function calculateBayesianAverage(
  reviews: Array<{ rating: number; isVerified: boolean }>
): number {
  const totalWeight = reviews.reduce((sum, review) => {
    const weight = review.isVerified ? VERIFIED_REVIEW_WEIGHT : UNVERIFIED_REVIEW_WEIGHT
    return sum + weight
  }, 0)

  const weightedSum = reviews.reduce((sum, review) => {
    const weight = review.isVerified ? VERIFIED_REVIEW_WEIGHT : UNVERIFIED_REVIEW_WEIGHT
    return sum + review.rating * weight
  }, 0)

  const numerator = BAYESIAN_PRIOR_COUNT * BAYESIAN_PRIOR_RATING + weightedSum
  const denominator = BAYESIAN_PRIOR_COUNT + totalWeight

  return numerator / denominator
}

/**
 * Calculate time-weighted rating to detect review bombing
 * Recent reviews get reduced weight if there's a sudden spike
 */
export function calculateTimeWeightedRating(
  reviews: Array<{ rating: number; isVerified: boolean; createdAt: Date }>
): number {
  if (reviews.length === 0) return 0

  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  const weekMs = 7 * dayMs

  // Count recent reviews (last 7 days)
  const recentReviews = reviews.filter((r) => {
    const age = now.getTime() - r.createdAt.getTime()
    return age <= weekMs
  })

  // If more than 50% of reviews are from last week, apply decay
  const recentRatio = recentReviews.length / reviews.length
  const isSpike = recentRatio > 0.5

  const weightedSum = reviews.reduce((sum, review) => {
    let baseWeight = review.isVerified ? VERIFIED_REVIEW_WEIGHT : UNVERIFIED_REVIEW_WEIGHT

    // Apply time decay if spike detected
    if (isSpike) {
      const age = now.getTime() - review.createdAt.getTime()
      if (age <= weekMs) {
        // Reduce weight for very recent reviews during spike
        const decayFactor = Math.min(1, age / weekMs)
        baseWeight *= 0.5 + 0.5 * decayFactor
      }
    }

    return sum + review.rating * baseWeight
  }, 0)

  const totalWeight = reviews.reduce((sum, review) => {
    let baseWeight = review.isVerified ? VERIFIED_REVIEW_WEIGHT : UNVERIFIED_REVIEW_WEIGHT

    if (isSpike) {
      const age = now.getTime() - review.createdAt.getTime()
      if (age <= weekMs) {
        const decayFactor = Math.min(1, age / weekMs)
        baseWeight *= 0.5 + 0.5 * decayFactor
      }
    }

    return sum + baseWeight
  }, 0)

  return weightedSum / totalWeight
}

/**
 * Get human-readable label text
 */
export function getLabelText(label: ReviewLabel): string {
  return REVIEW_LABELS[label]
}
