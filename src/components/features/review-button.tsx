'use client'

import { Button } from '@/components/ui/button'

export function ReviewButton() {
  return (
    <Button
      size="lg"
      onClick={() => {
        window.dispatchEvent(new CustomEvent('toggleReviewForm'))
      }}
    >
      리뷰 작성
    </Button>
  )
}
