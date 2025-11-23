import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ArrowLeft, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { NicknameInput } from '@/components/features/nickname-input'

interface JoinPageProps {
  params: Promise<{ id: string }>
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const community = await prisma.community.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          name: true,
          username: true,
        },
      },
      members: {
        where: {
          user: {
            email: session.user?.email || '',
          },
        },
      },
    },
  })

  if (!community) {
    redirect('/communities')
  }

  // Already a member
  if (community.members.length > 0) {
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
          뒤로 가기
        </Link>

        {/* Join Form */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border p-6">
            <h1 className="text-2xl font-bold mb-2">동아리 가입하기</h1>
            <p className="text-sm text-muted-foreground">
              동아리 가입을 위한 정보를 입력해주세요.
            </p>
          </div>

          <form action={`/api/communities/${id}/join`} method="POST" className="p-6 space-y-6">
            {/* Community Description */}
            <div className="border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 font-bold text-sm flex-shrink-0">동아리 설명</div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    {community.description || '동아리에 대한 설명이 없습니다.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Join Instructions */}
            <div className="border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 font-bold text-sm flex-shrink-0">가입 안내</div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    동아리 규칙을 준수하고, 서로 존중하는 분위기를 만들어주세요.
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Image */}
            <div className="border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 font-bold text-sm flex-shrink-0">프로필 이미지</div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground mb-3">
                    프로필을 카페별로 설정할 수 있습니다.
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 transition-colors"
                      >
                        등록
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-destructive/10 text-destructive rounded-md text-sm hover:bg-destructive/20 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nickname */}
            <div className="border-b border-border pb-6">
              <NicknameInput communityId={id} />
            </div>

            {/* Public Setting */}
            <div className="border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 font-bold text-sm flex-shrink-0">공개 설정</div>
                <div className="flex-1">
                  <div className="text-sm font-bold mb-3">
                    카페 운영진에게 <span className="text-primary">성별 연령대</span> 공개
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="publicSetting"
                        value="allow"
                        defaultChecked
                        className="w-4 h-4"
                      />
                      <span className="text-sm">허용</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="publicSetting"
                        value="deny"
                        className="w-4 h-4"
                      />
                      <span className="text-sm">비허용</span>
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">
                    공개 설정은 가입 후 프로필 설정 메뉴에서 자유롭게 변경할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>

            {/* Join Questions */}
            <div className="border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 font-bold text-sm flex-shrink-0">가입 질문</div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">
                      첫소리 카페의 규칙을 잘 지키실건가요?
                    </div>
                    <textarea
                      name="answer1"
                      rows={3}
                      placeholder="답변을 입력하세요"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">
                      첫소리님의 편이신가요?
                    </div>
                    <textarea
                      name="answer2"
                      rows={3}
                      placeholder="답변을 입력하세요"
                      className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background resize-none"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    잘못 답변 시 회원님의 소중한 개인정보가 유출되지 않도록 주의해주시기 바랍니다.
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="border-b border-border pb-6">
              <div className="flex items-start gap-4">
                <div className="w-20 font-bold text-sm flex-shrink-0">보안 절차</div>
                <div className="flex-1">
                  <div className="bg-muted/50 border border-border rounded-md p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">🔒 새로고침</div>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                      >
                        🔊 음성으로 듣기
                      </button>
                    </div>
                    <div className="bg-background p-3 rounded border border-border text-center">
                      <span className="text-2xl font-bold tracking-wider">CAPTCHA</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="captcha"
                    placeholder="보안문자를 입력하세요"
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-center gap-3 pt-4">
              <Link
                href={`/communities/${id}`}
                className="px-8 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors font-medium"
              >
                취소
              </Link>
              <button
                type="submit"
                className="px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                가입하기
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
