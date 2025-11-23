import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ArrowLeft, ThumbsUp, MessageSquare, Crown, Eye } from 'lucide-react'
import { CommentSection } from '@/components/features/comment-section'
import { PostMenu } from '@/components/features/post-menu'

interface PostPageProps {
  params: Promise<{ id: string; postId: string }>
}

export default async function PostPage({ params }: PostPageProps) {
  const { id: communityId, postId } = await params
  const session = await getServerSession(authOptions)

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      community: {
        include: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      },
      comments: {
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
        orderBy: {
          createdAt: 'asc',
        },
      },
      likes: true,
    },
  })

  if (!post || post.communityId !== communityId) {
    redirect(`/communities/${communityId}`)
  }

  const currentUser = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
      })
    : null

  // Increment view count (only once per user)
  if (currentUser) {
    const existingView = await prisma.postView.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: currentUser.id,
        },
      },
    })

    if (!existingView) {
      // Create view record and increment count
      await prisma.$transaction([
        prisma.postView.create({
          data: {
            postId: postId,
            userId: currentUser.id,
          },
        }),
        prisma.post.update({
          where: { id: postId },
          data: {
            viewsCount: {
              increment: 1,
            },
          },
        }),
      ])
    }
  }

  const hasLiked = currentUser
    ? post.likes.some((like) => like.userId === currentUser.id)
    : false

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href={`/communities/${communityId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {post.community.name}
        </Link>

        {/* Post */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          {/* Post Header */}
          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const isCurrentMember = post.community.members.some(m => m.userId === post.user.id)
              if (!isCurrentMember) {
                return (
                  <>
                    <img
                      src="/default-avatar.png"
                      alt="탈퇴한 부원"
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-muted-foreground">탈퇴한 부원</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(post.createdAt).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </>
                )
              }
              return (
                <>
                  {post.user.image ? (
                    <img
                      src={post.user.image}
                      alt={post.user.name || ''}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg">
                      {(post.user.name || post.user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {post.user.name || post.user.username}
                      {post.user.id === post.community.ownerId && (
                        <Crown className="w-4 h-4 text-blue-500 fill-blue-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Post Title */}
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-3xl font-bold flex-1">{post.title}</h1>
            {currentUser?.id === post.userId && (
              <PostMenu communityId={communityId} postId={postId} />
            )}
          </div>

          {/* Post Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none mb-6">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {post.images.map((url, index) => (
                <Image
                  key={index}
                  src={url}
                  alt={`Image ${index + 1}`}
                  width={600}
                  height={400}
                  className="w-full h-auto rounded-md border border-border"
                />
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                hasLiked
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{post.likesCount}</span>
            </button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentsCount} 댓글</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span>{post.viewsCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentSection
          postId={postId}
          communityId={communityId}
          comments={post.comments}
          currentUser={currentUser}
          ownerId={post.community.ownerId}
          members={post.community.members}
        />
      </div>
    </div>
  )
}
