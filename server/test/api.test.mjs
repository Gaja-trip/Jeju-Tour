import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readdirSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../index.mjs';
import { backupData } from '../manage.mjs';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=', 'base64');

function payload(values = {}, photos = [PNG]) {
  const form = new FormData();
  const entry = { name: '홍길동', date: '2026-09-07', minutes: '30', activity: '야외 라이딩', requestId: randomUUID(), ...values };
  Object.entries(entry).forEach(([key, value]) => form.append(key, value));
  for (const photo of photos) form.append('photos', new Blob([photo], { type: 'image/png' }), '../../camera.png');
  return form;
}
async function start(config) {
  const app = createApp(config);
  app.server.listen(0, '127.0.0.1');
  await once(app.server, 'listening');
  return { ...app, url: `http://127.0.0.1:${app.server.address().port}` };
}
async function stop(app) {
  await new Promise((resolve, reject) => app.server.close((error) => error ? reject(error) : resolve()));
}

test('photo registration, participants, persistence, backup and access boundaries', async (t) => {
  const root = mkdtempSync(join(tmpdir(), 'jeju-tour-test-'));
  const config = { dataDir: join(root, 'data'), backupDir: join(root, 'backups'), eventStart: '2026-09-07', eventEnd: '2026-10-31', adminToken: 'test-admin-token-for-local-tests-only', allowedOrigins: ['https://tour.example'] };
  let app = await start(config);
  const get = (path) => fetch(app.url + path);
  const post = (values, photos) => fetch(app.url + '/api/records', { method: 'POST', body: payload(values, photos) });
  let first;
  try {
    await t.test('saves a Korean name, metadata and viewable photos in name/date folders', async () => {
      const response = await post();
      assert.equal(response.status, 201);
      first = (await response.json()).record;
      assert.equal(first.name, '홍길동');
      assert.equal(first.photos.length, 1);
      const photo = await get(first.photos[0].url);
      assert.equal(photo.headers.get('content-type'), 'image/png');
      assert.deepEqual(Buffer.from(await photo.arrayBuffer()), PNG);
      const folder = readdirSync(join(config.dataDir, 'participants'))[0];
      assert.ok(folder.startsWith('p-홍길동--'));
      assert.ok(existsSync(join(config.dataDir, 'participants', folder, '2026-09-07', first.id, 'record.json')));
      assert.equal((await get('/api/event')).status, 200);
    });
    await t.test('retries and concurrent requests are idempotent', async () => {
      const requestId = randomUUID();
      const responses = await Promise.all(Array.from({ length: 3 }, () => post({ requestId, date: '2026-09-08' })));
      assert.deepEqual(responses.map((r) => r.status).sort(), [200, 200, 201]);
      const ids = await Promise.all(responses.map(async (r) => (await r.json()).record.id));
      assert.equal(new Set(ids).size, 1);
      assert.equal((await post({ requestId, minutes: '60' })).status, 409);
    });
    await t.test('normalizes names, counts distinct qualifying days, keeps short sessions', async () => {
      await post({ name: '  홍길동  ', minutes: '45' }, []);
      await post({ name: '홍길동', date: '2026-09-09', minutes: '29' }, []);
      await post({ name: '김참가', minutes: '15' }, []);
      const snapshot = await (await get('/api/event')).json();
      assert.equal(snapshot.participants.length, 2);
      const hong = snapshot.participants.find((p) => p.name === '홍길동');
      assert.equal(hong.recordCount, 4);
      assert.equal(hong.totalDays, 2);
      assert.deepEqual(hong.days, ['2026-09-07', '2026-09-08']);
      assert.equal(snapshot.participants.find((p) => p.name === '김참가').totalDays, 0);
      assert.equal(snapshot.records.filter((r) => !r.qualified).length, 2);
    });
    await t.test('rejects invalid dates, fields, files and oversized uploads without saving', async () => {
      const count = app.store.snapshot().records.length;
      for (const values of [{ date: '2026-09-31' }, { date: '2026-09-06' }, { date: '2026-11-01' }, { minutes: '0' }, { minutes: '30.5' }, { minutes: '1441' }, { name: ' ' }, { name: '가'.repeat(41) }, { activity: '' }]) {
        assert.equal((await post(values)).status, 400, JSON.stringify(values));
      }
      assert.equal((await post({}, [Buffer.from('<svg onload="alert(1)"></svg>')])).status, 400);
      assert.equal((await post({}, [PNG, PNG, PNG, PNG])).status, 400);
      assert.equal((await post({}, [Buffer.alloc(8 * 1024 * 1024 + 1)])).status, 400);
      assert.equal((await post({}, [Buffer.alloc(25 * 1024 * 1024)])).status, 413);
      assert.equal(app.store.snapshot().records.length, count);
    });
    await t.test('names cannot escape storage and server files are not public', async () => {
      const response = await post({ name: '../CON\\test' }, []);
      assert.equal(response.status, 201);
      const folders = readdirSync(join(config.dataDir, 'participants'));
      assert.ok(folders.some((f) => f.startsWith('p-.._CON_test--')));
      for (const folder of folders) assert.ok(resolve(config.dataDir, 'participants', folder).startsWith(resolve(config.dataDir, 'participants') + sep));
      for (const path of ['/server/config.json', '/server/data/jeju-tour.sqlite', '/.git/config', '/package.json', '/assets/%2e%2e%2fserver/config.json', '/assets/%2e%2e%5cserver/config.json']) {
        assert.equal((await get(path)).status, 404, path);
      }
      assert.equal((await get('/event.html')).status, 200);
      assert.equal((await get('/course.html')).status, 200);
      assert.equal((await get('/event.js')).status, 200);
    });
    await t.test('allows configured site origins and rejects other origins', async () => {
      const allowed = await fetch(app.url + '/api/event', { headers: { Origin: 'https://tour.example' } });
      assert.equal(allowed.status, 200);
      assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://tour.example');
      const rejected = await fetch(app.url + '/api/records', { method: 'POST', headers: { Origin: 'https://other.example' }, body: payload() });
      assert.equal(rejected.status, 403);
    });
    await t.test('only an administrator can archive; archived photos stop being served', async () => {
      const path = app.url + '/api/records/' + first.id;
      assert.equal((await fetch(path, { method: 'DELETE' })).status, 401);
      assert.equal((await fetch(path, { method: 'DELETE', headers: { Authorization: 'Bearer wrong' } })).status, 401);
      assert.equal((await fetch(path, { method: 'DELETE', headers: { Authorization: `Bearer ${config.adminToken}` } })).status, 200);
      assert.equal((await get(first.photos[0].url)).status, 404);
      assert.equal(app.store.snapshot().records.some((r) => r.id === first.id), false);
      assert.equal(app.store.snapshot().participants.find((p) => p.name === '홍길동').totalDays, 2);
    });
    await t.test('server restart preserves entries and a backup restores on a new path', async () => {
      const before = app.store.snapshot();
      await stop(app);
      app = await start(config);
      assert.deepEqual(app.store.snapshot(), before);
      const destination = await backupData(config);
      assert.ok(existsSync(join(destination, 'BACKUP-COMPLETE.txt')));
      assert.equal(JSON.parse(readFileSync(join(destination, 'backup-info.json'))).schemaVersion, 1);
      const restoredDir = join(root, 'another-computer', 'data');
      cpSync(destination, restoredDir, { recursive: true });
      const restored = await start({ ...config, dataDir: restoredDir });
      try {
        assert.deepEqual(restored.store.snapshot(), before);
        const record = before.records.find((r) => r.photos.length);
        const photo = await fetch(restored.url + record.photos[0].url);
        assert.equal(photo.status, 200);
        assert.deepEqual(Buffer.from(await photo.arrayBuffer()), PNG);
      } finally { await stop(restored); }
    });
  } finally {
    await stop(app);
    // The temp root is created by this test and all derived paths stay beneath it.
    assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
    assert.ok(root.includes('jeju-tour-test-'));
    rmSync(root, { recursive: true, force: true });
  }
});
