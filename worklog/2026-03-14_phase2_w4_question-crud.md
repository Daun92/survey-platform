# Phase 2 W4: Question 엔티티 + CRUD API

- **날짜**: 2026-03-14
- **Phase**: 2 (W4)
- **브랜치**: feature/phase2-editor

## 목표
- Question 엔티티 및 CRUD API 구현 (10가지 질문 타입 지원)
- Shared 패키지에 Question 관련 타입 정의

## 완료 항목

### Shared 타입 (`packages/shared/src/index.ts`)
- [x] `QuestionType` enum — 10가지 타입 (short_text, long_text, radio, checkbox, dropdown, linear_scale, date, file_upload, matrix, ranking)
- [x] `QuestionOption` 인터페이스 — id, label, value, order
- [x] `LinearScaleConfig` 인터페이스 — min, max, minLabel, maxLabel
- [x] `MatrixConfig` 인터페이스 — rows, columns
- [x] `FileUploadConfig` 인터페이스 — maxFileSize, allowedTypes, maxFiles
- [x] `ValidationRule` 인터페이스 — required, minLength, maxLength, min, max, pattern
- [x] `QuestionOptions` 인터페이스 — choices, linearScale, matrix, fileUpload
- [x] `QuestionResponse` 인터페이스 — id, surveyId, type, title, description, order, options, validation
- [x] `ReorderQuestionsRequest` 타입

### Question 엔티티 (`apps/backend/src/entities/question.entity.ts`)
- [x] UUID PK, surveyId FK (Survey ManyToOne)
- [x] type (enum: QuestionType), title, description
- [x] order (정렬 순서)
- [x] options (JSONB): choices, linearScale, matrix, fileUpload
- [x] validation (JSONB): required, minLength, maxLength 등

### Question CRUD API (`apps/backend/src/questions/`)
- [x] `QuestionsModule` — Survey, Question 엔티티 임포트
- [x] `QuestionsService` — findBySurvey, findOne, create, update, remove, reorder, bulkCreate
- [x] `QuestionsController` — REST 엔드포인트 (surveys/:surveyId/questions)
- [x] `CreateQuestionDto` — class-validator 검증
- [x] `UpdateQuestionDto` — partial DTO

### API 엔드포인트

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| GET | /api/v1/surveys/:surveyId/questions | JWT | 질문 목록 (order ASC) |
| POST | /api/v1/surveys/:surveyId/questions | JWT | 질문 생성 (order 자동 할당) |
| PUT | /api/v1/surveys/:surveyId/questions/:id | JWT | 질문 수정 |
| DELETE | /api/v1/surveys/:surveyId/questions/:id | JWT | 질문 삭제 |
| PATCH | /api/v1/surveys/:surveyId/questions/reorder | JWT | 순서 일괄 변경 (트랜잭션) |
| POST | /api/v1/surveys/:surveyId/questions/bulk | JWT | 질문 일괄 생성 |

### 비즈니스 로직
- DRAFT 상태 검증: 수정/삭제는 DRAFT 상태 설문만 허용
- order 자동 할당: 생성 시 기존 최대 order + 1
- reorder: 트랜잭션으로 일괄 순서 변경

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| Question 타입 종류 | 기본 5가지 vs 10가지 전체 | 10가지 전체 | Phase 2에서 설문 에디터 완성을 목표로 하므로 전체 타입 구현 (Claude 판단) |
| API URL 구조 | `/questions?surveyId=` vs `/surveys/:surveyId/questions` | nested resource | Question은 Survey의 하위 리소스이므로 RESTful 관례에 맞는 nested 구조 채택 (Claude 판단) |
| options/validation 저장 | 별도 테이블 vs JSONB 컬럼 | JSONB 컬럼 | 질문 타입별 구조가 다양하고, 조회 시 JOIN 없이 한 번에 로드 가능 (Claude 판단) |

## 이슈 & 해결
- Docker 포트 충돌 → PostgreSQL 5433, Redis 6380으로 변경 (커밋 `5cbae1f`)

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/entities/question.entity.ts`
- `apps/backend/src/questions/questions.module.ts`
- `apps/backend/src/questions/questions.service.ts`
- `apps/backend/src/questions/questions.controller.ts`
- `apps/backend/src/questions/dto/create-question.dto.ts`
- `apps/backend/src/questions/dto/update-question.dto.ts`

### 수정
- `packages/shared/src/index.ts` — Question 관련 타입 추가
- `apps/backend/src/app.module.ts` — QuestionsModule 임포트
- `apps/backend/src/entities/survey.entity.ts` — questions OneToMany 관계 추가

## Git 커밋
- `1c099fd` feat: shared 패키지에 Question 관련 타입 추가
- `2e88c5a` feat: Question 엔티티 + CRUD API 구현
- `5cbae1f` chore: Docker 포트 충돌 해결 (PostgreSQL 5433, Redis 6380)

## 다음 단계
- [ ] 설문 에디터 프론트엔드 구현 (질문 추가/수정/삭제/순서변경 UI)
- [ ] 질문 타입별 옵션 편집 컴포넌트 (radio/checkbox 선택지, linear_scale 설정 등)
- [ ] 설문 미리보기 기능
