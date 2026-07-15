# Developer Portfolio (Static + Decap CMS)

Vanilla JS 기반 포트폴리오 SPA입니다. 백엔드/DB 없이 **GitHub Pages**로 배포되며,
콘텐츠(프로젝트·경력)는 저장소 안의 마크다운 파일로 관리합니다. 관리자 편집은
**GitHub 계정 로그인 기반의 [Decap CMS](https://decapcms.org/)** 화면(`/admin`)에서 처리합니다.

기존 Express + SQLite + 비밀번호 로그인 구조를 걷어내고, 다음과 같이 바뀌었습니다.

| 이전 | 현재 |
| --- | --- |
| Express API (`/api/...`) | 빌드 시 생성한 정적 JSON (`data/*.json`) |
| SQLite DB | `content/**/*.md` 마크다운 파일 |
| 비밀번호 로그인 + 커스텀 관리 UI | Decap CMS (GitHub OAuth 로그인) |
| 서버에서 직접 서빙 | GitHub Pages 정적 호스팅 + GitHub Actions 배포 |

---

## 프로젝트 구조

```
portfolio/
├─ index.html              # SPA 셸 (Home / Introduce / Career / Project)
├─ css/
│  ├─ input.css            # Tailwind 진입점
│  ├─ styles.css           # 커스텀 컴포넌트 스타일 + .prose 타이포그래피
│  └─ output.css           # (빌드 결과물 — git 무시)
├─ js/
│  └─ app.js               # History API 라우터(클린 URL) + 정적 JSON 렌더링
├─ admin/
│  ├─ index.html           # Decap CMS 진입점
│  └─ config.yml           # CMS 컬렉션/백엔드 설정
├─ content/
│  ├─ projects/*.md        # 프로젝트 (frontmatter + 본문)
│  └─ careers/*.md         # 경력 (frontmatter만)
├─ static/images/          # 업로드 이미지 (Decap media_folder)
├─ scripts/
│  ├─ build-content.js     # content/*.md → dist/data/*.json (gray-matter + marked)
│  ├─ copy-static.js       # 정적 자산 → dist/
│  ├─ clean.js             # dist/ 초기화
│  └─ serve.js             # 로컬 미리보기 서버 (의존성 없음)
├─ .github/workflows/deploy.yml   # GitHub Pages 자동 배포
├─ tailwind.config.js
└─ package.json
```

빌드 결과물은 모두 `dist/`에 생성되며, 이 폴더가 그대로 GitHub Pages에 배포됩니다.

---

## 콘텐츠 작성 형식

### 프로젝트 — `content/projects/<slug>.md`

파일 이름(`<slug>`)이 상세 페이지 URL(`/project/<slug>`)이 됩니다.

```markdown
---
title: 개발자 포트폴리오 사이트
year: "2026"                         # 문자열. "2024.01 - 2024.06" 같은 기간도 가능
description: 한 줄 요약 설명
stack:                               # 배열
  - HTML
  - Tailwind CSS
link: https://github.com/you/repo    # 선택 (없으면 비워두기)
thumbnail: /static/images/cover.png  # 선택 (없으면 아이콘 플레이스홀더 표시)
---

## 상세 내용

여기부터가 본문입니다. **마크다운** 문법(제목, 리스트, 코드블럭, 인용문, 링크 등)을
그대로 사용할 수 있으며, 빌드 시 HTML로 렌더링됩니다.
```

### 경력 — `content/careers/<slug>.md`

경력은 본문 없이 frontmatter만 사용합니다.

```markdown
---
company: 브라이트벨
position: Backend Developer
freelance: false         # true면 "프리랜서" 배지 표시 (회사 소속이 아닌 경우)
start_date: "2024-01"    # YYYY-MM
end_date: ""             # 비우면 "재직중"으로 표시 (freelance면 배지 생략)
description: 담당 업무 설명
---
```

> 프리랜서 경력은 `freelance: true`로 두고 `company`에 `프리랜서`(또는 클라이언트명)를
> 적으면, 카드에 회사 소속과 구분되는 **프리랜서** 배지가 붙습니다.

### 사이트 설정 — `content/settings/site.md`

Home 히어로(직함·이름·한 줄 소개)와 Introduce 섹션(자기소개 본문·Skills)을 관리합니다.
CMS의 **사이트 설정 → 홈 / 소개**에서 편집하며, 값이 없으면 `index.html`의 기본값이 표시됩니다.

```markdown
---
role: Developer            # Home 대형 타이틀
name: 박주형               # Home 우측 하단 이름
tagline: 한 줄 소개
skills:                    # Introduce의 Skills 배지 목록
  - JavaScript
  - Node.js
---

자기소개 본문입니다. **마크다운**으로 작성하며 Introduce 섹션에 렌더링됩니다.
```

> 이미지 경로는 `/static/images/...` 형태로 참조합니다. 빌드 스크립트가 앞의 `/`를
> 제거해 상대 경로로 바꾸므로, 프로젝트 페이지(`user.github.io/portfolio/`)의 하위 경로에서도
> 이미지가 정상적으로 로드됩니다.

---

## 로컬에서 미리보기 / 빌드

```bash
# 1) 의존성 설치 (최초 1회)
npm install

# 2) 전체 빌드 (content → JSON, Tailwind CSS, 정적 자산 복사 → dist/)
npm run build

# 3) 미리보기 서버 실행 → http://localhost:8080
npm run preview
```

개별 스크립트:

| 명령 | 설명 |
| --- | --- |
| `npm run build:content` | `content/*.md`를 파싱해 `dist/data/*.json` 생성 |
| `npm run build:css` | Tailwind CSS 빌드 (`dist/css/output.css`) |
| `npm run build` | clean → 자산 복사 → content 빌드 → CSS 빌드 |
| `npm run preview` | `dist/`를 로컬 서버로 서빙 |
| `npm run dev` | CSS watch + 미리보기 서버 동시 실행 |

> `npm run dev`는 CSS만 자동 반영됩니다. `content/*.md`를 수정했다면
> `npm run build:content`를 다시 실행하세요.

---

## GitHub Pages 활성화

1. 이 저장소를 GitHub(`wngudpark/portfolio`)에 push 합니다.
2. 저장소 **Settings → Pages**로 이동합니다.
3. **Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
   (브랜치 선택 방식이 아닌 Actions 방식입니다.)
4. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 실행되어
   자동으로 빌드 후 배포됩니다.

배포 URL: **https://wngudpark.github.io/portfolio/**

### 클린 URL(해시 없는 경로) 처리 방식

라우팅은 `#` 없는 **클린 URL**(`/project`, `/project/<slug>`)을 사용합니다. 정적 호스팅에서
이를 동작시키기 위해 빌드가 두 가지를 준비합니다.

- **`dist/404.html`** — `index.html` 복사본. GitHub Pages는 존재하지 않는 경로에 이 파일을
  URL 그대로 서빙하므로, `/project/<slug>` 같은 딥링크·새로고침에서도 앱이 그대로 로드됩니다.
- **`<base>` 태그** — `index.html` 최상단 스크립트가 사이트 base 경로를 감지해
  삽입합니다. 덕분에 프로젝트 페이지 서브경로(`/portfolio/`)나 중첩 경로에서도
  `css/`·`js/`·`data/` 같은 상대 경로 자산이 항상 올바르게 로드됩니다.

> base 자동 감지는 `*.github.io` **프로젝트 페이지**(`/<repo>/`)와 커스텀 도메인/루트(`/`)를
> 지원합니다. 사용자·조직 페이지(`<user>.github.io` 리포지토리, 루트 서빙)를 쓴다면
> `index.html`의 감지 스크립트에서 base를 `'/'`로 고정하세요.

### CI가 하는 일

`main`에 push(직접 커밋 또는 CMS 커밋)될 때마다:

1. `content/*.md`를 파싱해 정적 JSON을 재생성하고
2. Tailwind CSS를 빌드한 뒤
3. `dist/`를 공식 GitHub Pages 액션(`actions/deploy-pages`)으로 배포합니다.

---

## Decap CMS 접속 및 GitHub OAuth 연동

### 접속 경로

배포 후 **`https://wngudpark.github.io/portfolio/admin/`** 로 접속합니다.
사이트 상단 내비게이션의 **Admin** 버튼도 이 경로로 연결됩니다.

### ⚠️ OAuth 프록시가 필요합니다

Decap CMS의 `github` 백엔드는 GitHub OAuth로 로그인하는데, OAuth 토큰 교환에는
**클라이언트 시크릿을 다루는 서버 측 처리**가 필요합니다. GitHub Pages는 정적
호스팅이라 이 처리를 할 수 없으므로, **별도의 OAuth 프록시**를 두어야 합니다.
가장 간단한 방법은 **Cloudflare Worker** 기반 프록시입니다. (무료 티어로 충분)

전체 흐름:

```
브라우저(/admin) ──▶ OAuth 프록시(/auth) ──▶ GitHub 로그인/승인
     ▲                                            │
     └──── access token ◀── 프록시(/callback) ◀───┘
```

### 1) GitHub OAuth App 생성

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**

- **Application name**: 아무 이름 (예: `portfolio-cms`)
- **Homepage URL**: `https://wngudpark.github.io/portfolio/`
- **Authorization callback URL**: 프록시의 콜백 주소
  예) `https://portfolio-oauth.<계정>.workers.dev/callback`

