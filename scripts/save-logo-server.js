// รับ base64 PNG จากหน้าเบราว์เซอร์ (ที่เรนเดอร์ SVG โลโก้ KKU) แล้วเขียนเป็นไฟล์
// ใช้: node scripts/save-logo-server.js  แล้วเปิดหน้าเว็บที่โพสต์ข้อมูลมาที่ http://127.0.0.1:8791/save
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8791;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'images');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 20 * 1024 * 1024) {
        res.writeHead(413);
        res.end('too large');
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      try {
        const { filename, dataUrl } = JSON.parse(body);
        if (!filename || !dataUrl) throw new Error('missing fields');
        if (!/^[\w.-]+\.png$/.test(filename)) throw new Error('bad filename');
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        const outPath = path.join(OUT_DIR, filename);
        fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
        console.log(`saved: ${outPath} (${fs.statSync(outPath).size} bytes)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, filename }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: String(err && err.message) }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`logo save server listening on http://127.0.0.1:${PORT}/save`);
});
