'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2 } from 'lucide-react'

interface NicknameInputProps {
  communityId: string
}

export function NicknameInput({ communityId }: NicknameInputProps) {
  const [nickname, setNickname] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const [bytes, setBytes] = useState(0)

  useEffect(() => {
    if (!nickname) {
      setAvailable(null)
      setMessage('')
      setBytes(0)
      return
    }

    // Calculate bytes (Korean characters are 3 bytes in UTF-8)
    const byteLength = new Blob([nickname]).size
    setBytes(byteLength)

    if (byteLength > 20) {
      setAvailable(false)
      setMessage('별명은 20bytes를 초과할 수 없습니다.')
      return
    }

    // Debounce API call
    const timeoutId = setTimeout(async () => {
      setChecking(true)

      try {
        const response = await fetch(
          `/api/communities/${communityId}/check-nickname?nickname=${encodeURIComponent(nickname)}`
        )
        const data = await response.json()

        setAvailable(data.available)
        setMessage(data.message)
      } catch (error) {
        console.error('Failed to check nickname:', error)
        setAvailable(null)
        setMessage('별명 확인 중 오류가 발생했습니다.')
      } finally {
        setChecking(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [nickname, communityId])

  return (
    <div className="flex items-start gap-4">
      <div className="w-20 font-bold text-sm flex-shrink-0">별명</div>
      <div className="flex-1">
        <div className="relative">
          <input
            type="text"
            name="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="동아리 내에서 사용할 별명을 입력하세요"
            className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 bg-background ${
              available === true
                ? 'border-green-500 focus:ring-green-500'
                : available === false
                ? 'border-red-500 focus:ring-red-500'
                : 'border-border focus:ring-primary'
            }`}
            required
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checking ? (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            ) : available === true ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : available === false ? (
              <X className="w-5 h-5 text-red-500" />
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className={`text-xs ${
            available === true
              ? 'text-green-600'
              : available === false
              ? 'text-red-600'
              : 'text-muted-foreground'
          }`}>
            {message || '별명을 입력하세요.'}
          </div>
          <div className="text-xs text-foreground">
            {bytes}/20bytes
          </div>
        </div>
      </div>
    </div>
  )
}
