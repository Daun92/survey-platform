# 에이전트 역할 정의 & 프롬프트 템플릿

> 여러 Claude Code 창을 열어 동시 작업할 때 각 창에 부여할 역할과 프롬프트입니다.
> 최종 업데이트: 2026-03-14

---

## 운영 방식

**혼합 전략**: 기반 작업은 순차(1개 창) → 기능 개발은 병렬(2~3개 창)

```
패턴: infra 먼저 → frontend + backend 동시
       (공유 타입 정의)    (각자 영역에서 개발)
```

---

## 역할 정의 (3개 롤)

### Role A: `infra` — 인프라/기반 에이전트

| 항목 | 내용 |
|------|------|
| 에이전트 ID | `agent-infra-1` |
| 담당 영역 | 루트 설정, `docker/`, `packages/shared/`, 모노레포 설정 |
| 수정 가능 | `package.json`(루트), `turbo.json`, `pnpm-workspace.yaml`, `docker/`, `docker-compose.yml`, `.env.example`, `packages/shared/` |
| 수정 금지 | `apps/frontend/` 내부 코드, `apps/backend/` 내부 코드 |
| 주요 작업 | 모노레포 세팅, Docker Compose, 공유 타입 정의, CI/CD, 배포 설정 |

### Role B: `backend` — 백엔드 에이전트

| 항목 | 내용 |
|------|------|
| 에이전트 ID | `agent-backend-1` |
| 담당 영역 | `apps/backend/` 전체 |
| 수정 가능 | `apps/backend/` 내 모든 파일 |
| 수정 가능 (추가) | `packages/shared/`에 **새 파일 추가**만 가능 (기존 파일 수정 금지) |
| 수정 금지 | `apps/frontend/`, 루트 설정 파일, `docker/` |
| 주요 작업 | NestJS API, DB 엔티티/마이그레이션, 인증, WebSocket, AI 연동 |

### Role C: `frontend` — 프론트엔드 에이전트

| 항목 | 내용 |
|------|------|
| 에이전트 ID | `agent-frontend-1` |
| 담당 영역 | `apps/frontend/` 전체 |
| 수정 가능 | `apps/frontend/` 내 모든 파일 |
| 수정 가능 (추가) | `packages/shared/`에 **새 파일 추가**만 가능 (기존 파일 수정 금지) |
| 수정 금지 | `apps/backend/`, 루트 설정 파일, `docker/` |
| 주요 작업 | Next.js 페이지, shadcn/ui 컴포넌트, 디자인 토큰 적용, API 연동 |

---

## 영역 충돌 방지 맵

```
파일/디렉토리                    infra  backend  frontend
─────────────────────────────  ─────  ───────  ────────
package.json (루트)              ✅      ❌       ❌
turbo.json                       ✅      ❌       ❌
pnpm-workspace.yaml              ✅      ❌       ❌
docker-compose.yml               ✅      ❌       ❌
docker/                          ✅      ❌       ❌
.env.example                     ✅      ❌       ❌
packages/shared/ (기존 파일)     ✅      ❌       ❌
packages/shared/ (새 파일 추가)  ✅      ✅       ✅
apps/backend/                    ❌      ✅       ❌
apps/frontend/                   ❌      ❌       ✅
CLAUDE.md                        ✅      ❌       ❌
agents/status.md                 ✅      ✅       ✅
worklog/ (자기 파일만)           ✅      ✅       ✅
docs/                            ✅      ✅       ✅
```

---

## Phase별 실행 순서

### Phase 1 Week 1: 기반 세팅

```
[순차 — 1개 창] Step 1: infra 에이전트
  ├─ pnpm + Turborepo 모노레포 세팅
  ├─ Docker Compose (PostgreSQL 16, Redis 7)
  ├─ packages/shared 초기 구조 (tsconfig, 빈 index.ts)
  ├─ apps/frontend, apps/backend 디렉토리 뼈대
  └─ 커밋 & 푸시 ✅

[병렬 — 2개 창] Step 2: frontend + backend
  ├─ 창1 (frontend): Next.js 15 초기화, Tailwind, shadcn/ui, 디자인 토큰
  │   참조: docs/design-system.md
  └─ 창2 (backend): NestJS 부트스트랩, TypeORM 설정, DB 연결
```

### Phase 1 Week 2~3: 인증 & 기본 CRUD