생성 후 표시되는 **Client ID**와, 새로 발급한 **Client Secret**을 복사해 둡니다.

### 2) Cloudflare Worker OAuth 프록시 배포

Decap용 공개 OAuth 프록시 Worker를 사용합니다. 예를 들어
[`sterlingwes/decap-proxy`](https://github.com/sterlingwes/decap-proxy)
또는 [`sveltia/sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth)
같은 오픈소스 Worker를 그대로 배포하면 됩니다. (둘 다 Decap/Netlify CMS 호환)

1. Cloudflare 대시보드 → **Workers & Pages → Create → Worker** 로 Worker를 만들거나,
   위 저장소를 `wrangler`로 배포합니다.
2. Worker 환경 변수(**Settings → Variables**)에 OAuth 앱 정보를 등록합니다.

   | 변수 | 값 |
   | --- | --- |
   | `GITHUB_CLIENT_ID` | 1)에서 복사한 Client ID |
   | `GITHUB_CLIENT_SECRET` | 1)에서 복사한 Client Secret |

   > 변수 이름은 사용하는 Worker 구현마다 다를 수 있습니다
   > (`OAUTH_CLIENT_ID` 등). 해당 저장소 README를 확인하세요.

3. 배포된 Worker 주소(예: `https://portfolio-oauth.<계정>.workers.dev`)를 확인합니다.
4. 이 Worker의 콜백 경로(`/callback`)가 1)의 **Authorization callback URL**과
   정확히 일치해야 합니다.

### 3) `admin/config.yml`의 `base_url` 수정

`admin/config.yml`의 백엔드 설정을 프록시 주소로 바꿉니다.

```yaml
backend:
  name: github
  repo: wngudpark/portfolio
  branch: main
  base_url: https://portfolio-oauth.<계정>.workers.dev   # ← 배포한 Worker 주소
  # auth_endpoint: auth   # 기본값. Worker 구현이 다른 경로를 쓰면 맞춰 수정
```

수정 후 push → 재배포하면, `/admin`에서 **"Login with GitHub"** 버튼으로 로그인할 수
있습니다. 저장소에 push 권한이 있는 GitHub 계정만 편집·커밋할 수 있습니다.

### 로컬에서 CMS 테스트 (선택)

OAuth 없이 로컬에서 편집을 테스트하려면 Decap의 로컬 백엔드를 사용합니다.

1. `admin/config.yml`에서 `local_backend: true` 주석을 해제합니다.
2. 별도 터미널에서 프록시 서버를 실행합니다: `npx decap-server`
3. `npm run build && npm run preview` 후 `http://localhost:8080/admin/` 접속.

로컬 백엔드는 GitHub 대신 로컬 파일(`content/`)에 바로 저장합니다.
배포 전에는 반드시 `local_backend`를 다시 주석 처리하세요.

---

## 편집 → 배포 흐름 정리

1. `/admin`에서 GitHub 로그인 후 프로젝트/경력을 추가·수정하고 **Publish**.
2. Decap CMS가 `content/**/*.md`(및 업로드 이미지)를 `main`에 커밋.
3. push를 감지한 GitHub Actions가 JSON·CSS를 다시 빌드해 Pages에 배포.
4. 수십 초 뒤 사이트에 반영됩니다.
