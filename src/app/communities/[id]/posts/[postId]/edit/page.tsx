'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChevronDown, X } from 'lucide-react'
import Link from 'next/link'
import RichTextEditor from '@/components/RichTextEditor'

interface Board {
  id: string
  name: string
  description: string | null
}

interface Post {
  id: string
  title: string
  content: string
  boardId: string | null
  tags: string[]
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const communityId = params.id as string
  const postId = params.postId as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [boards, setBoards] = useState<Board[]>([])
  const [loadingBoards, setLoadingBoards] = useState(true)
  const [loadingPost, setLoadingPost] = useState(true)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    boardId: '',
  })

  useEffect(() => {
    fetchBoards()
    fetchPost()
  }, [communityId, postId])

  const fetchBoards = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/boards`)
      if (response.ok) {
        const data = await response.json()
        setBoards(data)
      }
    } catch (err) {
      console.error('Failed to fetch boards:', err)
    } finally {
      setLoadingBoards(false)
    }
  }

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/posts/${postId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData({
          title: data.title,
          content: data.content,
          boardId: data.boardId || '',
        })
        setTags(data.tags || [])
      } else {
        setError('게시글을 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('Failed to fetch post:', err)
      setError('게시글을 불러올 수 없습니다.')
    } finally {
      setLoadingPost(false)
    }
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() && tags.length < 10) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput('')
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/communities/${communityId}/posts/${postId}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          boardId: formData.boardId,
          tags: tags,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update post')
      }

      router.push(`/communities/${communityId}/posts/${postId}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingPost) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground">게시글을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          href={`/communities/${communityId}/posts/${postId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          게시글로 돌아가기
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2">게시글 수정</h1>
        <p className="text-muted-foreground mb-8">
          게시글 내용을 수정하세요
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Board Selection */}
          <div>
            <label htmlFor="board" className="block text-sm font-medium mb-2">
              게시판 <span className="text-destructive">*</span>
            </label>
            {loadingBoards ? (
              <div className="w-full px-4 py-3 bg-muted border border-border rounded-md text-muted-foreground">
                게시판 로딩 중...
              </div>
            ) : boards.length === 0 ? (
              <div className="w-full px-4 py-3 bg-muted/30 border border-border rounded-md text-muted-foreground text-sm">
                생성된 게시판이 없습니다.
              </div>
            ) : (
              <div className="relative">
                <select
                  id="board"
                  value={formData.boardId}
                  onChange={(e) => setFormData({ ...formData, boardId: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer pr-10"
                  required
                >
                  <option value="">게시판을 선택하세요</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              제목 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              placeholder="게시글 제목을 입력하세요"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-2">
              내용 <span className="text-destructive">*</span>
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(html) => setFormData({ ...formData, content: html })}
              placeholder="내용을 입력하세요."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">
              태그 (선택)
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                className="w-full px-4 py-3 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="#태그를 입력해주세요 (최대 10개)"
                maxLength={20}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:text-primary/70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Enter 키를 눌러 태그를 추가하세요. ({tags.length}/10)
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.content || !formData.boardId || boards.length === 0}
              className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? '수정 중...' : '수정 완료'}
            </button>
            <Link
              href={`/communities/${communityId}/posts/${postId}`}
              className="px-6 py-3 border border-border rounded-md hover:bg-muted transition-colors"
            >
              취소
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
