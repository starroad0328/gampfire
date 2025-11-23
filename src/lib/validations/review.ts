import { z } from 'zod'
import { REVIEW_COMMENT_MAX_LENGTH } from '@/lib/constants'

export const reviewSchema = z.object({
  gameId: z.string().cuid(),
  rating: z.number().min(0.5).max(5).step(0.5),
  comment: z.string().max(REVIEW_COMMENT_MAX_LENGTH).optional(),

  // Element ratings (optional)
  graphicsRating: z.number().min(1).max(5).optional(),
  soundRating: z.number().min(1).max(5).optional(),
  combatRating: z.number().min(1).max(5).optional(),
  storyRating: z.number().min(1).max(5).optional(),
  uiRating: z.number().min(1).max(5).optional(),

  // Verification (optional)
  verificationType: z.enum(['STEAM', 'PLAYSTATION', 'XBOX', 'SCREENSHOT']).optional(),
  verificationProof: z.string().url().optional(),
})

export type ReviewInput = z.infer<typeof reviewSchema>

export const updateReviewSchema = reviewSchema.partial().extend({
  id: z.string().cuid(),
})

export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
