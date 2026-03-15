# Phase 4 W12: AI 설문 생성

- **날짜**: 2026-03-15
- **Phase**: 4 (W12)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- AI 기반 설문 자동 생성 API
- Claude API 연동 + API 키 없는 환경 모킹 폴백
- AI 설문 생성 프론트엔드 페이지

## 완료 항목

### Shared: AI 타입
- [x] `AiGenerateRequest` — topic, purpose, targetAudience, questionCount, language
- [x] `AiGenerateResponse` — title, description, questions: TemplateQuestion[]

### Backend: AI 모듈
- [x] `POST /ai/generate-survey` — JWT 보호
- [x] Claude API 연동 (ANTHROPIC_API_KEY 환경변수)
  - claude-haiku-4-5 모델 사용 (비용 최적화)
  - 시스템 프롬프트: JSON 출력 강제, 질문 타입별 옵션 구조 명시
  - 응답 파싱: JSON 추출 + order/validation 보정
- [x] API 키 미설정 시 모킹 폴백
  - 한국어/영어 자동 감지
  - 10종 질문 타입 혼합 (radio, checkbox, dropdown, linear_scale, short_text, long_text, date, ranking)
  - 주제 키워드 반영된 질문 텍스트

### Frontend: AI 설문 생성 페이지
- [x] `/dashboard/ai` 페이지
- [x] 입력 폼: 주제(필수), 목적, 대상, 질문 수(5/8/10/15/20)
- [x] 로딩 스피너 + AI 생성 중 메시지
- [x] 결과 미리보기: 제목/설명 편집, 질문 목록 (타입 Badge, 필수 표시)
- [x] 각 질문 제목 인라인 편집 + 삭제 가능
- [x] "다시 생성" 버튼 → 입력 폼으로 복귀
- [x] "설문으로 저장" → 프로젝트 선택 Dialog → Survey + Questions 일괄 생성 → 에디터 이동

### 사이드바 업데이트
- [x] "AI 설문 생성" 메뉴 추가 (Sparkles 아이콘)

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| AI 모델 | claude-sonnet vs claude-haiku | claude-haiku-4-5 | 비용 효율 + 빠른 응답 (Claude 판단) |
| API 키 없는 환경 | 에러 반환 vs 모킹 | 모킹 폴백 | 개발/데모 환경 지원 (Claude 판단) |
| 질문 편집 범위 | 전체 편집 vs 제목만 | 제목 편집 + 삭제 | 에디터에서 상세 편집 가능하므로 간소화 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/ai/ai.module.ts`
- `apps/backend/src/ai/ai.service.ts`
- `apps/backend/src/ai/ai.controller.ts`
- `apps/backend/src/ai/dto/generate-survey.dto.ts`
- `apps/frontend/src/app/dashboard/ai/page.tsx`

### 수정
- `packages/shared/src/index.ts` — AI 관련 타입 추가
- `apps/backend/src/app.module.ts` — AiModule 등록
- `apps/frontend/src/components/sidebar.tsx` — AI 메뉴 추가

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과

## Phase 4 완료 요약

Phase 4 (W10~W12) 전체 기능 완성:
1. W10: 리포트/통계 (질문별 집계 API + recharts 차트 대시보드)
2. W11: 템플릿 시스템 (엔티티 + CRUD + 갤러리)
3. W12: AI 설문 생성 (Claude API + 모킹 + 생성/편집/저장 UI)

## 다음 단계
- [ ] Phase 5 W13: 대시보드 홈 (통계 위젯, 최근 활동)
- [ ] Phase 5 W14: 프로덕션 배포 준비
