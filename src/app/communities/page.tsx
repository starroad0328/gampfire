import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Users, MessageSquare, Plus } from 'lucide-react'

export default async function CommunitiesPage() {
  const session = await getServerSession(authOptions)

  const communities = await prisma.community.findMany({
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      _count: {
        select: {
          members: true,
          posts: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">동아리</h1>
            <p className="text-muted-foreground">
              게임별 동아리에 가입하고 다른 유저들과 소통하세요
            </p>
          </div>
          {session && (
            <Link
              href="/communities/create"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              동아리 만들기
            </Link>
          )}
        </div>

        {/* Communities Grid */}
        {communities.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">아직 생성된 동아리가 없습니다</p>
            {session && (
              <Link
                href="/communities/create"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                첫 동아리 만들기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Link
                key={community.id}
                href={`/communities/${community.id}`}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
              >
                {/* Community Image */}
                {community.image && (
                  <div className="w-full h-32 mb-4 rounded-md overflow-hidden bg-muted">
                    <img
                      src={community.image}
                      alt={community.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Community Name */}
                <h3 className="text-xl font-bold mb-2">{community.name}</h3>

                {/* Description */}
                {community.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {community.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{community._count.members} 부원</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{community._count.posts} 게시글</span>
                  </div>
                </div>

                {/* Owner */}
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                  {community.owner.image ? (
                    <img
                      src={community.owner.image}
                      alt={community.owner.name || ''}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                      {(community.owner.name || community.owner.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {community.owner.name || community.owner.username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
