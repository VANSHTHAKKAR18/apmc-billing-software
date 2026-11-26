const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3456;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // Remove query strings
  filePath = filePath.split('?')[0];

  // If file doesn't exist, serve index.html (SPA fallback)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  APMC Unjha Billing Software`);
  console.log(`  Running at: http://localhost:${PORT}`);
  console.log(`  Opening in browser...\n`);

  // Auto-open in default browser
  const url = `http://localhost:${PORT}`;
  switch (process.platform) {
    case 'win32': exec(`start "" "${url}"`); break;
    case 'darwin': exec(`open "${url}"`); break;
    default: exec(`xdg-open "${url}"`); break;
  }

  console.log(`  Press Ctrl+C to stop the software.\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n  Shutting down APMC Unjha Billing...');
  server.close();
  process.exit(0);
});
