# Survey Platform - Claude Code 지침

## 프로젝트 개요
사내 설문조사 생성-수집-분석 플랫폼 (100~500명 규모)

## 기술 스택
- **모노레포**: pnpm + Turborepo
- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: NestJS + TypeScript (REST API + WebSocket)
- **DB**: PostgreSQL 16 + TypeORM (UUID PK, JSONB)
- **Cache**: Redis 7
- **AI**: Claude API 또는 OpenAI API
- **배포**: Docker Compose + Nginx (운영) / Railway (테스트)

## 코드 규칙
- TypeScript strict 모드 사용
- API 응답은 반드시 interface 정의 후 타입 캐스팅
- 엔티티는 UUID를 PK로 사용
- 커밋 컨벤션: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`
- 워크로그 파일은 `docs:` 접두사로 커밋

## 디렉토리 구조
- `apps/frontend/` — Next.js 15 앱
- `apps/backend/` — NestJS API 서버
- `packages/shared/` — 공유 타입/상수/검증
- `docker/` — Nginx, PostgreSQL 설정
- `worklog/` — 개발 히스토리 로그 (날짜별 기록)

## 주의사항
- `worklog/` 파일은 작업 완료 후 반드시 갱신
- `.env` 파일은 절대 커밋하지 않음
- DB 마이그레이션은 `apps/backend/src/database/` 에서 관리
- 공유 타입은 반드시 `packages/shared/`에 정의
- 브랜치: `main` ← `develop` ← `feature/*`
