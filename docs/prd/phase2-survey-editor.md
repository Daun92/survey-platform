# Phase 2: 설문 에디터 PRD

> 기간: W4~W6 | 상태: 진행 예정 | 의존: Phase 1 완료

## 1. 개요

### 목적
설문 관리자가 다양한 질문 타입을 조합하여 설문을 구성하고, 드래그 앤 드롭으로 순서를 변경하고, 미리보기로 응답자 시점을 확인한 뒤 발행할 수 있는 설문 에디터를 구현합니다.

### 범위
- 11가지 질문 타입 정의 및 공유 타입 생성
- Question 엔티티 및 CRUD API
- 설문 에디터 3열 레이아웃 UI
- 질문 타입별 에디터/미리보기 컴포넌트
- 설문 발행/마감 워크플로우

### 범위 외
- 응답 수집 (Phase 3)
- 조건부 로직 / 분기 (향후 확장)
- 설문 템플릿 (Phase 4)

---

## 2. 사용자 스토리

| ID | 사용자 | 스토리 | 우선순위 |
|----|--------|--------|---------|
| US-2.1 | 설문 관리자 | 새 설문에 질문을 추가할 때 11가지 타입 중 하나를 선택할 수 있다 | P0 |
| US-2.2 | 설문 관리자 | 질문의 제목, 설명, 필수 여부, 옵션을 편집할 수 있다 | P0 |
| US-2.3 | 설문 관리자 | 질문을 드래그 앤 드롭으로 순서를 변경할 수 있다 | P0 |
| US-2.4 | 설문 관리자 | 편집 중인 설문을 응답자 시점으로 미리볼 수 있다 | P0 |
| US-2.5 | 설문 관리자 | 설문을 발행(DRAFT→ACTIVE)하면 응답을 받을 수 있다 | P0 |
| US-2.6 | 설문 관리자 | 진행 중인 설문을 마감(ACTIVE→CLOSED)할 수 있다 | P0 |
| US-2.7 | 설문 관리자 | 질문을 복제하거나 삭제할 수 있다 | P1 |
| US-2.8 | 설문 관리자 | 설문에 질문이 없으면 발행할 수 없다 (유효성 검증) | P0 |

---

## 3. 기능 요구사항

### 3.1 공유 타입 (infra 에이전트)

`packages/shared/src/types/question.ts`에 다음 타입을 정의합니다:

```typescript
// 11가지 질문 타입
enum QuestionType {
  SINGLE_CHOICE = 'single-choice',
  MULTIPLE_CHOICE = 'multiple-choice',
  SHORT_TEXT = 'short-text',
  LONG_TEXT = 'long-text',
  RATING = 'rating',
  SCALE = 'scale',
  DATE = 'date',
  FILE_UPLOAD = 'file-upload',
  MATRIX = 'matrix',
  RANKING = 'ranking',
  NPS = 'nps',
}

// 질문 옵션 (객관식, 매트릭스 등에서 사용)
interface QuestionOption {
  id: string;          // UUID
  label: string;       // 표시 텍스트
  value: string;       // 저장 값
  order: number;       // 정렬 순서
}

// 질문 유효성 검증 규칙
interface QuestionValidation {
  minLength?: number;  // 텍스트 최소 길이
  maxLength?: number;  // 텍스트 최대 길이
  min?: number;        // 숫자/척도 최소값
  max?: number;        // 숫자/척도 최대값
  minSelect?: number;  // 복수선택 최소 개수
  maxSelect?: number;  // 복수선택 최대 개수
  pattern?: string;    // 정규식 패턴
}

// 매트릭스 질문의 행/열 정의
interface MatrixConfig {
  rows: QuestionOption[];    // 행 항목
  columns: QuestionOption[]; // 열 항목 (척도)
}

// 척도 질문 설정
interface ScaleConfig {
  min: number;          // 시작값 (기본: 1)
  max: number;          // 끝값 (기본: 5 또는 10)
  minLabel?: string;    // 시작 레이블 (예: "매우 불만족")
  maxLabel?: string;    // 끝 레이블 (예: "매우 만족")
  step?: number;        // 간격 (기본: 1)
}

// 평점 질문 설정
interface RatingConfig {
  maxRating: number;    // 최대 별점 (기본: 5)
  icon?: 'star' | 'heart' | 'thumb'; // 아이콘 종류
}

// 파일 업로드 설정
interface FileUploadConfig {
  maxFileSize: number;       // 최대 파일 크기 (MB)
  allowedTypes: string[];    // 허용 확장자 (예: ['pdf', 'jpg', 'png'])
  maxFiles: number;          // 최대 파일 수
}

// 질문 기본 인터페이스
interface QuestionBase {
  id: string;
  surveyId: string;
  type: QuestionType;
  title: string;
  description?: string;
  order: number;
  required: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  matrixConfig?: MatrixConfig;
  scaleConfig?: ScaleConfig;
  ratingConfig?: RatingConfig;
  fileUploadConfig?: FileUploadConfig;
}

// API 요청/응답 타입
interface CreateQuestionRequest {
  surveyId: string;
  type: QuestionType;
  title: string;
  description?: string;
  required?: boolean;
  options?: Omit<QuestionOption, 'id'>[];
  validation?: QuestionValidation;
  matrixConfig?: MatrixConfig;
  scaleConfig?: ScaleConfig;
  ratingConfig?: RatingConfig;
  fileUploadConfig?: FileUploadConfig;
}

interface UpdateQuestionRequest {
  title?: string;
  description?: string;
  required?: boolean;
  options?: QuestionOption[];
  validation?: QuestionValidation;
  matrixConfig?: MatrixConfig;
  scaleConfig?: ScaleConfig;
  ratingConfig?: RatingConfig;
  fileUploadConfig?: FileUploadConfig;
}

interface QuestionResponse extends QuestionBase {
  createdAt: string;
  updatedAt: string;
}

interface ReorderQuestionsRequest {
  questionIds: string[]; // 새 순서대로 정렬된 질문 ID 배열
}
```

