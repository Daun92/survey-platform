# Phase 4 W11: 템플릿 시스템

- **날짜**: 2026-03-15
- **Phase**: 4 (W11)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- Template 엔티티 + CRUD API
- 설문→템플릿 변환, 템플릿→설문 생성
- 템플릿 갤러리 프론트엔드 페이지

## 완료 항목

### Shared: Template 타입
- [x] `TemplateCategory` enum (5종: employee_satisfaction, customer_feedback, event_feedback, education, general)
- [x] `TemplateQuestion` interface (Question에서 id/surveyId 제외한 순수 질문 데이터)
- [x] `TemplateResponse`, `CreateTemplateRequest`, `UseTemplateRequest`

### Backend: Template 엔티티
- [x] `templates` 테이블 — UUID PK, title, description, category(enum), questions(JSONB), usageCount, isSystem, createdById(FK User nullable)

### Backend: Templates 모듈
- [x] `GET /templates` — 목록 (?category= 필터)
- [x] `GET /templates/:id` — 상세
- [x] `POST /templates` — 생성 (surveyId → 설문 질문 복사, 또는 직접 questions 입력)
- [x] `POST /templates/:id/use` — 템플릿으로 설문+질문 일괄 생성, usageCount++
- [x] `DELETE /templates/:id` — 삭제
- [x] SurveysService.create + QuestionsService.bulkCreate 재사용
- [x] AppModule에 TemplatesModule 등록

### Frontend: 템플릿 갤러리 페이지
- [x] `/dashboard/templates` 페이지 (사이드바 네비게이션 이미 존재)
- [x] 카테고리 필터 버튼 그룹 (전체 + 5개 카테고리)
- [x] 템플릿 카드 그리드 (제목, 설명, 카테고리 Badge, 질문 수, 사용 횟수)
- [x] "사용하기" → 프로젝트 선택 Dialog → 설문 생성 → 에디터로 이동
- [x] "설문에서 템플릿 만들기" → 프로젝트→설문 선택 → 제목/카테고리 입력 → 생성
- [x] 삭제 AlertDialog

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 질문 저장 방식 | 별도 TemplateQuestion 테이블 vs JSONB | JSONB | 템플릿은 스냅샷, 질문 독립 수정 불필요 (Claude 판단) |
| 카테고리 UI | 드롭다운 vs 버튼 탭 | 버튼 탭 | 한눈에 카테고리 확인 가능 (Claude 판단) |
| useTemplate 흐름 | 즉시 에디터 이동 vs 미리보기 | 즉시 에디터 이동 | 생성 후 에디터에서 수정 가능 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/entities/template.entity.ts`
- `apps/backend/src/templates/templates.module.ts`
- `apps/backend/src/templates/templates.service.ts`
- `apps/backend/src/templates/templates.controller.ts`
- `apps/backend/src/templates/dto/create-template.dto.ts`
- `apps/backend/src/templates/dto/use-template.dto.ts`
- `apps/frontend/src/app/dashboard/templates/page.tsx`

### 수정
- `packages/shared/src/index.ts` — Template 관련 타입 추가
- `apps/backend/src/app.module.ts` — TemplatesModule 등록

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과

## 다음 단계
- [ ] Phase 4 W12: AI 설문 생성
