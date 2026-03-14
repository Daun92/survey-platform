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

## 워크로그 프로토콜

### 기록 시점 (필수)
에이전트는 다음 시점에 워크로그를 갱신합니다:
1. **세션 시작 시**: 이전 워크로그의 "다음 단계"를 읽고, 현재 세션 워크로그 파일 생성
2. **기능 구현 완료 시**: 구현한 기능, 변경 파일, 테스트 결과 기록
3. **사용자 의사결정 발생 시**: Claude가 선택지를 제시하고 사용자가 선택한 경우 즉시 기록
4. **세션 종료 시**: 다음 단계, 미완료 항목 정리

### 의사결정 기록 규칙
Claude가 선택지를 제시하고 사용자가 선택한 경우, 워크로그 `의사결정 기록` 섹션에 반영:

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|

- Claude 자체 판단으로 진행한 기술적 결정도 기록 (선택 이유에 "Claude 판단" 명시)
- `[TBD]` 항목이 해결되면 즉시 업데이트

### 워크로그 파일 생성 규칙
- 새 Phase/Week 진입 시 새 파일 생성
- 파일명: `YYYY-MM-DD_phaseX_wY_작업명.md`
- 같은 날 같은 Phase/Week 작업은 기존 파일에 추가

### 세션 시작 명령어: `/resume`
새 세션에서 작업을 이어받을 때 사용합니다. 다음을 순서대로 수행합니다:
1. `CLAUDE.md` 읽기 — 프로젝트 규칙/스택 확인
2. `worklog/summary.md` 읽기 — 전체 진행 상황 파악
3. `worklog/` 최신 파일 읽기 — 마지막 작업 맥락 + 다음 단계 확인
4. `git status` + `git log --oneline -5` — 현재 브랜치/커밋 상태
5. 확인한 내용을 요약하여 사용자에게 보고:
   - 현재 Phase/Week
   - 마지막 완료 작업
   - 다음 단계 (워크로그의 "다음 단계" 섹션)
   - 미해결 의사결정 ([TBD] 항목)

## 멀티 에이전트 협업 프로토콜

여러 Claude Code 에이전트가 동시에 작업할 때 충돌을 방지하고 작업을 조율하기 위한 규칙입니다.

### 에이전트 식별
- 각 에이전트는 세션 시작 시 `agents/status.md`에 자신의 작업을 등록합니다
- 에이전트 ID 형식: `agent-{역할}-{번호}` (예: `agent-frontend-1`, `agent-backend-1`)

### 작업 영역 분리 (Zone Ownership)
동시 작업 시 각 에이전트는 **배타적 작업 영역**을 가집니다:

| 역할 | 담당 영역 | 수정 가능 범위 |
|------|-----------|---------------|
| frontend | `apps/frontend/` | 프론트엔드 전체 |
| backend | `apps/backend/` | 백엔드 전체 |
| shared | `packages/shared/` | 공유 타입/유틸 |
| infra | `docker/`, 루트 설정 | 인프라/설정 |

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
