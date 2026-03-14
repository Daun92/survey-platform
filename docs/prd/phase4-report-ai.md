# Phase 4: 리포트 & AI PRD

> 기간: W10~W12 | 상태: 예정 | 의존: Phase 3 완료

## 1. 개요

### 목적
수집된 응답 데이터를 시각화하여 분석하고, AI를 활용한 설문 자동 생성 및 템플릿 시스템을 구현합니다.

### 범위
- 응답 집계 및 통계 분석
- 차트 기반 리포트 대시보드
- 교차 분석 (부서별, 질문 간)
- 리포트 다운로드 (PDF, Excel)
- 설문 템플릿 갤러리
- AI 설문 자동 생성

### 범위 외
- 실시간 응답 알림 (Phase 5)
- 고급 통계 (회귀분석 등)

---

## 2. 사용자 스토리

| ID | 사용자 | 스토리 | 우선순위 |
|----|--------|--------|---------|
| US-4.1 | 설문 관리자 | 설문 결과를 차트(막대, 원형, 선형)로 확인할 수 있다 | P0 |
| US-4.2 | 설문 관리자 | 질문별 응답 분포를 한눈에 볼 수 있다 | P0 |
| US-4.3 | 설문 관리자 | 부서별/그룹별 교차 분석 결과를 테이블로 볼 수 있다 | P1 |
| US-4.4 | 설문 관리자 | 리포트를 PDF 또는 Excel로 다운로드할 수 있다 | P1 |
| US-4.5 | 설문 관리자 | 기존 설문을 템플릿으로 저장할 수 있다 | P0 |
| US-4.6 | 설문 관리자 | 템플릿 갤러리에서 원하는 템플릿을 선택하여 새 설문을 생성할 수 있다 | P0 |
| US-4.7 | 설문 관리자 | 주제/목적을 입력하면 AI가 설문 질문을 자동 생성해준다 | P0 |
| US-4.8 | 설문 관리자 | AI가 생성한 질문을 수정/삭제/추가한 뒤 설문으로 저장할 수 있다 | P0 |
| US-4.9 | 설문 관리자 | NPS 질문의 추천/중립/비추천 비율을 한눈에 확인할 수 있다 | P1 |

---

## 3. 기능 요구사항

### 3.1 공유 타입 (infra 에이전트)

`packages/shared/src/types/report.ts`:

```typescript
// 차트 타입
enum ChartType {
  BAR = 'bar',
  PIE = 'pie',
  LINE = 'line',
  HEATMAP = 'heatmap',
  STACKED_BAR = 'stacked-bar',
}

// 질문별 집계 결과
interface QuestionAggregation {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  totalResponses: number;
  data: AggregationData;
}

// 집계 데이터 (타입별 분기)
type AggregationData =
  | ChoiceAggregation      // single-choice, multiple-choice
  | TextAggregation        // short-text, long-text
  | NumericAggregation     // rating, scale, nps
  | MatrixAggregation      // matrix
  | RankingAggregation;    // ranking

interface ChoiceAggregation {
  type: 'choice';
  options: { label: string; count: number; percentage: number }[];
}

interface TextAggregation {
  type: 'text';
  responses: string[];       // 최근 N개
  totalCount: number;
  // AI 요약은 향후 확장
}

interface NumericAggregation {
  type: 'numeric';
  average: number;
  median: number;
  min: number;
  max: number;
  distribution: { value: number; count: number }[];
  // NPS 전용
  npsScore?: number;         // -100 ~ 100
  promoters?: number;        // 9-10점 비율
  passives?: number;         // 7-8점 비율
  detractors?: number;       // 0-6점 비율
}

interface MatrixAggregation {
  type: 'matrix';
  rows: {
    label: string;
    columns: { label: string; count: number; percentage: number }[];
  }[];
}

interface RankingAggregation {
  type: 'ranking';
  items: { label: string; averageRank: number; rankDistribution: number[] }[];
}

// 교차 분석
interface CrossTabulation {
  questionId: string;
  groupBy: string;           // 교차 기준 (부서, 다른 질문 등)
  groups: {
    groupLabel: string;
    data: AggregationData;
  }[];
}

// 리포트 다운로드 형식
enum ExportFormat {
  PDF = 'pdf',
  EXCEL = 'xlsx',
}
```

`packages/shared/src/types/template.ts`:

