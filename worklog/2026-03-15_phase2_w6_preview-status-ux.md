# Phase 2 W6 — 설문 미리보기, 상태 관리, UX 개선

**날짜**: 2026-03-15
**Phase**: 2 | **Week**: 6
**상태**: 완료

## 완료 항목

### 1. 설문 미리보기 페이지
- `/dashboard/surveys/[id]/preview` 라우트 생성
- 10가지 질문 타입별 미리보기 컴포넌트 (`question-preview.tsx`)
  - text, textarea, single_choice, multiple_choice, dropdown
  - linear_scale, rating, date, file_upload, matrix
- 에디터에서 미리보기 링크 연결 (Eye 아이콘)

### 2. 설문 상태 관리
- 설문 상태 변경 드롭다운 (draft → active → closed)
- PATCH API 호출로 상태 변경
- 상태별 배지 색상 표시

### 3. 인라인 편집
- 설문 제목/설명을 클릭하여 인라인 편집
- Enter/Escape 키보드 지원
- PATCH API로 즉시 저장

### 4. 질문 복제
- QuestionCard에 Copy 아이콘 + onDuplicate prop 추가
- 질문 데이터 복사 후 POST API로 새 질문 생성

### 5. 프로젝트 CRUD 페이지
- `/dashboard/projects` 라우트 생성
- 프로젝트 목록/생성/수정/삭제 기능
- 모달 기반 CRUD UI

### 6. 인프라 수정
- PostgreSQL UTF-8 인코딩 설정 (database.module.ts + docker-compose.dev.yml)
- Next.js outputFileTracingRoot 설정 (모노레포 빌드 경고 해결)

## 변경 파일 목록

| 파일 | 변경 | 커밋 |
|------|------|------|
| `apps/backend/src/database/database.module.ts` | 수정 | fix: PostgreSQL UTF-8 인코딩 설정 |
| `docker-compose.dev.yml` | 수정 | fix: PostgreSQL UTF-8 인코딩 설정 |
| `apps/frontend/src/app/dashboard/surveys/[id]/preview/page.tsx` | 신규 | feat: 설문 미리보기, 상태 관리, UX 개선 |
| `apps/frontend/src/components/survey-preview/question-preview.tsx` | 신규 | feat: 설문 미리보기, 상태 관리, UX 개선 |
| `apps/frontend/src/app/dashboard/surveys/[id]/edit/page.tsx` | 수정 | feat: 설문 미리보기, 상태 관리, UX 개선 |
| `apps/frontend/src/components/survey-editor/question-card.tsx` | 수정 | feat: 설문 미리보기, 상태 관리, UX 개선 |
| `apps/frontend/src/app/dashboard/projects/page.tsx` | 신규 | feat: 설문 미리보기, 상태 관리, UX 개선 |
| `apps/frontend/next.config.ts` | 수정 | fix: Next.js outputFileTracingRoot 설정 |

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 빌드 에러 해결 방법 | 1) 캐시 삭제 2) next.config 수정 3) dev모드 확인 | 캐시 삭제 + next.config 수정 | 캐시 삭제로 빌드 성공, outputFileTracingRoot 추가로 경고도 제거 (Claude 판단) |

## 검증 결과
- `npx tsc --noEmit`: 통과
- `npx next build`: 통과 (경고 없음)
- 모든 라우트 정상 생성 확인

## 다음 단계
- Phase 3 W7: 대상자 관리 (설문 배포 대상 선정)
- Phase 3 W8: 설문 배포 시스템
- Phase 3 W9: 응답 수집 UI + API
