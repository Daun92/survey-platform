# Phase 2 W5: 설문 에디터 프론트엔드

- **날짜**: 2026-03-14
- **Phase**: 2 (W5)
- **브랜치**: feature/phase2-editor

## 목표
- 설문 목록 페이지 구현
- 설문 에디터 페이지 구현 (질문 CRUD + 순서 변경)
- 10가지 질문 타입별 옵션 편집기 구현

## 완료 항목

### shadcn/ui 컴포넌트 설치 (13개)
- [x] Button, Input, Textarea, Label, Select, Card, Dialog, Switch, Badge, Separator, ScrollArea, DropdownMenu, AlertDialog

### 설문 목록 페이지 (`/dashboard/surveys`)
- [x] 프로젝트별 설문 그룹 표시
- [x] 설문 상태 배지 (초안/진행 중/마감/보관)
- [x] "새 설문" 다이얼로그 (프로젝트 선택 + 제목 + 설명)
- [x] "편집" 버튼으로 에디터 페이지 이동

### 설문 에디터 페이지 (`/dashboard/surveys/[id]/edit`)
- [x] 설문 정보 헤더 (제목, 상태 배지, 질문 수)
- [x] DRAFT 상태 검증 — 비-DRAFT 설문은 편집 불가 경고 표시
- [x] 질문 목록 표시 (QuestionCard)
- [x] 질문 추가 (QuestionForm 인라인)
- [x] 질문 수정 (카드 → 폼 전환)
- [x] 질문 삭제 (AlertDialog 확인)
- [x] 질문 순서 변경 (위/아래 버튼, 낙관적 업데이트 + 롤백)

### 설문 에디터 컴포넌트
- [x] `QuestionCard` — 순서번호, 타입 배지, 제목, 필수 배지, 편집/삭제/이동 버튼
- [x] `QuestionForm` — 타입 선택, 제목, 설명, 필수 토글, 타입별 설정, 저장/취소
- [x] `QuestionTypeConfig` — 10가지 타입별 옵션 편집 UI 분기
- [x] `ChoiceEditor` — 선택지 관리 (추가/삭제/순서변경, 라벨+값 편집)

### 질문 타입별 편집기
| 타입 | 편집 UI |
|------|---------|
| short_text | 플레이스홀더 |
| long_text | 플레이스홀더, 최대 줄 수 |
| radio / checkbox / dropdown / ranking | 선택지 목록 (ChoiceEditor) |
| linear_scale | 최솟값/최댓값/단계, 라벨 |
| date | 설정 불필요 안내 |
| file_upload | 최대 크기, 최대 수, 허용 형식 |
| matrix | 행/열 항목 (ChoiceEditor x2), 복수 선택 |

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 질문 편집 UX | 모달 vs 인라인 vs 사이드패널 | 인라인 | 카드를 폼으로 전환하는 인라인 방식이 설문 에디터에 가장 자연스러움 (Claude 판단) |
| 순서 변경 방식 | 드래그앤드롭 vs 위/아래 버튼 | 위/아래 버튼 | 추가 라이브러리 없이 구현, 향후 DnD 추가 가능 (Claude 판단) |
| 순서 변경 UX | 서버 응답 대기 vs 낙관적 업데이트 | 낙관적 업데이트 | 즉각적인 UI 반응, 실패 시 서버 데이터로 롤백 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `src/app/dashboard/surveys/page.tsx` — 설문 목록 페이지
- `src/app/dashboard/surveys/[id]/edit/page.tsx` — 설문 에디터 페이지
- `src/components/survey-editor/question-card.tsx` — 질문 카드 컴포넌트
- `src/components/survey-editor/question-form.tsx` — 질문 폼 컴포넌트
- `src/components/survey-editor/question-type-config.tsx` — 타입별 설정 컴포넌트
- `src/components/survey-editor/choice-editor.tsx` — 선택지 편집 컴포넌트
- `src/components/ui/*.tsx` — shadcn/ui 컴포넌트 13개

## 빌드 검증
- TypeScript 타입 체크: 통과
- Next.js 빌드: 성공
- `/dashboard/surveys`: 4.66 kB (정적)
- `/dashboard/surveys/[id]/edit`: 9.97 kB (동적)

## 다음 단계
- [ ] 설문 미리보기 기능 (응답자 관점에서 설문 확인)
- [ ] 설문 제목/설명 인라인 편집
- [ ] 드래그앤드롭 순서 변경 (선택적 개선)
- [ ] 질문 복제 기능
- [ ] 설문 상태 변경 (DRAFT → ACTIVE 등)
