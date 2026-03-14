# 2026-03-14 Phase 0 - 에이전트 역할 배분 & 실행 가이드

## 목표
- 멀티 에이전트 동시 작업을 위한 역할 배분 확정
- Phase별 순차/병렬 실행 순서 정의
- 각 에이전트에게 줄 프롬프트 템플릿 작성

## 수행 내역

### 1. agents/roles.md 생성
- **파일 생성**: `agents/roles.md`
- 3개 역할 정의: infra, backend, frontend
- 영역 충돌 방지 맵 (파일별 수정 권한 매트릭스)
- Phase별 순차/병렬 실행 순서
- 각 역할별 프롬프트 템플릿 (복사-붙여넣기용)
- 실전 팁 (병렬 시작법, 충돌 대응)

### 2. CLAUDE.md 업데이트
- **파일 변경**: `CLAUDE.md`
- 기존 4개 역할(frontend/backend/shared/infra) → 3개 역할(infra/backend/frontend)로 정리
- `agents/roles.md` 참조 링크 추가
- 순차→병렬 실행 패턴 명시

### 3. agents/status.md 업데이트
- **파일 변경**: `agents/status.md`
- Phase 1 작업을 Step 1~5로 세분화
- 각 Step에 순차/병렬 구분 + 담당 에이전트 + 의존성 명시

## 의사결정 기록

| 결정사항 | 선택지 | 선택 이유 |
|---------|--------|----------|
| 역할 수 | 2개, **3개**, 4개 | 3개(infra/backend/frontend) — shared를 infra에 통합, 프로젝트 규모에 적합 |
| 운영 방식 | 동시, 순차, **혼합** | 혼합 — 기반은 순차로 안전하게, 이후 병렬로 속도 향상 |
| 실행 패턴 | 자유 병렬, **infra 먼저 패턴** | 항상 공유 타입 먼저 정의 → frontend/backend 병렬 — 의존성 충돌 방지 |

## 다음 단계
- [ ] Phase 1 Step 1 시작: infra 에이전트로 모노레포 세팅
- [ ] Step 1 완료 후: frontend + backend 에이전트 병렬 실행

## Git 커밋
- (이 세션에서 커밋 예정)