### 3.2 Backend API (backend 에이전트)

#### Question 엔티티

```
Question
├── id: UUID (PK)
├── surveyId: UUID (FK → Survey, CASCADE)
├── type: enum QuestionType
├── title: varchar(1000)
├── description: text (nullable)
├── order: integer
├── required: boolean (default: true)
├── options: jsonb (nullable) — QuestionOption[]
├── validation: jsonb (nullable) — QuestionValidation
├── config: jsonb (nullable) — MatrixConfig | ScaleConfig | RatingConfig | FileUploadConfig
├── createdAt: timestamptz
└── updatedAt: timestamptz
```

관계: `Survey.questions` — OneToMany, CASCADE 삭제

#### API 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/v1/surveys/:surveyId/questions` | 질문 추가 | JWT |
| GET | `/api/v1/surveys/:surveyId/questions` | 질문 목록 (order순) | JWT |
| PATCH | `/api/v1/questions/:id` | 질문 수정 | JWT |
| DELETE | `/api/v1/questions/:id` | 질문 삭제 | JWT |
| POST | `/api/v1/surveys/:surveyId/questions/reorder` | 순서 변경 | JWT |
| PATCH | `/api/v1/surveys/:id/publish` | 설문 발행 (DRAFT→ACTIVE) | JWT |
| PATCH | `/api/v1/surveys/:id/close` | 설문 마감 (ACTIVE→CLOSED) | JWT |
| GET | `/api/v1/surveys/:id?include=questions` | 설문+질문 일괄 조회 | JWT |

#### 비즈니스 규칙

- 질문 추가 시 `order`는 해당 설문의 마지막 순서+1로 자동 부여
- 질문 삭제 시 나머지 질문들의 `order` 재정렬
- `reorder`는 전체 질문 ID 배열을 받아 한번에 순서 업데이트 (트랜잭션)
- `publish`는 질문이 1개 이상이고, 설문 상태가 DRAFT일 때만 가능
- `close`는 설문 상태가 ACTIVE일 때만 가능
- ACTIVE 상태의 설문에서는 질문 추가/수정/삭제 불가 (DRAFT 상태에서만)

### 3.3 Frontend UI (frontend 에이전트)

#### 설문 에디터 페이지

경로: `/dashboard/surveys/[id]/edit`

3열 레이아웃:

