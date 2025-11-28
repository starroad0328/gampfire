'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AccountManagementFormProps {
  user: {
    id: string
    email: string
    name: string | null
  }
}

export function AccountManagementForm({ user }: AccountManagementFormProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    const confirmation = window.confirm(
      `정말로 계정을 삭제하시겠습니까?\n\n계정: ${user.email}\n\n이 작업은 되돌릴 수 없으며, 모든 리뷰와 데이터가 영구적으로 삭제됩니다.`
    )

    if (!confirmation) return

    const finalConfirmation = window.prompt(
      '계정 삭제를 확인하려면 "삭제"를 입력하세요:'
    )

    if (finalConfirmation !== '삭제') {
      alert('계정 삭제가 취소되었습니다.')
      return
    }

    setIsDeleting(true)

    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '계정 삭제에 실패했습니다')
        setIsDeleting(false)
        return
      }

      // Sign out and redirect to home
      alert('계정이 삭제되었습니다.')
      signOut({ callbackUrl: '/' })
    } catch (error) {
      console.error('Delete account error:', error)
      alert('계정 삭제에 실패했습니다')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Delete Account Section */}
      <div className="bg-card border border-red-500/20 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground mb-2">계정 탈퇴</h2>
            <div className="mb-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-md">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-600 space-y-1">
                  <p>⚠️ 삭제되는 데이터:</p>
                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                    <li>모든 게임 리뷰 및 평점</li>
                    <li>리뷰 좋아요 및 댓글</li>
                    <li>프로필 정보</li>
                    <li>계정 정보</li>
                  </ul>
                </div>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? '삭제 중...' : '계정 탈퇴'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
