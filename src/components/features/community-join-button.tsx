'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CommunityJoinButtonProps {
  communityId: string
  isMember: boolean
  isOwner: boolean
}

export function CommunityJoinButton({ communityId, isMember, isOwner }: CommunityJoinButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLeave = async () => {
    if (!confirm('정말로 이 동아리에서 탈퇴하시겠습니까?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/communities/${communityId}/leave`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to leave community')
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if user is owner
  if (isOwner) {
    return null
  }

  if (isMember) {
    return (
      <button
        onClick={handleLeave}
        disabled={loading}
        className="bg-destructive text-destructive-foreground px-6 py-2 rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 text-sm"
      >
        {loading ? '처리 중...' : '탈퇴하기'}
      </button>
    )
  }

  return (
    <Link
      href={`/communities/${communityId}/join`}
      className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
    >
      가입하기
    </Link>
  )
}
