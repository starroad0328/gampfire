'use client'

import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function ReviewButton() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showLoginAlert, setShowLoginAlert] = useState(false)

  const handleClick = () => {
    if (!session) {
      setShowLoginAlert(true)
      setTimeout(() => {
        router.push('/login')
      }, 1500)
      return
    }
    window.dispatchEvent(new CustomEvent('toggleReviewForm'))
  }

  return (
    <>
      {showLoginAlert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <Alert className="bg-orange-500 text-white border-orange-600">
            <AlertDescription className="font-medium">
              로그인이 필요합니다. 로그인 페이지로 이동합니다...
            </AlertDescription>
          </Alert>
        </div>
      )}
      <Button
        size="lg"
        onClick={handleClick}
      >
        리뷰 작성
      </Button>
    </>
  )
}
