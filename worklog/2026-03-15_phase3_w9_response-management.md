# Phase 3 W9: 응답 관리 모듈, 배포/응답 관리 페이지

- **날짜**: 2026-03-15
- **Phase**: 3 (W9)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- Responses 관리 모듈 (JWT 보호 CRUD)
- 배포 관리 페이지 (배포 링크 생성/복사/토글)
- 응답 목록/상세 페이지 (테이블 뷰, 페이지네이션)
- 설문 에디터에 배포/응답 네비게이션 추가

## 완료 항목

### Backend: Responses 모듈
- [x] `GET /surveys/:surveyId/responses` — 페이지네이션 응답 목록
- [x] `GET /surveys/:surveyId/responses/count` — 응답 수
- [x] `GET /responses/:id` — 개별 응답 상세
- [x] `DELETE /responses/:id` — 응답 삭제
- [x] AppModule에 ResponsesModule 등록

### Frontend: 배포 관리 페이지
- [x] `/dashboard/surveys/[id]/distribute` 페이지
- [x] 배포 링크 목록 (활성 상태 Badge, URL 표시)
- [x] "링크 생성" Dialog (중복 허용, 최대 응답, 환영/완료 메시지 설정)
- [x] URL 복사 (navigator.clipboard + 복사 완료 피드백)
- [x] 활성/비활성 토글 (Switch 컴포넌트)

### Frontend: 응답 관리 페이지
- [x] `/dashboard/surveys/[id]/responses` 페이지
- [x] 응답 테이블 (번호, 제출 시간, IP 마스킹, 상태, 액션)
- [x] 응답 상세 Dialog (질문-답변 나란히 표시, 타입별 포맷팅)
- [x] 응답 삭제 (AlertDialog 확인)
- [x] 페이지네이션 (이전/다음)

### Frontend: 네비게이션 업데이트
- [x] 설문 에디터 헤더에 "배포" 버튼 추가 (Share2 아이콘)
- [x] 설문 에디터 헤더에 "응답" 버튼 추가 (BarChart3 아이콘)
- [x] ACTIVE/CLOSED 상태에서만 표시

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 응답 상세 보기 방식 | 별도 페이지 vs Dialog | Dialog | 목록에서 빠르게 확인 가능 (Claude 판단) |
| IP 표시 방식 | 전체 vs 마스킹 | 앞 2옥텟만 표시 | 개인정보 보호 (Claude 판단) |
| Delete 동작 | soft delete vs hard delete | hard delete | 응답 데이터 완전 삭제 필요 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/responses/responses.module.ts`
- `apps/backend/src/responses/responses.controller.ts`
- `apps/backend/src/responses/responses.service.ts`
- `apps/frontend/src/app/dashboard/surveys/[id]/distribute/page.tsx`
- `apps/frontend/src/app/dashboard/surveys/[id]/responses/page.tsx`

### 수정
- `apps/backend/src/app.module.ts` — ResponsesModule 등록
- `apps/frontend/src/app/dashboard/surveys/[id]/edit/page.tsx` — 배포/응답 네비게이션 버튼

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과

## Phase 3 완료 요약

Phase 3 (W7~W9) 전체 흐름 완성:
1. 설문 생성 → 질문 추가 → 발행 (Phase 2)
2. 배포 링크 생성 (W7) → 공개 URL 배포
3. 응답자가 `/s/:token`에서 설문 응답 (W8)
4. 관리자가 배포/응답 관리 (W9)

## 다음 단계
- [ ] Phase 4 W10: 응답 통계/리포트
- [ ] Phase 4 W11: 설문 템플릿
- [ ] Phase 4 W12: AI 설문 생성
