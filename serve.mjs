// StructViz ローカル起動用の簡易HTTPサーバー（ビルド済み dist/ を配信）
// npm install 不要。Node.js 標準モジュールのみ使用。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const URL_TO_OPEN = 'http://127.0.0.1:4173/';
const openBrowser = () => exec(`start "" ${URL_TO_OPEN}`);

const root = fileURLToPath(new URL('./dist', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root + sep) && filePath !== root) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
    let data;
    try {
      if (urlPath === '/' || urlPath.endsWith('/')) filePath = join(filePath, 'index.html');
      data = await readFile(filePath);
    } catch {
      // SPAフォールバック
      filePath = join(root, 'index.html');
      data = await readFile(filePath);
    }
    res.writeHead(200, { 'content-type': types[extname(filePath).toLowerCase()] ?? 'application/octet-stream' });
    res.end(data);
  } catch (e) {
    res.writeHead(500);
    res.end(String(e));
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('StructViz は既に起動しています。ブラウザを開きます: ' + URL_TO_OPEN);
    openBrowser();
    setTimeout(() => process.exit(0), 1500);
  } else {
    console.error('起動に失敗しました: ' + err.message);
    process.exitCode = 1;
  }
});

server.listen(4173, '127.0.0.1', () => {
  console.log('StructViz が起動しました: ' + URL_TO_OPEN);
  console.log('終了するにはこのウィンドウを閉じるか Ctrl+C を押してください。');
  openBrowser();
});
