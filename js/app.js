// ===== Vanilla JS SPA router (History API, clean URLs) + public content =====
// Data comes from static JSON generated at build time from content/*.md
// (see scripts/build-content.js). No backend / API.
//
// Clean URLs on a static host need: (1) a <base> tag (set in index.html) so
// relative assets resolve at any depth, and (2) a 404.html copy of index.html
// so deep links load the app on GitHub Pages. Both are handled by the build.

// Site base path, e.g. "/" locally or "/portfolio/" on a project page.
// Set by the inline detector in index.html; always ends with "/".
const BASE = (window.__BASE__ || '/').replace(/\/*$/, '/');

const ROUTES = ['home', 'introduce', 'career', 'project'];
const PAGES = [...ROUTES, 'project-detail'];
// Fallback skills used only if data/site.json fails to load.
const SKILLS = [
  'JavaScript', 'TypeScript', 'Node.js', 'Express',
  'React', 'HTML/CSS', 'Tailwind CSS', 'SQLite',
  'PostgreSQL', 'Git', 'Docker', 'Linux'
];

// Escape user-provided text before injecting into HTML.
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Sanitize pre-rendered markdown HTML (produced at build time by marked).
function sanitize(html) {
  return window.DOMPurify ? window.DOMPurify.sanitize(html || '') : (html || '');
}

// ===== Data (static JSON, fetched once and cached) =====
let _projectsPromise = null;
let _careersPromise = null;
let _settingsPromise = null;

function fetchJson(url) {
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`failed to load ${url}`);
    return r.json();
  });
}
function getProjects() {
  if (!_projectsPromise) _projectsPromise = fetchJson('data/projects.json');
  return _projectsPromise;
}
function getCareers() {
  if (!_careersPromise) _careersPromise = fetchJson('data/careers.json');
  return _careersPromise;
}
function getSettings() {
  if (!_settingsPromise) _settingsPromise = fetchJson('data/site.json');
  return _settingsPromise;
}

// Parse the current URL (minus the base) into a route.
// e.g. "/portfolio/project/portfolio-site" -> { name:'project', id:'portfolio-site' }
function parsePath() {
  let p = location.pathname;
  if (p.startsWith(BASE)) p = p.slice(BASE.length);
  const parts = p.replace(/^\/+/, '').split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home' };
  return { name: parts[0].toLowerCase(), id: parts[1] ? decodeURIComponent(parts[1]) : undefined };
}

// Programmatic navigation via the History API (clean URLs, no '#').
// `route` is the path after the base, e.g. '', 'career', 'project/portfolio-site'.
function navigate(route) {
  const url = BASE + String(route).replace(/^\/+/, '');
  if (location.pathname !== url) history.pushState({}, '', url);
  render();
}

function setActiveNav(route) {
  document.querySelectorAll('[data-route]').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === route);
  });
}

function showSection(id, { flex = false } = {}) {
  const sec = document.getElementById(id);
  if (!sec) return;
  sec.classList.remove('hidden');
  sec.classList.add(flex ? 'flex' : 'block', 'active-page');
}

function render() {
  const { name, id } = parsePath();

  // Hide everything first.
  PAGES.forEach((pid) => {
    const sec = document.getElementById(pid);
    if (sec) {
      sec.classList.add('hidden');
      sec.classList.remove('flex', 'block', 'active-page');
    }
  });

  if (name === 'project' && id) {
    showSection('project-detail');
    setActiveNav('project');
    loadProjectDetail(id);
  } else {
    const route = ROUTES.includes(name) ? name : 'home';
    showSection(route, { flex: route === 'home' });
    setActiveNav(route);
    if (route === 'project') loadProjects();
    if (route === 'career') loadCareers();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.lucide) window.lucide.createIcons();
}

// ===== Site settings (Home hero + Introduce), from data/site.json =====
async function applySettings() {
  let s = {};
  try {
    s = await getSettings();
  } catch (err) {
    // Keep the static defaults already in the HTML.
    renderSkills(SKILLS);
    return;
  }
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value) el.textContent = value;
  };
  set('home-role', s.role);
  set('home-name', s.name);
  set('home-tagline', s.tagline);

  const bio = document.getElementById('introduce-bio');
  if (bio && s.intro_html) bio.innerHTML = sanitize(s.intro_html);

  renderSkills(s.skills && s.skills.length ? s.skills : SKILLS);
}

// ===== Skills =====
function renderSkills(skills) {
  const wrap = document.getElementById('skills-list');
  wrap.innerHTML = (skills || SKILLS)
    .map(
      (s) =>
        `<span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">${escapeHtml(s)}</span>`
    )
    .join('');
}

// Format "2022-03" -> "2022.03"; returns '' for empty.
function formatMonth(value) {
  if (!value) return '';
  return String(value).replace(/-/g, '.');
}

// Build "2022.03 ~ 2024.06" or "2022.03 ~ 현재" (empty end_date = 재직중).
function formatPeriod(start, end) {
  const s = formatMonth(start);
  const e = end ? formatMonth(end) : '현재';
  if (!s && !end) return '현재';
  if (!s) return e;
  return `${s} ~ ${e}`;
}

// ===== Careers (public) =====
async function loadCareers() {
  const list = document.getElementById('career-list');
  const empty = document.getElementById('career-empty');
  list.innerHTML = `<p class="text-slate-400">불러오는 중...</p>`;

  try {
    const careers = await getCareers();

    if (!careers.length) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    list.innerHTML = careers.map((c) => careerCard(c)).join('');
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    list.innerHTML = `<p class="text-red-500">경력을 불러오지 못했습니다.</p>`;
  }
}

function careerCard(c) {
  const period = formatPeriod(c.start_date, c.end_date);
  // Freelance gets its own badge; "재직중" only for non-freelance ongoing roles.
  const freelance = c.freelance
    ? `<span class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">프리랜서</span>`
    : '';
  const current = !c.end_date && !c.freelance
    ? `<span class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">재직중</span>`
    : '';

  return `
    <article class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 class="text-lg font-bold text-slate-900">${escapeHtml(c.company)}</h3>
          <p class="mt-0.5 font-medium text-brand-600">${escapeHtml(c.position)}</p>
        </div>
        <div class="flex items-center gap-2">
          ${freelance}${current}
          <span class="whitespace-nowrap text-sm text-slate-400">${escapeHtml(period)}</span>
        </div>
      </div>
      ${c.description ? `<p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">${escapeHtml(c.description)}</p>` : ''}
    </article>`;
}

// ===== Projects list (public) =====
async function loadProjects() {
  const list = document.getElementById('project-list');
  const empty = document.getElementById('project-empty');
  list.innerHTML = `<p class="text-slate-400">불러오는 중...</p>`;

  try {
    const projects = await getProjects();

    if (!projects.length) {
      list.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');

    list.innerHTML = projects.map((p) => projectCard(p)).join('');
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    list.innerHTML = `<p class="text-red-500">프로젝트를 불러오지 못했습니다.</p>`;
  }
}

function projectCard(p) {
  const stack = (p.stack || [])
    .map(
      (s) =>
        `<span class="rounded bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">${escapeHtml(s)}</span>`
    )
    .join('');

  const linkHtml = p.link
    ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noopener"
         class="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-700">
         <i data-lucide="external-link" class="h-4 w-4"></i> 바로가기</a>`
    : '';

  // Thumbnail with an icon placeholder fallback when none is set.
  const thumbHtml = p.thumbnail_url
    ? `<img src="${escapeHtml(p.thumbnail_url)}" alt="${escapeHtml(p.title)}"
         class="mb-4 h-44 w-full rounded-lg object-cover" loading="lazy" />`
    : `<div class="mb-4 flex h-44 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-300">
         <i data-lucide="image" class="h-10 w-10"></i>
       </div>`;

  return `
    <article data-detail-id="${escapeHtml(p.id)}" role="link" tabindex="0"
      class="flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-100">
      ${thumbHtml}
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-lg font-bold text-slate-900">${escapeHtml(p.title)}</h3>
        ${p.year ? `<span class="whitespace-nowrap text-sm text-slate-400">${escapeHtml(p.year)}</span>` : ''}
      </div>
      ${p.description ? `<p class="mt-2 flex-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">${escapeHtml(p.description)}</p>` : '<div class="flex-1"></div>'}
      <div class="mt-4 flex flex-wrap gap-1.5">${stack}</div>
      <div class="mt-4 flex items-center justify-between">
        <span class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
          자세히 보기 <i data-lucide="arrow-right" class="h-4 w-4"></i>
        </span>
        ${linkHtml}
      </div>
    </article>`;
}

// ===== Project detail (public) =====
async function loadProjectDetail(id) {
  const body = document.getElementById('detail-body');
  body.innerHTML = `<p class="text-slate-400">불러오는 중...</p>`;

  try {
    const projects = await getProjects();
    const p = projects.find((x) => x.id === id);
    if (!p) {
      body.innerHTML = `<p class="text-slate-400">존재하지 않는 프로젝트입니다.</p>`;
      return;
    }
    body.innerHTML = detailHtml(p);
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    body.innerHTML = `<p class="text-red-500">상세 정보를 불러오지 못했습니다.</p>`;
  }
}

function detailHtml(p) {
  const stack = (p.stack || [])
    .map(
      (s) =>
        `<span class="rounded bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">${escapeHtml(s)}</span>`
    )
    .join('');

  // Detail view: show every image at full size (natural aspect, not cropped).
  const images = p.images && p.images.length ? p.images : (p.thumbnail_url ? [p.thumbnail_url] : []);
  const gallery = images.length
    ? `<div class="mt-6 space-y-4">${images
        .map(
          (src) =>
            `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.title)}"
               class="w-full rounded-xl border border-slate-200" loading="lazy" />`
        )
        .join('')}</div>`
    : '';

  const linkBtn = p.link
    ? `<a href="${escapeHtml(p.link)}" target="_blank" rel="noopener"
         class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
         <i data-lucide="external-link" class="h-4 w-4"></i> 바로가기</a>`
    : '';

  const content = p.detail_html
    ? sanitize(p.detail_html)
    : `<p class="text-slate-400">상세 내용이 아직 작성되지 않았습니다.</p>`;

  return `
    <header>
      <div class="flex flex-wrap items-center gap-3">
        <h1 class="text-3xl font-extrabold tracking-tight text-slate-900">${escapeHtml(p.title)}</h1>
        ${p.year ? `<span class="text-slate-400">${escapeHtml(p.year)}</span>` : ''}
      </div>
      ${p.description ? `<p class="mt-2 whitespace-pre-line text-slate-600">${escapeHtml(p.description)}</p>` : ''}
      ${stack ? `<div class="mt-4 flex flex-wrap gap-1.5">${stack}</div>` : ''}
      ${linkBtn ? `<div class="mt-5">${linkBtn}</div>` : ''}
      ${gallery}
    </header>
    <article class="prose mt-8 max-w-none">${content}</article>`;
}

// ===== Init =====
window.addEventListener('DOMContentLoaded', () => {
  applySettings();

  const mobileMenu = document.getElementById('mobile-menu');

  // Mobile menu toggle
  document.getElementById('menu-toggle').addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  // Intercept internal links (data-route) for client-side navigation.
  document.body.addEventListener('click', (e) => {
    const routeLink = e.target.closest('[data-route]');
    if (routeLink) {
      e.preventDefault();
      mobileMenu.classList.add('hidden');
      const r = routeLink.dataset.route;
      navigate(r === 'home' ? '' : r);
      return;
    }
    const back = e.target.closest('[data-back]');
    if (back) {
      e.preventDefault();
      navigate(back.dataset.back);
    }
  });

  // Project card -> detail (ignore clicks on real links inside the card).
  const list = document.getElementById('project-list');
  list.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const card = e.target.closest('[data-detail-id]');
    if (card) navigate(`project/${encodeURIComponent(card.dataset.detailId)}`);
  });
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('[data-detail-id]');
    if (card) {
      e.preventDefault();
      navigate(`project/${encodeURIComponent(card.dataset.detailId)}`);
    }
  });

  // Route on browser back/forward and on initial load.
  window.addEventListener('popstate', render);
  render();

  if (window.lucide) window.lucide.createIcons();
});

// expose for potential reuse
window.App = { navigate, loadProjects, loadCareers, escapeHtml, formatPeriod };
