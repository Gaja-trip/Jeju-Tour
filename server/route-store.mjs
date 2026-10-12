import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { HttpError, LIMITS, imageType } from './store.mjs';

export function validateRoutePost(input) {
  const text = (value, max, label, required = false, multiline = false) => {
    if (typeof value !== 'string') throw new HttpError(400, label + '을 확인해주세요.');
    let clean = value.normalize('NFC').trim();
    clean = multiline ? clean.replace(/\r\n?/g, '\n') : clean.replace(/\s+/gu, ' ');
    if ((required && !clean) || clean.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(clean)) throw new HttpError(400, label + '은 ' + (required ? '1' : '0') + '~' + max + '자로 입력해주세요.');
    return clean;
  };
  if (!['accident', 'photo'].includes(input.kind)) throw new HttpError(400, '사고지점 또는 사진 기록을 선택해주세요.');
  if (!/^day[1-4]$/.test(input.day)) throw new HttpError(400, '기록 일차를 확인해주세요.');
  const coordinate = (value, limit) => {
    if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > limit) throw new HttpError(400, '지도에서 올바른 위치를 선택해주세요.');
    return Number(value);
  };
  if (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.requestId)) throw new HttpError(400, '등록 식별자를 확인해주세요.');
  return { kind: input.kind, day: input.day, title: text(input.title, 80, '제목', true), note: text(input.note, 2000, '설명', false, true),
    author: text(input.author, 40, '작성자'), latitude: coordinate(input.latitude, 90), longitude: coordinate(input.longitude, 180), requestId: input.requestId };
}

export function openRouteStore(config, db) {
  mkdirSync(join(config.dataDir, 'route-posts'), { recursive: true });
  db.exec(
    "CREATE TABLE IF NOT EXISTS route_posts (id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('accident','photo')), day TEXT NOT NULL CHECK(day IN ('day1','day2','day3','day4')), title TEXT NOT NULL, note TEXT NOT NULL, author TEXT NOT NULL, latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90), longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180), created_at TEXT NOT NULL, request_id TEXT NOT NULL UNIQUE, request_hash TEXT NOT NULL, deleted_at TEXT) STRICT;" +
    "CREATE TABLE IF NOT EXISTS route_photos (id TEXT PRIMARY KEY, post_id TEXT NOT NULL REFERENCES route_posts(id), mime TEXT NOT NULL, size INTEGER NOT NULL, path TEXT NOT NULL, position INTEGER NOT NULL) STRICT;" +
    "CREATE INDEX IF NOT EXISTS route_posts_day ON route_posts(day, created_at);" +
    "CREATE INDEX IF NOT EXISTS route_photos_post ON route_photos(post_id, position);"
  );
  const photosFor = db.prepare('SELECT id, mime, size FROM route_photos WHERE post_id = ? ORDER BY position');
  const publicPost = (row) => ({ id: row.id, kind: row.kind, day: row.day, title: row.title, note: row.note, author: row.author,
    latitude: row.latitude, longitude: row.longitude, createdAt: row.created_at,
    photos: photosFor.all(row.id).map((photo) => ({ ...photo, url: '/api/route-photos/' + photo.id })) });
  function list(day) {
    if (day && !/^day[1-4]$/.test(day)) throw new HttpError(400, '기록 일차를 확인해주세요.');
    const rows = day ? db.prepare('SELECT * FROM route_posts WHERE deleted_at IS NULL AND day = ? ORDER BY created_at DESC, id DESC').all(day) :
      db.prepare('SELECT * FROM route_posts WHERE deleted_at IS NULL ORDER BY created_at DESC, id DESC').all();
    return { records: rows.map(publicPost), limits: LIMITS };
  }
  function save(input, photos) {
    const entry = validateRoutePost(input);
    if (photos.length > LIMITS.maxPhotos) throw new HttpError(400, '사진은 최대 3장까지 첨부할 수 있습니다.');
    if (entry.kind === 'photo' && !photos.length) throw new HttpError(400, '사진 기록에는 사진을 한 장 이상 첨부해주세요.');
    const verified = photos.map((photo) => {
      if (!photo.bytes.length || photo.bytes.length > LIMITS.maxPhotoBytes) throw new HttpError(400, '사진 한 장은 0바이트보다 크고 8MB 이하여야 합니다.');
      return { ...photo, ...imageType(photo.bytes) };
    });
    const hash = createHash('sha256').update(JSON.stringify(entry));
    for (const photo of verified) hash.update(createHash('sha256').update(photo.bytes).digest());
    const requestHash = hash.digest('hex');
    let directory;
    db.exec('BEGIN IMMEDIATE');
    try {
      const previous = db.prepare('SELECT * FROM route_posts WHERE request_id = ?').get(entry.requestId);
      if (previous) {
        if (previous.request_hash !== requestHash || previous.deleted_at) throw new HttpError(409, '같은 등록 식별자로 다른 기록을 저장할 수 없습니다.');
        db.exec('COMMIT');
        return { record: publicPost(previous), duplicate: true };
      }
      const id = randomUUID(), createdAt = new Date().toISOString();
      directory = join(config.dataDir, 'route-posts', id);
      mkdirSync(directory, { recursive: true });
      db.prepare('INSERT INTO route_posts (id,kind,day,title,note,author,latitude,longitude,created_at,request_id,request_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
        .run(id, entry.kind, entry.day, entry.title, entry.note, entry.author, entry.latitude, entry.longitude, createdAt, entry.requestId, requestHash);
      const saved = verified.map((photo, index) => {
        const photoId = randomUUID(), filename = photoId + '.' + photo.ext, relative = ['route-posts', id, filename].join('/');
        writeFileSync(join(directory, filename), photo.bytes, { flag: 'wx' });
        db.prepare('INSERT INTO route_photos (id,post_id,mime,size,path,position) VALUES (?,?,?,?,?,?)').run(photoId, id, photo.mime, photo.bytes.length, relative, index);
        return { id: photoId, mime: photo.mime, size: photo.bytes.length, path: relative };
      });
      writeFileSync(join(directory, 'record.json'), JSON.stringify({ id, ...entry, requestId: undefined, createdAt, photos: saved }, null, 2) + '\n', { flag: 'wx' });
      db.exec('COMMIT');
      return { record: publicPost({ id, ...entry, created_at: createdAt }), duplicate: false };
    } catch (error) {
      db.exec('ROLLBACK');
      if (directory) rmSync(directory, { recursive: true, force: true });
      throw error;
    }
  }
  function getPhoto(id) {
    const photo = db.prepare('SELECT p.path, p.mime FROM route_photos p JOIN route_posts r ON r.id=p.post_id WHERE p.id=? AND r.deleted_at IS NULL').get(id);
    if (!photo) throw new HttpError(404, '사진을 찾을 수 없습니다.');
    return photo;
  }
  return { list, save, getPhoto };
}
