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

### Phase 1: 기반 세팅 + 인증 + CRUD ✅ 완료

> Phase 1 전체(W1~W3)가 완료되었습니다. 상세 내역은 worklog/ 참조.
> - W1: 모노레포, Docker, NestJS, Next.js 부트스트랩
> - W2: JWT 인증, User/Department 엔티티, 로그인 페이지
> - W3: Project/Survey CRUD, RBAC, 대시보드 레이아웃

### Phase 2: 설문 에디터 (W4~W6)

```
[순차 — 1개 창] Step 1: infra 에이전트
  └─ packages/shared/src/types/question.ts
     ├─ QuestionType enum (11가지)
     ├─ QuestionBase, QuestionOption, QuestionValidation
     └─ CreateQuestionRequest, UpdateQuestionRequest, QuestionResponse

[병렬 — 2개 창] Step 2: frontend + backend (의존: Step 1 완료)
  ├─ 창1 (frontend): 설문 에디터 UI
  │   ├─ /dashboard/surveys/[id]/edit 페이지
  │   ├─ 3열 레이아웃 (질문 팔레트 | 에디터 | 미리보기)
  │   ├─ QuestionTypeSelector, QuestionEditor, QuestionPreview
  │   └─ dnd-kit 드래그 앤 드롭
  └─ 창2 (backend): Question API
      ├─ Question 엔티티 (JSONB options, order)
      ├─ QuestionController — CRUD + 순서 변경
      └─ 설문 발행/마감 API (DRAFT→ACTIVE→CLOSED)
```

### Phase 3: 대상자 관리 & 응답 수집 (W7~W9)

```
[순차] Step 1: infra
  └─ packages/shared/src/types/response.ts, distribution.ts

[병렬] Step 2: frontend + backend
  ├─ 창1 (frontend): 공개 응답 페이지 (/s/[surveyId])
  │   ├─ 질문 타입별 응답 컴포넌트 (10종)
  │   ├─ 진행률 표시, 유효성 검증, 제출 완료
  │   └─ 대상자 관리 + 배포 링크 생성
  └─ 창2 (backend): 응답 수집 API
      ├─ Response 엔티티 (answers:JSONB)
      ├─ POST /surveys/:id/responses (비인증 허용)
      └─ 배포 링크 + 중복 응답 방지
```

### Phase 4: 리포트 & AI (W10~W12)

```
[순차] Step 1: infra
  └─ packages/shared/src/types/report.ts, template.ts

[병렬] Step 2: frontend + backend
  ├─ 창1 (frontend): 리포트 & 템플릿 UI
  │   ├─ 차트 (recharts): 막대, 원형, 선형, 히트맵
  │   ├─ 교차 분석, PDF/Excel 다운로드
  │   ├─ 템플릿 목록/상세/복사
  │   └─ AI 설문 생성 (주제 → 질문 자동 생성)
  └─ 창2 (backend): 분석 & AI API
      ├─ 응답 집계 API (질문별 통계, 교차분석)
      ├─ Template 엔티티 + CRUD
      ├─ AI 설문 생성 API (Claude/OpenAI)
      └─ 리포트 파일 생성 (PDF, Excel)
```

### Phase 5: 대시보드 고도화 & 배포 (W13~W14)

```
[순차] Step 1: infra
  ├─ Docker Compose 프로덕션 설정 (multi-stage build)
  ├─ Nginx 리버스 프록시 + SSL
  └─ CI/CD (GitHub Actions)

[병렬] Step 2: frontend + backend
  ├─ 창1 (frontend): 대시보드 고도화
  │   ├─ 실시간 통계 (응답률, 완료율, 트렌드)
  │   ├─ 알림 시스템 UI
  │   ├─ 사용자/부서 관리 UI (admin)
  │   └─ Pretendard 폰트 + 반응형 모바일
  └─ 창2 (backend): 실시간 & 배포
      ├─ WebSocket 실시간 응답 알림
      ├─ 이메일 알림 서비스
      ├─ 사용자/부서 관리 API 확장
      └─ 데이터 시딩 + 통합 테스트
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
- docs/design-system.md — 디자인 토큰, 컬러, 폰트
- docs/ui-guide.md — 컴포넌트 체계, 레이아웃, 페이지별 CX 설계
- packages/shared/src/types/ — 공유 타입 참조

규칙:
- CLAUDE.md 멀티 에이전트 협업 프로토콜 준수
- docs/design-system.md의 컬러/폰트 규격 준수
- docs/ui-guide.md의 컴포넌트/레이아웃/인터랙션 패턴 준수
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

---

## Phase 2 실전 프롬프트

> Phase 2를 시작할 때 아래 프롬프트를 그대로 복사해서 각 Claude Code 창에 붙여넣으세요.
> Step 1 완료 후 → Step 2의 두 프롬프트를 각각 별도 창에 붙여넣어 동시 실행합니다.

### Phase 2 Step 1 — infra 에이전트에게 (1개 창)

```
CLAUDE.md를 읽고 멀티 에이전트 협업 프로토콜을 따라주세요.
agents/roles.md에서 자신의 역할과 수정 가능 범위를 확인하세요.

