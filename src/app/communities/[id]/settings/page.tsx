import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { NicknameInput } from '@/components/features/nickname-input'

interface SettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
  })

  if (!currentUser) {
    redirect('/login')
  }

  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      boards: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  if (!community) {
    redirect('/communities')
  }

  const member = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId: id,
        userId: currentUser.id,
      },
    },
  })

  if (!member) {
    redirect(`/communities/${id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <Link
          href={`/communities/${id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          동아리로 돌아가기
        </Link>

        {/* Settings Form */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border p-6">
            <h1 className="text-2xl font-bold mb-2">내 설정</h1>
            <p className="text-sm text-muted-foreground">
              {community.name} 동아리에서 사용할 설정을 관리합니다.
            </p>
          </div>

          <form action={`/api/communities/${id}/update-settings`} method="POST" className="p-6 space-y-6">
            {/* Nickname */}
            <div className="border-b border-border pb-6">
              <h2 className="text-lg font-bold mb-4">별명 설정</h2>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground mb-4">
                  현재 별명: <span className="font-medium text-foreground">{member.nickname || '설정되지 않음'}</span>
                </div>
                <NicknameInput communityId={id} />
              </div>
            </div>

            {/* Blocked Boards */}
            <div className="border-b border-border pb-6">
              <h2 className="text-lg font-bold mb-4">게시판 차단</h2>
              <div className="text-sm text-muted-foreground mb-4">
                보고 싶지 않은 게시판을 선택하면 해당 게시판의 글이 목록에 표시되지 않습니다.
              </div>
              <div className="space-y-2">
                {community.boards.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    아직 생성된 게시판이 없습니다.
                  </div>
                ) : (
                  community.boards.map((board) => (
                    <label
                      key={board.id}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="blockedBoards"
                        value={board.id}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{board.name}</span>
                      {board.description && (
                        <span className="text-xs text-muted-foreground">
                          - {board.description}
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Link
                href={`/communities/${id}`}
                className="px-6 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
              >
                취소
              </Link>
              <button
                type="submit"
                className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
