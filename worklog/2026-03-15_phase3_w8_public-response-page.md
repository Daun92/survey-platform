# Phase 3 W8: 공개 응답 페이지 + 응답 제출 API

- **날짜**: 2026-03-15
- **Phase**: 3 (W8)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- 응답 제출 API (POST /public/surveys/:token/responses)
- 공개 응답 페이지 (/s/[token]) 프론트엔드
- 10종 질문 타입별 인터랙티브 입력 컴포넌트

## 완료 항목

### Backend: 응답 제출 API
- [x] `SubmitResponseDto` (class-validator + class-transformer)
- [x] `validateDistribution()` private 메서드 추출 (getSurveyByToken과 재사용)
- [x] `submitResponse()` 메서드 — 5단계 검증:
  1. 배포 링크/설문 유효성 검증
  2. IP 중복 응답 체크 (`createQueryBuilder` + JSONB `respondentInfo->>'ipAddress'`)
  3. maxResponses 제한 체크
  4. 필수 질문 미응답 검증
  5. SurveyResponse 엔티티 저장
- [x] `POST /public/surveys/:token/responses` 엔드포인트 (x-forwarded-for IP 추출)

### Frontend: 공개 API 유틸리티
- [x] `public-api.ts` — `api.ts`와 동일 패턴, JWT 토큰 주입 제거

### Frontend: 공개 응답 페이지
- [x] `/s/[token]/layout.tsx` — 미니멀 레이아웃 (사이드바/헤더 없음, 중앙 정렬)
- [x] `/s/[token]/page.tsx` — 상태 머신 기반 응답 흐름:
  - loading → error | ready (인트로) → answering (한 질문씩) → submitting → submitted
  - 클라이언트 사이드 필수 질문 검증
  - ranking 타입 초기값 자동 설정

### Frontend: 응답 컴포넌트
- [x] `progress-bar.tsx` — 진행률 바 (current/total + % 바)
- [x] `question-input.tsx` — 10종 질문 타입 인터랙티브 입력:
  - short_text/long_text → controlled Input/Textarea
  - radio/checkbox → 클릭 가능한 선택지
  - dropdown → 선택 드롭다운
  - linear_scale → 하이라이트 숫자 버튼
  - date → date input
  - matrix → 라디오 그리드 (단일 선택)
  - ranking → 위/아래 버튼 순서 변경
  - file_upload → "추후 지원" 플레이스홀더

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| IP 중복 쿼리 방식 | TypeORM findOne vs createQueryBuilder | createQueryBuilder | JSONB nested 쿼리 안정성 (Claude 판단) |
| 응답 페이지 UX | 전체 질문 vs 한 질문씩 | 한 질문씩 | 계획된 UX 방식 유지 |
| Matrix allowMultiple | 지원 vs 스킵 | 단일 선택만 (스킵) | shared 타입 Record<string,string>과 일치 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/public/dto/submit-response.dto.ts`
- `apps/frontend/src/lib/public-api.ts`
- `apps/frontend/src/components/response/progress-bar.tsx`
- `apps/frontend/src/components/response/question-input.tsx`
- `apps/frontend/src/app/s/[token]/layout.tsx`
- `apps/frontend/src/app/s/[token]/page.tsx`

### 수정
- `apps/backend/src/public/public.service.ts` — validateDistribution 추출 + submitResponse 추가
- `apps/backend/src/public/public.controller.ts` — POST 엔드포인트 추가

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과

## 다음 단계
- [ ] Phase 3 W9: Responses 관리 모듈 (JWT 보호 CRUD)
- [ ] Phase 3 W9: 배포 관리 페이지 (/dashboard/surveys/[id]/distribute)
- [ ] Phase 3 W9: 응답 목록/상세 페이지 (/dashboard/surveys/[id]/responses)
- [ ] Phase 3 W9: 설문 에디터에 배포/응답 네비게이션 추가
