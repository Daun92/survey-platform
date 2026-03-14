# Phase 5: 대시보드 고도화 & 배포 PRD

> 기간: W13~W14 | 상태: 예정 | 의존: Phase 4 완료

## 1. 개요

### 목적
대시보드를 실시간 통계와 알림으로 고도화하고, 사용자/부서 관리 기능을 완성하며, 프로덕션 배포 환경을 구축합니다.

### 범위
- 대시보드 실시간 통계 위젯
- WebSocket 기반 실시간 응답 알림
- 이메일 알림 (설문 배포, 마감 임박)
- 사용자/부서 관리 UI (ADMIN)
- Pretendard 폰트 적용
- 반응형 모바일 대응
- Docker 프로덕션 빌드
- Nginx SSL + 리버스 프록시
- CI/CD (GitHub Actions)

### 범위 외
- 소셜 로그인 (OAuth)
- 멀티 테넌트
- 국제화 (i18n)

---

## 2. 사용자 스토리

| ID | 사용자 | 스토리 | 우선순위 |
|----|--------|--------|---------|
| US-5.1 | 설문 관리자 | 대시보드에서 전체 설문 현황(진행중/완료/응답률)을 한눈에 확인할 수 있다 | P0 |
| US-5.2 | 설문 관리자 | 새 응답이 들어오면 실시간 알림을 받을 수 있다 | P1 |
| US-5.3 | 설문 관리자 | 설문 마감 24시간 전에 알림을 받을 수 있다 | P1 |
| US-5.4 | ADMIN | 전체 사용자 목록을 보고, 역할을 변경하거나 비활성화할 수 있다 | P0 |
| US-5.5 | ADMIN | 부서를 생성/수정/삭제하고 사용자를 부서에 배정할 수 있다 | P0 |
| US-5.6 | 사용자 | 모바일에서도 응답 페이지를 편하게 사용할 수 있다 | P0 |
| US-5.7 | 운영자 | Docker Compose로 프로덕션 환경을 원커맨드 배포할 수 있다 | P0 |
| US-5.8 | 운영자 | main 브랜치 푸시 시 자동으로 빌드/테스트/배포가 실행된다 | P1 |
| US-5.9 | 사용자 | 한글이 Pretendard 폰트로 깔끔하게 표시된다 | P1 |

---

## 3. 기능 요구사항

### 3.1 인프라 (infra 에이전트)

#### Docker 프로덕션 설정

```yaml
# docker-compose.prod.yml
services:
  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
      target: production
    # Next.js standalone output

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
      target: production
    # NestJS compiled build

  nginx:
    # SSL termination + reverse proxy
    # frontend: / → frontend:3000
    # backend: /api → backend:4000

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
```

#### Dockerfile (Multi-stage)

