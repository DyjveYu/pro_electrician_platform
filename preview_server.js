const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT ? Number(process.env.PORT) : (process.argv[2] ? Number(process.argv[2]) : 8003);
const root = __dirname;

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveFile(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      send(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    const ctype = typeMap[ext] || 'application/octet-stream';
    send(res, 200, { 'Content-Type': ctype }, data);
  });
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/preview_orders_ui_fixes.html';
  const filePath = path.join(root, urlPath.replace(/^\//, ''));

  fs.stat(filePath, (err, stat) => {
    if (err) {
      return send(res, 404, { 'Content-Type': 'text/plain' }, 'Not Found');
    }
    if (stat.isDirectory()) {
      const index = path.join(filePath, 'index.html');
      if (fs.existsSync(index)) return serveFile(index, res);
      return send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
    }
    serveFile(filePath, res);
  });
});

server.listen(port, () => {
  console.log(`Preview server running at http://127.0.0.1:${port}/`);
});