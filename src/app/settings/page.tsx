import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProfileSettingsForm } from '@/components/features/profile-settings-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            프로필로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-foreground">계정 설정</h1>
          <p className="text-muted-foreground mt-2">
            프로필 정보를 수정하세요
          </p>
        </div>

        {/* Settings Form */}
        <ProfileSettingsForm
          user={{
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            image: user.image,
          }}
        />
      </div>
    </div>
  )
}
