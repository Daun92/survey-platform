# Phase 2 W6: 설문 미리보기, 상태 관리, UX 개선

- **날짜**: 2026-03-15
- **Phase**: 2 (W6)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- 설문 미리보기 기능 (응답자 시점)
- 설문 발행/마감 워크플로우
- 설문 제목/설명 인라인 편집
- 질문 복제 기능

## 완료 항목

### Backend: 설문 발행/마감 API
- [x] `PATCH /surveys/:id/publish` — DRAFT→ACTIVE (질문 1개 이상 검증)
- [x] `PATCH /surveys/:id/close` — ACTIVE→CLOSED (상태 검증)
- [x] SurveysModule에 Question 엔티티 주입

### Backend: 질문 복제 API
- [x] `POST /surveys/:surveyId/questions/:id/duplicate` — 질문 복제
- [x] 복제 시 order 자동 관리 (원본+1, 이후 질문 밀림)
- [x] title에 " (복사)" 접미사 자동 추가

### Frontend: 설문 미리보기
- [x] SurveyPreview Dialog 컴포넌트 (전체 화면 모달)
- [x] 10가지 질문 타입별 응답자 시점 렌더링
  - short_text → Input, long_text → Textarea
  - radio → 라디오 버튼, checkbox → 체크박스
  - dropdown → Select, linear_scale → 숫자 버튼 행
  - date → 날짜 입력, file_upload → 드래그앤드롭 영역
  - matrix → 행×열 그리드, ranking → 순위 목록

### Frontend: 인라인 편집
- [x] 설문 제목 클릭 → Input 전환 → blur/Enter 저장
- [x] 설문 설명 클릭 → Textarea 전환 → blur 저장
- [x] DRAFT 상태에서만 편집 가능

### Frontend: 액션 버튼
- [x] 미리보기 버튼 (Eye 아이콘)
- [x] 발행 버튼 (DRAFT일 때, 확인 AlertDialog)
- [x] 마감 버튼 (ACTIVE일 때, 확인 AlertDialog)
- [x] 질문 복제 버튼 (Copy 아이콘, QuestionCard에 추가)

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 미리보기 방식 | 별도 페이지 vs Dialog | Dialog | 현재 편집 중인 데이터를 그대로 사용, API 재호출 불필요 (Claude 판단) |
| DnD 순서 변경 | 이번 W6에 포함 vs 스킵 | 스킵 | 이미 위/아래 버튼으로 동작하며, DnD는 추가 라이브러리 필요 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/frontend/src/components/survey-editor/survey-preview.tsx`

### 수정
- `apps/backend/src/surveys/surveys.controller.ts` — publish/close 엔드포인트
- `apps/backend/src/surveys/surveys.service.ts` — publish/close 로직
- `apps/backend/src/surveys/surveys.module.ts` — Question 엔티티 주입
- `apps/backend/src/questions/questions.controller.ts` — duplicate 엔드포인트
- `apps/backend/src/questions/questions.service.ts` — duplicate 로직
- `apps/frontend/src/app/dashboard/surveys/[id]/edit/page.tsx` — 인라인 편집, 액션 버튼
- `apps/frontend/src/components/survey-editor/question-card.tsx` — 복제 버튼

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과
- Turbo build (backend + shared): 성공
- Frontend build: Google Fonts DNS 에러 (환경 문제, 코드 무관)

## 다음 단계
- [ ] 드래그앤드롭 순서 변경 (@dnd-kit) — 선택적
- [ ] Phase 3 W7: 대상자 관리, 설문 배포
- [ ] 설문 응답 수집 페이지 (공개 URL)
