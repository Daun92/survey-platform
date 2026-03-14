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

## 멀티 에이전트 협업 프로토콜

여러 Claude Code 에이전트가 동시에 작업할 때 충돌을 방지하고 작업을 조율하기 위한 규칙입니다.

### 에이전트 식별
- 각 에이전트는 세션 시작 시 `agents/status.md`에 자신의 작업을 등록합니다
- 에이전트 ID 형식: `agent-{역할}-{번호}` (예: `agent-frontend-1`, `agent-backend-1`)

### 역할 배분 (3개 롤)
상세 역할 정의, 수정 가능 범위, 프롬프트 템플릿은 `agents/roles.md` 참조

| 역할 | 에이전트 ID | 담당 영역 | 수정 가능 범위 |
|------|-----------|-----------|---------------|
| infra | `agent-infra-1` | 루트 설정, `docker/`, `packages/shared/` | 모노레포 설정, 공유 타입, 인프라 |
| backend | `agent-backend-1` | `apps/backend/` | 백엔드 전체 + shared 새 파일 추가 |
| frontend | `agent-frontend-1` | `apps/frontend/` | 프론트엔드 전체 + shared 새 파일 추가 |

### 실행 패턴
- **순차**: infra가 기반 세팅 & 공유 타입 정의 → 커밋 & 푸시
- **병렬**: frontend + backend가 각자 영역에서 동시 개발
- 참고: `agents/roles.md`에 Phase별 실행 순서 및 프롬프트 템플릿 있음

### 공유 영역 수정 규칙
다음 파일/디렉토리는 **공유 영역**이므로 수정 전 `agents/status.md`를 확인합니다:
- `packages/shared/` — 타입 추가는 자유, 기존 타입 수정 시 다른 에이전트 확인
- `CLAUDE.md` — 규칙 변경은 반드시 기록
- `worklog/summary.md` — 자기 작업만 추가 (다른 에이전트 항목 수정 금지)
- 루트 `package.json`, `turbo.json` — infra 역할 에이전트만 수정

### 세션 시작 체크리스트
에이전트는 작업 시작 시 반드시 다음을 수행합니다:
1. `git pull origin {branch}` — 최신 코드 가져오기
2. `agents/status.md` 읽기 — 다른 에이전트의 현재 작업 파악
3. `worklog/` 최신 파일 읽기 — 마지막 작업 맥락 파악
4. `agents/status.md`에 자기 작업 등록
5. 작업 완료 시 `agents/status.md` 업데이트 및 워크로그 갱신

### 충돌 방지 규칙
- **같은 파일 동시 수정 금지**: `agents/status.md`에서 다른 에이전트가 수정 중인 파일은 건드리지 않음
- **공유 타입 추가 시**: `packages/shared/`에 새 파일을 만들어 추가 (기존 파일 수정 최소화)
- **DB 마이그레이션**: 한 번에 하나의 에이전트만 마이그레이션 생성 (`agents/status.md`에 잠금 표시)
- **커밋 전**: 반드시 `git pull --rebase`로 최신화 후 커밋

### 핸드오프 프로토콜
에이전트가 작업을 넘길 때:
1. 워크로그에 **다음 단계**를 구체적으로 기록
2. `agents/status.md`에서 자기 작업 상태를 `완료`로 변경
3. 미완료 작업은 `다음 에이전트 TODO`에 명시
4. 커밋 → 푸시 → 다음 에이전트가 pull하여 이어받음

### 의사결정 기록
- 아키텍처/설계 결정은 반드시 `worklog/`에 **의사결정 기록** 섹션에 남김
- 다른 에이전트의 기존 결정을 뒤집을 때는 이유를 명시
- 불확실한 결정은 `[TBD]` 마킹 후 사용자에게 확인 요청
