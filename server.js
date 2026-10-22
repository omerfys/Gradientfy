import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let PORT = process.env.PORT ? parseInt(process.env.PORT) : 3030;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

if (!fs.existsSync(DIST_DIR)) {
  console.error('\x1b[31m[Error] dist/ folder not found. Please run "npm run build" first.\x1b[0m');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  let reqPath = decodeURIComponent(req.url?.split('?')[0] || '/');

  if (req.method === 'POST' && reqPath === '/api/save-thumbnail') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, dataUrl } = JSON.parse(body);
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const pubDir = path.join(__dirname, 'public', 'presets');
        const distDir = path.join(DIST_DIR, 'presets');
        if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });
        if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
        fs.writeFileSync(path.join(pubDir, `${id}.webp`), buffer);
        fs.writeFileSync(path.join(distDir, `${id}.webp`), buffer);
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true, id }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (reqPath === '/') {
    reqPath = '/index.html';
  }

  const relativePath = reqPath.replace(/^\/+/, '');
  let filePath = path.join(DIST_DIR, relativePath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    if (!path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
  }

  try {
    let stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stat = fs.statSync(filePath);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': (ext === '.html' || ext === '.webp' || ext === '.json') ? 'no-cache' : 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});
function startServer(portToTry) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${portToTry} in use, trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(portToTry, '0.0.0.0', () => {
    const url = `http://localhost:${portToTry}`;
    console.log('\n============================================================');
    console.log('   \x1b[35m✨ GRADIENTFY — 207 GPU GRADIENTS STUDIO ✨\x1b[0m');
    console.log('============================================================');
    console.log(` 🌐 \x1b[32mApp is running live at:\x1b[0m \x1b[36m${url}\x1b[0m`);
    console.log(' 🎨 Catalog: 207 Presets in 15 Collections');
    console.log(' ⚡ Shader Engine: WebGL2 / WebGPU 60 FPS');
    console.log(' 💾 Export: PNG, JPG, WebP, SVG, MP4, GIF, CSS & React');
    console.log('============================================================');
    console.log(' Press \x1b[33mCtrl+C\x1b[0m in this terminal to stop the server.\n');

    // Auto-open browser
    const startCmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
    exec(startCmd, () => {});
  });
}

startServer(PORT);
