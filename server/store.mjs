import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { validDate } from './config.mjs';

export const LIMITS = { maxPhotos: 3, maxPhotoBytes: 8 * 1024 * 1024, maxBodyBytes: 25 * 1024 * 1024 };
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function validateEntry(input, config) {
  const clean = (value, max, label) => {
    if (typeof value !== 'string') throw new HttpError(400, `${label}을 입력해주세요.`);
    const normalized = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
    if (!normalized || normalized.length > max || /[\x00-\x1f\x7f]/u.test(normalized)) throw new HttpError(400, `${label}은 1~${max}자로 입력해주세요.`);
    return normalized;
  };
  const name = clean(input.name, 40, '이름');
  const activity = clean(input.activity, 80, '운동 종류');
  if (!validDate(input.date) || input.date < config.eventStart || input.date > config.eventEnd) throw new HttpError(400, `운동 날짜는 ${config.eventStart}부터 ${config.eventEnd} 사이여야 합니다.`);
  const minutes = Number(input.minutes);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) throw new HttpError(400, '운동 시간은 1~1440분 사이의 정수여야 합니다.');
  if (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.requestId)) throw new HttpError(400, '등록 식별자가 올바르지 않습니다. 페이지를 새로고침해주세요.');
  return { name, activity, date: input.date, minutes, requestId: input.requestId };
}

export function imageType(bytes) {
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0) return { ext: 'png', mime: 'image/png' };
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) return { ext: 'jpg', mime: 'image/jpeg' };
  if (bytes.length >= 30 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16)) && bytes.readUInt32LE(4) + 8 === bytes.length) return { ext: 'webp', mime: 'image/webp' };
  throw new HttpError(400, '사진은 JPG, PNG, WebP 파일만 첨부할 수 있습니다.');
}