```dockerfile
# apps/frontend/Dockerfile
FROM node:20-alpine AS base
# ... pnpm install

FROM base AS builder
# ... pnpm build (standalone)

FROM node:20-alpine AS production
# ... copy standalone output
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Nginx 설정

```nginx
server {
    listen 443 ssl http2;
    server_name survey.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://frontend:3000;
    }

    location /api {
        proxy_pass http://backend:4000;
    }

    location /ws {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    # pnpm lint + pnpm type-check

  test:
    # pnpm test (unit + integration)

  build:
    # pnpm build (frontend + backend)
    needs: [lint-and-typecheck, test]

  deploy:
    # Docker build + push + deploy
    needs: [build]
    if: github.ref == 'refs/heads/main'
```

### 3.2 Backend API (backend 에이전트)

#### WebSocket 실시간 알림

```typescript
// Gateway: apps/backend/src/notifications/notifications.gateway.ts
@WebSocketGateway({ namespace: '/notifications', cors: true })
class NotificationsGateway {
  // 클라이언트 연결 시 JWT 검증
  handleConnection(client: Socket);

  // 새 응답 수신 시 설문 소유자에게 알림
  notifyNewResponse(surveyId: string, responseCount: number);

  // 설문 마감 임박 알림
  notifyDeadlineApproaching(surveyId: string, hoursLeft: number);
}

// 이벤트 타입
interface NotificationEvent {
  type: 'new-response' | 'deadline-approaching' | 'survey-closed';
  surveyId: string;
  title: string;
  message: string;
  timestamp: string;
}
```

#### 이메일 알림

```typescript
// Service: apps/backend/src/notifications/email.service.ts
class EmailService {
  // 설문 배포 안내 이메일
  sendDistributionEmail(to: string[], surveyTitle: string, link: string);

  // 마감 임박 알림
  sendDeadlineReminder(to: string, surveyTitle: string, deadline: Date);

  // 설문 완료 리포트 안내
  sendCompletionNotice(to: string, surveyTitle: string, responseCount: number);
}
```

#### 사용자/부서 관리 API 확장

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/v1/users` | 사용자 목록 (페이지네이션, 검색) | JWT (ADMIN) |
| PATCH | `/api/v1/users/:id` | 사용자 수정 (역할, 부서, 활성) | JWT (ADMIN) |
| DELETE | `/api/v1/users/:id` | 사용자 비활성화 | JWT (ADMIN) |
| PUT | `/api/v1/departments/:id` | 부서 수정 | JWT (ADMIN) |
| DELETE | `/api/v1/departments/:id` | 부서 삭제 | JWT (ADMIN) |

#### 스케줄러

```typescript
// 마감 임박 체크 (매시간)
@Cron('0 * * * *')
checkDeadlines() {
  // endsAt이 24시간 이내인 ACTIVE 설문 → 소유자에게 알림
}
```

### 3.3 Frontend UI (frontend 에이전트)

#### 대시보드 고도화

경로: `/dashboard`

```
┌─────────────────────────────────────────────────────┐
│ 대시보드                                              │
│                                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│ │ 총 설문   │ │ 진행중    │ │ 총 응답   │ │ 응답률   ││
│ │    24     │ │     5    │ │   342    │ │   78%   ││
│ │ ↑12%     │ │ ↓2       │ │ ↑45      │ │ ↑3%     ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│                                                     │
│ ┌─ 응답 트렌드 (최근 7일) ─────────────────────────┐ │
│ │ [선형 차트: 일별 응답 수]                          │ │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ 진행중인 설문 ──────────────────────────────────┐ │
│ │ 직원 만족도 조사     42/100 응답  마감 D-3  [보기]│ │
│ │ 교육 피드백         15/50 응답   마감 D-7  [보기] │ │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ 최근 활동 ──────────────────────────────────────┐ │
│ │ 🔔 "직원 만족도 조사"에 새 응답 3건 (5분 전)       │ │
│ │ 🔔 "교육 피드백" 마감 D-3 (1시간 전)              │ │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### 알림 드롭다운 (Header)

```
┌─────────────────────────────────┐
│ 🔔 알림 (3)              [모두 읽음] │
├─────────────────────────────────┤
│ ● "직원 만족도" 새 응답 5건    │
│   5분 전                       │
│                                │
│ ● "교육 피드백" 마감 D-3       │
│   1시간 전                     │
│                                │
│ ○ "온보딩 설문" 발행 완료       │
│   어제                         │
└─────────────────────────────────┘
```

#### 사용자 관리 (ADMIN)

경로: `/dashboard/settings/users`

```
┌──────────────────────────────────────────────────┐
│ 사용자 관리                      [검색: ________] │
│                                                  │
│ ┌────────────────────────────────────────────┐   │
│ │ 이름     │ 이메일          │ 부서  │ 역할   │ 상태│
│ ├──────────┼───────────────┼──────┼───────┼────┤
│ │ 김관리자  │ admin@co.kr   │ IT   │ Admin │ ✅ │
│ │ 이매니저  │ mgr@co.kr     │ HR   │ Mgr   │ ✅ │
│ │ 박사원   │ user@co.kr    │ Dev  │ User  │ ✅ │
│ │ 최퇴사   │ left@co.kr    │ -    │ User  │ ❌ │
│ └────────────────────────────────────────────┘   │
│                                    [< 1 2 3 >]   │
└──────────────────────────────────────────────────┘
```

#### Pretendard 폰트

```typescript
// apps/frontend/src/app/layout.tsx
import localFont from 'next/font/local';

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  display: 'swap',
});

