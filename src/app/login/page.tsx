'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const steamToken = searchParams.get('steamToken')
  const steamError = searchParams.get('error')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Handle Steam error messages
    if (steamError) {
      const errorMessages: Record<string, string> = {
        steam_auth_failed: 'Steam 인증에 실패했습니다.',
        invalid_steam_id: 'Steam ID를 가져올 수 없습니다.',
        steam_processing_failed: 'Steam 로그인 처리 중 오류가 발생했습니다.',
        steam_callback_failed: 'Steam 로그인 콜백 오류가 발생했습니다.',
        missing_token: '로그인 토큰이 없습니다.',
        invalid_token: '유효하지 않은 로그인 토큰입니다.',
        user_not_found: '사용자를 찾을 수 없습니다.',
        verification_failed: '인증에 실패했습니다.',
      }
      setError(errorMessages[steamError] || 'Steam 로그인 중 오류가 발생했습니다.')
    }

    // Auto-login with Steam token
    if (steamToken && !loading) {
      handleSteamLogin(steamToken)
    }
  }, [steamToken, steamError])

  const handleSteamLogin = async (token: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        steamToken: token,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.ok) {
        // Check if user needs onboarding
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()

        if (session?.user?.needsOnboarding) {
          router.push('/onboarding')
        } else {
          router.push('/')
        }
        router.refresh()
      }
    } catch (err) {
      setError('Steam 로그인 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <img src="/gampfire-logo.png" alt="Gampfire" className="w-12 h-12" />
            <span>겜프파이어</span>
          </CardTitle>
          <CardDescription className="text-center">
            간편하게 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                setError('')
                try {
                  const result = await signIn('google', { redirect: false })

                  if (result?.error) {
                    setError(result.error)
                    setLoading(false)
                    return
                  }

                  if (result?.ok) {
                    // Check if user needs onboarding
                    const sessionRes = await fetch('/api/auth/session')
                    const session = await sessionRes.json()

                    if (session?.user?.needsOnboarding) {
                      router.push('/onboarding')
                    } else {
                      router.push('/')
                    }
                    router.refresh()
                  }
                } catch (err) {
                  setError('Google 로그인 처리 중 오류가 발생했습니다.')
                  setLoading(false)
                }
              }}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Google로 계속하기
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base bg-[#171a21] hover:bg-[#1b2838] text-white border-[#1b2838]"
              disabled={loading}
              onClick={() => window.location.href = '/api/auth/steam/login'}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 1.5A8.5 8.5 0 0 1 20.5 12 8.5 8.5 0 0 1 12 20.5 8.5 8.5 0 0 1 3.5 12 8.5 8.5 0 0 1 12 3.5zm-1.03 3.47a5.53 5.53 0 0 0-5 5.47 5.48 5.48 0 0 0 4.3 5.33l2.23-3.09a2.5 2.5 0 0 1-1.2-2.11 2.48 2.48 0 0 1 2.48-2.48 2.48 2.48 0 0 1 2.48 2.48 2.48 2.48 0 0 1-2.48 2.48h-.06l-3.17 2.26a5.48 5.48 0 0 0 3.92 1.64 5.53 5.53 0 0 0 5.5-5.53 5.53 5.53 0 0 0-5.5-5.5 5.46 5.46 0 0 0-2.5.58z"/>
              </svg>
              Steam으로 로그인
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-muted-foreground text-center">
            처음 방문하셨나요? 위 버튼으로 바로 시작하세요!
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
