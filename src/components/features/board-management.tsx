'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Folder, ChevronDown } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string | null
  order: number
}

interface Board {
  id: string
  name: string
  description: string | null
  categoryId: string | null
  order: number
  isNoticeBoard: boolean
  _count: {
    posts: number
  }
}

interface BoardManagementProps {
  communityId: string
}

export function BoardManagement({ communityId }: BoardManagementProps) {
  const router = useRouter()

  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({ name: '' })

  // Boards
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [boardFormData, setBoardFormData] = useState({ name: '', description: '', categoryId: '', isNoticeBoard: false })

  useEffect(() => {
    fetchCategories()
    fetchBoards()
  }, [communityId])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

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
      setLoading(false)
    }
  }

  // Category handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!categoryFormData.name.trim()) {
      setError('카테고리 이름을 입력하세요')
      return
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create category')
      }

      setCategoryFormData({ name: '' })
      setIsCreatingCategory(false)
      fetchCategories()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create category')
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!categoryFormData.name.trim() || !editingCategory) {
      return
    }

    try {
      const response = await fetch(
        `/api/communities/${communityId}/categories/${editingCategory.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryFormData),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update category')
      }

      setCategoryFormData({ name: '' })
      setEditingCategory(null)
      fetchCategories()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`"${category.name}" 카테고리를 삭제하시겠습니까? (게시판은 삭제되지 않고 카테고리 미지정 상태가 됩니다)`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/communities/${communityId}/categories/${category.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete category')
      }

      fetchCategories()
      fetchBoards()
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Board handlers
  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!boardFormData.name.trim()) {
      setError('게시판 이름을 입력하세요')
      return
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: boardFormData.name,
          description: boardFormData.description,
          categoryId: boardFormData.categoryId || null,
          isNoticeBoard: boardFormData.isNoticeBoard,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create board')
      }

      setBoardFormData({ name: '', description: '', categoryId: '', isNoticeBoard: false })
      setIsCreatingBoard(false)
      fetchBoards()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create board')
    }
  }

  const handleUpdateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!boardFormData.name.trim() || !editingBoard) {
      return
    }

    try {
      const response = await fetch(
        `/api/communities/${communityId}/boards/${editingBoard.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: boardFormData.name,
            description: boardFormData.description,
            categoryId: boardFormData.categoryId || null,
            isNoticeBoard: boardFormData.isNoticeBoard,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update board')
      }

      setBoardFormData({ name: '', description: '', categoryId: '', isNoticeBoard: false })
      setEditingBoard(null)
      fetchBoards()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteBoard = async (board: Board) => {
    if (!confirm(`"${board.name}" 게시판을 삭제하시겠습니까? (게시글은 삭제되지 않고 게시판 미지정 상태가 됩니다)`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/communities/${communityId}/boards/${board.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete board')
      }

      fetchBoards()
      router.refresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const startEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({ name: category.name })
    setIsCreatingCategory(false)
    setError('')
  }

  const startEditBoard = (board: Board) => {
    setEditingBoard(board)
    setBoardFormData({ name: board.name, description: board.description || '', categoryId: board.categoryId || '', isNoticeBoard: board.isNoticeBoard })
    setIsCreatingBoard(false)
    setError('')
  }

  const cancelCategoryForm = () => {
    setIsCreatingCategory(false)
    setEditingCategory(null)
    setCategoryFormData({ name: '' })
    setError('')
  }

  const cancelBoardForm = () => {
    setIsCreatingBoard(false)
    setEditingBoard(null)
    setBoardFormData({ name: '', description: '', categoryId: '', isNoticeBoard: false })
    setError('')
  }

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>
  }

  return (
    <div className="space-y-8">
      {/* Category Management Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Folder className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">카테고리 관리</h3>
        </div>

        {!isCreatingCategory && !editingCategory && (
          <button
            onClick={() => setIsCreatingCategory(true)}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors mb-4"
          >
            <Plus className="w-4 h-4" />
            카테고리 추가
          </button>
        )}

        {/* Category Create/Edit Form */}
        {(isCreatingCategory || editingCategory) && (
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4 p-4 bg-muted/30 rounded-lg mb-4">
            <h4 className="font-semibold">
              {editingCategory ? '카테고리 수정' : '새 카테고리'}
            </h4>

            <div>
              <label className="block text-sm font-medium mb-2">
                카테고리 이름 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예: 공지사항, 커뮤니티, 게임 정보 등"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingCategory ? '수정' : '생성'}
              </button>
              <button
                type="button"
                onClick={cancelCategoryForm}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        {categories.length === 0 ? (
          <div className="text-center py-8 px-4 bg-muted/20 rounded-lg text-muted-foreground text-sm">
            카테고리가 없습니다. 게시판을 그룹화하려면 카테고리를 추가하세요.
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <h5 className="font-medium">{category.name}</h5>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditCategory(category)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border"></div>

      {/* Board Management Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">게시판 관리</h3>

        {!isCreatingBoard && !editingBoard && (
          <button
            onClick={() => setIsCreatingBoard(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors mb-4"
          >
            <Plus className="w-4 h-4" />
            게시판 추가
          </button>
        )}

        {/* Board Create/Edit Form */}
        {(isCreatingBoard || editingBoard) && (
          <form onSubmit={editingBoard ? handleUpdateBoard : handleCreateBoard} className="space-y-4 p-4 bg-muted/30 rounded-lg mb-4">
            <h4 className="font-semibold">
              {editingBoard ? '게시판 수정' : '새 게시판'}
            </h4>

            {/* Category Selection */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  카테고리 (선택)
                </label>
                <div className="relative">
                  <select
                    value={boardFormData.categoryId}
                    onChange={(e) => setBoardFormData({ ...boardFormData, categoryId: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer pr-10"
                  >
                    <option value="">카테고리 없음</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                게시판 이름 <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={boardFormData.name}
                onChange={(e) => setBoardFormData({ ...boardFormData, name: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예: 자유게시판, 공략, 질문 등"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                설명 (선택)
              </label>
              <textarea
                value={boardFormData.description}
                onChange={(e) => setBoardFormData({ ...boardFormData, description: e.target.value })}
                className="w-full px-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={2}
                placeholder="게시판에 대한 간단한 설명"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-md">
              <input
                type="checkbox"
                id="isNoticeBoard"
                checked={boardFormData.isNoticeBoard}
                onChange={(e) => setBoardFormData({ ...boardFormData, isNoticeBoard: e.target.checked })}
                className="w-5 h-5 rounded border-red-500/30 text-red-500 focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="isNoticeBoard" className="text-sm font-medium cursor-pointer select-none">
                <span className="text-red-500">공지사항 전용 게시판</span>
                <span className="text-muted-foreground ml-2">(동아리장만 글을 쓸 수 있으며, 작성된 글은 자동으로 공지사항이 됩니다)</span>
              </label>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingBoard ? '수정' : '생성'}
              </button>
              <button
                type="button"
                onClick={cancelBoardForm}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* Boards List */}
        {boards.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>아직 생성된 게시판이 없습니다</p>
            <p className="text-sm mt-2">게시판을 추가하여 글을 분류해보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {boards.map((board) => (
              <div
                key={board.id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{board.name}</h4>
                    {board.isNoticeBoard && (
                      <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded font-bold">
                        공지사항 전용
                      </span>
                    )}
                    {board.categoryId && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20">
                        {categories.find(c => c.id === board.categoryId)?.name}
                      </span>
                    )}
                  </div>
                  {board.description && (
                    <p className="text-sm text-muted-foreground mt-1">{board.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    게시글 {board._count.posts}개
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditBoard(board)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                    title="수정"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBoard(board)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
