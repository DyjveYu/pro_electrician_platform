// Lightweight static file server for previewing HTML in this workspace
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5500;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=UTF-8',
  '.htm': 'text/html; charset=UTF-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif'
};

function safeJoin(base, target) {
  const resolvedPath = path.resolve(base, target);
  if (!resolvedPath.startsWith(path.resolve(base))) {
    return null;
  }
  return resolvedPath;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = safeJoin(ROOT, urlPath === '/' ? '/preview_payment_autopay.html' : urlPath);
  if (!filePath) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Bad Request');
  }

  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Server Error');
      }
      res.writeHead(200, { 'Content-Type': type });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}/`);
  console.log('Root:', ROOT);
});