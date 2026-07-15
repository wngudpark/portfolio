# Developer Portfolio

Vanilla JS SPA 프론트엔드 + Express/SQLite 백엔드로 만든 개발자 포트폴리오 사이트입니다.
관리자 로그인 후 프로젝트를 추가/수정/삭제할 수 있습니다.

## 주요 기능

- **SPA**: 새로고침 없이 Home / Introduce / Career / Project 섹션 전환 (History API 경로 라우팅, 깔끔한 URL)
- **경력(Career)**: 회사·직무·재직기간(재직중이면 "현재")·담당 업무를 최신순으로 표시, 관리자에서 CRUD
- **프로젝트 상세**: 카드 클릭 → `/project/:id` 상세 화면. 새로고침·링크 공유 가능하며,
  본문은 마크다운으로 작성해 **marked + DOMPurify**(XSS 방지)로 렌더링
- **반응형**: Tailwind CSS(로컬 빌드) + Lucide 아이콘, 모바일 대응
- **관리자**: `/admin` 경로에서 비밀번호 로그인 → 프로젝트 CRUD (마크다운 상세 + 실시간 미리보기)
- **보안**:
  - 관리자 비밀번호는 **bcrypt 해시**로 `.env`에만 저장 (평문 저장 안 함)
  - `POST/PUT/DELETE /api/projects`는 **서버에서 세션 인증 필수**, `GET`은 공개
  - 세션 쿠키(httpOnly, sameSite), CORS는 지정된 origin만 허용

## 기술 스택

| 구분     | 사용 기술                                        |
| -------- | ------------------------------------------------ |
| Frontend | HTML, Tailwind CSS (CLI 빌드), Lucide, marked, DOMPurify, Vanilla JS SPA |
| Backend  | Node.js, Express, multer(업로드)                 |
| DB       | SQLite (`better-sqlite3`)                        |
| 인증     | express-session + bcryptjs                       |

## 폴더 구조

```
portfolio/
├─ backend/
│  ├─ server.js            # Express 앱 진입점 (API + 정적 파일 서빙)
│  ├─ routes/
│  │  ├─ auth.js           # /api/login, /api/logout, /api/me
│  │  ├─ projects.js       # /api/projects CRUD
│  │  └─ careers.js        # /api/careers CRUD
│  ├─ middleware/
│  │  └─ auth.js           # requireAuth (세션 검사)
│  ├─ db/
│  │  ├─ database.js       # SQLite 연결
│  │  ├─ init.js           # 스키마 생성 + 샘플 시드
│  │  └─ portfolio.db      # (init 후 자동 생성)
│  ├─ scripts/
│  │  └─ hash-password.js  # 비밀번호 → bcrypt 해시 생성
│  ├─ .env.example
│  └─ .env                 # (직접 생성, git 제외)
├─ frontend/
│  ├─ index.html
│  ├─ css/
│  │  ├─ input.css         # Tailwind 지시어 (빌드 소스)
│  │  ├─ output.css        # 빌드 결과물 (커밋됨, HTML이 로드)
│  │  └─ styles.css        # 커스텀 컴포넌트 스타일
│  └─ js/
│     ├─ app.js            # SPA 라우터 + 공개 화면
│     └─ admin.js          # 관리자 로그인 + CRUD
├─ tailwind.config.js      # content 경로, theme.extend(brand 색상)
├─ postcss.config.js
├─ package.json
└─ README.md
```

## 로컬 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`backend/.env.example`을 복사해 `backend/.env`를 만듭니다.

```bash
# macOS / Linux
cp backend/.env.example backend/.env
# Windows (PowerShell)
Copy-Item backend/.env.example backend/.env
```

**관리자 비밀번호 해시 생성** — 원하는 비밀번호로 해시를 만들어 `.env`의 `ADMIN_PASSWORD_HASH`에 넣습니다.

```bash
npm run hash -- "yourPassword"
```

> `.env.example`의 기본 해시는 비밀번호 **`admin123`** 에 해당합니다. 테스트용이며 실제 사용 시 반드시 변경하세요.

세션 시크릿도 무작위 문자열로 바꿔 주세요.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. DB 초기화 (스키마 생성 + 샘플 데이터)

```bash
npm run init-db
```

### 4. CSS 빌드 (Tailwind)

Tailwind CSS는 CDN이 아니라 **로컬 빌드** 방식입니다. `frontend/css/input.css`를
컴파일해 `frontend/css/output.css`를 생성하며, HTML은 이 파일을 로드합니다.