시작 전: git pull → agents/status.md 읽기 → worklog/ 최신 파일 읽기

당신의 역할: agent-infra-1 (인프라/기반 에이전트)

작업 내용: Phase 2 공유 타입 정의

1. `packages/shared/src/types/question.ts` 생성:
   - QuestionType enum (11가지): single-choice, multiple-choice, short-text, long-text, rating, scale, date, file-upload, matrix, ranking, nps
   - QuestionBase 인터페이스: id, surveyId, type, title, description?, order, required, options?
   - QuestionOption: id, label, value, order
   - QuestionValidation: minLength?, maxLength?, min?, max?, pattern?
   - CreateQuestionRequest, UpdateQuestionRequest, QuestionResponse 타입
   - ReorderQuestionsRequest: { questionIds: string[] }
2. `packages/shared/src/index.ts`에 새 타입 re-export 추가
3. agents/status.md 업데이트 (작업 시작/완료)
4. worklog/2026-03-XX_phase2_shared-types.md 작성

완료 후 커밋 & 푸시.
커밋 메시지: feat: add question type definitions for survey editor
```

### Phase 2 Step 2 — frontend 에이전트에게 (창1)

```
CLAUDE.md를 읽고 멀티 에이전트 협업 프로토콜을 따라주세요.
agents/roles.md에서 자신의 역할과 수정 가능 범위를 확인하세요.

시작 전: git pull → agents/status.md 읽기 → worklog/ 최신 파일 읽기
확인: packages/shared/src/types/question.ts가 있는지 확인 (infra 작업 완료 필요)

당신의 역할: agent-frontend-1 (프론트엔드 에이전트)

작업 내용: Phase 2 설문 에디터 UI

1. 설문 에디터 페이지: `apps/frontend/src/app/dashboard/surveys/[id]/edit/page.tsx`
   - 3열 레이아웃: 왼쪽(질문 타입 팔레트) | 가운데(에디터) | 오른쪽(미리보기)

2. 컴포넌트 (`apps/frontend/src/components/survey-editor/`):
   - QuestionTypeSelector.tsx — 10가지 타입 선택 팔레트 (카드 형태)
   - QuestionEditor.tsx — 질문 편집 폼 (제목, 설명, 필수여부, 타입별 옵션)
   - QuestionPreview.tsx — 응답자 시점 미리보기
   - QuestionList.tsx — 질문 목록 (드래그 가능, 선택 상태)
   - editors/ — 타입별 에디터 (SingleChoiceEditor, MultipleChoiceEditor, TextEditor, RatingEditor, ScaleEditor, DateEditor, FileUploadEditor, MatrixEditor, RankingEditor, NpsEditor)
   - previews/ — 타입별 미리보기 (위와 동일 패턴)

3. packages/shared의 QuestionType, QuestionBase 등 import해서 사용
4. docs/design-system.md 참조 — 오렌지 포인트 컬러, 카드 스타일, 시맨틱 컬러 적용
5. dnd-kit 설치 (`@dnd-kit/core`, `@dnd-kit/sortable`) 후 드래그 앤 드롭 구현
6. agents/status.md 업데이트 + worklog 작성

커밋 메시지: feat: add survey editor UI with question type components
```

### Phase 2 Step 2 — backend 에이전트에게 (창2, frontend와 동시)

```
CLAUDE.md를 읽고 멀티 에이전트 협업 프로토콜을 따라주세요.
agents/roles.md에서 자신의 역할과 수정 가능 범위를 확인하세요.

시작 전: git pull → agents/status.md 읽기 → worklog/ 최신 파일 읽기
확인: packages/shared/src/types/question.ts가 있는지 확인 (infra 작업 완료 필요)

당신의 역할: agent-backend-1 (백엔드 에이전트)

작업 내용: Phase 2 Question API

1. Question 엔티티 (`apps/backend/src/entities/question.entity.ts`):
   - UUID PK, surveyId (FK → Survey), type (QuestionType enum)
   - title: string, description: string (nullable)
   - options: JSONB (QuestionOption[]), validation: JSONB (nullable)
   - order: number, required: boolean (default true)
   - timestamps (createdAt, updatedAt)
   - Survey 엔티티에 questions 관계 추가 (OneToMany)

2. Questions 모듈 (`apps/backend/src/questions/`):
   - QuestionsController: CRUD 엔드포인트
     - POST /api/v1/surveys/:surveyId/questions
     - GET /api/v1/surveys/:surveyId/questions
     - PATCH /api/v1/questions/:id
     - DELETE /api/v1/questions/:id
     - POST /api/v1/surveys/:surveyId/questions/reorder
   - QuestionsService: 비즈니스 로직
   - CreateQuestionDto, UpdateQuestionDto (class-validator 데코레이터)

3. Surveys 모듈 확장:
   - PATCH /api/v1/surveys/:id/publish — DRAFT→ACTIVE (질문 1개 이상 필수)
   - PATCH /api/v1/surveys/:id/close — ACTIVE→CLOSED
   - GET /api/v1/surveys/:id?include=questions — 질문 포함 조회

4. agents/status.md 업데이트 + worklog 작성

커밋 메시지: feat: add question entity and CRUD API for survey editor
```
