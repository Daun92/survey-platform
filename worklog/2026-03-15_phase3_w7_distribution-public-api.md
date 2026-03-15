# Phase 3 W7: 배포 링크, 공개 설문 조회 API

- **날짜**: 2026-03-15
- **Phase**: 3 (W7)
- **브랜치**: claude/build-resume-endpoint-Q9INe

## 목표
- Distribution/Response 엔티티 생성
- 배포 링크 CRUD API (JWT 보호)
- 공개 설문 조회 API (인증 없음)
- 공유 타입 정의

## 완료 항목

### 공유 타입 추가
- [x] `DistributionChannel` enum (LINK, QR, EMAIL)
- [x] `DistributionConfig` interface (allowDuplicate, maxResponses, welcomeMessage, completionMessage)
- [x] `DistributionResponse`, `CreateDistributionRequest`, `UpdateDistributionRequest`
- [x] `ResponseStatus` enum (IN_PROGRESS, COMPLETED)
- [x] `AnswerValue` interface (questionId + value union)
- [x] `RespondentInfo`, `SubmitResponseRequest`, `SurveyResponseDetail`
- [x] `PublicSurveyData` interface (survey + questions + config)

### Distribution 엔티티
- [x] UUID PK, surveyId(FK CASCADE), channel(enum), token(varchar 21, unique)
- [x] config(JSONB), isActive(boolean), expiresAt(timestamptz nullable)

### SurveyResponse 엔티티
- [x] UUID PK, surveyId(FK CASCADE), distributionId(FK SET NULL, nullable)
- [x] status(enum), answers(JSONB), respondentInfo(JSONB), submittedAt

### Survey 엔티티 업데이트
- [x] `@OneToMany` distributions 추가
- [x] `@OneToMany` responses 추가

### Distributions 모듈 (JWT 보호)
- [x] `POST /surveys/:surveyId/distributions` — 배포 링크 생성 (ACTIVE 설문만)
- [x] `GET /surveys/:surveyId/distributions` — 배포 목록
- [x] `PATCH /surveys/:surveyId/distributions/:id` — 설정 수정
- [x] `DELETE /surveys/:surveyId/distributions/:id` — 비활성화
- [x] nanoid(21) 토큰 자동 생성

### Public 모듈 (인증 없음)
- [x] `GET /public/surveys/:token` — 토큰으로 설문+질문 조회
- [x] 토큰 유효성/활성화/만료/설문 상태 검증

## 의사결정 기록

| 결정사항 | 제시된 선택지 | 사용자 선택 | 선택 이유/맥락 |
|----------|-------------|------------|---------------|
| 응답 수집 방식 | 공개 URL(토큰) vs 내부 사용자 지정 | 공개 URL (토큰 기반) | 사용자 선택 |
| nanoid 버전 | v5 (ESM) vs v3 (CJS) | v3.3.8 | NestJS CommonJS 호환 필요 (Claude 판단) |
| Delete 동작 | 실제 삭제 vs 비활성화 | 비활성화 | 데이터 보존, 이미 배포된 링크 추적 가능 (Claude 판단) |
| 엔티티 클래스명 | Response vs SurveyResponse | SurveyResponse | global Response와 충돌 방지 (Claude 판단) |

## 파일 변경 목록

### 신규 생성
- `apps/backend/src/entities/distribution.entity.ts`
- `apps/backend/src/entities/response.entity.ts`
- `apps/backend/src/distributions/distributions.module.ts`
- `apps/backend/src/distributions/distributions.service.ts`
- `apps/backend/src/distributions/distributions.controller.ts`
- `apps/backend/src/distributions/dto/create-distribution.dto.ts`
- `apps/backend/src/distributions/dto/update-distribution.dto.ts`
- `apps/backend/src/public/public.module.ts`
- `apps/backend/src/public/public.service.ts`
- `apps/backend/src/public/public.controller.ts`

### 수정
- `packages/shared/src/index.ts` — Distribution/Response 공유 타입 추가
- `apps/backend/src/entities/survey.entity.ts` — distributions/responses 관계 추가
- `apps/backend/src/app.module.ts` — DistributionsModule, PublicModule 등록
- `apps/backend/package.json` — nanoid@3.3.8 추가
- `pnpm-lock.yaml` — lockfile 업데이트

## 빌드 검증
- TypeScript 타입 체크 (backend): 통과
- TypeScript 타입 체크 (frontend): 통과
- 공유 패키지 빌드: 통과

## 다음 단계
- [ ] Phase 3 W8: 응답 제출 API (POST /public/surveys/:token/responses)
- [ ] Phase 3 W8: 공개 응답 페이지 (/s/[token]) — 프론트엔드
- [ ] Phase 3 W8: 질문 타입별 인터랙티브 입력 컴포넌트
- [ ] Phase 3 W9: 응답 관리 + 배포 관리 페이지
