// Copies the static site assets into dist/. Tailwind and build-content write
// their generated output (css/output.css, data/*.json) into dist/ separately.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Top-level files and directories to publish as-is.
// NOTE: static/images is handled separately by optimize-images.js (resize + compress).
const ENTRIES = ['index.html', 'favicon.svg', '.nojekyll', 'js', 'admin', 'css/styles.css'];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

for (const entry of ENTRIES) {
  const src = path.join(ROOT, entry);
  if (!fs.existsSync(src)) continue;
  copyRecursive(src, path.join(DIST, entry));
}

// SPA fallback for GitHub Pages: any unknown deep URL (e.g. /project/foo)
// is served this file, which is the same app shell as index.html.
fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(DIST, '404.html'));

console.log('Copied static assets (+ 404.html) -> dist/');
