'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function CompanyPage() {
  useEffect(() => {
    // 스크롤 시 섹션 부드럽게 등장시키는 코드
    const reveals = document.querySelectorAll('.reveal')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('show')
            // 한 번 나타난 섹션은 계속 보여두고 싶으면 아래 줄 유지
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15, // 15% 정도 보이기 시작하면 애니메이션 실행
      }
    )

    reveals.forEach((el) => observer.observe(el))

    return () => {
      reveals.forEach((el) => observer.unobserve(el))
    }
  }, [])

  return (
    <div className="company-site">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0 !important;
          padding: 0 !important;
          display: block !important;
        }

        .company-site {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: radial-gradient(circle at top, #111827 0, #020617 45%, #000 100%);
          color: #f9fafb;
          line-height: 1.6;
          min-height: 100vh;
          width: 100%;
        }

        /* 헤더 / 네비게이션 */
        .company-header {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(2, 6, 23, 0.88);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }
        .company-nav {
          max-width: 960px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .company-logo {
          font-weight: 700;
          letter-spacing: 1px;
          font-size: 1rem;
        }
        .company-logo span {
          color: #f97316;
        }
        .company-nav-links {
          display: flex;
          gap: 16px;
          font-size: 0.9rem;
        }
        .company-nav-links a {
          opacity: 0.8;
          position: relative;
          padding-bottom: 2px;
        }
        .company-nav-links a::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(to right, #f97316, #fb923c);
          transition: width 0.2s ease-out;
        }
        .company-nav-links a:hover {
          opacity: 1;
        }
        .company-nav-links a:hover::after {
          width: 100%;
        }

        /* 공통 섹션 레이아웃 */
        .company-section {
          max-width: 960px;
          margin: 0 auto;
          padding: 80px 20px;
        }

        /* Hero */
        .company-hero {
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 24px;
        }
        .hero-kicker {
          font-size: 0.8rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .hero-title {
          font-size: clamp(2.2rem, 4vw, 3rem);
          font-weight: 700;
        }
        .hero-title span {
          background: linear-gradient(to right, #f97316, #fb7185);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 0.98rem;
          max-width: 520px;
          opacity: 0.85;
          color: #d1d5db;
        }
        .hero-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 0.75rem;
        }
        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          background: rgba(15, 23, 42, 0.8);
        }
        .hero-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .btn-primary,
        .btn-secondary {
          padding: 10px 18px;
          border-radius: 999px;
          border: 1px solid #374151;
          font-size: 0.9rem;
          cursor: pointer;
          display: inline-block;
          transition: transform 0.12s ease-out, box-shadow 0.12s ease-out, filter 0.12s ease-out,
            background 0.12s ease-out;
        }
        .btn-primary {
          background: linear-gradient(to right, #f97316, #fb923c);
          border-color: transparent;
          color: #0b0c10;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.35);
        }
        .btn-primary:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
          box-shadow: 0 14px 40px rgba(249, 115, 22, 0.5);
        }
        .btn-secondary {
          background: rgba(15, 23, 42, 0.9);
          color: #e5e7eb;
        }
        .btn-secondary:hover {
          background: rgba(31, 41, 55, 1);
          transform: translateY(-1px);
        }

        /* 섹션 타이틀 */
        .company-section h2 {
          font-size: 1.5rem;
          margin-bottom: 10px;
        }
        .section-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #6b7280;
          margin-bottom: 6px;
        }
        .section-desc {
          font-size: 0.95rem;
          opacity: 0.8;
          margin-bottom: 24px;
          color: #d1d5db;
        }

        /* 카드 그리드 */
        .company-grid {
          display: grid;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
          .grid-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .company-card {
          border-radius: 18px;
          border: 1px solid rgba(55, 65, 81, 0.9);
          padding: 18px;
          background: radial-gradient(
            circle at top left,
            rgba(15, 23, 42, 0.9),
            rgba(15, 23, 42, 0.96)
          );
          box-shadow: 0 18px 35px rgba(15, 23, 42, 0.65);
        }
        .card-title {
          font-size: 0.98rem;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .card-subtitle {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .card-body {
          font-size: 0.9rem;
          opacity: 0.9;
          color: #e5e7eb;
        }

        /* Contact & Footer */
        .contact-list {
          font-size: 0.9rem;
        }
        .contact-list dt {
          font-weight: 600;
          margin-top: 14px;
          color: #e5e7eb;
        }
        .contact-list dd {
          margin-left: 0;
          opacity: 0.85;
          color: #d1d5db;
        }

        .company-footer {
          border-top: 1px solid rgba(55, 65, 81, 0.9);
          padding: 16px 20px 30px;
          font-size: 0.8rem;
          text-align: center;
          opacity: 0.6;
          color: #9ca3af;
          margin-top: 20px;
        }

        /* 스크롤 등장 애니메이션 */
        .reveal {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
          will-change: opacity, transform;
        }
        .reveal.show {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      <header className="company-header">
        <div className="company-nav">
          <div className="company-logo">
            Un<span>known</span>
          </div>
          <nav className="company-nav-links">
            <a href="#about">회사 소개</a>
            <a href="#services">서비스</a>
            <a href="#why">강점</a>
            <a href="#team">팀</a>
            <a href="#contact">문의</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="company-section company-hero reveal" id="top">
          <div className="hero-kicker">OFFICIAL COMPANY SITE</div>
          <h1 className="hero-title">
            <span>모든 게이머를 위한</span>
            <br />
            진짜 평가 플랫폼
          </h1>
          <p className="hero-subtitle">
            모든 플랫폼의 게임 평점을 한 번에 모아 보여주는 모던 게임 데이터 플랫폼. 복잡한 검색
            없이, 진짜 유저들이 매긴 점수로만 판단할 수 있게 돕습니다.
          </p>
          <div className="hero-badges">
            <span className="badge">게임 평가 플랫폼</span>
            <span className="badge">커뮤니티 기반</span>
            <span className="badge">모던 다크 UI</span>
          </div>
          <div className="hero-buttons">
            <Link href="/" className="btn-primary">
              서비스 이용하기
            </Link>
            <a href="#contact" className="btn-secondary">
              협업·문의하기
            </a>
          </div>
        </section>

        {/* About */}
        <section className="company-section reveal" id="about">
          <div className="section-label">ABOUT</div>
          <h2>회사 소개</h2>
          <p className="section-desc">
            우리는 게이머들이 신뢰할 수 있는 게임 평가를 찾기 위해 여러 사이트를 돌아다니며 시간을
            낭비하는 문제를 해결하고 싶었습니다.
            <br />
            그래서 진짜 유저들의 평가를 한 곳에 모아, 누구나 빠르게 핵심 정보만 확인할 수 있는
            플랫폼을 만들고 있습니다.
          </p>
        </section>

        {/* Services */}
        <section className="company-section reveal" id="services">
          <div className="section-label">SERVICES</div>
          <h2>우리가 만드는 것</h2>
          <p className="section-desc">
            GampFire는 게이머들을 위한 통합 게임 평가 플랫폼입니다.
          </p>
          <div className="company-grid grid-3">
            <div className="company-card">
              <div className="card-subtitle">FEATURE 01</div>
              <div className="card-title">통합 게임 데이터베이스</div>
              <div className="card-body">
                IGDB API를 활용해 수만 개의 게임 정보를 제공하며, Steam과 연동하여 실시간 가격,
                플레이어 수, 메타크리틱 점수를 한눈에 확인할 수 있습니다.
              </div>
            </div>
            <div className="company-card">
              <div className="card-subtitle">FEATURE 02</div>
              <div className="card-title">세부 평가 시스템</div>
              <div className="card-body">
                단순한 별점이 아닌, 가격 만족도, 그래픽, 조작감, 스토리 등 8가지 항목을 세분화하여
                평가할 수 있어 더 정확한 게임 분석이 가능합니다.
              </div>
            </div>
            <div className="company-card">
              <div className="card-subtitle">FEATURE 03</div>
              <div className="card-title">역할 기반 인증 시스템</div>
              <div className="card-body">
                일반 유저, 전문가, 인플루언서로 구분된 평가 시스템으로 신뢰도 높은 리뷰를
                우선적으로 확인할 수 있습니다.
              </div>
            </div>
          </div>
        </section>

        {/* Why Us */}
        <section className="company-section reveal" id="why">
          <div className="section-label">WHY US</div>
          <h2>왜 GampFire를 써야 할까?</h2>
          <p className="section-desc">
            기존 게임 평가 사이트들과 차별화된 GampFire만의 강점입니다.
          </p>
          <div className="company-grid grid-3">
            <div className="company-card">
              <div className="card-subtitle">EDGE 01</div>
              <div className="card-title">통합성</div>
              <div className="card-body">
                PC, 콘솔, 모바일 등 플랫폼을 가리지 않고 모든 게임을 한 번에 조회 가능합니다.
                장르별 필터링과 무한 스크롤로 원하는 게임을 쉽게 찾을 수 있습니다.
              </div>
            </div>
            <div className="company-card">
              <div className="card-subtitle">EDGE 02</div>
              <div className="card-title">속도와 심플함</div>
              <div className="card-body">
                복잡한 커뮤니티 글을 뒤질 필요 없이, 평점과 핵심 정보만 빠르게 확인할 수 있습니다.
                모던하고 직관적인 UI로 누구나 쉽게 사용할 수 있습니다.
              </div>
            </div>
            <div className="company-card">
              <div className="card-subtitle">EDGE 03</div>
              <div className="card-title">커뮤니티 기반</div>
              <div className="card-body">
                실제 게이머들의 평가와 리뷰를 기반으로 한 신뢰할 수 있는 정보를 제공합니다. 좋아요
                시스템으로 도움이 되는 리뷰를 쉽게 찾을 수 있습니다.
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="company-section reveal" id="team">
          <div className="section-label">TEAM</div>
          <h2>팀 소개</h2>
          <p className="section-desc">
            게이머들에게 진짜 도움이 되는 서비스를 만들기 위해 노력하고 있습니다.
          </p>
          <div className="company-grid grid-2">
            <div className="company-card">
              <div className="card-subtitle">FOUNDER</div>
              <div className="card-title">Unknown Team</div>
              <div className="card-body">
                서비스 기획 & 풀스택 개발
                <br />
                AI 코딩과 최신 웹 기술을 활용하여 실제 유저가 사용하는 제품을 목표로 개발하고
                있습니다. Next.js, Prisma, PostgreSQL을 기반으로 한 모던 웹 애플리케이션을
                구축하고 있습니다.
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="company-section reveal" id="contact">
          <div className="section-label">CONTACT</div>
          <h2>협업 및 문의</h2>
          <p className="section-desc">
            피드백, 제안, 협업 등 무엇이든 편하게 연락해주세요.
          </p>
          <dl className="contact-list">
            <dt>이메일</dt>
            <dd>starroad0328@naver.com</dd>
            <dt>서비스</dt>
            <dd>
              <Link href="/" style={{ color: '#f97316' }}>
                GampFire 바로가기
              </Link>
            </dd>
            <dt>GitHub</dt>
            <dd>github.com/unknown</dd>
          </dl>
        </section>
      </main>

      <footer className="company-footer">© 2025 Unknown. All rights reserved.</footer>
    </div>
  )
}
