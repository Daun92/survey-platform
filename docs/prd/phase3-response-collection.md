# Phase 3: 대상자 관리 & 응답 수집 PRD

> 기간: W7~W9 | 상태: 예정 | 의존: Phase 2 완료

## 1. 개요

### 목적
발행된 설문에 대해 배포 링크를 생성하고, 응답자가 비로그인으로 설문에 응답할 수 있는 공개 응답 페이지와 응답 수집/저장 시스템을 구현합니다.

### 범위
- 설문 배포 (링크, QR코드 생성)
- 공개 응답 페이지 (비로그인)
- 응답 제출 및 저장
- 중복 응답 방지
- 대상자/응답자 그룹 관리

### 범위 외
- 응답 분석/리포트 (Phase 4)
- 이메일 발송 (Phase 5)
- 실시간 응답 알림 (Phase 5)

---

## 2. 사용자 스토리

| ID | 사용자 | 스토리 | 우선순위 |
|----|--------|--------|---------|
| US-3.1 | 설문 관리자 | 발행된 설문의 배포 링크를 생성하고 복사할 수 있다 | P0 |
| US-3.2 | 설문 관리자 | QR코드를 생성하여 오프라인에서도 설문을 배포할 수 있다 | P1 |
| US-3.3 | 응답자 | 링크를 클릭하면 로그인 없이 바로 설문에 응답할 수 있다 | P0 |
| US-3.4 | 응답자 | 설문 진행률을 확인하며 순서대로 응답할 수 있다 | P0 |
| US-3.5 | 응답자 | 필수 질문을 건너뛰면 유효성 에러를 확인할 수 있다 | P0 |
| US-3.6 | 응답자 | 모든 질문에 답한 뒤 제출하면 완료 화면을 볼 수 있다 | P0 |
| US-3.7 | 설문 관리자 | 동일 응답자의 중복 응답을 방지할 수 있다 | P1 |
| US-3.8 | 설문 관리자 | 수집된 응답 개수를 실시간으로 확인할 수 있다 | P0 |
| US-3.9 | 설문 관리자 | 마감된 설문의 링크에 접속하면 마감 안내를 볼 수 있다 | P0 |

---

## 3. 기능 요구사항

### 3.1 공유 타입 (infra 에이전트)

`packages/shared/src/types/response.ts`:

```typescript
// 응답 상태
enum ResponseStatus {
  IN_PROGRESS = 'in-progress',   // 작성 중 (임시저장)
  COMPLETED = 'completed',       // 제출 완료
}

// 개별 질문에 대한 응답 값
interface AnswerValue {
  questionId: string;
  type: QuestionType;
  value: string | string[] | number | Record<string, string> | null;
  // string: short-text, long-text, date, nps
  // string[]: multiple-choice, ranking, file-upload
  // number: rating, scale
  // Record<string, string>: matrix (rowId → columnValue)
  // null: 미응답
}

// 응답자 정보 (비로그인)
interface RespondentInfo {
  name?: string;
  email?: string;
  department?: string;
  ipAddress?: string;
  userAgent?: string;
}

// 응답 제출 요청
interface SubmitResponseRequest {
  answers: AnswerValue[];
  respondentInfo?: RespondentInfo;
}

// 응답 결과
interface SurveyResponseDetail {
  id: string;
  surveyId: string;
  status: ResponseStatus;
  respondentInfo: RespondentInfo | null;
  answers: AnswerValue[];
  submittedAt: string | null;
  createdAt: string;
}
```

`packages/shared/src/types/distribution.ts`:

```typescript
// 배포 채널
enum DistributionChannel {
  LINK = 'link',
  QR = 'qr',
  EMAIL = 'email',  // Phase 5에서 구현
}

// 배포 설정
interface DistributionConfig {
  allowAnonymous: boolean;        // 익명 응답 허용
  allowDuplicate: boolean;        // 중복 응답 허용
  requireName: boolean;           // 이름 필수
  requireEmail: boolean;          // 이메일 필수
  maxResponses?: number;          // 최대 응답 수 제한
  expiresAt?: string;             // 링크 만료 시각
}

// 배포 링크
interface DistributionResponse {
  id: string;
  surveyId: string;
  channel: DistributionChannel;
  token: string;                  // URL 토큰 (nanoid)
  config: DistributionConfig;
  responseCount: number;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

// 배포 생성 요청
interface CreateDistributionRequest {
  channel: DistributionChannel;
  config: DistributionConfig;
}
```

### 3.2 Backend API (backend 에이전트)

#### 신규 엔티티

**Response 엔티티:**
```
Response
├── id: UUID (PK)
├── surveyId: UUID (FK → Survey)
├── distributionId: UUID (FK → Distribution, nullable)
├── status: enum ResponseStatus
├── respondentInfo: jsonb (nullable) — RespondentInfo
├── answers: jsonb — AnswerValue[]
├── submittedAt: timestamptz (nullable)
├── ipAddress: varchar(45) (nullable)
├── createdAt: timestamptz
└── updatedAt: timestamptz
```

