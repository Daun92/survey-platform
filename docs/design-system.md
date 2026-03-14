# Survey Platform - 디자인 시스템

> 사내 설문조사 플랫폼의 UI/UX 컨셉 및 디자인 토큰 정의서
> 기술 스택: Next.js 15 + Tailwind CSS + shadcn/ui
> 최종 업데이트: 2026-03-14

---

## 1. 컬러 시스템 — 뉴트럴 + 오렌지 포인트

미니멀한 뉴트럴 톤에 오렌지 포인트로 활력을 더하는 전문적인 디자인입니다.
shadcn/ui의 CSS 변수(HSL) 기반 테마 시스템을 활용합니다.

### 1.1 Light Mode (:root)

```css
:root {
  --background: 0 0% 100%;             /* #ffffff — 화이트 */
  --foreground: 224 71% 4%;            /* #030712 — 거의 블랙 */

  --card: 0 0% 100%;
  --card-foreground: 224 71% 4%;

  --popover: 0 0% 100%;
  --popover-foreground: 224 71% 4%;

  --primary: 220 14% 25%;              /* #374151 — 차콜 (주요 텍스트, 사이드바) */
  --primary-foreground: 0 0% 98%;      /* #fafafa */

  --secondary: 220 14% 96%;            /* #f3f4f6 — 웜그레이 (배경, 구분선) */
  --secondary-foreground: 220 14% 25%;

  --accent: 24 95% 53%;                /* #f97316 — 오렌지 포인트 (CTA, 강조, FAB) */
  --accent-foreground: 0 0% 100%;

  --muted: 220 14% 96%;
  --muted-foreground: 220 8% 46%;      /* #6b7280 — 보조 텍스트 */

  --destructive: 0 84% 60%;            /* #ef4444 — 삭제/오류 */
  --destructive-foreground: 0 0% 98%;

  --border: 220 13% 91%;               /* #e5e7eb */
  --input: 220 13% 91%;
  --ring: 24 95% 53%;                  /* 오렌지 포커스 링 */

  --radius: 0.5rem;                    /* 8px — 기본 border-radius */
}
```

### 1.2 Dark Mode (.dark)

```css
.dark {
  --background: 224 71% 4%;            /* #030712 — 딥 다크 */
  --foreground: 210 20% 98%;           /* #f9fafb */

  --card: 224 50% 8%;                  /* #0f172a */
  --card-foreground: 210 20% 98%;

  --popover: 224 50% 8%;
  --popover-foreground: 210 20% 98%;

  --primary: 210 20% 98%;
  --primary-foreground: 224 71% 4%;

  --secondary: 215 20% 15%;            /* #1e293b */
  --secondary-foreground: 210 20% 98%;

  --accent: 24 95% 53%;                /* 오렌지 유지 — 다크에서도 동일한 브랜드 컬러 */
  --accent-foreground: 0 0% 100%;

  --muted: 215 20% 15%;
  --muted-foreground: 215 15% 55%;     /* #94a3b8 */

  --destructive: 0 62% 30%;
  --destructive-foreground: 0 0% 98%;

  --border: 215 20% 18%;               /* #334155 */
  --input: 215 20% 18%;
  --ring: 24 95% 53%;
}
```

### 1.3 Semantic Colors

