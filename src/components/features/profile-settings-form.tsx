'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

interface ProfileSettingsFormProps {
  user: {
    id: string
    name: string | null
    username: string | null
    email: string
    image: string | null
    bio: string | null
    preferredPlatform: string | null
  }
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(user.name || '')
  const [username, setUsername] = useState(user.username || '')
  const [bio, setBio] = useState(user.bio || '')
  const [preferredPlatform, setPreferredPlatform] = useState(user.preferredPlatform || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          bio: bio.trim() || null,
          preferredPlatform: preferredPlatform || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/profile')
          router.refresh()
        }, 1500)
      } else {
        setError(data.error || '프로필 수정에 실패했습니다')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setError('프로필 수정에 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Picture Preview */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">프로필 사진</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted">
            {user.image ? (
              <img
                src={user.image}
                alt={name || username || '사용자'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {(name || username || 'U')[0].toUpperCase()}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            프로필 사진은 프로필 페이지에서 변경할 수 있습니다
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">기본 정보</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="이름을 입력하세요"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              프로필에 표시될 이름입니다
            </p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              사용자명
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="사용자명을 입력하세요"
              maxLength={30}
              pattern="[a-z0-9_]+"
            />
            <p className="text-xs text-muted-foreground mt-1">
              영문 소문자, 숫자, 밑줄(_)만 사용 가능합니다
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
              한 줄 소개
            </label>
            <input
              id="bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="자신을 한 줄로 소개해보세요"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {bio.length}/100자
            </p>
          </div>

          <div>
            <label htmlFor="platform" className="block text-sm font-medium text-foreground mb-2">
              대표 플랫폼
            </label>
            <select
              id="platform"
              value={preferredPlatform}
              onChange={(e) => setPreferredPlatform(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">선택 안 함</option>
              <option value="PC">PC</option>
              <option value="PlayStation">PlayStation</option>
              <option value="Nintendo">Nintendo</option>
              <option value="Xbox">Xbox</option>
              <option value="Mobile">모바일</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              주로 플레이하는 플랫폼을 선택하세요
            </p>
          </div>
        </div>
      </div>

      {/* Email (Read-only) */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">이메일</h2>
        <div className="p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            이메일은 변경할 수 없습니다
          </p>
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
          <p className="text-sm text-green-500">프로필이 성공적으로 수정되었습니다!</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || !name.trim() || !username.trim()}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground py-3 rounded-md font-medium transition-colors"
        >
          {isLoading ? '저장 중...' : '변경사항 저장'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          disabled={isLoading}
          className="px-6 bg-muted hover:bg-muted/80 text-foreground py-3 rounded-md font-medium transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  )
}
