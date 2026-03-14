# 멀티 에이전트 협업 가이드

## 개요

이 디렉토리는 여러 Claude Code 에이전트가 동시에 작업할 때 충돌을 방지하고 작업을 조율하기 위한 시스템입니다.

## 파일 구조

```
agents/
├── README.md          # 이 파일 - 협업 가이드
└── status.md          # 에이전트 작업 현황판 (실시간 업데이트)
```

## 작업 흐름

### 1. 세션 시작 시

```
1. git pull origin {branch}
2. agents/status.md 읽기
3. worklog/ 최신 파일 읽기
4. agents/status.md에 자기 작업 등록
```

### 2. 작업 중

```
- 자기 영역(Zone) 내에서만 작업
- 공유 영역 수정 시 status.md 확인
- 주요 변경 시 커밋하고 푸시하여 다른 에이전트에게 공유
```

### 3. 세션 종료 시

```
1. agents/status.md에서 자기 작업 상태 업데이트
2. 워크로그 작성/갱신
3. 다음 단계를 '다음 에이전트 TODO'에 기록
4. 커밋 → 푸시
```

## 영역(Zone) 분리 원칙

모노레포 구조를 활용하여 각 에이전트의 작업 영역을 물리적으로 분리합니다:

```
survey-platform/
├── apps/frontend/     → frontend 에이전트 전담
├── apps/backend/      → backend 에이전트 전담
├── packages/shared/   → shared 에이전트 또는 협의 후 수정
├── docker/            → infra 에이전트 전담
└── worklog/           → 모든 에이전트 (자기 파일만)
```

### 공유 영역 수정 규칙

`packages/shared/`는 여러 에이전트가 의존하므로 특별 규칙 적용:

1. **새 타입/인터페이스 추가**: 새 파일 생성으로 처리 (충돌 최소화)
2. **기존 타입 수정**: `agents/status.md`에서 다른 에이전트 확인 후 진행
3. **index.ts export**: 자기가 추가한 파일의 export만 추가

## 충돌 발생 시 대응

### Git 충돌
1. `agents/status.md`에서 충돌 상대 에이전트 확인
2. 워크로그에서 상대 에이전트의 의도 파악
3. 양쪽 변경사항을 모두 보존하는 방향으로 병합
4. 병합 결과를 워크로그에 기록

### 설계 결정 충돌
1. `agents/status.md`의 **의사결정 충돌 로그**에 기록
2. 기존 결정을 우선 존중 (먼저 결정한 쪽 우선)
3. 불확실하면 `[TBD]`로 마킹하고 사용자에게 확인 요청

## 워크로그 네이밍 규칙 (에이전트별)

에이전트별 워크로그 파일명:
```
YYYY-MM-DD_phaseX_역할_작업명.md
```

예시:
- `2026-03-15_phase1_frontend_auth-ui.md`
- `2026-03-15_phase1_backend_auth-api.md`
- `2026-03-15_phase1_shared_types.md`

이렇게 하면 각 에이전트의 워크로그 파일이 분리되어 충돌이 방지됩니다.

## 실전 시나리오 예시

### 시나리오: Frontend + Backend 에이전트가 동시에 인증 기능 구현

**Agent-Backend-1:**
1. `packages/shared/src/types/auth.ts` 생성 (공유 타입)
2. `apps/backend/src/auth/` 모듈 구현
3. 커밋 & 푸시
4. status.md 업데이트: "auth API 완료, 공유 타입 정의됨"

**Agent-Frontend-1:**
1. status.md 확인 → backend가 공유 타입 작업 중
2. 공유 타입이 확정될 때까지 UI 레이아웃/컴포넌트 구조 먼저 작업
3. backend 에이전트 완료 후 `git pull`
4. 공유 타입을 import하여 API 연동 구현
5. 커밋 & 푸시

### 시나리오: 공유 타입 동시 수정 필요

1. 먼저 수정하는 에이전트가 status.md에 잠금 설정
2. 다른 에이전트는 잠금 해제 전까지 해당 파일 수정 대기
3. 급한 경우 새 파일에 임시 타입을 정의하고, 나중에 통합
