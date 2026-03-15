# 설문 에디터 UX 개선 + AI 채팅 어시스턴트 통합

## 작업 일시
2026-03-15

## 브랜치
`feature/editor-ux-ai-chat` (base: `main`)

## 작업 목표
1. 에디터 UX 전반 개선 (비주얼 타입 선택기, 질문 카드 개선, 빈 상태 퀵스타트, 미리보기 Sheet, 탭 네비게이션, 설문 목록 개선)
2. AI 생성을 에디터 내 멀티모달 채팅으로 전환 (파일 첨부 + 대화형 설문 설계)

## 완료 항목

### Part A: 에디터 UX 개선 (프론트엔드)

#### A1. 공유 레이아웃 + 탭 네비게이션
- `surveys/[id]/layout.tsx` 신규 — survey fetch, 공통 헤더(뒤로가기+제목+상태배지), 탭 바
- `survey-editor-tabs.tsx` 신규 — pathname 기반 활성 탭 감지, Link 기반 3탭(편집/배포/응답)
- `distribute/page.tsx`, `responses/page.tsx` — 중복 헤더(ArrowLeft+제목) 제거

#### A2. 비주얼 질문 타입 선택기
- `question-form.tsx` — Select 드롭다운 → 2×5 아이콘 그리드
- lucide 아이콘 매핑: Type, AlignLeft, CircleDot, CheckSquare, ChevronDown, SlidersHorizontal, Calendar, Paperclip, Grid3X3, ArrowUpDown
- 선택 시 `border-primary bg-primary/5`, 편집 모드 시 disabled
- `defaultType` prop 추가 (빈 상태 quick-add 연동)

#### A3. 질문 카드 비주얼 개선
- `question-card.tsx` — 타입별 좌측 컬러 보더(`border-l-4`)
  - 텍스트계(blue), 선택형(green), 척도/날짜(amber), 특수(purple)
- 5개 액션 버튼 → DropdownMenu 통합 (편집 버튼만 외부 노출)
- 선택형 질문: 첫 3개 선택지 인라인 미리보기 + "+N개 더"
- 선형 배율: 범위 표시 (예: "1~5점")

#### A4. 빈 상태 + 퀵스타트
- `empty-state.tsx` 신규 — 빠른 추가 버튼 5종(단답/객관식/체크/선형/장문)
- 프리셋 템플릿 3개: 만족도 조사, 의견 수집, NPS 조사
- 프리셋 선택 시 bulk create API 호출
- `edit/page.tsx` — 빈 상태 div를 EmptyState 컴포넌트로 교체

#### A5. 설문 목록 개선
- `surveys/page.tsx` — 상태 필터 탭(전체/초안/진행 중/마감)
- 검색 입력란 (title/description 클라이언트 필터링)
- 카드에 메타정보 추가: responseCount, 수정일(updatedAt), 작성자(createdByName)
- 편집 버튼 → DropdownMenu 퀵 액션(편집, 삭제)
- 삭제 확인 AlertDialog 추가

#### A6. 미리보기 Sheet 전환
- `survey-preview.tsx` — Dialog → Sheet(side="right", w-480px)
- 모바일 시뮬레이션 폭으로 실제 설문 경험에 가까운 미리보기

### Part B: AI 채팅 어시스턴트 (백엔드 + 프론트엔드)

#### B1. 공유 타입
- `packages/shared/src/index.ts` — AiChatMessage, AiChatAttachment, AiChatRequest 인터페이스 추가

#### B2. 백엔드 — 파일 업로드 + 스트리밍 채팅
- `multer` + `@types/multer` 설치
- `chat-message.dto.ts` 신규 — ChatMessageDto (message, surveyId, attachmentIds, conversationHistory, existingQuestions)
- `ai.module.ts` — MulterModule 등록 (dest: uploads/ai-temp, 10MB, PDF/이미지만)
- `ai.controller.ts` — `POST /ai/upload` (multer 파일 수신), `POST /ai/chat` (SSE 스트리밍)
- `ai.service.ts` — `chatStream()` async generator
  - 시스템 프롬프트에 기존 질문 목록 포함 (중복 방지)
  - 첨부파일 base64 → Claude multimodal API (이미지/PDF)
  - `stream: true`로 Claude API 호출, SSE 이벤트 파싱
  - `<<<QUESTIONS>>>...<<<END_QUESTIONS>>>` 블록 파싱 → questions 이벤트
  - API 키 없을 때 mock 스트리밍 fallback
  - 모델: claude-sonnet-4-20250514
  - 첨부파일 1시간 후 자동 삭제

#### B3. 프론트엔드 API 확장
- `api.ts` — `apiUpload<T>()` (FormData 전송), `apiStream()` (SSE ReadableStream 파싱)

#### B4. useAiChat 훅
- `use-ai-chat.ts` 신규 — messages, isStreaming, pendingAttachments 상태 관리
- uploadFile, removeAttachment, sendMessage(content, existingQuestions, onQuestionsGenerated), clearChat

