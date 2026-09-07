import http from 'node:http';
import { stat, realpath } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { loadConfig, SITE_DIR } from './config.mjs';
import { openStore, HttpError, LIMITS } from './store.mjs';

const PUBLIC_FILES = new Set(['index.html', 'course.html', 'event.html', 'restaurants.html', 'schedule.html', 'live.html', 'transport.html', 'styles.css', 'app.js', 'gpx-route.js', 'event.js', 'event-config.js', 'logo.svg']);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gpx': 'application/gpx+xml', '.json': 'application/json', '.woff2': 'font/woff2' };

async function readBody(req, limit) {
  if (Number(req.headers['content-length']) > limit) throw new HttpError(413, '첨부 용량을 초과했습니다. 사진은 최대 3장, 장당 8MB입니다.');
  const chunks = [];
  let size = 0;
  // Do not destroy the socket on validation errors; the caller returns a useful HTTP response.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, '첨부 용량을 초과했습니다.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function createApp(config) {
  const store = openStore(config);
  let activeUploads = 0;
  const json = (res, status, value) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
  };
  function requireAdmin(req) {
    const provided = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer /, ''));
    const expected = Buffer.from(config.adminToken);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) throw new HttpError(401, '관리자 키를 확인해주세요.');
  }
  async function serveFile(req, res, path, mime, privatePhoto = false) {
    const info = await stat(path).catch(() => { throw new HttpError(404, '파일을 찾을 수 없습니다.'); });
    if (!info.isFile()) throw new HttpError(404, '파일을 찾을 수 없습니다.');
    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': info.size,
      'Cache-Control': privatePhoto ? 'private, no-store' : 'no-cache',
      ...(privatePhoto ? { 'Content-Security-Policy': "default-src 'none'; sandbox" } : {}),
    });
    if (req.method === 'HEAD') return res.end();
    const stream = createReadStream(path);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    try {
      const url = new URL(req.url, 'http://localhost');
      let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { throw new HttpError(400, '올바르지 않은 주소입니다.'); }
      if (pathname.startsWith('/api/')) {
        const origin = req.headers.origin;
        const sameOrigin = origin && [`http://${req.headers.host}`, `https://${req.headers.host}`].includes(origin);
        if (origin && !sameOrigin && !config.allowedOrigins.includes(origin)) throw new HttpError(403, '허용되지 않은 사이트에서 요청했습니다. 서버 주소로 접속해주세요.');
        if (origin) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Vary', 'Origin');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        }
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
        if (req.method === 'GET' && pathname === '/api/health') return json(res, 200, { ok: true });
        if (req.method === 'GET' && pathname === '/api/event') return json(res, 200, store.snapshot());
        if (req.method === 'GET' && pathname === '/api/admin') { requireAdmin(req); return json(res, 200, { ok: true }); }
        if (req.method === 'POST' && pathname === '/api/records') {
          if (!/^multipart\/form-data;.*boundary=/i.test(req.headers['content-type'] || '')) throw new HttpError(415, '사진 등록은 multipart/form-data 형식이어야 합니다.');
          if (activeUploads >= 4) throw new HttpError(503, '다른 사진을 저장 중입니다. 잠시 후 다시 등록해주세요.');
          activeUploads += 1;
          try {
            const body = await readBody(req, LIMITS.maxBodyBytes);
            let form;
            try { form = await new Response(body, { headers: { 'Content-Type': req.headers['content-type'] } }).formData(); }
            catch { throw new HttpError(400, '첨부파일 형식을 확인해주세요.'); }
            const allowed = new Set(['name', 'activity', 'date', 'minutes', 'requestId', 'photos']);
            for (const key of form.keys()) if (!allowed.has(key)) throw new HttpError(400, '지원하지 않는 등록 항목입니다.');
            const input = {};
            for (const key of ['name', 'activity', 'date', 'minutes', 'requestId']) {
              if (form.getAll(key).length !== 1) throw new HttpError(400, '등록 항목을 확인해주세요.');
              input[key] = form.get(key);
            }
            const files = form.getAll('photos');
            if (files.length > LIMITS.maxPhotos) throw new HttpError(400, '사진은 최대 3장까지 첨부할 수 있습니다.');
            const photos = [];
            for (const file of files) {
              if (typeof file === 'string') throw new HttpError(400, '사진 파일을 선택해주세요.');
              if (file.size > LIMITS.maxPhotoBytes) throw new HttpError(400, '사진 한 장은 8MB 이하여야 합니다.');
              photos.push({ bytes: Buffer.from(await file.arrayBuffer()) });
            }
            const result = store.save(input, photos);
            return json(res, result.duplicate ? 200 : 201, result);
          } finally { activeUploads -= 1; }
        }
        const recordMatch = pathname.match(/^\/api\/records\/([a-f0-9-]{36})$/);
        if (req.method === 'DELETE' && recordMatch) {
          requireAdmin(req);
          store.archive(recordMatch[1]);
          return json(res, 200, { ok: true });
        }
        const photoMatch = pathname.match(/^\/api\/photos\/([a-f0-9-]{36})$/);
        if (['GET', 'HEAD'].includes(req.method) && photoMatch) {
          const photo = store.getPhoto(photoMatch[1]);
          return await serveFile(req, res, resolve(config.dataDir, photo.path), photo.mime, true);
        }
        throw new HttpError(404, '요청한 기능을 찾을 수 없습니다.');
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new HttpError(405, '허용되지 않은 요청입니다.');
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      if (!PUBLIC_FILES.has(relative) && !/^assets\/(?!.*(?:^|\/)\.)(?!.*\\)[\s\S]+$/.test(relative)) throw new HttpError(404, '페이지를 찾을 수 없습니다.');
      const path = resolve(SITE_DIR, relative);
      if (!path.startsWith(SITE_DIR + sep)) throw new HttpError(404, '페이지를 찾을 수 없습니다.');
      const actualPath = await realpath(path).catch(() => { throw new HttpError(404, '페이지를 찾을 수 없습니다.'); });
      if (!actualPath.startsWith(await realpath(SITE_DIR) + sep)) throw new HttpError(404, '페이지를 찾을 수 없습니다.');
      return await serveFile(req, res, actualPath, MIME[extname(path).toLowerCase()] || 'application/octet-stream');
    } catch (error) {
      const status = error.status || 500;
      if (status === 500) console.error(new Date().toISOString(), error);
      if (!res.headersSent) {
        // Finish errors even if an oversized or malformed upload has unread data.
        if (req.method === 'POST') req.resume();
        json(res, status, { error: status === 500 ? '서버에서 처리하지 못했습니다. 잠시 후 다시 시도해주세요.' : error.message });
      }
    }
  });
  server.requestTimeout = 60_000;
  server.headersTimeout = 15_000;
  server.on('close', () => store.close());
  return { server, store };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  const { server } = createApp(config);
  server.on('error', (error) => { console.error(`서버 시작 실패: ${error.message}`); process.exitCode = 1; });
  server.listen(config.port, config.host, () => {
    console.log(`Jeju-Tour: http://localhost:${config.port}/course.html?panel=event`);
    console.log(`저장 폴더: ${config.dataDir}`);
    console.log(`관리자 키와 접속 설정: ${resolve(SITE_DIR, 'server/config.json')}`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
