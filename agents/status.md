# 에이전트 작업 현황판 (Agent Status Board)

> 모든 에이전트는 작업 시작/종료 시 이 파일을 업데이트합니다.
> 마지막 업데이트: 2026-03-14

## 현재 활성 에이전트

| 에이전트 ID | 역할 | 작업 내용 | 수정 중인 파일/영역 | 상태 | 시작 시각 |
|------------|------|----------|-------------------|------|----------|
| (현재 활성 에이전트 없음) | | | | | |

## 잠금 영역 (Locked Zones)

> 한 번에 하나의 에이전트만 수정 가능한 영역입니다.
> 잠금을 설정한 에이전트만 해제할 수 있습니다.

| 영역 | 잠금 에이전트 | 사유 | 설정 시각 |
|------|-------------|------|----------|
| (잠금 없음) | | | |

## 최근 완료된 작업

| 에이전트 ID | 작업 내용 | 완료 시각 | 워크로그 참조 |
|------------|----------|----------|-------------|
| agent-design-1 | 디자인 시스템 & UI/UX 컨셉 정의 | 2026-03-14 | worklog/2026-03-14_phase0_design-concept.md |

## 다음 에이전트 TODO

> 완료된 에이전트가 다음 에이전트에게 넘기는 작업 목록입니다.

### Phase 1 — Step 1 [순차: infra]
- [ ] 모노레포 세팅 (pnpm + Turborepo + pnpm-workspace.yaml) — `agent-infra-1`
- [ ] Docker Compose 구성 (PostgreSQL 16, Redis 7) — `agent-infra-1`
- [ ] packages/shared 초기 구조 (tsconfig, index.ts) — `agent-infra-1`
- [ ] apps/frontend, apps/backend 디렉토리 뼈대 — `agent-infra-1`

### Phase 1 — Step 2 [병렬: frontend + backend] (의존: Step 1 완료)
- [ ] Next.js 15 초기화 + Tailwind + shadcn/ui + 디자인 토큰 — `agent-frontend-1`
  - 참조: `docs/design-system.md`
- [ ] NestJS 부트스트랩 + TypeORM 설정 + DB 연결 — `agent-backend-1`

### Phase 1 — Step 3 [순차: infra]
- [ ] packages/shared에 공유 타입 정의 (auth, survey) — `agent-infra-1`

### Phase 1 — Step 4 [병렬: frontend + backend] (의존: Step 3 완료)
- [ ] JWT 인증 모듈 + User 엔티티 + Auth API — `agent-backend-1`
- [ ] 로그인/회원가입 UI + 사이드바+헤더 레이아웃 — `agent-frontend-1`

### Phase 1 — Step 5 [병렬: frontend + backend]
- [ ] Survey CRUD API + 엔티티 설계 — `agent-backend-1`
- [ ] 설문 목록 페이지 + SurveyCard + FAB — `agent-frontend-1`

## 의사결정 충돌 로그

> 에이전트 간 설계 결정이 충돌할 경우 여기에 기록합니다.

| 날짜 | 주제 | 에이전트A 의견 | 에이전트B 의견 | 최종 결정 | 결정자 |
|------|------|-------------|-------------|----------|-------|
