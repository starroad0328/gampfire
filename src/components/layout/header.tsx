'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GameSearch } from '@/components/features/game-search'
import { CommunitySearch } from '@/components/features/community-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isLoading = status === 'loading'
  const [userImage, setUserImage] = useState<string | null>(null)
  const [currentCommunity, setCurrentCommunity] = useState<{ id: string; name: string } | null>(null)

  // Check if we're on a community page
  const isOnCommunityPage = pathname?.startsWith('/communities') ?? false

  // Fetch latest user image when session is available
  useEffect(() => {
    const fetchUserProfile = () => {
      if (session?.user?.email) {
        fetch('/api/user/profile')
          .then(res => res.json())
          .then(data => {
            if (data.image) {
              setUserImage(data.image)
            } else {
              setUserImage(null)
            }
          })
          .catch(err => console.error('Failed to fetch user profile:', err))
      }
    }

    fetchUserProfile()

    // Listen for profile update events
    const handleProfileUpdate = () => {
      fetchUserProfile()
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
    }
  }, [session?.user?.email])

  // Fetch community info when on community page
  useEffect(() => {
    const communityMatch = pathname?.match(/^\/communities\/([^\/]+)/)
    if (communityMatch) {
      const communityId = communityMatch[1]
      fetch(`/api/communities/${communityId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id && data.name) {
            setCurrentCommunity({ id: data.id, name: data.name })
          }
        })
        .catch(err => console.error('Failed to fetch community:', err))
    } else {
      setCurrentCommunity(null)
    }
  }, [pathname])

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
              <img src="/gampfire-logo.png?v=3" alt="GampFire" className="w-12 h-12" />
              <span className="text-2xl font-bold">GAMPFIRE</span>
            </Link>
            {isOnCommunityPage && (
              <>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                <Link
                  href="/communities"
                  className="text-xl font-semibold hover:underline whitespace-nowrap"
                >
                  동아리
                </Link>
                {currentCommunity && (
                  <>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    <Link
                      href={`/communities/${currentCommunity.id}`}
                      className="text-xl font-semibold hover:underline whitespace-nowrap text-primary"
                    >
                      {currentCommunity.name}
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
            {isOnCommunityPage ? <CommunitySearch /> : <GameSearch />}
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/games" className="hover:underline whitespace-nowrap">
              게임
            </Link>
            <Link href="/reviews" className="hover:underline whitespace-nowrap">
              리뷰
            </Link>
            <Link href="/onboarding" className="hover:underline whitespace-nowrap">
              리스트
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-10 w-20 bg-muted animate-pulse rounded" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={userImage || session.user?.image || '/default-avatar.png'}
                        alt={session.user?.name || ''}
                      />
                      <AvatarFallback>
                        {session.user?.name?.[0] || session.user?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || session.user?.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>프로필</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>설정</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">로그인</Link>
                </Button>
                <Button asChild className="hidden sm:flex">
                  <Link href="/signup">회원가입</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 md:hidden">
          {isOnCommunityPage ? <CommunitySearch /> : <GameSearch />}
        </div>
      </div>
    </header>
  )
}
