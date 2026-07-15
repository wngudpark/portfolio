// Minimal zero-dependency static server for previewing the built dist/ locally.
//   node scripts/serve.js   (or: npm run preview)
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.yml': 'text/yaml; charset=utf-8',
  '.ico': 'image/x-icon'
};

http
  .createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    let filePath = path.normalize(path.join(DIST, urlPath));
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    fs.stat(filePath, (err, st) => {
      if (!err && st.isDirectory()) filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, (e, data) => {
        if (e) {
          // Unknown path -> serve the SPA shell.
          return fs.readFile(path.join(DIST, 'index.html'), (e2, d2) => {
            if (e2) {
              res.writeHead(404);
              return res.end('Not found');
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(d2);
          });
        }
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
        res.end(data);
      });
    });
  })
  .listen(PORT, () => console.log(`Preview running: http://localhost:${PORT}`));
