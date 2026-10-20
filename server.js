const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function resolvePath(requestedPath) {
  const cleanPath = requestedPath.split('?')[0].replace(/^\/+/, '');
  const candidate = cleanPath === '' ? 'index.html' : cleanPath;
  
  const searchLocations = [
    path.join(__dirname, candidate),
    path.join(process.cwd(), candidate),
    path.join(__dirname, 'index.html'),
    path.join(process.cwd(), 'index.html')
  ];

  for (const loc of searchLocations) {
    if (fs.existsSync(loc) && fs.statSync(loc).isFile()) {
      return loc;
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const targetFile = resolvePath(req.url);

  if (!targetFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(targetFile, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading file');
      return;
    }
    
    // Add PWA service worker header if requested
    const headers = { 'Content-Type': contentType };
    if (path.basename(targetFile) === 'sw.js') {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Aura Music Server running at http://localhost:${PORT}/`);
  });
}

module.exports = server;
