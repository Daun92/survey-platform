# 2026-03-14 Phase 0 - 디자인 테마 & UI/UX 컨셉 정의

## 에이전트 정보
- **에이전트 ID**: agent-design-1
- **담당 영역**: docs/ (디자인 시스템 문서)

## 목표
- 앱 디자인 테마와 UI/UX 방향성 확정
- Phase 1 프론트엔드 구현의 참조 가이드 생성

## 수행 내역

### 1. 디자인 시스템 문서 작성
- **파일 생성**: `docs/design-system.md`
- **내용**: 컬러 시스템, 타이포그래피, 레이아웃, 컴포넌트, UX 원칙, 파일 구조

### 2. agents/status.md 업데이트
- **파일 변경**: `agents/status.md`
- 완료 작업 등록, Phase 1 미할당 작업 목록 추가

### 3. worklog/summary.md 갱신
- **파일 변경**: `worklog/summary.md`

## 의사결정 기록

| 결정사항 | 선택지 | 선택 이유 |
|---------|--------|----------|
| 컬러 톤 | 딥 네이비+블루, 인디고+바이올렛, 틸+그린, **뉴트럴+오렌지** | 사용자 선택 — 미니멀하고 임팩트 있는 톤 |
| 네비게이션 | 풀 사이드바, 미니 사이드바, 탑 네비게이션 | **풀 사이드바 + FAB** — 사용자 요청, 주요 액션 빠른 접근 |
| 다크 모드 | Phase 1 라이트만, **처음부터 양쪽 모두** | 사용자 선택 — CSS 변수 기반으로 추가 비용 적음 |
| 한국어 폰트 | Noto Sans KR, **Pretendard**, Spoqa Han Sans | Pretendard — Variable Font, 가독성 우수, 무료 |
| 차트 라이브러리 | Chart.js, D3.js, **Recharts** | Recharts — React 네이티브, Tailwind 호환, 번들 가벼움 |
| 드래그앤드롭 | react-beautiful-dnd, **dnd-kit** | dnd-kit — 모던 API, 접근성 내장, 유지보수 활발 |
| 애니메이션 | CSS only, **Framer Motion**, React Spring | Framer Motion — Next.js 호환 우수, 선언적 API |

## 다음 에이전트에게
- [ ] Phase 1에서 `docs/design-system.md`를 참조하여 Tailwind/shadcn/ui 초기 설정
- [ ] `globals.css`에 CSS 변수 (Light/Dark) 적용
- [ ] Pretendard 웹폰트 설정
- [ ] 사이드바 + 헤더 + FAB 레이아웃 구현
- 주의사항: `next-themes` 패키지 설치 필요, `ThemeProvider` 루트 레이아웃에 래핑

## Git 커밋
- (이 세션에서 커밋 예정)