#### B5. AI 채팅 UI 컴포넌트 (4개 파일)
- `ai-chat-panel.tsx` — Sheet(right) 기반 패널, 헤더(Sparkles+닫기), 메시지 목록, 입력 영역, 빈 상태 안내
- `chat-message.tsx` — 사용자(우측/primary), 어시스턴트(좌측/muted), 첨부파일 표시, QuestionInsertCard 렌더
- `chat-input.tsx` — auto-expanding textarea, 파일 첨부(Paperclip), 전송(ArrowUp), 첨부 미리보기
- `question-insert-card.tsx` — "N개 질문이 추가되었습니다" + 미니 카드(타입 배지+제목)

#### B6. 에디터 통합
- `edit/page.tsx` — "AI 어시스턴트" 버튼(Sparkles, isDraft일 때만), AiChatPanel 렌더
- `onQuestionsGenerated` 콜백 → bulk create API → questions 상태 갱신 → toast

#### B7. 기존 AI 페이지 전환 안내
- `ai/page.tsx` — 상단 안내 배너 추가 ("설문 편집 화면에서 AI 어시스턴트를 바로 사용할 수 있습니다")

## 신규 파일 (9개)

| 파일 | 용도 |
|------|------|
| `apps/frontend/src/app/dashboard/surveys/[id]/layout.tsx` | 공유 레이아웃 + 탭 |
| `apps/frontend/src/components/survey-editor/survey-editor-tabs.tsx` | 탭 네비게이션 |
| `apps/frontend/src/components/survey-editor/empty-state.tsx` | 빈 상태 + 퀵스타트 |
| `apps/backend/src/ai/dto/chat-message.dto.ts` | 채팅 요청 DTO |
| `apps/frontend/src/hooks/use-ai-chat.ts` | AI 채팅 훅 |
| `apps/frontend/src/components/ai-chat/ai-chat-panel.tsx` | 채팅 패널 |
| `apps/frontend/src/components/ai-chat/chat-message.tsx` | 메시지 버블 |
| `apps/frontend/src/components/ai-chat/chat-input.tsx` | 채팅 입력 |
| `apps/frontend/src/components/ai-chat/question-insert-card.tsx` | 질문 삽입 카드 |

## 수정 파일 (11개)

| 파일 | 변경 내용 |
|------|----------|
| `packages/shared/src/index.ts` | AI 채팅 타입 추가 |
| `apps/backend/package.json` | multer 의존성 추가 |
| `apps/backend/src/ai/ai.module.ts` | MulterModule 등록 |
| `apps/backend/src/ai/ai.controller.ts` | upload, chat 엔드포인트 추가 |
| `apps/backend/src/ai/ai.service.ts` | chatStream 메서드 추가 |
| `apps/frontend/src/lib/api.ts` | apiUpload, apiStream 함수 추가 |
| `apps/frontend/src/app/dashboard/surveys/[id]/edit/page.tsx` | 헤더 축소, AI 버튼, 빈 상태, Sheet 미리보기 |
| `apps/frontend/src/app/dashboard/surveys/[id]/distribute/page.tsx` | 헤더 제거 |
| `apps/frontend/src/app/dashboard/surveys/[id]/responses/page.tsx` | 헤더 제거 |
| `apps/frontend/src/components/survey-editor/question-form.tsx` | 비주얼 타입 그리드, defaultType |
| `apps/frontend/src/components/survey-editor/question-card.tsx` | 컬러 보더, DropdownMenu, 인라인 미리보기 |
| `apps/frontend/src/components/survey-editor/survey-preview.tsx` | Dialog → Sheet |
| `apps/frontend/src/app/dashboard/surveys/page.tsx` | 상태 필터, 검색, 메타정보, DropdownMenu |
| `apps/frontend/src/app/dashboard/ai/page.tsx` | 안내 배너 추가 |

## 추가된 의존성

| 패키지 | 위치 | 용도 |
|--------|------|------|
| `multer` | backend | 파일 업로드 처리 |
| `@types/multer` | backend (dev) | multer 타입 정의 |

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 레이아웃 제목 편집 | 레이아웃에서 인라인 편집 vs 편집 페이지에서만 | 편집 페이지에서만 | 레이아웃은 읽기 전용으로 단순화, 편집 페이지에서 인라인 편집 유지. Claude 판단 |
| SSE 스트리밍 방식 | WebSocket vs SSE | SSE | 단방향 스트리밍에 적합, 구현 단순, Claude 판단 |
| AI 모델 선택 | claude-haiku vs claude-sonnet | claude-sonnet-4 | 채팅은 멀티모달+스트리밍 필요, 기존 generate는 haiku 유지. 계획서 지정 |
| 질문 블록 마커 | JSON fence vs 커스텀 마커 | `<<<QUESTIONS>>>...<<<END_QUESTIONS>>>` | 스트리밍 중 파싱 용이, 계획서 지정 |
| 리포트 탭 | 탭에 포함 vs 제외 | 제외 | report 라우트가 아직 미생성, Claude 판단 |

## 검증 결과
- `pnpm --filter @survey/shared run build` ✅ 통과
- `pnpm --filter backend run type-check` ✅ 통과
- `pnpm --filter frontend run type-check` ✅ (기존 target-manager.tsx 에러만 잔존, 본 작업 무관)

## 다음 단계
- 브라우저 E2E 검증: 빈 상태 → 퀵스타트, 비주얼 타입 그리드, AI 채팅 스트리밍
- target-manager.tsx 기존 에러 정리
- report 페이지 생성 후 탭에 추가