```typescript
// 템플릿 카테고리
enum TemplateCategory {
  EMPLOYEE_SATISFACTION = 'employee-satisfaction',
  CUSTOMER_FEEDBACK = 'customer-feedback',
  EVENT_FEEDBACK = 'event-feedback',
  ONBOARDING = 'onboarding',
  TRAINING = 'training',
  GENERAL = 'general',
  CUSTOM = 'custom',
}

// 템플릿 내 질문 정의
interface TemplateQuestion {
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  config?: Record<string, unknown>;
}

// 템플릿
interface TemplateResponse {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  questions: TemplateQuestion[];
  usageCount: number;
  isSystem: boolean;          // 시스템 기본 vs 사용자 생성
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

// AI 설문 생성 요청
interface AiGenerateRequest {
  topic: string;              // 설문 주제
  purpose?: string;           // 설문 목적
  targetAudience?: string;    // 대상
  questionCount?: number;     // 원하는 질문 수 (기본: 10)
  language?: string;          // 언어 (기본: 'ko')
}

// AI 설문 생성 응답
interface AiGenerateResponse {
  title: string;
  description: string;
  questions: TemplateQuestion[];
}
```

### 3.2 Backend API (backend 에이전트)

#### 신규 엔티티

**Template 엔티티:**
```
Template
├── id: UUID (PK)
├── title: varchar(200)
├── description: text
├── category: enum TemplateCategory
├── questions: jsonb — TemplateQuestion[]
├── usageCount: integer (default: 0)
├── isSystem: boolean (default: false)
├── createdById: UUID (FK → User, nullable)
├── createdAt: timestamptz
└── updatedAt: timestamptz
```

#### API 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| **리포트** | | | |
| GET | `/api/v1/surveys/:id/report` | 전체 리포트 (질문별 집계) | JWT |
| GET | `/api/v1/surveys/:id/report/questions/:questionId` | 단일 질문 상세 집계 | JWT |
| GET | `/api/v1/surveys/:id/report/cross` | 교차 분석 | JWT |
| GET | `/api/v1/surveys/:id/report/export` | 리포트 파일 다운로드 | JWT |
| **템플릿** | | | |
| GET | `/api/v1/templates` | 템플릿 목록 (카테고리 필터) | JWT |
| GET | `/api/v1/templates/:id` | 템플릿 상세 | JWT |
| POST | `/api/v1/templates` | 템플릿 생성 (설문→템플릿) | JWT |
| POST | `/api/v1/templates/:id/use` | 템플릿으로 설문 생성 | JWT |
| DELETE | `/api/v1/templates/:id` | 템플릿 삭제 | JWT |
| **AI** | | | |
| POST | `/api/v1/ai/generate-survey` | AI 설문 생성 | JWT |

#### 비즈니스 규칙

- 리포트 집계는 COMPLETED 상태의 응답만 포함
- 교차 분석은 `groupBy` 쿼리 파라미터로 부서 또는 다른 질문 ID 지정
- 리포트 export는 `format=pdf|xlsx` 쿼리 파라미터
- AI 생성은 Claude API (또는 OpenAI) 호출 — API 키는 환경변수
- AI 응답은 JSON 포맷으로 파싱하여 TemplateQuestion[] 반환
- 템플릿에서 설문 생성 시 `usageCount` 증가

### 3.3 Frontend UI (frontend 에이전트)

#### 리포트 대시보드

경로: `/dashboard/surveys/[id]/report`

