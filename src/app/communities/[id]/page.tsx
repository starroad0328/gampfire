import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ArrowLeft, Users, MessageSquare, ThumbsUp, Plus, Crown, Folder, Image as ImageIcon, Settings } from 'lucide-react'
import { CommunityJoinButton } from '@/components/features/community-join-button'

interface CommunityPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ boardId?: string }>
}

export default async function CommunityPage({ params, searchParams }: CommunityPageProps) {
  const { id } = await params
  const { boardId } = await searchParams
  const session = await getServerSession(authOptions)

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
            },
          },
        },
      },
      categories: {
        orderBy: {
          order: 'asc',
        },
        include: {
          boards: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      },
      boards: {
        where: {
          categoryId: null,
        },
        orderBy: {
          order: 'asc',
        },
      },
      posts: {
        where: boardId ? { boardId, isNotice: false } : { isNotice: false },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          board: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          posts: true,
        },
      },
    },
  })

  if (!community) {
    redirect('/communities')
  }

  // Fetch notices (up to 10, always shown regardless of board filter)
  const notices = await prisma.post.findMany({
    where: {
      communityId: id,
      isNotice: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      board: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  })

  // Check if current user is member
  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
      })
    : null

  const isMember = currentUser
    ? community.members.some((m) => m.userId === currentUser.id)
    : false

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          동아리 목록으로
        </Link>

        {/* Community Header */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
          {/* Header with Image and Title */}
          <div className="flex items-start gap-6 p-6 border-b border-border">
            {community.image && (
              <div className="w-32 h-32 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img
                  src={community.image}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{community.name}</h1>
              {community.description && (
                <p className="text-muted-foreground mb-4">{community.description}</p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {currentUser?.id === community.ownerId && (
                  <Link
                    href={`/communities/${id}/manage`}
                    className="bg-secondary text-secondary-foreground px-6 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm"
                  >
                    동아리 관리
                  </Link>
                )}
                {session && (
                  <CommunityJoinButton
                    communityId={id}
                    isMember={isMember}
                    isOwner={currentUser?.id === community.ownerId}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="p-6">
            <div className="flex items-center gap-4 border-b border-border pb-3 mb-4">
              <button className="text-sm font-bold text-primary border-b-2 border-primary pb-3 -mb-3">
                동아리 정보
              </button>
              {isMember && (
                <button className="text-sm text-muted-foreground hover:text-foreground pb-3 -mb-3">
                  나의 활동
                </button>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Community Info */}
              <div>
                {/* Owner Info */}
                <div className="flex items-center gap-3 mb-4">
                  {community.owner.image ? (
                    <img
                      src={community.owner.image}
                      alt={community.owner.name || ''}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                      {(community.owner.name || community.owner.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{community.owner.name || community.owner.username}</span>
                      <Crown className="w-4 h-4 text-blue-500 fill-blue-500" />
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">동아리장</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(community.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}. 개설
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  {community.gameId && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">
                        G
                      </div>
                      <span className="text-muted-foreground">게임 전용 동아리</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="font-bold">{community.members.length}</span>
                      <span className="text-muted-foreground">명</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: User Profile (only for members) */}
              {isMember && currentUser && (
                <div className="border-l border-border pl-6">
                  {/* User Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {currentUser.image ? (
                        <img
                          src={currentUser.image}
                          alt={currentUser.name || ''}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold">
                          {(currentUser.name || currentUser.username || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold">{currentUser.name || currentUser.username}</div>
                        <div className="text-xs text-muted-foreground">
                          {(() => {
                            const member = community.members.find(m => m.userId === currentUser.id)
                            return member ? new Date(member.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            }) + '. 가입' : ''
                          })()}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/communities/${id}/settings`}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                      title="내 설정"
                    >
                      <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                    </Link>
                  </div>

                  {/* User Stats */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">👑 역할</div>
                      <div className="font-bold">
                        {currentUser.id === community.ownerId ? '동아리장' : '부원'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">👍 받은 추천</div>
                      <div className="font-bold">
                        {(() => {
                          const userPosts = community.posts.filter(p => p.userId === currentUser.id)
                          const totalLikes = userPosts.reduce((acc, post) => acc + post.likesCount, 0)
                          return totalLikes
                        })()}개
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">📝 내가 쓴 게시글</div>
                      <div className="font-bold">
                        {community.posts.filter(p => p.userId === currentUser.id).length}개
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs mb-1">💬 내가 쓴 댓글</div>
                      <div className="font-bold">
                        {(() => {
                          const userComments = community.posts.reduce((acc, post) => {
                            return acc + post._count.comments
                          }, 0)
                          return userComments
                        })()}개
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Board Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">게시판</h3>
              <div className="space-y-1">
                <Link
                  href={`/communities/${id}`}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    !boardId
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-muted'
                  }`}
                >
                  전체글보기
                </Link>

                {/* Categories with Boards */}
                {community.categories.map((category, index) => (
                  <div key={category.id} className="mt-3 pt-3 border-t border-border">
                    <div className="px-3 py-1.5 text-xs font-bold text-foreground">
                      {category.name}
                    </div>
                    <div className="space-y-1 mt-1">
                      {category.boards.map((board) => (
                        <Link
                          key={board.id}
                          href={`/communities/${id}?boardId=${board.id}`}
                          className={`block px-3 py-2 pl-6 rounded-md text-sm transition-colors ${
                            boardId === board.id
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {board.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Boards without Category */}
                {community.boards.length > 0 && (
                  <div className={community.categories.length > 0 ? "mt-3 pt-3 border-t border-border space-y-1" : "mt-3 space-y-1"}>
                    {community.boards.map((board) => (
                      <Link
                        key={board.id}
                        href={`/communities/${id}?boardId=${board.id}`}
                        className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                          boardId === board.id
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {board.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Posts List */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-lg">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold">
                    {boardId
                      ? (() => {
                          // Find board in categories
                          for (const category of community.categories) {
                            const board = category.boards.find(b => b.id === boardId)
                            if (board) return board.name
                          }
                          // Find board without category
                          return community.boards.find(b => b.id === boardId)?.name || '전체글보기'
                        })()
                      : '전체글보기'}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {community.posts.length}개의 글
                  </span>
                </div>
                {session && isMember && (
                  <Link
                    href={`/communities/${id}/create-post`}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    글 작성
                  </Link>
                )}
              </div>

          {/* Table */}
          {notices.length === 0 && community.posts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">아직 작성된 게시글이 없습니다</p>
              {session && isMember && (
                <Link
                  href={`/communities/${id}/create-post`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  첫 게시글 작성하기
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground w-[50%]">
                      제목
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground w-[15%]">
                      작성자
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground w-[15%]">
                      작성일
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground w-[10%]">
                      댓글
                    </th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground w-[10%]">
                      조회
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Notice Posts - Always at top with red background */}
                  {notices.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-border bg-red-500/5 hover:bg-red-500/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/communities/${id}/posts/${post.id}`}
                          className="hover:underline"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded font-bold flex-shrink-0">
                              공지
                            </span>
                            {post.board && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 flex-shrink-0">
                                {post.board.name}
                              </span>
                            )}
                            {post.images && post.images.length > 0 && (
                              <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-medium">{post.title}</span>
                            {post._count.comments > 0 && (
                              <span className="text-sm text-primary flex-shrink-0">
                                [{post._count.comments}]
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const isCurrentMember = community.members.some(m => m.userId === post.user.id)
                            if (!isCurrentMember) {
                              return (
                                <>
                                  <img
                                    src="/default-avatar.png"
                                    alt="탈퇴한 부원"
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <span className="text-sm text-muted-foreground">탈퇴한 부원</span>
                                </>
                              )
                            }
                            return (
                              <>
                                {post.user.image ? (
                                  <img
                                    src={post.user.image}
                                    alt={post.user.name || ''}
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                    {(post.user.name || post.user.username || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm flex items-center gap-1">
                                  {post.user.name || post.user.username}
                                  {post.user.id === community.ownerId && (
                                    <Crown className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                                  )}
                                </span>
                              </>
                            )
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {post._count.comments}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {post.viewsCount || 0}
                      </td>
                    </tr>
                  ))}

                  {/* Regular Posts */}
                  {community.posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/communities/${id}/posts/${post.id}`}
                          className="hover:underline"
                        >
                          <div className="flex items-center gap-2">
                            {post.board && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 flex-shrink-0">
                                {post.board.name}
                              </span>
                            )}
                            {post.images && post.images.length > 0 && (
                              <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <span className="font-medium">{post.title}</span>
                            {post._count.comments > 0 && (
                              <span className="text-sm text-primary flex-shrink-0">
                                [{post._count.comments}]
                              </span>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(() => {
                            const isCurrentMember = community.members.some(m => m.userId === post.user.id)
                            if (!isCurrentMember) {
                              return (
                                <>
                                  <img
                                    src="/default-avatar.png"
                                    alt="탈퇴한 부원"
                                    className="w-6 h-6 rounded-full"
                                  />
                                  <span className="text-sm text-muted-foreground">탈퇴한 부원</span>
                                </>
                              )
                            }
                            return (
                              <>
                                {post.user.image ? (
                                  <img
                                    src={post.user.image}
                                    alt={post.user.name || ''}
                                    className="w-6 h-6 rounded-full"
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                    {(post.user.name || post.user.username || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm flex items-center gap-1">
                                  {post.user.name || post.user.username}
                                  {post.user.id === community.ownerId && (
                                    <Crown className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                                  )}
                                </span>
                              </>
                            )
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        }).replace(/\. /g, '.').replace(/\.$/, '')}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {post._count.comments}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {post.viewsCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