```
[순차] Step 3: infra
  └─ packages/shared/src/types/auth.ts, survey.ts 공유 타입 정의

[병렬] Step 4: frontend + backend
  ├─ 창1 (backend): JWT 인증, User 엔티티, Auth API
  └─ 창2 (frontend): 로그인/회원가입 UI, 사이드바+헤더 레이아웃

[병렬] Step 5: frontend + backend
  ├─ 창1 (backend): Survey CRUD API, 엔티티 설계
  └─ 창2 (frontend): 설문 목록, SurveyCard, FAB
```

### Phase 2~5: 동일 패턴

```
항상: infra(공유 타입) → frontend + backend(병렬 개발)
```

---

## 프롬프트 템플릿

### 모든 에이전트 공통 (첫 줄에 추가)

```
CLAUDE.md를 읽고 멀티 에이전트 협업 프로토콜을 따라주세요.
agents/roles.md에서 자신의 역할과 수정 가능 범위를 확인하세요.

시작 전 체크리스트:
1. git pull origin {현재 브랜치}
2. agents/status.md 읽기 — 다른 에이전트 현황 확인
3. worklog/ 최신 파일 읽기 — 이전 작업 맥락 파악
4. agents/status.md에 자기 작업 등록
```

### infra 에이전트 전용

```
당신의 역할: agent-infra-1 (인프라/기반 에이전트)

담당 영역: 루트 설정, docker/, packages/shared/
수정 금지: apps/frontend/ 내부 코드, apps/backend/ 내부 코드

작업 내용: [구체적 작업 내용]

규칙:
- CLAUDE.md 멀티 에이전트 협업 프로토콜 준수
- 작업 시작 시 agents/status.md에 등록
- 작업 완료 시 agents/status.md 업데이트 + 워크로그 작성
- 커밋 전 git pull --rebase
- 커밋 메시지 컨벤션: feat:, fix:, chore:, docs: 등
```

### backend 에이전트 전용

```
당신의 역할: agent-backend-1 (백엔드 에이전트)

담당 영역: apps/backend/
수정 가능 추가: packages/shared/에 새 파일 추가만 가능 (기존 파일 수정 금지)
수정 금지: apps/frontend/, 루트 설정, docker/

작업 내용: [구체적 작업 내용]

참고:
- packages/shared/src/types/ 공유 타입 참조
- DB 마이그레이션 시 agents/status.md에 잠금 설정

규칙:
- CLAUDE.md 멀티 에이전트 협업 프로토콜 준수
- 작업 시작 시 agents/status.md에 등록
- 작업 완료 시 agents/status.md 업데이트 + 워크로그 작성
- 커밋 전 git pull --rebase
- 커밋 메시지 컨벤션: feat:, fix:, chore:, docs: 등
```

### frontend 에이전트 전용

```
당신의 역할: agent-frontend-1 (프론트엔드 에이전트)

담당 영역: apps/frontend/
수정 가능 추가: packages/shared/에 새 파일 추가만 가능 (기존 파일 수정 금지)
수정 금지: apps/backend/, 루트 설정, docker/

작업 내용: [구체적 작업 내용]

참고:
- docs/design-system.md — 디자인 토큰, 레이아웃, 컴포넌트 방향
- packages/shared/src/types/ — 공유 타입 참조

규칙:
- CLAUDE.md 멀티 에이전트 협업 프로토콜 준수
- docs/design-system.md의 컬러/폰트/레이아웃 규격 준수
- 작업 시작 시 agents/status.md에 등록
- 작업 완료 시 agents/status.md 업데이트 + 워크로그 작성
- 커밋 전 git pull --rebase
- 커밋 메시지 컨벤션: feat:, fix:, chore:, docs: 등
```

---

## 실전 팁

### 병렬 작업 시작할 때
1. infra 에이전트가 커밋 & 푸시 완료 확인
2. frontend/backend 창 각각에서 `git pull` 먼저
3. 각 창에 역할 프롬프트 + 구체적 작업 내용 전달

### 작업 중간에 다른 에이전트 결과가 필요할 때
- "git pull 하고 packages/shared/src/types/ 확인해줘" 지시
- 아직 안 올라왔으면 다른 작업 먼저 진행

### 에이전트 작업 완료 확인
- agents/status.md에서 '완료' 상태 확인
- 또는 git log로 최신 커밋 확인

### 충돌 발생 시
1. "git pull --rebase 후 충돌 해결해줘" 지시
2. 양쪽 변경사항 모두 보존
3. 반복되면 해당 영역을 순차 작업으로 전환
