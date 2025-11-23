'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export function SteamLinkMessage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'SteamLinked') {
      setMessage({
        type: 'success',
        text: 'Steam 계정이 성공적으로 연동되었습니다!'
      })
      setVisible(true)
    } else if (error === 'SteamAlreadyLinked') {
      setMessage({
        type: 'error',
        text: '이 Steam 계정은 이미 다른 사용자와 연동되어 있습니다.'
      })
      setVisible(true)
    } else if (error === 'SteamVerificationFailed') {
      setMessage({
        type: 'error',
        text: 'Steam 인증에 실패했습니다. 다시 시도해주세요.'
      })
      setVisible(true)
    } else if (error === 'LinkFailed') {
      setMessage({
        type: 'error',
        text: 'Steam 계정 연동 중 오류가 발생했습니다.'
      })
      setVisible(true)
    }

    // Clear the query parameters from URL
    if (success || error) {
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!visible || !message) return null

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 ${
      message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white rounded-lg shadow-lg p-4 flex items-start gap-3`}>
      {message.type === 'success' ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      )}
      <p className="flex-1">{message.text}</p>
      <button
        onClick={() => setVisible(false)}
        className="text-white/80 hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
