import Link from 'next/link'
import { Github, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 서비스 정보 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img src="/gampfire-logo.png" alt="Gampfire" className="w-8 h-8" />
              <h3 className="font-bold text-lg">겜프파이어</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              한국어 중심의 게임 평점·리뷰 플랫폼
            </p>
            <p className="text-sm text-muted-foreground">
              신뢰도 높은 게임 평가 서비스
            </p>
          </div>

          {/* 서비스 링크 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/games" className="hover:text-foreground transition-colors">
                  게임 둘러보기
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="hover:text-foreground transition-colors">
                  리뷰
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-foreground transition-colors">
                  취향 찾기
                </Link>
              </li>
            </ul>
          </div>

          {/* 정보 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">정보</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/company" className="hover:text-foreground transition-colors">
                  회사소개
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          {/* 비즈니스 문의 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">비즈니스 문의</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:gampfireoffical@gmail.com" className="hover:text-foreground transition-colors">
                  gampfireoffical@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                <a
                  href="https://github.com/starroad0328"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 하단 저작권 및 추가 정보 */}
        <div className="border-t mt-8 pt-6 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 겜프파이어. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            게임 데이터 제공: IGDB (Twitch) · Steam API
          </p>
        </div>
      </div>
    </footer>
  )
}