```
┌──────────────────────────────────────────────────┐
│ 설문 리포트: "2026년 직원 만족도 조사"               │
│ 응답 42건 | 기간: 2026.03.14 ~ 2026.03.21          │
│                                    [PDF] [Excel]  │
├──────────────────────────────────────────────────┤
│                                                  │
│ ┌─ Q1. 전반적 만족도 (rating) ────────────────┐  │
│ │ 평균: 4.2 / 5.0                             │  │
│ │ ██████████████████░░ 84%                    │  │
│ │ ★★★★☆                                      │  │
│ │ [막대 차트: 1점~5점 분포]                     │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ ┌─ Q2. 선호하는 근무 형태 (single-choice) ────┐  │
│ │ [원형 차트]                                  │  │
│ │ ● 사무실 출근: 30% (13)                      │  │
│ │ ● 재택 근무: 45% (19)                        │  │
│ │ ● 하이브리드: 25% (10)                       │  │
│ └─────────────────────────────────────────────┘  │
│                                                  │
│ ┌─ Q3. NPS ────────────────────────────────┐    │
│ │ NPS Score: +42                            │    │
│ │ 추천(9-10): 55% | 중립(7-8): 30% | 비추천: 15% │
│ └───────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

#### AI 설문 생성 페이지

경로: `/dashboard/surveys/ai`

```
┌──────────────────────────────────────────┐
│ AI 설문 생성                               │
│                                          │
│ 주제: [직원 복지 만족도 조사_____________]  │
│ 목적: [복지 제도 개선을 위한 의견 수집____]  │
│ 대상: [전 직원________________________]   │
│ 질문 수: [10]                            │
│                                          │
│ [AI로 생성하기]                            │
│                                          │
│ ─── 생성 결과 ───                         │
│                                          │
│ "직원 복지 만족도 조사"                     │
│                                          │
│ Q1. 현재 복지 제도에 얼마나 만족... (rating) │
│ Q2. 가장 만족스러운 복지 항목... (multiple)  │
│ Q3. 개선이 필요한 부분은... (long-text)     │
│ ...                                      │
│                                          │
│ [설문으로 저장]  [다시 생성]                 │
└──────────────────────────────────────────┘
```

#### 템플릿 갤러리

경로: `/dashboard/templates`

```
┌──────────────────────────────────────────────────┐
│ 설문 템플릿                                        │
│ [전체] [직원만족] [고객피드백] [이벤트] [온보딩] [교육] │
│                                                  │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│ │ 📋        │ │ 📋        │ │ 📋        │       │
│ │ 직원 만족도│ │ 고객 NPS  │ │ 온보딩     │       │
│ │ 10개 질문  │ │ 5개 질문  │ │ 8개 질문   │       │
│ │ 사용 23회  │ │ 사용 15회 │ │ 사용 7회   │       │
│ │ [사용하기] │ │ [사용하기]│ │ [사용하기] │       │
│ └───────────┘ └───────────┘ └───────────┘       │
└──────────────────────────────────────────────────┘
```

#### 컴포넌트 구조

```
apps/frontend/src/components/
├── report/
│   ├── ReportDashboard.tsx         # 리포트 메인 레이아웃
│   ├── QuestionReport.tsx          # 질문별 리포트 카드
│   ├── charts/
│   │   ├── BarChart.tsx            # 막대 차트 (recharts)
│   │   ├── PieChart.tsx            # 원형 차트
│   │   ├── LineChart.tsx           # 선형 차트 (트렌드)
│   │   ├── HeatmapChart.tsx        # 히트맵 (매트릭스)
│   │   └── NpsGauge.tsx            # NPS 게이지
│   ├── CrossTabTable.tsx           # 교차 분석 테이블
│   └── ExportButtons.tsx           # PDF/Excel 다운로드 버튼
├── template/
│   ├── TemplateGallery.tsx         # 템플릿 갤러리 그리드
│   ├── TemplateCard.tsx            # 개별 템플릿 카드
│   └── TemplatePreview.tsx         # 템플릿 미리보기 모달
└── ai/
    ├── AiGenerateForm.tsx          # AI 생성 입력 폼
    ├── AiGenerateResult.tsx        # 생성 결과 표시
    └── AiQuestionPreview.tsx       # 생성된 질문 미리보기/편집
```

---

## 4. 비기능 요구사항

### 성능
- 리포트 집계: 응답 1000건 기준 3초 이내
- 차트 렌더링: 500ms 이내
- AI 생성: 15초 이내 (로딩 스피너 표시)

### 보안
- AI API 키는 서버 환경변수로만 관리 (프론트에 노출 금지)
- 리포트 접근은 설문 소유자 또는 ADMIN/MANAGER로 제한
- 다운로드 파일은 임시 URL로 제공 (5분 만료)

---

## 5. 의존성 & 제약사항

### 이전 Phase 의존
- Phase 2: Question 엔티티, QuestionType
- Phase 3: Response 엔티티, 응답 데이터

### 신규 라이브러리

| 라이브러리 | 용도 | 설치 위치 |
|-----------|------|----------|
| `recharts` | 차트 컴포넌트 | apps/frontend |
| `@anthropic-ai/sdk` 또는 `openai` | AI 설문 생성 | apps/backend |
| `pdfkit` 또는 `jspdf` | PDF 생성 | apps/backend |
| `exceljs` | Excel 생성 | apps/backend |

---

## 6. 완료 기준 (Definition of Done)

### infra
- [ ] report.ts, template.ts 공유 타입 정의
- [ ] index.ts re-export

### backend
- [ ] Template 엔티티 생성
- [ ] 리포트 집계 API (질문별 통계)
- [ ] 교차 분석 API
- [ ] 리포트 파일 다운로드 (PDF, Excel 중 1개 이상)
- [ ] 템플릿 CRUD API + 사용 API
- [ ] AI 설문 생성 API (Claude 또는 OpenAI)

### frontend
- [ ] 리포트 대시보드 페이지 (질문별 차트)
- [ ] 차트 컴포넌트 3종 이상 (막대, 원형, NPS)
- [ ] 교차 분석 테이블
- [ ] 리포트 다운로드 버튼 동작
- [ ] 템플릿 갤러리 페이지
- [ ] AI 설문 생성 페이지 (입력 → 결과 → 저장)
