// Parses content/*.md into static JSON consumed by the frontend at build time.
// Uses gray-matter (frontmatter) + marked (markdown body -> HTML).
//
//   node scripts/build-content.js
//
// Output: dist/data/projects.json, dist/data/careers.json

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist', 'data');

// breaks: true → single newlines become <br>, matching what CMS authors expect
// when they press Enter in the markdown editor.
marked.setOptions({ gfm: true, breaks: true });

// Read every *.md file in content/<dir> into { id, data, content }.
// id is the filename without extension and is used as the route param (#/project/:id).
function readCollection(dir) {
  const abs = path.join(ROOT, 'content', dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(abs, file), 'utf8');
      const { data, content } = matter(raw);
      return { id: file.replace(/\.md$/, ''), data, content };
    });
}

// Strip a leading slash so asset paths resolve under a project subpath
// (e.g. https://user.github.io/portfolio/). Decap stores "/static/images/x.png";
// we serve it as the relative "static/images/x.png".
function toRelative(p) {
  if (!p) return null;
  return String(p).replace(/^\/+/, '');
}

// Same normalization for <img src> / <a href> inside rendered markdown bodies.
function rewriteAssetPaths(html) {
  return html.replace(/(src|href)="\/(static|assets)\//g, '$1="$2/');
}

function normalizeStack(stack) {
  if (Array.isArray(stack)) return stack.map((s) => String(s).trim()).filter(Boolean);
  if (typeof stack === 'string') return stack.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

// Up to 3 project images. Accepts the new `images` list, or falls back to a
// legacy single `thumbnail`. Paths are normalized to relative.
function normalizeImages(data) {
  let list = [];
  if (Array.isArray(data.images)) list = data.images;
  else if (data.thumbnail) list = [data.thumbnail];
  return list.map(toRelative).filter(Boolean).slice(0, 3);
}

// Extract sortable month keys from a free-form `year` like "2025.12 ~ 2026.07",
// "2026.05", or "2024". end = latest date (range end, or the single date);
// start = earliest date. Bare years count as December (latest within the year).
// "현재/진행중" style text → ongoing (sorts newest). No date → sorts last.
function projectDateKeys(year) {
  const str = String(year || '');
  const ongoing = /현재|진행|present|ongoing|now/i.test(str);
  const months = [];
  const re = /(\d{4})(?:[.\-/](\d{1,2}))?/g;
  let m;
  while ((m = re.exec(str)) !== null) {
    months.push(+m[1] * 12 + (m[2] ? +m[2] : 12));
  }
  return {
    end: ongoing ? Infinity : months.length ? Math.max(...months) : -Infinity,
    start: months.length ? Math.min(...months) : -Infinity
  };
}

// Descending compare that is safe for Infinity/-Infinity (avoids NaN).
function descCompare(a, b) {
  if (a === b) return 0;
  return b - a;
}

function buildProjects() {
  const items = readCollection('projects').map(({ id, data, content }) => {
    const images = normalizeImages(data);
    return {
      id,
      title: data.title || id,
      year: data.year != null ? String(data.year) : '',
      description: data.description || '',
      stack: normalizeStack(data.stack),
      link: data.link || '',
      images,
      thumbnail_url: images[0] || null, // first image = list card thumbnail
      detail_html: rewriteAssetPaths(marked.parse(content || ''))
    };
  });
  // Sort by end date (latest first); tie-break by start date, then id.
  items.sort((a, b) => {
    const ka = projectDateKeys(a.year);
    const kb = projectDateKeys(b.year);
    return descCompare(ka.end, kb.end) || descCompare(ka.start, kb.start) || a.id.localeCompare(b.id);
  });
  return items;
}

// Single "site" settings file drives the Home hero and the Introduce section.
function buildSettings() {
  const abs = path.join(ROOT, 'content', 'settings', 'site.md');
  if (!fs.existsSync(abs)) return {};
  const { data, content } = matter(fs.readFileSync(abs, 'utf8'));
  return {
    name: data.name || '',
    role: data.role || '',
    tagline: data.tagline || '',
    skills: normalizeStack(data.skills),
    intro_html: rewriteAssetPaths(marked.parse(content || ''))
  };
}

function buildCareers() {
  const items = readCollection('careers').map(({ id, data }) => ({
    id,
    company: data.company || '',
    position: data.position || '',
    freelance: !!data.freelance,
    start_date: data.start_date ? String(data.start_date) : '',
    end_date: data.end_date ? String(data.end_date) : '', // empty = 재직중
    description: data.description || ''
  }));
  // Most recent start_date first; entries without a start_date go last.
  items.sort((a, b) => {
    if (!a.start_date && !b.start_date) return a.id.localeCompare(b.id);
    if (!a.start_date) return 1;
    if (!b.start_date) return -1;
    return b.start_date.localeCompare(a.start_date);
  });
  return items;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const projects = buildProjects();
const careers = buildCareers();
const settings = buildSettings();
fs.writeFileSync(path.join(OUT_DIR, 'projects.json'), JSON.stringify(projects, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'careers.json'), JSON.stringify(careers, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'site.json'), JSON.stringify(settings, null, 2));
console.log(`Built ${projects.length} projects, ${careers.length} careers, site settings -> dist/data/`);