**Distribution 엔티티:**
```
Distribution
├── id: UUID (PK)
├── surveyId: UUID (FK → Survey)
├── channel: enum DistributionChannel
├── token: varchar(21) (unique, nanoid)
├── config: jsonb — DistributionConfig
├── isActive: boolean (default: true)
├── expiresAt: timestamptz (nullable)
├── createdAt: timestamptz
└── updatedAt: timestamptz
```

#### API 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| **배포 관리** | | | |
| POST | `/api/v1/surveys/:surveyId/distributions` | 배포 링크 생성 | JWT |
| GET | `/api/v1/surveys/:surveyId/distributions` | 배포 목록 조회 | JWT |
| PATCH | `/api/v1/distributions/:id` | 배포 설정 수정 | JWT |
| DELETE | `/api/v1/distributions/:id` | 배포 비활성화 | JWT |
| **공개 응답** | | | |
| GET | `/api/v1/public/surveys/:token` | 공개 설문 조회 (질문 포함) | 없음 |
| POST | `/api/v1/public/surveys/:token/responses` | 응답 제출 | 없음 |
| **응답 관리** | | | |
| GET | `/api/v1/surveys/:surveyId/responses` | 응답 목록 조회 | JWT |
| GET | `/api/v1/surveys/:surveyId/responses/count` | 응답 수 조회 | JWT |
| GET | `/api/v1/responses/:id` | 개별 응답 상세 | JWT |
| DELETE | `/api/v1/responses/:id` | 응답 삭제 | JWT (ADMIN) |

#### 비즈니스 규칙

- 공개 API (`/api/v1/public/*`)는 인증 불필요
- 공개 설문 조회 시 설문이 ACTIVE 상태가 아니면 에러 응답 (마감 안내)
- 배포 링크의 `token`은 nanoid(21자)로 생성 — URL-safe
- 중복 응답 방지: `allowDuplicate=false`일 때 IP + 브라우저 핑거프린트로 체크
- 응답 제출 시 필수 질문 미응답 검증 (서버사이드)
- `maxResponses` 도달 시 추가 응답 거부
- `expiresAt` 지나면 응답 거부
- 응답 수(`responseCount`)는 Survey와 Distribution에 모두 반영

### 3.3 Frontend UI (frontend 에이전트)

#### 공개 응답 페이지

경로: `/s/[token]` (대시보드 레이아웃 밖, 별도 레이아웃)

```
┌──────────────────────────────────────┐
│         [설문 플랫폼 로고]              │
│                                      │
│  ┌──────────────────────────────┐    │
│  │        설문 제목               │    │
│  │        설문 설명               │    │
│  │                              │    │
│  │  ████████████░░░░░  60%     │    │
│  │  (3/5 질문)                  │    │
│  │                              │    │
│  │  Q3. 선호하는 근무 형태는?     │    │
│  │  하나만 선택해주세요            │    │
│  │                              │    │
│  │  ○ 사무실 출근                │    │
│  │  ● 재택 근무                  │    │
│  │  ○ 하이브리드                 │    │
│  │                              │    │
│  │  [← 이전]          [다음 →]   │    │
│  └──────────────────────────────┘    │
│                                      │
│         © Survey Platform            │
└──────────────────────────────────────┘
```

#### 완료 화면

```
┌──────────────────────────────────┐
│                                  │
│           ✓ 완료!                │
│                                  │
│    설문에 응답해주셔서 감사합니다.   │
│    응답이 성공적으로 제출되었습니다.  │
│                                  │
│         [홈으로 돌아가기]          │
│                                  │
└──────────────────────────────────┘
```

#### 대상자 관리 페이지

경로: `/dashboard/surveys/[id]/distribute`

