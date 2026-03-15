# Phase 5 W13-W14: 대시보드 홈 + 프로덕션 배포

- **날짜**: 2026-03-15
- **Phase**: 5 (W13-W14)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- 대시보드 홈 화면 완성 (통계 위젯, 최근 활동, 빠른 액션)
- 프로덕션 배포 인프라 (Dockerfiles)

## W13 완료 항목

### Shared: Dashboard 타입
- [x] `DashboardStats` — totalProjects, totalSurveys, activeSurveys, totalResponses, totalTemplates
- [x] `RecentActivity` — id, type(4종), title, description, createdAt

### Backend: Dashboard 모듈
- [x] `GET /dashboard/stats` — 5개 통계 수치 (Promise.all로 병렬 쿼리)
- [x] `GET /dashboard/recent` — 최근 설문 5건 + 응답 5건 + 템플릿 3건 → 시간순 정렬 상위 10건
- [x] AppModule에 DashboardModule 등록

### Frontend: 대시보드 홈 리뉴얼
- [x] 5개 통계 카드 (아이콘 + 링크 연결)
- [x] 빠른 액션 3종 (새 설문, AI 설문 생성, 템플릿 찾기)
- [x] 최근 활동 목록 (타입별 아이콘/색상, timeAgo 표시)
- [x] 최근 프로젝트 목록 (2컬럼 레이아웃)

## W14 완료 항목

### Dockerfiles
- [x] `apps/backend/Dockerfile` — 멀티스테이지 (deps → builder → runner)
- [x] `apps/frontend/Dockerfile` — Next.js standalone 빌드
- [x] `.dockerignore` — node_modules, .next, dist, .git 등 제외
- [x] Next.js `output: 'standalone'` 이미 설정됨 (변경 불필요)

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 대시보드 레이아웃 | 단순 카드 vs 2컬럼 | 2컬럼 (활동+프로젝트) | 정보 밀도 향상 (Claude 판단) |
| Docker 베이스 이미지 | node:20 vs node:20-alpine | alpine | 이미지 크기 최소화 (Claude 판단) |
| 통계 쿼리 | 순차 vs 병렬 | Promise.all 병렬 | 응답 속도 최적화 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/dashboard/dashboard.module.ts`
- `apps/backend/src/dashboard/dashboard.service.ts`
- `apps/backend/src/dashboard/dashboard.controller.ts`
- `apps/backend/Dockerfile`
- `apps/frontend/Dockerfile`
- `.dockerignore`

### 수정
- `packages/shared/src/index.ts` — Dashboard 타입 추가
- `apps/backend/src/app.module.ts` — DashboardModule 등록
- `apps/frontend/src/app/dashboard/page.tsx` — 전면 리뉴얼

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과

## Phase 5 완료 — 전체 프로젝트 완료 요약

### 전체 Phase 타임라인
| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 0 | 프로젝트 초기화 | 완료 |
| Phase 1 (W1-W3) | 모노레포, Auth, CRUD, RBAC | 완료 |
| Phase 2 (W4-W6) | 질문 CRUD, 설문 에디터, 미리보기 | 완료 |
| Phase 3 (W7-W9) | 배포, 응답 수집, 응답 관리 | 완료 |
| Phase 4 (W10-W12) | 리포트, 템플릿, AI 설문 생성 | 완료 |
| Phase 5 (W13-W14) | 대시보드 홈, 프로덕션 배포 | 완료 |
