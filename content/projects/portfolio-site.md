---
title: 개발자 포트폴리오 사이트
year: "2026"
description: 정적 사이트 + Git 기반 CMS(Decap)로 만든 포트폴리오. GitHub 계정으로 로그인해 프로젝트와 경력을 직접 관리합니다.
stack:
  - HTML
  - Tailwind CSS
  - Vanilla JS
  - Decap CMS
  - GitHub Actions
link: https://github.com/wngudpark/portfolio
thumbnail: ""
---

## 프로젝트 개요

프레임워크 없이 **Vanilla JS**로 SPA를 구현하고, 콘텐츠는 저장소 안의 마크다운 파일로 관리하는 개인 포트폴리오입니다. 별도의 서버 없이 **GitHub Pages**로 배포됩니다.

### 주요 기능

- 새로고침 없는 섹션 전환 (해시 기반 라우팅)
- 마크다운으로 작성하는 프로젝트 상세 페이지
- GitHub 계정 로그인 기반 **Decap CMS** 편집 화면
- push 시 GitHub Actions로 자동 빌드 & 배포

### 기술적 포인트

1. 빌드 시점에 `content/*.md`를 파싱해 정적 JSON 생성 (`gray-matter` + `marked`)
2. 서버·DB 없이 동작하는 순수 정적 사이트
3. Tailwind CSS 로컬 빌드 파이프라인

> "복잡한 백엔드 없이도 충분히 관리 가능한 포트폴리오를 만들 수 있다."

빌드 스크립트는 아래처럼 마크다운을 읽어 JSON으로 변환합니다.

```js
const matter = require('gray-matter');
const { marked } = require('marked');

const { data, content } = matter(fileText);
const detail_html = marked.parse(content);
```

[GitHub 저장소 보기](https://github.com/wngudpark/portfolio)