```
┌─ Sidebar ─┬─────────────────────────────────────────────────────┐
│           │ Header: [설문 제목 (인라인 편집)]  [저장] [미리보기] [발행] │
│           ├──────────┬───────────────────┬──────────────────────┤
│           │ 질문 팔레트  │   질문 에디터       │   미리보기           │
│           │ (200px)   │   (flex-1)         │   (360px)           │
│           │           │                    │                     │
│           │ ┌────────┐│ ┌────────────────┐ │ ┌─────────────────┐ │
│           │ │단일선택 ││ │ Q1. 제목 입력    │ │ │ [응답자 시점]    │ │
│           │ │복수선택 ││ │ 설명 입력       │ │ │                 │ │
│           │ │단답형  ││ │ ☑ 필수         │ │ │ Q1. 제목        │ │
│           │ │장문형  ││ │ 옵션:          │ │ │ ○ 옵션 1        │ │
│           │ │별점   ││ │  ① 옵션 1 [x]  │ │ │ ○ 옵션 2        │ │
│           │ │척도   ││ │  ② 옵션 2 [x]  │ │ │ ○ 옵션 3        │ │
│           │ │날짜   ││ │  + 옵션 추가    │ │ │                 │ │
│           │ │파일   ││ └────────────────┘ │ │ Q2. ...         │ │
│           │ │매트릭스 ││                    │ │                 │ │
│           │ │순위   ││ ┌────────────────┐ │ └─────────────────┘ │
│           │ │NPS   ││ │ Q2. ...        │ │                     │
│           │ └────────┘│ └────────────────┘ │                     │
│           │           │                    │                     │
│           │           │ [+ 질문 추가]       │                     │
└───────────┴──────────┴───────────────────┴──────────────────────┘
```

#### 컴포넌트 구조

```
apps/frontend/src/components/survey-editor/
├── SurveyEditorPage.tsx        # 메인 페이지 컴포넌트 (3열 레이아웃)
├── SurveyEditorHeader.tsx      # 상단 바 (제목, 저장, 발행 버튼)
├── QuestionTypeSelector.tsx    # 왼쪽: 질문 타입 팔레트
├── QuestionList.tsx            # 가운데: 질문 목록 (DnD 컨테이너)
├── QuestionCard.tsx            # 가운데: 개별 질문 카드 (접기/펼치기)
├── QuestionEditor.tsx          # 가운데: 질문 편집 폼 (타입별 분기)
├── QuestionPreviewPanel.tsx    # 오른쪽: 전체 미리보기 패널
├── editors/                    # 타입별 에디터
│   ├── SingleChoiceEditor.tsx
│   ├── MultipleChoiceEditor.tsx
│   ├── ShortTextEditor.tsx
│   ├── LongTextEditor.tsx
│   ├── RatingEditor.tsx
│   ├── ScaleEditor.tsx
│   ├── DateEditor.tsx
│   ├── FileUploadEditor.tsx
│   ├── MatrixEditor.tsx
│   ├── RankingEditor.tsx
│   └── NpsEditor.tsx
└── previews/                   # 타입별 미리보기
    ├── SingleChoicePreview.tsx
    ├── MultipleChoicePreview.tsx
    ├── ShortTextPreview.tsx
    ├── LongTextPreview.tsx
    ├── RatingPreview.tsx
    ├── ScalePreview.tsx
    ├── DatePreview.tsx
    ├── FileUploadPreview.tsx
    ├── MatrixPreview.tsx
    ├── RankingPreview.tsx
    └── NpsPreview.tsx
```

#### 상태 관리

- 설문 데이터와 질문 목록은 페이지 컴포넌트에서 `useState`로 관리
- API 호출은 `apps/frontend/src/lib/api.ts`의 `api<T>()` 함수 사용
- 자동 저장: 질문 편집 후 2초 디바운스로 PATCH 호출
- 낙관적 업데이트: UI 먼저 반영 후 API 호출, 실패 시 롤백

#### 질문 타입별 에디터 상세