```bash
# 프로덕션 빌드 (minify) — 서버 실행/배포 전에 최소 1회 필요
npm run build:css

# 개발 중: 파일 변경을 감지해 자동 재빌드
npm run watch:css
```

> **중요:** HTML/JS의 클래스를 바꾸면 `output.css`를 다시 빌드해야 화면에 반영됩니다.
> 개발 중에는 `npm run watch:css`를 별도 터미널에서 켜 두고, 서버는 `npm run dev`로 실행하세요.

**빌드 산출물(`output.css`) 처리 방침**

- 이 프로젝트는 `frontend/css/output.css`를 **저장소에 커밋**합니다. 별도 CI/빌드 파이프라인 없이
  `git clone` 또는 파일 복사만으로 바로 서빙할 수 있도록 하기 위함입니다. (`.gitignore`에 넣지 않음)
- 다만 소스(HTML/JS/config)를 수정했다면 **배포 전에 반드시 `npm run build:css`를 실행**해
  최신 `output.css`를 반영한 뒤 커밋/배포해야 합니다.
- 배포 파이프라인을 따로 구성한다면, 커밋 대신 배포 단계에서 `npm ci && npm run build:css`를
  실행하도록 구성해도 됩니다.

### 5. 서버 실행

```bash
# 개발 모드 (nodemon, 자동 재시작)
npm run dev

# 또는 일반 실행
npm start
```

- 사이트: <http://localhost:3000>
- 관리자: <http://localhost:3000/admin>

## 환경변수 설명 (`backend/.env`)

| 변수                  | 설명                                                        |
| --------------------- | ----------------------------------------------------------- |
| `PORT`                | 서버 포트 (기본 3000)                                       |
| `CORS_ORIGIN`         | 허용할 프론트엔드 origin (같은 서버에서 서빙 시 서버 URL)   |
| `SESSION_SECRET`      | 세션 서명용 시크릿 (긴 무작위 문자열 권장)                  |
| `ADMIN_PASSWORD_HASH` | 관리자 비밀번호의 bcrypt 해시 (`npm run hash`로 생성)       |
| `NODE_ENV`            | `production`이면 secure 쿠키 활성화 (HTTPS 필요)            |

## API 명세

| 메서드 | 경로                 | 인증 | 설명             |
| ------ | -------------------- | ---- | ---------------- |
| POST   | `/api/login`         | -    | 로그인 `{ password }` |
| POST   | `/api/logout`        | -    | 로그아웃         |
| GET    | `/api/me`            | -    | 로그인 상태 확인 |
| GET    | `/api/projects`      | 공개 | 프로젝트 목록 (`detail_content` 제외, 가볍게) |
| GET    | `/api/projects/:id`  | 공개 | 프로젝트 단건 (`detail_content` 포함) |
| POST   | `/api/projects`      | 필요 | 프로젝트 추가    |
| PUT    | `/api/projects/:id`  | 필요 | 프로젝트 수정    |
| DELETE | `/api/projects/:id`  | 필요 | 프로젝트 삭제    |
| GET    | `/api/careers`       | 공개 | 경력 목록 (최신순) |
| POST   | `/api/careers`       | 필요 | 경력 추가        |
| PUT    | `/api/careers/:id`   | 필요 | 경력 수정        |
| DELETE | `/api/careers/:id`   | 필요 | 경력 삭제        |

프로젝트 payload 예시:

추가/수정은 `multipart/form-data`로 전송하며, 다음 필드를 받습니다
(썸네일 이미지는 선택, `thumbnail` 필드):

```
title           프로젝트 제목 (필수)
year            기간 / 연도
description      목록 카드용 짧은 한 줄 설명
stack           기술스택 (배열 또는 콤마 구분 문자열)
link            GitHub / 데모 URL
detail_content  상세 페이지 본문 (마크다운)
thumbnail       썸네일 이미지 파일 (jpg/jpeg/png/webp, 최대 2MB)
```

> `stack`은 배열 또는 콤마로 구분된 문자열 모두 허용되며, DB에는 JSON 배열 문자열로 저장됩니다.
> `description`은 목록 카드용 짧은 설명, `detail_content`는 상세 화면 전용 마크다운으로 분리되어 있습니다.

## 콘텐츠 수정

- 이름 / 직무 / 소개 문구, Skills 목록, 이메일 주소(Home CTA·footer의 `mailto:`)는
  `frontend/index.html`과 `frontend/js/app.js`(상단 `SKILLS` 배열)에서 직접 수정합니다.
- 프로젝트와 경력은 `/admin`에서 관리합니다. (관리자 화면 상단 탭으로 전환)
