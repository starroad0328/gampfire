'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SteamAccountSectionProps {
  steamId: string | null
  steamUsername: string | null
}

export function SteamAccountSection({ steamId, steamUsername }: SteamAccountSectionProps) {
  const router = useRouter()
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const res = await fetch('/api/user/steam/disconnect', {
        method: 'POST',
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || 'Steam 연동 해제에 실패했습니다')
      }
    } catch (error) {
      console.error('Steam disconnect error:', error)
      alert('Steam 연동 해제에 실패했습니다')
    } finally {
      setIsDisconnecting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[#171a21] flex items-center justify-center">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 1.5A8.5 8.5 0 0 1 20.5 12 8.5 8.5 0 0 1 12 20.5 8.5 8.5 0 0 1 3.5 12 8.5 8.5 0 0 1 12 3.5zm-1.03 3.47a5.53 5.53 0 0 0-5 5.47 5.48 5.48 0 0 0 4.3 5.33l2.23-3.09a2.5 2.5 0 0 1-1.2-2.11 2.48 2.48 0 0 1 2.48-2.48 2.48 2.48 0 0 1 2.48 2.48 2.48 2.48 0 0 1-2.48 2.48h-.06l-3.17 2.26a5.48 5.48 0 0 0 3.92 1.64 5.53 5.53 0 0 0 5.5-5.53 5.53 5.53 0 0 0-5.5-5.5 5.46 5.46 0 0 0-2.5.58z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Steam 계정</h2>
          <p className="text-sm text-muted-foreground">
            {steamId ? '연동된 Steam 계정' : 'Steam 계정을 연동하세요'}
          </p>
        </div>
      </div>

      {steamId ? (
        <div className="space-y-3">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="font-medium text-foreground mb-1">{steamUsername}</p>
            <a
              href={`https://steamcommunity.com/profiles/${steamId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              Steam 프로필 보기
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {showConfirm ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-foreground mb-3">
                정말 Steam 연동을 해제하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white py-2 rounded-md font-medium transition-colors"
                >
                  {isDisconnecting ? '해제 중...' : '연동 해제'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isDisconnecting}
                  className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 rounded-md font-medium transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full text-sm text-muted-foreground hover:text-red-500 py-2 transition-colors"
            >
              Steam 연동 해제
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Steam 계정을 연동하여 보유 게임 수를 표시하세요
          </p>
          <a
            href="/api/auth/steam/link"
            className="block w-full bg-[#171a21] hover:bg-[#2a475e] text-white text-center py-3 rounded-md font-medium transition-colors"
          >
            Steam 계정 연동하기
          </a>
        </div>
      )}
    </div>
  )
}
