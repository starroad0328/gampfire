'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Globe } from 'lucide-react'

interface PrivacySettingsFormProps {
  profileVisibility: string
  reviewVisibility: string
}

export function PrivacySettingsForm({
  profileVisibility: initialProfileVisibility,
  reviewVisibility: initialReviewVisibility,
}: PrivacySettingsFormProps) {
  const router = useRouter()
  const [profileVisibility, setProfileVisibility] = useState(initialProfileVisibility)
  const [reviewVisibility, setReviewVisibility] = useState(initialReviewVisibility)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/update-privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileVisibility,
          reviewVisibility,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(data.error || '설정 저장에 실패했습니다')
      }
    } catch (error) {
      console.error('Privacy update error:', error)
      setError('설정 저장에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Visibility */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">프로필 공개 범위</h2>
            <p className="text-sm text-muted-foreground">다른 사용자가 내 프로필을 볼 수 있는 범위를 설정합니다</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="profileVisibility"
              value="public"
              checked={profileVisibility === 'public'}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-green-500" />
                <span className="font-medium text-foreground">전체 공개</span>
              </div>
              <p className="text-sm text-muted-foreground">
                모든 사용자가 내 프로필과 통계를 볼 수 있습니다
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="profileVisibility"
              value="private"
              checked={profileVisibility === 'private'}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-red-500" />
                <span className="font-medium text-foreground">비공개</span>
              </div>
              <p className="text-sm text-muted-foreground">
                본인만 프로필을 볼 수 있습니다
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Review Visibility */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">리뷰 공개 범위</h2>
            <p className="text-sm text-muted-foreground">내가 작성한 리뷰를 다른 사용자가 볼 수 있는 범위를 설정합니다</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="reviewVisibility"
              value="public"
              checked={reviewVisibility === 'public'}
              onChange={(e) => setReviewVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-green-500" />
                <span className="font-medium text-foreground">전체 공개</span>
              </div>
              <p className="text-sm text-muted-foreground">
                모든 사용자가 내 리뷰를 볼 수 있습니다
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="reviewVisibility"
              value="followers"
              checked={reviewVisibility === 'followers'}
              onChange={(e) => setReviewVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-foreground">팔로워에게만 공개</span>
              </div>
              <p className="text-sm text-muted-foreground">
                나를 팔로우하는 사용자만 내 리뷰를 볼 수 있습니다
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
            <input
              type="radio"
              name="reviewVisibility"
              value="private"
              checked={reviewVisibility === 'private'}
              onChange={(e) => setReviewVisibility(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-red-500" />
                <span className="font-medium text-foreground">비공개</span>
              </div>
              <p className="text-sm text-muted-foreground">
                본인만 리뷰를 볼 수 있습니다 (게임 통계에는 반영됨)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm text-green-500">개인정보 설정이 저장되었습니다!</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground py-3 rounded-md font-medium transition-colors"
        >
          {isLoading ? '저장 중...' : '변경사항 저장'}
        </button>
      </div>
    </form>
  )
}
