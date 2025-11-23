'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface PostMenuProps {
  communityId: string
  postId: string
}

export function PostMenu({ communityId, postId }: PostMenuProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/communities/${communityId}/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete post')
      }

      // Redirect to community page after deletion
      router.push(`/communities/${communityId}`)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-muted rounded-md transition-colors"
        aria-label="게시글 메뉴"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-20 overflow-hidden">
            <Link
              href={`/communities/${communityId}/posts/${postId}/edit`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors w-full text-left"
              onClick={() => setIsOpen(false)}
            >
              <Edit className="w-4 h-4" />
              <span>수정</span>
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 hover:text-destructive transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
