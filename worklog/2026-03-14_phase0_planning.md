# 2026-03-14 Phase 0 - 프로젝트 초기화 & 기획/설계

## 목표
- Git 저장소 생성 및 GitHub 연결
- 프로젝트 기본 파일 구성 (.gitignore, README, CLAUDE.md)
- 워크로그 시스템 구축
- 첫 커밋 및 GitHub 푸시

## 수행 내역

### 1. Git 저장소 초기화
- **명령어**: `git init` (기존 travel-blog 연결 해제, 독립 저장소)
- **결과**: 성공 — `C:/Users/blue5/claude/survey/.git/` 생성
- **파일 변경**: `.git/` 디렉토리 생성

### 2. 프로젝트 기본 파일 생성
- **파일 변경**:
  - `.gitignore` — Node.js, Docker, 환경변수, IDE 무시 규칙
  - `README.md` — 프로젝트 소개, 기술 스택, 실행 방법
  - `CLAUDE.md` — Claude Code 프로젝트별 지침

### 3. 워크로그 시스템 구축
- **파일 변경**:
  - `worklog/README.md` — 워크로그 사용법 안내
  - `worklog/summary.md` — 전체 진행 요약
  - `worklog/2026-03-14_phase0_planning.md` — 본 파일

### 4. GitHub 저장소 생성 및 푸시
- **명령어**: `gh repo create Daun92/survey-platform --public`
- **결과**: 저장소 생성 완료

## 의사결정 기록

| 결정사항 | 선택지 | 선택 이유 |
|----------|--------|-----------|
| 테스트 배포 환경 | Firebase, Vercel+Supabase, Railway | Railway — Docker 그대로 배포, NestJS+WebSocket 지원, 운영 전환 용이 |
| 모노레포 도구 | npm workspaces, yarn, pnpm+Turborepo | pnpm+Turborepo — 빠른 설치, 효율적 캐싱, 모노레포 최적화 |
| DB ORM | Prisma, TypeORM, Drizzle | TypeORM — NestJS 공식 통합, 데코레이터 기반 엔티티 |
| 인증 방식 | OAuth, JWT, Session | JWT — 심플, 향후 SSO 확장 가능 |
| UI 라이브러리 | Material UI, Ant Design, shadcn/ui | shadcn/ui — 커스터마이징 용이, Tailwind 기반, 번들 사이즈 최적 |

## 이슈 & 해결
- `survey/` 디렉토리가 `travel-blog` Git 저장소의 하위 디렉토리 → `git init`으로 독립 저장소 생성하여 해결

## 다음 단계 (Phase 1 Week 1)
- [ ] pnpm + Turborepo 모노레포 세팅
- [ ] Docker Compose 구성 (PostgreSQL 16, Redis 7)
- [ ] NestJS 부트스트랩 (apps/backend)
- [ ] Next.js 15 초기화 + Tailwind CSS + shadcn/ui (apps/frontend)
- [ ] packages/shared 초기 구성

## Git 커밋
- 첫 커밋: `chore: Phase 0 프로젝트 초기화 — Git 저장소, 워크로그 시스템 구축`
