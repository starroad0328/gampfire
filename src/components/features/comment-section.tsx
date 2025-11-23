'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Crown } from 'lucide-react'

interface Comment {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
}

interface User {
  id: string
  email: string
}

interface Member {
  userId: string
}

interface CommentSectionProps {
  postId: string
  communityId: string
  comments: Comment[]
  currentUser: User | null
  ownerId: string
  members: Member[]
}

export function CommentSection({
  postId,
  communityId,
  comments: initialComments,
  currentUser,
  ownerId,
  members,
}: CommentSectionProps) {
  const router = useRouter()
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/communities/${communityId}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to post comment')
      }

      const comment = await response.json()
      setComments([...comments, comment])
      setNewComment('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        댓글 {comments.length}개
      </h2>

      {/* Comment Form */}
      {currentUser ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
            placeholder="댓글을 입력하세요..."
            rows={3}
          />
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm mb-3">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '작성 중...' : '댓글 작성'}
          </button>
        </form>
      ) : (
        <div className="bg-muted px-4 py-3 rounded-md text-sm text-muted-foreground mb-8">
          댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => {
            const isCurrentMember = members.some(m => m.userId === comment.user.id)

            return (
              <div key={comment.id} className="flex gap-3">
                {/* Avatar */}
                {!isCurrentMember ? (
                  <img
                    src="/default-avatar.png"
                    alt="탈퇴한 부원"
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                ) : comment.user.image ? (
                  <img
                    src={comment.user.image}
                    alt={comment.user.name || ''}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {(comment.user.name || comment.user.username || 'U')[0].toUpperCase()}
                  </div>
                )}

                <div className="flex-1">
                  {/* Comment Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium flex items-center gap-1 ${!isCurrentMember ? 'text-muted-foreground' : ''}`}>
                      {!isCurrentMember ? '탈퇴한 부원' : (comment.user.name || comment.user.username)}
                      {isCurrentMember && comment.user.id === ownerId && (
                        <Crown className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('ko-KR')}
                    </span>
                  </div>

                  {/* Comment Content */}
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
