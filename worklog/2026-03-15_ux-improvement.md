# UX 개선 (feature/improve-ux)

## 작업 일시
2026-03-15

## 브랜치
`feature/improve-ux` (base: `feature/phase2-editor`)

## 작업 목표
기존 화면들의 UX를 전반적으로 개선. alert() 에러 → toast 알림, 텍스트 로딩 → 스켈레톤, DnD 미지원 → dnd-kit 적용 등.

## 완료 항목

### Step 1: Toast 인프라
- `sonner` 패키지 설치
- `components/ui/sonner.tsx` 생성, `layout.tsx`에 `<Toaster />` 추가
- **19개 alert() → toast.error()** 전환 (4개 파일)
  - `projects/page.tsx` (3곳) — 생성/수정/삭제 실패
  - `surveys/page.tsx` (1곳) — 생성 실패
  - `surveys/[id]/edit/page.tsx` (8곳) — 제목/설명/상태/질문 CRUD
  - `target-manager.tsx` (7곳) — 대상자 관련
- 성공 시 `toast.success()` 피드백 추가

### Step 2: 스켈레톤 로딩 UI
- `components/ui/skeleton.tsx` 생성
- 6곳 "로딩 중..." 텍스트 → Skeleton 컴포넌트로 교체
  - `dashboard/page.tsx` — 카드+리스트 스켈레톤
  - `projects/page.tsx` — 그리드 카드 스켈레톤
  - `surveys/page.tsx` — 설문 카드 리스트 스켈레톤
  - `surveys/[id]/edit/page.tsx` — 편집기 레이아웃 스켈레톤
  - `surveys/[id]/preview/page.tsx` — 미리보기 스켈레톤
  - `target-manager.tsx` — 대상자 리스트 스켈레톤

### Step 3: Sidebar 네비게이션 개선
- `pathname.startsWith(item.href)` 로직 추가
- `/dashboard/surveys/123/edit` 등 하위 경로에서 상위 메뉴 활성화

### Step 4: 질문 DnD 재정렬
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` 설치
- `QuestionCard`에 `useSortable` 훅 적용, GripVertical을 실제 drag handle로 전환
- `edit/page.tsx`에 `DndContext` + `SortableContext` 래핑
- `handleDragEnd`에서 `arrayMove` + reorder API 호출
- 기존 위/아래 버튼은 접근성 대체 수단으로 유지
- `components/ui/tooltip.tsx` 생성, QuestionCard 아이콘 버튼에 Tooltip 적용

### Step 5: 랜딩 페이지 개선
- 기본 템플릿 → Card + Button 기반 심플 랜딩 페이지
- 로그인 CTA 버튼 추가

### Step 6: 반응형 사이드바
- `components/ui/sheet.tsx` 생성
- `Sidebar` → `SidebarNav` (공유 네비게이션) + `Sidebar` (데스크톱) 분리
- `dashboard/layout.tsx`에 모바일 Sheet 사이드바 + hamburger 메뉴 추가
- `md` breakpoint 이하에서 사이드바 숨김 → Sheet으로 표시
- `Header` 컴포넌트 리팩토링 (자체 `<header>` 태그 제거, layout에서 통합 관리)

## 추가된 의존성

| 패키지 | 용도 |
|--------|------|
| `sonner` | Toast 알림 |
| `@dnd-kit/core` | DnD 기반 |
| `@dnd-kit/sortable` | 정렬 가능 리스트 |
| `@dnd-kit/utilities` | CSS 유틸 |

## 추가된 shadcn/ui 컴포넌트

| 컴포넌트 | 용도 |
|----------|------|
| `sonner.tsx` | Toast 프로바이더 |
| `skeleton.tsx` | 로딩 스켈레톤 |
| `tooltip.tsx` | 아이콘 접근성 |
| `sheet.tsx` | 모바일 사이드바 |

## 변경 파일 목록 (프론트엔드)
- `apps/frontend/package.json` — 의존성 추가
- `apps/frontend/src/app/layout.tsx` — Toaster 추가
- `apps/frontend/src/app/page.tsx` — 랜딩 페이지 리뉴얼
- `apps/frontend/src/app/dashboard/layout.tsx` — 반응형 사이드바
- `apps/frontend/src/app/dashboard/page.tsx` — 스켈레톤
- `apps/frontend/src/app/dashboard/projects/page.tsx` — toast + 스켈레톤
- `apps/frontend/src/app/dashboard/surveys/page.tsx` — toast + 스켈레톤
- `apps/frontend/src/app/dashboard/surveys/[id]/edit/page.tsx` — toast + 스켈레톤 + DnD
- `apps/frontend/src/app/dashboard/surveys/[id]/preview/page.tsx` — 스켈레톤
- `apps/frontend/src/components/header.tsx` — 리팩토링
- `apps/frontend/src/components/sidebar.tsx` — SidebarNav 분리 + active 로직
- `apps/frontend/src/components/survey-editor/question-card.tsx` — DnD + Tooltip
- `apps/frontend/src/components/survey-editor/target-manager.tsx` — toast + 스켈레톤
- `apps/frontend/src/components/ui/sonner.tsx` — 신규
- `apps/frontend/src/components/ui/skeleton.tsx` — 신규
- `apps/frontend/src/components/ui/tooltip.tsx` — 신규
- `apps/frontend/src/components/ui/sheet.tsx` — 신규

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| Toast 라이브러리 | sonner vs react-hot-toast | sonner | 계획서에서 sonner 지정, shadcn/ui 공식 지원 |
| DnD 라이브러리 | @dnd-kit vs react-beautiful-dnd | @dnd-kit | 계획서에서 지정, React 19 공식 지원, rbd deprecated |
| restrictToVerticalAxis | 설치(@dnd-kit/modifiers) vs 미사용 | 미사용 | 추가 의존성 없이도 DnD 동작 충분, Claude 판단 |
| Header 리팩토링 | 기존 header 태그 유지 vs 제거 | 제거 | layout에서 통합 관리하여 모바일 hamburger 배치, Claude 판단 |

## 검증 결과
- `pnpm type-check` ✅ 통과
- `pnpm lint` — ESLint 미설정 상태 (기존과 동일)

## 다음 단계
- `feature/phase2-editor`에 merge 후 Phase 2 W7~W10 계속 진행