```
┌──────────────────────────────────────────────┐
│ 설문 배포 관리                                  │
│                                              │
│ ┌─ 배포 링크 ──────────────────────────────┐  │
│ │ https://example.com/s/abc123def456...    │  │
│ │ [복사] [QR 생성] [새 링크]                 │  │
│ └──────────────────────────────────────────┘  │
│                                              │
│ ┌─ 배포 설정 ──────────────────────────────┐  │
│ │ ☑ 익명 응답 허용                          │  │
│ │ ☐ 중복 응답 허용                          │  │
│ │ ☐ 이름 필수                              │  │
│ │ ☐ 이메일 필수                             │  │
│ │ 최대 응답 수: [___] (0=제한없음)           │  │
│ │ 만료일: [____-__-__]                     │  │
│ └──────────────────────────────────────────┘  │
│                                              │
│ ┌─ 응답 현황 ──────────────────────────────┐  │
│ │ 총 응답: 42건  |  오늘: 5건               │  │
│ └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

#### 컴포넌트 구조

```
apps/frontend/src/
├── app/
│   ├── s/[token]/                    # 공개 응답 (별도 레이아웃)
│   │   ├── layout.tsx                # 미니멀 레이아웃 (사이드바 없음)
│   │   └── page.tsx                  # 응답 페이지
│   └── dashboard/surveys/[id]/
│       └── distribute/
│           └── page.tsx              # 배포 관리 페이지
├── components/
│   ├── survey-response/              # 응답 컴포넌트
│   │   ├── ResponseForm.tsx          # 전체 응답 폼
│   │   ├── ProgressBar.tsx           # 진행률 바
│   │   ├── CompletionScreen.tsx      # 완료 화면
│   │   ├── ClosedScreen.tsx          # 마감 안내 화면
│   │   └── renderers/               # 질문 타입별 응답 렌더러
│   │       ├── SingleChoiceRenderer.tsx
│   │       ├── MultipleChoiceRenderer.tsx
│   │       ├── ShortTextRenderer.tsx
│   │       ├── LongTextRenderer.tsx
│   │       ├── RatingRenderer.tsx
│   │       ├── ScaleRenderer.tsx
│   │       ├── DateRenderer.tsx
│   │       ├── FileUploadRenderer.tsx
│   │       ├── MatrixRenderer.tsx
│   │       ├── RankingRenderer.tsx
│   │       └── NpsRenderer.tsx
│   └── distribution/                 # 배포 관리 컴포넌트
│       ├── DistributionPanel.tsx
│       ├── LinkCopyButton.tsx
│       ├── QrCodeGenerator.tsx
│       └── DistributionSettings.tsx
```

---

## 4. 데이터 모델

### Response 엔티티 (TypeORM)

```typescript
@Entity('responses')
class Response {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  surveyId: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column('uuid', { nullable: true })
  distributionId: string | null;

  @ManyToOne(() => Distribution, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'distributionId' })
  distribution: Distribution | null;

  @Column({ type: 'enum', enum: ResponseStatus, default: ResponseStatus.COMPLETED })
  status: ResponseStatus;

  @Column({ type: 'jsonb', nullable: true })
  respondentInfo: RespondentInfo | null;

  @Column({ type: 'jsonb' })
  answers: AnswerValue[];

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

### Distribution 엔티티 (TypeORM)

```typescript
@Entity('distributions')
class Distribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  surveyId: string;

  @ManyToOne(() => Survey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;

  @Column({ type: 'enum', enum: DistributionChannel })
  channel: DistributionChannel;

  @Column({ type: 'varchar', length: 21, unique: true })
  token: string;

  @Column({ type: 'jsonb' })
  config: DistributionConfig;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
```

---

## 5. 비기능 요구사항

### 성능
- 공개 응답 페이지 초기 로딩: 2초 이내
- 응답 제출 처리: 1초 이내
- 동시 100명 응답 제출 처리 가능

### 보안
- 공개 API에 Rate Limiting 적용 (IP당 분당 30회)
- 응답 데이터 XSS sanitize
- CSRF 보호 (토큰 기반)
- SQL Injection 방지 (TypeORM 파라미터 바인딩)

### 접근성
- 공개 응답 페이지 모바일 최적화 (max-width: 640px)
- 키보드로 전체 응답 가능
- 스크린 리더 호환 (aria-label, role)

---

## 6. 의존성 & 제약사항

### 이전 Phase 의존
- Phase 2: Question 엔티티, QuestionType, 설문 에디터, 발행/마감 API

### 신규 라이브러리

| 라이브러리 | 용도 | 설치 위치 |
|-----------|------|----------|
| `nanoid` | 배포 토큰 생성 | apps/backend |
| `qrcode.react` | QR코드 컴포넌트 | apps/frontend |

---

## 7. 완료 기준 (Definition of Done)

### infra
- [ ] `packages/shared/src/types/response.ts` 타입 정의
- [ ] `packages/shared/src/types/distribution.ts` 타입 정의
- [ ] index.ts re-export

### backend
- [ ] Response, Distribution 엔티티 생성
- [ ] 배포 링크 CRUD API 동작
- [ ] 공개 설문 조회 API (토큰 기반, 비인증)
- [ ] 응답 제출 API (비인증, 유효성 검증)
- [ ] 중복 응답 방지 로직
- [ ] 응답 목록/상세 조회 API (인증)

### frontend
- [ ] 공개 응답 페이지 (`/s/[token]`) 렌더링
- [ ] 11가지 질문 타입별 응답 렌더러 동작
- [ ] 진행률 바, 이전/다음 네비게이션
- [ ] 필수 질문 유효성 검증 표시
- [ ] 제출 완료 / 마감 안내 화면
- [ ] 배포 관리 페이지 (링크 복사, QR, 설정)
- [ ] 모바일 반응형 동작