| 용도 | CSS 변수 | 라이트 모드 | 다크 모드 | 사용 예 |
|------|---------|-----------|---------|--------|
| 성공 | `--success` | `142 76% 36%` (#22c55e) | `142 76% 36%` | 설문 발송 완료, 저장 성공 |
| 경고 | `--warning` | `38 92% 50%` (#f59e0b) | `38 92% 50%` | 마감 임박, 미완료 항목 |
| 오류 | `--error` | `0 84% 60%` (#ef4444) | `0 62% 30%` | 유효성 오류, 삭제 확인 |
| 정보 | `--info` | `217 91% 60%` (#3b82f6) | `217 91% 60%` | 안내 메시지, 도움말 |

### 1.4 다크 모드 구현

- `next-themes` 패키지로 테마 전환 관리
- shadcn/ui의 `ThemeProvider` 래핑
- 사이드바 하단에 테마 토글 버튼 배치
- CSS 변수 기반이므로 컴포넌트 코드 변경 없이 테마 전환
- `localStorage`에 사용자 선호 저장, 시스템 설정 연동

---

## 2. 타이포그래피

### 2.1 폰트 패밀리

| 용도 | 폰트 | 비고 |
|------|------|------|
| 한국어 본문 | **Pretendard** | 웹폰트, 가독성 우수, 무료, Variable Font |
| 영문/숫자 | **Inter** | shadcn/ui 기본, Google Fonts |
| 코드/데이터 | **JetBrains Mono** | 숫자 구분 용이, 리포트 데이터 표시 |

```ts
// tailwind.config.ts
fontFamily: {
  sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### 2.2 타입 스케일

Tailwind 기본 스케일을 활용하되, 용도를 명확히 정의합니다.

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `text-xs` | 12px | 캡션, 타임스탬프, 보조 텍스트 |
| `text-sm` | 14px | 테이블 셀, 폼 라벨, 사이드바 메뉴 |
| `text-base` | 16px | 본문, 설문 질문 텍스트 |
| `text-lg` | 18px | 섹션 제목, 카드 타이틀 |
| `text-xl` | 20px | 페이지 서브타이틀 |
| `text-2xl` | 24px | 페이지 타이틀 |
| `text-3xl` | 30px | 대시보드 주요 숫자 (KPI) |

### 2.3 폰트 웨이트

| 웨이트 | 용도 |
|--------|------|
| `font-normal` (400) | 본문, 설명 텍스트 |
| `font-medium` (500) | 라벨, 메뉴 항목 |
| `font-semibold` (600) | 제목, 강조 텍스트 |
| `font-bold` (700) | 대시보드 숫자, 페이지 타이틀 |

---

## 3. 레이아웃 & 네비게이션

### 3.1 전체 구조: 풀 사이드바 + 헤더 + FAB

```
┌──────────────────────────────────────────────────┐
│  Header (64px)                                   │
│  [로고]     [검색바]     [알림] [테마] [프로필]    │
├─────────┬────────────────────────────────────────┤
│         │                                        │
│  Sidebar│         Main Content Area              │
│  (240px)│         (max-width: 1280px)            │
│         │                                        │
│ 📊 대시보드 │                                     │
│ 📝 설문관리 │                                [FAB]│
│ 📋 템플릿   │                                     │
│ 📮 응답수집 │                                     │
│ 📈 리포트   │                                     │
│ ─────── │                                        │
│ ⚙️ 설정    │                                     │
│ 🌙/☀️     │                                      │
└─────────┴────────────────────────────────────────┘
```

#### 사이드바 사양
- **너비**: 240px (펼침) / 64px (접힘, 아이콘만)
- **배경**: `--primary` (차콜) — 라이트/다크 모두에서 구분감
- **접기**: 토글 버튼 또는 `Ctrl+B` 단축키
- **하단**: 테마 토글, 설정 메뉴

#### 헤더 사양
- **높이**: 64px 고정
- **구성**: 로고 / 글로벌 검색 / 알림 / 테마 토글 / 프로필 드롭다운
- **배경**: `--background` + 하단 `--border` 구분선

#### FAB (Floating Action Button)
- **위치**: 우측 하단 (`bottom-6 right-6`)
- **색상**: `--accent` (오렌지 포인트)
- **크기**: 56px 원형
- **동작**: 클릭 시 확장 메뉴
  - 설문 목록: "새 설문 만들기" / "AI로 생성" / "템플릿에서 선택"
  - 대시보드: "빠른 설문 생성"
- **애니메이션**: Framer Motion으로 확장/축소

### 3.2 반응형 전략

| 브레이크포인트 | 범위 | 동작 |
|-------------|------|------|
| Desktop | 1280px+ | 풀 레이아웃 (사이드바 + 헤더 + 콘텐츠) |
| Laptop | 1024px~1279px | 사이드바 접힘 모드 (64px) |
| Tablet | 768px~1023px | 사이드바 오버레이 (햄버거 메뉴) |
| Mobile | ~767px | 설문 응답 페이지만 최적화 (관리 기능은 미지원) |

> Desktop-first 접근: 사내 도구이므로 데스크톱 경험을 최우선합니다.
> 설문 응답 페이지(`/respond/[token]`)만 모바일 반응형으로 별도 설계합니다.

### 3.3 주요 페이지 레이아웃

| 페이지 | 레이아웃 패턴 | 비고 |
|--------|-------------|------|
| 대시보드 | 카드 그리드 (2~4열) + 차트 영역 | 최근 설문, KPI 카드, 트렌드 차트 |
| 설문 목록 | 필터바 + 테이블/카드 토글 뷰 | 상태별 필터, 정렬, 검색 |
| 설문 에디터 | 3열 (질문 목록 \| 에디터 \| 미리보기) | 드래그앤드롭, 실시간 미리보기 |
| 설문 응답 | 단일 컬럼, 스텝 위저드 | 모바일 대응, 진행률 표시 |
| 템플릿 갤러리 | 카드 그리드 (3열) | 미리보기 모달, 포크 기능 |
| AI 생성 | 2열 (좌: 채팅 \| 우: 미리보기) | 스트리밍 응답, 실시간 생성 |
| 리포트 | 탭 네비게이션 + 차트/테이블 | 개요/질문별/교차분석 탭 |
| 로그인 | 중앙 카드, 배경 그라데이션 | 브랜드 오렌지 포인트 |

---

## 4. 컴포넌트 디자인 방향

### 4.1 shadcn/ui 커스터마이징 원칙

1. shadcn/ui 기본 컴포넌트를 **최대한 활용** (자체 구현 최소화)
2. 컬러/폰트는 CSS 변수로 오버라이드 (컴포넌트 코드 수정 X)
3. 프로젝트 전용 컴포넌트는 별도 디렉토리에 분리

### 4.2 컴포넌트 디렉토리 구조

```
components/
├── ui/           # shadcn/ui 원본 (npx shadcn-ui add로 추가)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── table.tsx
│   └── ...
├── layout/        # 레이아웃
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── fab.tsx
│   └── theme-toggle.tsx
├── survey/        # 설문 전용
│   ├── survey-card.tsx
│   ├── question-editor.tsx
│   ├── question-renderer.tsx
│   └── question-types/
│       ├── single-choice.tsx
│       ├── multiple-choice.tsx
│       ├── text-input.tsx
│       ├── rating.tsx
│       ├── scale.tsx
│       ├── date-picker.tsx
│       ├── file-upload.tsx
│       ├── matrix.tsx
│       ├── ranking.tsx
│       └── nps.tsx
└── common/        # 프로젝트 공통
    ├── stat-card.tsx
    ├── chart-panel.tsx
    ├── status-badge.tsx
    ├── empty-state.tsx
    ├── loading-skeleton.tsx
    └── ai-chat-panel.tsx
```

### 4.3 핵심 커스텀 컴포넌트

| 컴포넌트 | 용도 | 기반 라이브러리 |
|---------|------|--------------|
| `Sidebar` | 메인 네비게이션 | shadcn/ui Sheet + 커스텀 |
| `FAB` | 플로팅 액션 버튼 | 커스텀 + Framer Motion |
| `SurveyCard` | 설문 목록 카드 | shadcn Card |
| `QuestionEditor` | 질문 편집기 (D&D) | dnd-kit + 커스텀 |
| `QuestionRenderer` | 질문 렌더링 (응답용) | 질문 타입별 커스텀 |
| `StatCard` | 대시보드 KPI 카드 | shadcn Card |
| `ChartPanel` | 차트 컨테이너 | Recharts |
| `AiChatPanel` | AI 채팅 인터페이스 | 커스텀 (WebSocket) |
| `StatusBadge` | 상태 배지 | shadcn Badge (variant 확장) |
| `ThemeToggle` | 라이트/다크 전환 | next-themes + 커스텀 |
| `EmptyState` | 빈 상태 일러스트 | 커스텀 |

### 4.4 추가 라이브러리

| 라이브러리 | 용도 |
|-----------|------|
| `recharts` | 차트 (막대, 원형, 선형 등) |
| `@dnd-kit/core` | 드래그앤드롭 (설문 에디터) |
| `framer-motion` | 애니메이션 (페이지 전환, FAB, 모달) |
| `next-themes` | 다크 모드 관리 |
| `lucide-react` | 아이콘 (shadcn/ui 기본) |
| `date-fns` | 날짜 포맷팅 (한국어 로케일) |

---

## 5. UX 원칙

### 5.1 핵심 원칙

1. **빠른 작업 완료** — 설문 생성 5분 이내 가능하도록 (FAB → 템플릿 선택 → 수정 → 발송)
2. **명확한 상태 표시** — 설문 상태를 색상+아이콘으로 즉시 인지
   - 초안: `--muted` (회색) + 연필 아이콘
   - 진행중: `--success` (녹색) + 재생 아이콘
   - 마감: `--accent` (오렌지) + 체크 아이콘
   - 종료: `--muted` (회색) + 아카이브 아이콘
3. **점진적 공개** — 기본 설정으로 즉시 사용 가능, 고급 옵션은 "더 보기"로 숨김
4. **실수 방지** — 삭제/발송 전 확인 다이얼로그, 5초 Undo 토스트

### 5.2 인터랙션 패턴

| 패턴 | 적용 위치 | 설명 |
|------|---------|------|
| 토스트 알림 | 저장, 복사, 삭제 | 하단 우측, 5초 자동 닫힘 + Undo |
| 확인 다이얼로그 | 설문 발송, 삭제 | 파괴적 작업 전 확인 |
| 인라인 편집 | 설문 제목, 질문 텍스트 | 클릭하면 바로 편집 모드 |
| 드래그앤드롭 | 질문 순서 변경 | 핸들 표시, 그림자 효과 |
| 스켈레톤 로딩 | 데이터 로딩 시 | shadcn Skeleton 활용 |
| 빈 상태 | 첫 사용, 데이터 없음 | 일러스트 + CTA 버튼 |

### 5.3 접근성 (a11y)

- shadcn/ui의 **Radix UI** 기반 접근성 자동 적용 (ARIA, 키보드, 포커스 관리)
- 키보드 네비게이션 완전 지원
- 색상 대비 **WCAG AA** 기준 충족 (4.5:1 이상)
- 포커스 링: `--ring` (오렌지) — 키보드 사용자에게 명확한 시각적 피드백
- 터치 타겟: 모바일 응답 페이지에서 44px x 44px 이상
- 스크린 리더: 시맨틱 HTML + aria-live 영역

### 5.4 애니메이션

- **Framer Motion** 사용
- 페이지 전환: `fadeIn` (150ms)
- 모달/시트: `slideUp` (200ms)
- FAB 확장: `scale + fadeIn` (200ms)
- 드래그앤드롭: 실시간 그림자 + 위치 이동 (spring 물리)
- **원칙**: 업무 도구이므로 속도 우선, 과도한 애니메이션 지양 (150~300ms)

```css
/* 애니메이션 토큰 */
--duration-fast: 150ms;    /* 호버, 포커스 */
--duration-normal: 200ms;  /* 모달, 토스트 */
--duration-slow: 300ms;    /* 페이지 전환 */
--easing: cubic-bezier(0.4, 0, 0.2, 1); /* ease-out */
```

---

## 6. 간격 & 그림자 토큰

### 6.1 간격 체계

4px 단위 그리드를 기본으로 사용합니다.

| Tailwind 클래스 | 값 | 용도 |
|----------------|-----|------|
| `p-1` / `gap-1` | 4px | 아이콘-텍스트 간격 |
| `p-2` / `gap-2` | 8px | 버튼 내부, 배지 내부 |
| `p-3` / `gap-3` | 12px | 인풋 내부 패딩 |
| `p-4` / `gap-4` | 16px | 카드 간 간격 |
| `p-5` / `gap-5` | 20px | 섹션 내부 |
| `p-6` / `gap-6` | 24px | 카드 내부, 페이지 패딩 |
| `space-y-8` | 32px | 섹션 간 간격 |
| `p-10` | 40px | 대형 카드 내부 |
| `p-12` | 48px | 히어로 섹션 |
| `p-16` | 64px | 페이지 최대 여백 |

### 6.2 그림자

```css
/* Calm Design: 미묘한 그림자 + 1px 보더 조합 */
--shadow-card: 0 1px 3px rgba(0,0,0,0.04);
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.08);
--shadow-dropdown: 0 4px 16px rgba(0,0,0,0.12);
--shadow-dialog: 0 16px 48px rgba(0,0,0,0.16);
```

### 6.3 보더 반경

```css
--radius-sm: 6px;      /* 배지, 작은 버튼 */
--radius-md: 8px;      /* 입력, 카드 (기본값 --radius) */
--radius-lg: 12px;     /* 모달, 시트 */
--radius-xl: 16px;     /* 큰 카드 */
--radius-full: 9999px; /* 아바타, FAB */
```

---

## 7. 파일 구조

### 7.1 프론트엔드 디렉토리

```
apps/frontend/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # 루트 레이아웃 (ThemeProvider)
│   │   ├── (auth)/                  # 인증 페이지 그룹 (별도 레이아웃)
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/             # 메인 레이아웃 그룹 (사이드바+헤더)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # 대시보드
│   │   │   ├── surveys/
│   │   │   │   ├── page.tsx         # 설문 목록
│   │   │   │   ├── new/page.tsx     # 새 설문 생성
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/page.tsx   # 설문 편집
│   │   │   │       └── report/page.tsx # 결과 리포트
│   │   │   ├── templates/page.tsx   # 템플릿 갤러리
│   │   │   ├── reports/page.tsx     # 리포트 목록
│   │   │   └── settings/page.tsx    # 설정
│   │   └── respond/[token]/         # 설문 응답 (별도 레이아웃, 모바일 대응)
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── components/                  # 위 4.2 참조
│   ├── lib/
│   │   ├── utils.ts                 # cn() 등 유틸리티
│   │   └── api.ts                   # API 클라이언트
│   ├── hooks/                       # 커스텀 훅
│   │   ├── use-theme.ts
│   │   └── use-sidebar.ts
│   └── styles/
│       └── globals.css              # CSS 변수 (위 테마), Tailwind 지시문
├── tailwind.config.ts               # Tailwind 확장 (폰트, 커스텀 유틸)
├── components.json                  # shadcn/ui 설정
└── next.config.ts
```

### 7.2 디자인 토큰 위치

| 토큰 종류 | 파일 위치 | 설명 |
|----------|---------|------|
| 컬러 (CSS 변수) | `apps/frontend/src/styles/globals.css` | shadcn/ui 방식, Light/Dark 모드 |
| 폰트/확장 | `apps/frontend/tailwind.config.ts` | fontFamily, 커스텀 유틸 |
| 공유 상수 | `packages/shared/src/constants/` | 상태값, 질문 타입 등 백엔드 공유 |

---

## 8. 디자인 컨셉 키워드

- **Clean & Professional** — 업무 도구답게 깔끔하고 전문적
- **Warm Neutral** — 차가운 그레이가 아닌 따뜻한 뉴트럴 톤
- **Orange Spark** — 오렌지 포인트로 활력과 행동 유도
- **Efficient** — 최소 클릭으로 목표 달성
- **Accessible** — 누구나 사용할 수 있는 접근성
- **Calm Design** — 인지 부하 최소화, 필수 정보만 기본 표시
- **Strategic Minimalism** — 화면당 하나의 명확한 다음 액션

> 세부 UI/UX 가이드(컴포넌트, 레이아웃, 페이지별 CX)는 `docs/ui-guide.md` 참조
