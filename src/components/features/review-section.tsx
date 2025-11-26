'use client'

import { useState, useEffect } from 'react'
import { ReviewForm } from './review-form'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ReviewSectionProps {
  gameId: string
  gameName: string
  existingReview?: {
    rating: number
    comment: string | null
    priceRating?: number | null
    graphicsRating?: number | null
    controlRating?: number | null
    directionRating?: number | null
    storyRating?: number | null
    soundRating?: number | null
    volumeRating?: number | null
    innovationRating?: number | null
  } | null
}

export function ReviewSection({ gameId, gameName, existingReview }: ReviewSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Listen for custom event to toggle review form
    const handleToggleReviewForm = () => {
      setIsOpen((prev) => !prev)
    }

    window.addEventListener('toggleReviewForm', handleToggleReviewForm)
    return () => window.removeEventListener('toggleReviewForm', handleToggleReviewForm)
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div id="review-section" className="mb-8">
      <div className="flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="gap-1"
        >
          <X className="w-4 h-4" />
          닫기
        </Button>
      </div>
      <ReviewForm
        gameId={gameId}
        gameName={gameName}
        existingReview={existingReview}
      />
    </div>
  )
}
