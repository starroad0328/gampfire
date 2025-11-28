'use client'

import { useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FollowButtonProps {
  targetUserId: string
  initialFollowing: boolean
}

export function FollowButton({ targetUserId, initialFollowing }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async () => {
    setIsLoading(true)

    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })

      const data = await res.json()

      if (res.ok) {
        setIsFollowing(data.following)
      } else {
        alert(data.error || '팔로우 처리에 실패했습니다')
      }
    } catch (error) {
      console.error('Follow error:', error)
      alert('팔로우 처리에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      variant={isFollowing ? 'outline' : 'default'}
      className="w-full"
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4 mr-2" />
          팔로잉
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          팔로우
        </>
      )}
    </Button>
  )
}