export function openStore(config) {
  mkdirSync(join(config.dataDir, 'participants'), { recursive: true });
  const db = new DatabaseSync(join(config.dataDir, 'jeju-tour.sqlite'), { timeout: 5000 });
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA synchronous = FULL;
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, folder TEXT NOT NULL UNIQUE
    ) STRICT;
    CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id),
      date TEXT NOT NULL, activity TEXT NOT NULL, minutes INTEGER NOT NULL CHECK(minutes BETWEEN 1 AND 1440),
      created_at TEXT NOT NULL, photos TEXT NOT NULL, request_id TEXT NOT NULL UNIQUE,
      request_hash TEXT NOT NULL, deleted_at TEXT
    ) STRICT;
    CREATE INDEX IF NOT EXISTS records_participant_date ON records(participant_id, date);
  `);
  const selectRows = () => db.prepare(`SELECT r.*, p.name FROM records r JOIN participants p ON p.id = r.participant_id WHERE r.deleted_at IS NULL ORDER BY r.date DESC, r.created_at DESC, r.id`).all();
  const publicRecord = (row) => ({
    id: row.id, participantId: row.participant_id, name: row.name, date: row.date,
    activity: row.activity, minutes: row.minutes, createdAt: row.created_at,
    qualified: row.minutes >= 30,
    photos: JSON.parse(row.photos).map(({ id, mime, size }) => ({ id, mime, size, url: `/api/photos/${id}` })),
  });
  function snapshot() {
    const records = selectRows().map(publicRecord);
    const members = new Map();
    for (const record of records) {
      if (!members.has(record.participantId)) members.set(record.participantId, { id: record.participantId, name: record.name, recordCount: 0, days: new Set() });
      const member = members.get(record.participantId);
      member.recordCount += 1;
      if (record.qualified) member.days.add(record.date);
    }
    const participants = [...members.values()].map(({ days, ...member }) => ({ ...member, days: [...days].sort(), totalDays: days.size }))
      .sort((a, b) => b.totalDays - a.totalDays || a.name.localeCompare(b.name, 'ko'));
    return { event: { start: config.eventStart, end: config.eventEnd }, limits: LIMITS, participants, records };
  }
  function save(input, photos) {
    const entry = validateEntry(input, config);
    if (photos.length > LIMITS.maxPhotos) throw new HttpError(400, '사진은 최대 3장까지 첨부할 수 있습니다.');
    const verified = photos.map((photo) => {
      if (!photo.bytes.length || photo.bytes.length > LIMITS.maxPhotoBytes) throw new HttpError(400, '사진 한 장은 0바이트보다 크고 8MB 이하여야 합니다.');
      return { ...photo, ...imageType(photo.bytes) };
    });
    const hash = createHash('sha256').update(JSON.stringify(entry));
    for (const photo of verified) hash.update(createHash('sha256').update(photo.bytes).digest());
    const requestHash = hash.digest('hex');
    let recordDir;
    db.exec('BEGIN IMMEDIATE');
    try {
      const previous = db.prepare('SELECT r.*, p.name FROM records r JOIN participants p ON p.id = r.participant_id WHERE request_id = ?').get(entry.requestId);
      if (previous) {
        if (previous.request_hash !== requestHash || previous.deleted_at) throw new HttpError(409, '동일한 등록 식별자가 이미 사용되었습니다. 입력을 변경한 뒤 다시 등록해주세요.');
        db.exec('COMMIT');
        return { record: publicRecord(previous), duplicate: true };
      }
      let participant = db.prepare('SELECT * FROM participants WHERE name = ?').get(entry.name);
      if (!participant) {
        const id = randomUUID();
        // Prefix + UUID avoids Windows device names, path traversal and case collisions.
        const safeName = entry.name.replace(/[<>:"/\\|?*\x00-\x1f]/gu, '_').replace(/[. ]+$/u, '').slice(0, 40) || '참가자';
        participant = { id, name: entry.name, folder: `p-${safeName}--${id}` };
        db.prepare('INSERT INTO participants (id, name, folder) VALUES (?, ?, ?)').run(id, entry.name, participant.folder);
      }
      const id = randomUUID();
      const relativeDir = ['participants', participant.folder, entry.date, id];
      recordDir = join(config.dataDir, ...relativeDir);
      mkdirSync(recordDir, { recursive: true });
      const savedPhotos = verified.map((photo) => {
        const photoId = randomUUID();
        const filename = `${photoId}.${photo.ext}`;
        writeFileSync(join(recordDir, filename), photo.bytes, { flag: 'wx' });
        return { id: photoId, mime: photo.mime, size: photo.bytes.length, path: [...relativeDir, filename].join('/') };
      });
      const createdAt = new Date().toISOString();
      // Human-readable per-entry copy; SQLite remains the source of truth.
      writeFileSync(join(recordDir, 'record.json'), `${JSON.stringify({ id, name: entry.name, date: entry.date, activity: entry.activity, minutes: entry.minutes, createdAt, photos: savedPhotos }, null, 2)}\n`);
      db.prepare('INSERT INTO records (id, participant_id, date, activity, minutes, created_at, photos, request_id, request_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, participant.id, entry.date, entry.activity, entry.minutes, createdAt, JSON.stringify(savedPhotos), entry.requestId, requestHash);
      db.exec('COMMIT');
      return { record: publicRecord({ id, participant_id: participant.id, name: entry.name, date: entry.date, activity: entry.activity, minutes: entry.minutes, created_at: createdAt, photos: JSON.stringify(savedPhotos) }), duplicate: false };
    } catch (error) {
      db.exec('ROLLBACK');
      if (recordDir) rmSync(recordDir, { recursive: true, force: true });
      throw error;
    }
  }
  function getPhoto(id) {
    for (const row of db.prepare('SELECT photos FROM records WHERE deleted_at IS NULL').all()) {
      const photo = JSON.parse(row.photos).find((item) => item.id === id);
      if (photo) return photo;
    }
    throw new HttpError(404, '사진을 찾을 수 없습니다.');
  }
  function archive(id) {
    const result = db.prepare('UPDATE records SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL').run(new Date().toISOString(), id);
    if (!result.changes) throw new HttpError(404, '인증 기록을 찾을 수 없습니다.');
  }
  return { db, snapshot, save, getPhoto, archive, close: () => db.close() };
}
