'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserX, Shield } from 'lucide-react'

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    email: string
  }
}

interface MemberManagementProps {
  communityId: string
  members: Member[]
  ownerId: string
}

export function MemberManagement({ communityId, members, ownerId }: MemberManagementProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`정말로 ${memberName}님을 동아리에서 내보내시겠습니까?`)) {
      return
    }

    setLoading(memberId)

    try {
      const response = await fetch(`/api/communities/${communityId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(null)
    }
  }

  const handleChangeRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'member' ? 'moderator' : 'member'
    const roleText = newRole === 'moderator' ? '운영진' : '일반 부원'

    if (!confirm(`이 부원의 역할을 ${roleText}(으)로 변경하시겠습니까?`)) {
      return
    }

    setLoading(memberId)

    try {
      const response = await fetch(`/api/communities/${communityId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change role')
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(null)
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
          <Shield className="w-3 h-3" />
          동아리장
        </span>
      )
    }
    if (role === 'moderator') {
      return (
        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded">
          운영진
        </span>
      )
    }
    return (
      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded">
        부원
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        총 {members.length}명의 부원
      </p>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              {member.user.image ? (
                <img
                  src={member.user.image}
                  alt={member.user.name || ''}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  {(member.user.name || member.user.username || 'U')[0].toUpperCase()}
                </div>
              )}

              {/* Name and Role */}
              <div>
                <div className="font-medium">
                  {member.user.name || member.user.username}
                </div>
                <div className="text-sm text-muted-foreground">
                  {member.user.email}
                </div>
              </div>

              {/* Role Badge */}
              <div className="ml-2">
                {getRoleBadge(member.role)}
              </div>
            </div>

            {/* Actions */}
            {member.user.id !== ownerId && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleChangeRole(member.id, member.role)}
                  disabled={loading === member.id}
                  className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  {member.role === 'member' ? '운영진으로' : '부원으로'}
                </button>
                <button
                  onClick={() => handleRemoveMember(member.id, member.user.name || member.user.username || '사용자')}
                  disabled={loading === member.id}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors disabled:opacity-50"
                  title="동아리에서 내보내기"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
