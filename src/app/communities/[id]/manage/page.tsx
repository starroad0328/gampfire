import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CommunityManagementTabs } from '@/components/features/community-management-tabs'

interface ManageCommunityPageProps {
  params: Promise<{ id: string }>
}

export default async function ManageCommunityPage({ params }: ManageCommunityPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!currentUser) {
    redirect('/login')
  }

  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  })

  if (!community) {
    redirect('/communities')
  }

  // Check if current user is owner
  if (community.ownerId !== currentUser.id) {
    redirect(`/communities/${id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href={`/communities/${id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          동아리로 돌아가기
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2">동아리 관리</h1>
        <p className="text-muted-foreground mb-8">
          동아리 정보와 부원을 관리하세요
        </p>

        {/* Management Tabs */}
        <CommunityManagementTabs
          community={{
            id: community.id,
            name: community.name,
            description: community.description,
            image: community.image,
          }}
          members={community.members}
          ownerId={community.ownerId}
        />
      </div>
    </div>
  )
}