// globals.css
// --font-sans: var(--font-pretendard), var(--font-inter), sans-serif;
```

#### 반응형 대응

| 브레이크포인트 | 동작 |
|-------------|------|
| Desktop (1280px+) | 풀 레이아웃 |
| Laptop (1024~1279px) | 사이드바 자동 접힘 (64px) |
| Tablet (768~1023px) | 사이드바 오버레이 (햄버거) |
| Mobile (~767px) | 하단 탭바, 카드 1열, 응답 페이지 최적화 |

#### 컴포넌트 구조

```
apps/frontend/src/components/
├── dashboard/
│   ├── StatCard.tsx              # KPI 통계 카드 (증감 표시)
│   ├── ResponseTrend.tsx         # 응답 트렌드 차트
│   ├── ActiveSurveyList.tsx      # 진행중 설문 목록
│   └── RecentActivity.tsx        # 최근 활동 피드
├── notifications/
│   ├── NotificationDropdown.tsx  # 헤더 알림 드롭다운
│   ├── NotificationItem.tsx      # 개별 알림 항목
│   └── useNotifications.ts       # WebSocket 알림 훅
├── admin/
│   ├── UserManagementTable.tsx   # 사용자 관리 테이블
│   ├── UserEditModal.tsx         # 사용자 편집 모달
│   ├── DepartmentManager.tsx     # 부서 관리
│   └── AdminGuard.tsx            # ADMIN 권한 체크 래퍼
```

---

## 4. 비기능 요구사항

### 성능
- 대시보드 초기 로딩: 2초 이내
- WebSocket 알림 지연: 1초 이내
- Lighthouse Performance 점수: 90+

### 보안
- WebSocket 연결 시 JWT 검증
- ADMIN API에 RolesGuard 적용
- SSL 인증서 적용 (Let's Encrypt 또는 자체 서명)
- 환경변수 `.env` 파일은 `.gitignore`에 포함
- Docker secrets 또는 환경변수로 민감 정보 관리

### 접근성
- 반응형 모바일에서 터치 타겟 44px 이상
- 키보드 네비게이션 전체 지원
- 고대비 모드 호환

---

## 5. 의존성 & 제약사항

### 이전 Phase 의존
- Phase 1~4 전체 (모든 엔티티, API, UI)

### 신규 라이브러리

| 라이브러리 | 용도 | 설치 위치 |
|-----------|------|----------|
| `@nestjs/websockets` | WebSocket 게이트웨이 | apps/backend |
| `socket.io` / `socket.io-client` | 실시간 통신 | apps/backend + frontend |
| `@nestjs/schedule` | 크론 스케줄러 | apps/backend |
| `nodemailer` | 이메일 발송 | apps/backend |
| `PretendardVariable.woff2` | 한글 폰트 | apps/frontend |

### 제약사항
- 이메일 발송은 SMTP 서버 설정 필요 (환경변수)
- SSL 인증서는 운영 환경에서 별도 발급
- WebSocket은 Nginx에서 Upgrade 헤더 프록시 필요

---

## 6. 완료 기준 (Definition of Done)

### infra
- [ ] Docker multi-stage Dockerfile (frontend + backend)
- [ ] docker-compose.prod.yml 작성
- [ ] Nginx SSL + WebSocket 프록시 설정
- [ ] GitHub Actions CI 파이프라인 (lint → test → build)
- [ ] `.env.example` 프로덕션 환경변수 목록

### backend
- [ ] WebSocket 게이트웨이 — 새 응답 알림 동작
- [ ] 마감 임박 스케줄러 동작 (매시간)
- [ ] 이메일 발송 서비스 동작
- [ ] 사용자 목록/수정/비활성화 API (ADMIN)
- [ ] 부서 수정/삭제 API (ADMIN)
- [ ] 데이터 시딩 스크립트 (테스트용 초기 데이터)

### frontend
- [ ] 대시보드 4개 KPI 카드 + 트렌드 차트
- [ ] 진행중 설문 목록 + 최근 활동 피드
- [ ] 알림 드롭다운 (WebSocket 연동)
- [ ] 사용자/부서 관리 페이지 (ADMIN)
- [ ] Pretendard 폰트 적용
- [ ] 반응형: Tablet(사이드바 오버레이) + Mobile(하단 탭)
- [ ] Lighthouse Performance 90+
