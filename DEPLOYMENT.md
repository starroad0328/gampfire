# 배포 가이드

## Vercel 배포

### 1. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

```env
# Database
DATABASE_URL=postgresql://neondb_owner:...@ep-plain-term-a7zpq2wq-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret-key-here

# Email (선택적)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# API Keys
IGDB_CLIENT_ID=8aigihd8kl28xmem5zzp95n89f89ow
IGDB_CLIENT_SECRET=utvm31fz2d9v34tlu5hv0h0nlwutmz

# Admin
ADMIN_EMAIL=starroad0328@naver.com

# Batch Job (Cron Job 인증용)
CRON_SECRET=your-random-secret-for-cron
BATCH_SECRET=dev-batch-secret
```

### 2. Cron Job 설정

`vercel.json` 파일이 이미 설정되어 있습니다:
- 매일 자동으로 HOT 게임 점수 및 동시 접속자 수 업데이트
- 실행 시간: 매일 00:00 UTC (한국 시간 09:00)

Vercel 배포 후 환경 변수에 `CRON_SECRET`을 추가하세요.

### 3. 데이터베이스 마이그레이션

배포 전에 Neon DB에 스키마를 푸시하세요:

```bash
npx prisma db push
```

### 4. 배포 명령어

```bash
vercel --prod
```

## 다른 플랫폼 배포

### Railway

1. 프로젝트 생성 및 GitHub 연결
2. 환경 변수 설정 (위와 동일)
3. 빌드 명령어: `npm run build`
4. 시작 명령어: `npm start`

### 크론잡 대안 (Railway/기타 플랫폼)

Railway나 다른 플랫폼에서는 외부 크론 서비스 사용:

**옵션 1: Cron-job.org**
1. https://cron-job.org 계정 생성
2. 새 크론잡 추가
   - URL: `https://your-domain.com/api/batch/update-hot-scores`
   - Schedule: `0 0 * * *` (매일 00:00)
   - HTTP Method: POST
   - Header: `Authorization: Bearer dev-batch-secret`

**옵션 2: GitHub Actions**
```yaml
# .github/workflows/update-hot-scores.yml
name: Update Hot Scores

on:
  schedule:
    - cron: '0 0 * * *'  # 매일 00:00 UTC
  workflow_dispatch:  # 수동 실행 가능

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Call batch API
        run: |
          curl -X POST https://your-domain.com/api/batch/update-hot-scores \
            -H "Authorization: Bearer ${{ secrets.BATCH_SECRET }}"
```

## 배포 후 확인 사항

1. 홈페이지 정상 작동 확인
2. 로그인/회원가입 테스트
3. 게임 목록 HOT 탭 확인
4. 배치 작업 수동 실행 테스트:
   ```bash
   curl -X POST https://your-domain.com/api/batch/update-hot-scores \
     -H "Authorization: Bearer dev-batch-secret"
   ```

## 주의사항

- `NEXTAUTH_SECRET`은 반드시 강력한 랜덤 문자열로 변경
- `CRON_SECRET`은 Vercel 대시보드에서 자동 생성된 값 사용
- `BATCH_SECRET`은 프로덕션에서 반드시 강력한 값으로 변경
- 이메일 기능을 사용하려면 Gmail 앱 비밀번호 발급 필요
