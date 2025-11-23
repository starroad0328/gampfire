'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gamepad2, Link, Unlink, Loader2, ExternalLink, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SteamIntegrationProps {
  initialSteamId?: string | null
  initialSteamUsername?: string | null
}

export function SteamIntegration({ initialSteamId, initialSteamUsername }: SteamIntegrationProps) {
  const router = useRouter()
  const [steamId, setSteamId] = useState('')
  const [linkedSteamId, setLinkedSteamId] = useState<string | null>(initialSteamId || null)
  const [steamUsername, setSteamUsername] = useState<string | null>(initialSteamUsername || null)
  const [gameCount, setGameCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Fetch game count if Steam is linked
    async function fetchGameCount() {
      if (linkedSteamId) {
        try {
          const res = await fetch('/api/steam/owned-games')
          if (res.ok) {
            const data = await res.json()
            setGameCount(data.gameCount)
          }
        } catch (err) {
          console.error('Failed to fetch game count:', err)
        }
      }
    }

    fetchGameCount()
  }, [linkedSteamId])

  const extractSteamId = (input: string): string | null => {
    // Remove whitespace
    const trimmed = input.trim()

    // If it's just a Steam ID (17-digit number)
    if (/^\d{17}$/.test(trimmed)) {
      return trimmed
    }

    // Try to extract from profile URL: https://steamcommunity.com/profiles/76561198...
    const profileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d{17})/)
    if (profileMatch) {
      return profileMatch[1]
    }

    // Try to extract from URL with id parameter: ?id=76561198...
    const idParamMatch = trimmed.match(/[?&]id=(\d{17})/)
    if (idParamMatch) {
      return idParamMatch[1]
    }

    return null
  }

  const handleLinkSteam = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Extract Steam ID from input (could be URL or direct ID)
      const extractedId = extractSteamId(steamId)

      if (!extractedId) {
        setError('올바른 Steam ID 또는 프로필 URL을 입력해주세요')
        setLoading(false)
        return
      }

      const res = await fetch('/api/steam/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamId: extractedId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to link Steam account')
        return
      }

      setSuccess('Steam 계정이 성공적으로 연동되었습니다!')
      setLinkedSteamId(extractedId)
      setSteamUsername(data.steamUsername)
      setSteamId('')

      // Fetch game count
      const gamesRes = await fetch('/api/steam/owned-games')
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json()
        setGameCount(gamesData.gameCount)
      }
    } catch (err) {
      setError('Steam 계정 연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkSteam = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/steam/link', {
        method: 'DELETE',
      })

      if (!res.ok) {
        setError('Steam 계정 연동 해제에 실패했습니다')
        return
      }

      setSuccess('Steam 계정 연동이 해제되었습니다')
      setLinkedSteamId(null)
      setSteamUsername(null)
      setGameCount(null)
    } catch (err) {
      setError('Steam 계정 연동 해제 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleUseSteamAvatar = async () => {
    setAvatarLoading(true)
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

      setSuccess('Steam 아바타가 프로필 사진으로 설정되었습니다')

      // Refresh the page to show new avatar
      router.refresh()
    } catch (err) {
      setError('Steam 아바타 적용 중 오류가 발생했습니다')
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Steam 계정 연동
        </CardTitle>
        <CardDescription>
          Steam 계정을 연동하여 보유 게임을 자동으로 가져오세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {linkedSteamId ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{steamUsername}</p>
                  <p className="text-sm text-muted-foreground">
                    Steam ID: {linkedSteamId}
                  </p>
                  {gameCount !== null && (
                    <p className="text-sm text-primary mt-2 font-semibold">
                      보유 게임: {gameCount.toLocaleString()}개
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnlinkSteam}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Unlink className="w-4 h-4 mr-2" />
                      연동 해제
                    </>
                  )}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUseSteamAvatar}
                  disabled={avatarLoading}
                  className="w-full"
                >
                  {avatarLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <User className="w-4 h-4 mr-2" />
                  )}
                  Steam 아바타 사용
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="steamId">Steam 프로필 URL 또는 Steam ID</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="steamId"
                  type="text"
                  placeholder="https://steamcommunity.com/profiles/76561198... 또는 Steam ID"
                  value={steamId}
                  onChange={(e) => setSteamId(e.target.value)}
                  disabled={loading}
                />
                <Button onClick={handleLinkSteam} disabled={loading || !steamId}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Link className="w-4 h-4 mr-2" />
                      연동
                    </>
                  )}
                </Button>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <p className="text-sm text-muted-foreground">
                  💡 Steam 프로필 URL을 그대로 붙여넣거나, 17자리 Steam ID를 입력하세요.
                </p>
                <p className="text-xs text-muted-foreground">
                  예: https://steamcommunity.com/profiles/76561198... 또는 76561198...
                </p>
                <a
                  href="https://steamcommunity.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline w-fit"
                >
                  <ExternalLink className="w-3 h-3" />
                  내 Steam 프로필 찾기
                </a>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
