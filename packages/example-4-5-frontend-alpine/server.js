/**
 * server.js — local dev server for the Alpine CDN example
 *
 * Serves:
 *   /             → index.html (CDN import map, requires internet)
 *   /dev          → dev.html   (local importmap, no CDN required)
 *   /src/*        → local source files
 *   /node_modules/* → workspace package files (resolves monorepo symlinks)
 *
 * Run: npm run serve
 * Open: http://localhost:3002/dev  (local packages, no internet needed)
 *        http://localhost:3002/    (CDN imports)
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3002;

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.mjs':  'application/javascript',
  '.json': 'application/json',
  '.css':  'text/css',
};

function serve(res, filePath, status = 200) {
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(status, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath;

  if (url.pathname === '/' || url.pathname === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else if (url.pathname === '/dev' || url.pathname === '/dev.html') {
    filePath = path.join(__dirname, 'dev.html');
  } else if (url.pathname.startsWith('/src/')) {
    filePath = path.join(__dirname, url.pathname);
  } else if (url.pathname.startsWith('/node_modules/')) {
    // Walk up to workspace root for monorepo node_modules.
    // fs.realpathSync resolves symlinks so we get the actual package files.
    const rel = url.pathname.slice('/node_modules/'.length);
    const candidates = [
      path.join(__dirname, 'node_modules', rel),
      path.join(__dirname, '../../node_modules', rel),
    ];
    filePath = candidates.find((p) => fs.existsSync(p)) || candidates[1];
    // Follow symlinks to reach the real file (workspace packages are symlinked)
    try { filePath = fs.realpathSync(filePath); } catch { /* leave as-is */ }
  } else {
    filePath = path.join(__dirname, url.pathname);
  }

  serve(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Dev server: http://localhost:${PORT}`);
  console.log('  /      → CDN imports (requires internet)');
  console.log('  /dev   → Local packages (no internet needed)');
});
