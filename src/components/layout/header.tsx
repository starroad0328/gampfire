'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GameSearch } from '@/components/features/game-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Settings, LogOut, Bell } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const isLoading = status === 'loading'
  const [userImage, setUserImage] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

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

  // Fetch notifications
  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/notifications')
        .then(res => res.json())
        .then(data => {
          if (data.notifications) {
            setNotifications(data.notifications)
            setUnreadCount(data.notifications.filter((n: any) => !n.isRead).length)
          }
        })
        .catch(err => console.error('Failed to fetch notifications:', err))
    }
  }, [session?.user?.email])

  return (
    <header className="border-b sticky top-0 bg-background z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
              <img src="/gampfire-logo.png?v=3" alt="GampFire" className="w-12 h-12" />
              <span className="text-2xl font-bold">GAMPFIRE</span>
            </Link>
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
            <GameSearch />
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/games" className="hover:underline whitespace-nowrap">
              게임
            </Link>
            <Link href="/reviews" className="hover:underline whitespace-nowrap">
              리뷰
            </Link>
            <Link href="/onboarding" className="hover:underline whitespace-nowrap">
              취향 찾기
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-10 w-20 bg-muted animate-pulse rounded" />
            ) : session ? (
              <>
                {/* Notifications Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel>알림</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        알림이 없습니다
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.slice(0, 10).map((notification) => (
                          <DropdownMenuItem
                            key={notification.id}
                            className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-primary/5' : ''}`}
                            onClick={() => {
                              // Mark as read
                              fetch('/api/notifications', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ notificationId: notification.id }),
                              })
                              setNotifications(notifications.map(n =>
                                n.id === notification.id ? { ...n, isRead: true } : n
                              ))
                              setUnreadCount(Math.max(0, unreadCount - 1))
                            }}
                          >
                            <div className="flex flex-col gap-1">
                              <p className="text-sm">{notification.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Profile Dropdown */}
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
              </>
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
          <GameSearch />
        </div>
      </div>
    </header>
  )
}
