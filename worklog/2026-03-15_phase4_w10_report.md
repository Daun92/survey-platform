# Phase 4 W10: 리포트/통계 모듈

- **날짜**: 2026-03-15
- **Phase**: 4 (W10)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- 응답 데이터 질문별 집계 API
- recharts 기반 차트 대시보드
- 에디터에 리포트 네비게이션 추가

## 완료 항목

### Shared: Report 타입
- [x] `ChartType` enum (BAR, PIE, LINE, HEATMAP, STACKED_BAR)
- [x] `ChoiceAggregation`, `TextAggregation`, `NumericAggregation`, `MatrixAggregation`, `RankingAggregation`
- [x] `AggregationData` union type
- [x] `QuestionAggregation`, `SurveyReportResponse` 인터페이스

### Backend: Report 모듈
- [x] `GET /surveys/:id/report` — 전체 리포트 (질문별 집계)
- [x] `GET /surveys/:id/report/questions/:questionId` — 단일 질문 상세
- [x] 질문 타입별 집계 로직:
  - radio/checkbox/dropdown → ChoiceAggregation (선택지별 count/percentage)
  - short_text/long_text/date → TextAggregation (최근 20건 + totalCount)
  - linear_scale → NumericAggregation (average, median, min, max, distribution)
  - matrix → MatrixAggregation (행×열 카운트)
  - ranking → RankingAggregation (평균 순위, 분포)
  - file_upload → 스킵
- [x] COMPLETED 응답만 집계 대상
- [x] AppModule에 ReportModule 등록

### Frontend: 차트 컴포넌트 (recharts)
- [x] `bar-chart.tsx` — 수평 바 차트 (ChoiceAggregation용)
- [x] `pie-chart.tsx` — 도넛 차트 (ChoiceAggregation용)
- [x] `numeric-summary.tsx` — 평균/중간값/분포 (NumericAggregation용)
- [x] `text-responses.tsx` — 텍스트 응답 목록 (TextAggregation용)
- [x] `matrix-table.tsx` — 행×열 테이블 (MatrixAggregation용)
- [x] `ranking-chart.tsx` — 평균 순위 막대 차트 (RankingAggregation용)
- [x] `question-report-card.tsx` — 타입별 차트 분기 + 바/파이 전환 토글

### Frontend: 리포트 대시보드 페이지
- [x] `/dashboard/surveys/[id]/report` 페이지
- [x] 설문 제목 + 총 응답 수 헤더
- [x] 질문별 QuestionReportCard 목록
- [x] 에디터 페이지에 "리포트" 버튼 추가 (PieChart 아이콘, ACTIVE/CLOSED)

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| Phase 4 구현 범위 | W10~W12 전체 vs W10만 먼저 | W10만 먼저 | 점진적 구현 (사용자 선택) |
| 차트 라이브러리 | recharts vs chart.js | recharts | React 친화적, 경량 (Claude 판단) |
| Choice 차트 기본 모드 | 바 차트 vs 파이 차트 | 바 차트 (파이 전환 가능) | 데이터 비교 용이 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/report/report.module.ts`
- `apps/backend/src/report/report.controller.ts`
- `apps/backend/src/report/report.service.ts`
- `apps/frontend/src/app/dashboard/surveys/[id]/report/page.tsx`
- `apps/frontend/src/components/report/bar-chart.tsx`
- `apps/frontend/src/components/report/pie-chart.tsx`
- `apps/frontend/src/components/report/numeric-summary.tsx`
- `apps/frontend/src/components/report/text-responses.tsx`
- `apps/frontend/src/components/report/matrix-table.tsx`
- `apps/frontend/src/components/report/ranking-chart.tsx`
- `apps/frontend/src/components/report/question-report-card.tsx`

### 수정
- `packages/shared/src/index.ts` — Report 관련 타입 추가
- `apps/backend/src/app.module.ts` — ReportModule 등록
- `apps/frontend/package.json` — recharts 의존성 추가
- `apps/frontend/src/app/dashboard/surveys/[id]/edit/page.tsx` — 리포트 버튼 추가

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과

## 다음 단계
- [ ] Phase 4 W11: 템플릿 시스템 (엔티티 + CRUD + 갤러리)
- [ ] Phase 4 W12: AI 설문 생성
