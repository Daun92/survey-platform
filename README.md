# Survey Platform

사내 설문조사 생성-수집-분석 플랫폼

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | NestJS + TypeScript (REST API + WebSocket) |
| Database | PostgreSQL 16 (TypeORM) |
| Cache | Redis 7 |
| AI | Claude API / OpenAI API |
| 인증 | JWT + 이메일/비밀번호 |
| 모노레포 | pnpm + Turborepo |
| 배포 | Docker Compose + Nginx (운영) / Railway (테스트) |

## 주요 기능

- 10가지 질문 타입 지원 설문 에디터 (드래그앤드롭)
- 조건 로직 (분기/스킵)
- 대상자 그룹 관리 및 이메일 배포
- 토큰 기반 응답 수집 (중간저장 지원)
- 통계 리포트 및 교차분석 (차트 시각화)
- 템플릿 갤러리 및 포크 기능
- AI 채팅 기반 설문 자동 생성 (WebSocket 스트리밍)

## 개발 환경 실행

```bash
# 의존성 설치
pnpm install

# 인프라 (PostgreSQL, Redis)
docker compose -f docker-compose.dev.yml up -d

# 개발 서버
pnpm dev
```

## 프로젝트 구조

```
apps/
  frontend/    # Next.js 15
  backend/     # NestJS
packages/
  shared/      # 공유 타입, 상수, 검증
docker/        # Nginx, PostgreSQL 설정
worklog/       # 개발 히스토리 로그
```

## 브랜치 전략

- `main` — 안정 배포 브랜치
- `develop` — 개발 통합 브랜치
- `feature/*` — 기능별 작업 브랜치
