'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Loader2, User, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'

interface ProfileAvatarEditorProps {
  currentImage?: string | null
  name?: string | null
  username?: string | null
  email?: string
  hasSteamLinked?: boolean
}

export function ProfileAvatarEditor({
  currentImage,
  name,
  username,
  email,
  hasSteamLinked,
}: ProfileAvatarEditorProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하여야 합니다')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '이미지 업로드에 실패했습니다')
        return
      }

      setSuccess('프로필 사진이 업데이트되었습니다')
      // Dispatch event to update header
      window.dispatchEvent(new Event('profileUpdated'))
      setTimeout(() => {
        setIsOpen(false)
        router.refresh()
      }, 1000)
    } catch (err) {
      setError('이미지 업로드 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleUseSteamAvatar = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/user/update-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarType: 'steam' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Steam 아바타 적용에 실패했습니다')
        return
      }

      setSuccess('Steam 아바타가 적용되었습니다')
      // Dispatch event to update header
      window.dispatchEvent(new Event('profileUpdated'))
      setTimeout(() => {
        setIsOpen(false)
        router.refresh()
      }, 1000)
    } catch (err) {
      setError('Steam 아바타 적용 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/user/update-avatar', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '프로필 사진 삭제에 실패했습니다')
        return
      }

      setSuccess('프로필 사진이 삭제되었습니다')
      // Dispatch event to update header
      window.dispatchEvent(new Event('profileUpdated'))
      setTimeout(() => {
        setIsOpen(false)
        router.refresh()
      }, 1000)
    } catch (err) {
      setError('프로필 사진 삭제 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted">
          {currentImage ? (
            <Image
              src={currentImage}
              alt={name || username || '프로필'}
              fill
              className="object-cover"
            />
          ) : (
            <Image
              src="/default-avatar.png"
              alt="기본 프로필"
              fill
              className="object-cover"
            />
          )}
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-8 h-8 text-white" />
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로필 사진 변경</DialogTitle>
            <DialogDescription>
              이미지를 업로드하거나 Steam 아바타를 사용하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                이미지 업로드
              </Button>

              {hasSteamLinked && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleUseSteamAvatar}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <User className="w-4 h-4 mr-2" />
                  )}
                  Steam 아바타 사용
                </Button>
              )}

              {currentImage && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDeleteAvatar}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  프로필 사진 삭제
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
