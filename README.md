# 🎮 GAMERATE

한국어 중심의 "와챠피디아식" 게임 평점·리뷰 플랫폼

## 📋 프로젝트 개요

**GAMERATE**는 간단한 별점(★0.5 단위)과 숏 코멘트를 기반으로 신뢰도 높은 게임 평가 서비스를 제공합니다.

### 핵심 기능

- ⭐ 원터치 별점 평가 (0.5 단위)
- 💬 120자 숏 코멘트
- 🎯 요소별 세부 평가 (그래픽/사운드/전투/스토리/UI)
- ✅ 플랫폼 연동 리뷰 인증
- 🛡️ 안티 리뷰폭탄 시스템
- 👥 소셜 기능 (팔로우, 좋아요, 리스트)
- 🏢 개발사 공식 응답 기능

## 🛠️ 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL + Prisma
- **Authentication**: NextAuth.js
- **State**: Zustand + React Query

## 🚀 시작하기

### 1. 환경 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어서 DATABASE_URL 등 필요한 값 설정
```

### 2. 데이터베이스 설정

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 마이그레이션
npm run db:migrate
```

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

## 📜 주요 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
npm run db:generate  # Prisma 클라이언트 생성
npm run db:migrate   # DB 마이그레이션
npm run db:studio    # Prisma Studio
```

## 📁 프로젝트 구조

```
src/
├── app/              # Next.js App Router
├── components/       # React 컴포넌트
│   ├── ui/          # shadcn/ui
│   ├── features/    # 기능별 컴포넌트
│   └── layout/      # 레이아웃
├── lib/             # 유틸리티
├── types/           # TypeScript 타입
├── hooks/           # 커스텀 훅
└── actions/         # Server Actions
```

## 🗺️ 개발 로드맵

### Phase 0: 프로젝트 셋업 ✅
- [x] Next.js + TypeScript 초기화
- [x] Prisma 스키마 설계
- [x] 기본 환경 구성

### Phase 1: 코어 기능 (진행 중)
- [ ] 게임 정보 페이지
- [ ] 리뷰 작성/조회
- [ ] 평점 계산 시스템

### Phase 2-6: 추가 기능
- 인증 시스템, 소셜 기능, 개발사 기능, 안티 리뷰폭탄 등

상세 로드맵은 프로젝트 문서 참고