| 타입 | 에디터 UI | 미리보기 UI |
|------|----------|-----------|
| single-choice | 옵션 목록 편집 (추가/삭제/순서변경) | 라디오 버튼 목록 |
| multiple-choice | 옵션 목록 편집 + 최소/최대 선택 수 | 체크박스 목록 |
| short-text | 최대 글자 수, 플레이스홀더 | 한 줄 텍스트 입력 |
| long-text | 최대 글자 수, 플레이스홀더, 행 수 | 여러 줄 텍스트 입력 |
| rating | 최대 별점(3~10), 아이콘 선택 | 별/하트 아이콘 행 |
| scale | 시작/끝 값, 시작/끝 레이블 | 숫자 슬라이더 or 버튼 행 |
| date | 날짜 범위 제한 (min/max date) | 날짜 선택기 |
| file-upload | 파일 크기, 허용 확장자, 최대 개수 | 파일 업로드 영역 |
| matrix | 행 항목 편집 + 열 척도 편집 | 행×열 라디오 그리드 |
| ranking | 항목 목록 편집 | 드래그로 순위 지정 |
| nps | 고정 (0~10 척도) | 0~10 숫자 버튼 행 |

---

## 4. 데이터 모델

### Question 엔티티 (TypeORM)

```typescript
@Entity('questions')
class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  surveyId: string;

  @ManyToOne(() => Survey, survey => survey.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column({ type: 'enum', enum: QuestionType })
  type: QuestionType;

  @Column({ length: 1000 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'integer' })
  order: number;

  @Column({ type: 'boolean', default: true })
  required: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options: QuestionOption[] | null;

  @Column({ type: 'jsonb', nullable: true })
  validation: QuestionValidation | null;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, unknown> | null;
  // MatrixConfig | ScaleConfig | RatingConfig | FileUploadConfig

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Survey 엔티티 수정

```typescript
// 기존 Survey 엔티티에 추가
@OneToMany(() => Question, question => question.survey)
questions: Question[];
```

---

## 5. API 명세

### POST /api/v1/surveys/:surveyId/questions

질문 추가. order는 서버에서 자동 부여 (마지막+1).

**Request:**
```json
{
  "type": "single-choice",
  "title": "선호하는 근무 형태는?",
  "description": "하나만 선택해주세요",
  "required": true,
  "options": [
    { "label": "사무실 출근", "value": "office", "order": 0 },
    { "label": "재택 근무", "value": "remote", "order": 1 },
    { "label": "하이브리드", "value": "hybrid", "order": 2 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "surveyId": "uuid",
    "type": "single-choice",
    "title": "선호하는 근무 형태는?",
    "description": "하나만 선택해주세요",
    "order": 0,
    "required": true,
    "options": [
      { "id": "uuid", "label": "사무실 출근", "value": "office", "order": 0 },
      { "id": "uuid", "label": "재택 근무", "value": "remote", "order": 1 },
      { "id": "uuid", "label": "하이브리드", "value": "hybrid", "order": 2 }
    ],
    "validation": null,
    "config": null,
    "createdAt": "2026-03-14T...",
    "updatedAt": "2026-03-14T..."
  },
  "timestamp": "2026-03-14T..."
}
```

### GET /api/v1/surveys/:surveyId/questions

질문 목록 조회. order 오름차순 정렬.

**Response (200):**
```json
{
  "success": true,
  "data": [ /* QuestionResponse[] */ ],
  "timestamp": "..."
}
```

### PATCH /api/v1/questions/:id

질문 수정. DRAFT 상태의 설문에서만 가능.

**Request:** UpdateQuestionRequest (부분 업데이트)
**Response (200):** ApiResponse<QuestionResponse>

### DELETE /api/v1/questions/:id

질문 삭제. 나머지 질문 order 재정렬. DRAFT 상태에서만 가능.

**Response (200):**
```json
{ "success": true, "data": null, "message": "질문이 삭제되었습니다." }
```

### POST /api/v1/surveys/:surveyId/questions/reorder

전체 질문 순서 변경. 트랜잭션으로 일괄 처리.

**Request:**
```json
{ "questionIds": ["uuid-3", "uuid-1", "uuid-2"] }
```

**Response (200):** ApiResponse<QuestionResponse[]>

### PATCH /api/v1/surveys/:id/publish

설문 발행. 조건: status=DRAFT, 질문 1개 이상.

**Response (200):**
```json
{
  "success": true,
  "data": { /* SurveyResponse with status: "active" */ }
}
```

**Error (400):**
```json
{
  "success": false,
  "error": { "code": "NO_QUESTIONS", "message": "질문이 최소 1개 이상 필요합니다." }
}
```

### PATCH /api/v1/surveys/:id/close

설문 마감. 조건: status=ACTIVE.

**Response (200):** ApiResponse<SurveyResponse> (status: "closed")

---

## 6. 화면 설계

### 설문 에디터 진입 흐름

```
대시보드 → 프로젝트 → 설문 목록 → [설문 카드 클릭] → 설문 에디터
                                   [FAB → 새 설문] → 설문 생성 → 설문 에디터
```

### 에디터 인터랙션

1. **질문 추가**: 왼쪽 팔레트에서 타입 클릭 → 가운데 목록 하단에 빈 질문 추가 → 자동 포커스
2. **질문 편집**: 질문 카드 클릭 → 확장되어 편집 폼 표시 → 오른쪽 미리보기 실시간 반영
3. **순서 변경**: 질문 카드의 핸들(≡)을 드래그 → 드롭 위치에 삽입 → API 호출
4. **질문 삭제**: 질문 카드 우상단 [...] → 삭제 클릭 → 확인 다이얼로그
5. **질문 복제**: 질문 카드 우상단 [...] → 복제 클릭 → 같은 위치 아래에 복사본
6. **발행**: 상단 [발행] 버튼 → 확인 다이얼로그 → ACTIVE 상태 전환

### 상태별 에디터 동작

| 설문 상태 | 질문 추가 | 질문 편집 | 순서 변경 | 삭제 | 발행 |
|----------|---------|---------|---------|------|------|
| DRAFT | ✅ | ✅ | ✅ | ✅ | ✅ (질문 1개↑) |
| ACTIVE | ❌ | ❌ | ❌ | ❌ | ❌ (마감만) |
| CLOSED | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 7. 비기능 요구사항

### 성능
- 질문 100개까지 매끄러운 DnD 동작 (가상 스크롤 불필요, 리스트 렌더링 최적화)
- 자동 저장 디바운스: 2초
- 미리보기 반영 지연: 100ms 이내

### 보안
- 모든 질문 API에 JWT 인증 필수
- 설문 소유자 또는 ADMIN/MANAGER만 편집 가능 (향후 RBAC 확장 고려)
- title/description에 XSS 방지 (서버에서 sanitize)

### 접근성
- 키보드로 질문 타입 선택 가능 (Enter/Space)
- DnD에 키보드 대안 제공 (↑↓ 키로 이동)
- 각 입력 필드에 적절한 label/aria 속성

---

## 8. 의존성 & 제약사항

### 이전 Phase 의존
- Phase 1: Survey 엔티티, Survey CRUD API, 대시보드 레이아웃, JWT 인증

### 신규 라이브러리

| 라이브러리 | 용도 | 설치 위치 |
|-----------|------|----------|
| `@dnd-kit/core` | 드래그 앤 드롭 코어 | apps/frontend |
| `@dnd-kit/sortable` | 정렬 가능 리스트 | apps/frontend |
| `@dnd-kit/utilities` | DnD 유틸리티 | apps/frontend |

### 제약사항
- Tailwind CSS v4 (OKLch) + shadcn/ui 패턴 준수
- 질문 options/config는 JSONB로 저장 (스키마리스 유연성)
- 파일 업로드 질문은 Phase 2에서 UI만 구현, 실제 업로드는 Phase 3에서 구현

---

## 9. 완료 기준 (Definition of Done)

### infra
- [ ] `packages/shared/src/types/question.ts` 생성 및 모든 타입 정의
- [ ] `packages/shared/src/index.ts`에서 re-export
- [ ] TypeScript 컴파일 에러 없음

### backend
- [ ] Question 엔티티 생성, DB 테이블 자동 생성 (synchronize)
- [ ] Question CRUD API 5개 엔드포인트 동작
- [ ] 설문 발행/마감 API 동작 + 비즈니스 규칙 검증
- [ ] 질문 포함 설문 조회 (`?include=questions`) 동작
- [ ] ACTIVE 상태 설문의 질문 수정 차단

### frontend
- [ ] 설문 에디터 3열 레이아웃 렌더링
- [ ] 11가지 질문 타입 팔레트에서 선택하여 추가
- [ ] 각 타입별 에디터 UI 동작 (옵션 추가/삭제/편집)
- [ ] 미리보기 패널에 응답자 시점 실시간 반영
- [ ] DnD로 질문 순서 변경
- [ ] 발행 버튼 동작 (확인 다이얼로그 포함)
- [ ] 디자인 시스템 준수 (오렌지 포인트, 카드 스타일)
