import { backup, DatabaseSync } from 'node:sqlite';
import { mkdirSync, cpSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { loadConfig, SERVER_DIR } from './config.mjs';

function snapshotName() { return `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`; }

export async function backupData(config) {
  const source = join(config.dataDir, 'jeju-tour.sqlite');
  if (!existsSync(source)) throw new Error('저장된 데이터가 없습니다. 먼저 서버를 한 번 실행해주세요.');
  const destination = join(config.backupDir, snapshotName());
  mkdirSync(destination, { recursive: true });
  const db = new DatabaseSync(source, { readOnly: true });
  try {
    // SQLite backup API gives a consistent database even while the server is running.
    await backup(db, join(destination, 'jeju-tour.sqlite'));
    // Records and their files are append-only; deleting in the UI only archives records.
    cpSync(join(config.dataDir, 'participants'), join(destination, 'participants'), { recursive: true, errorOnExist: true, force: false });
    writeFileSync(join(destination, 'backup-info.json'), JSON.stringify({ createdAt: new Date().toISOString(), eventStart: config.eventStart, eventEnd: config.eventEnd, schemaVersion: 1 }, null, 2));
    writeFileSync(join(destination, 'BACKUP-COMPLETE.txt'), 'Database and participant files copied successfully.\n');
    return destination;
  } finally { db.close(); }
}

export function exportData(config) {
  const source = join(config.dataDir, 'jeju-tour.sqlite');
  if (!existsSync(source)) throw new Error('저장된 데이터가 없습니다. 먼저 서버를 실행해주세요.');
  const destination = join(SERVER_DIR, 'exports', snapshotName());
  mkdirSync(destination, { recursive: true });
  const db = new DatabaseSync(source, { readOnly: true });
  try {
    db.exec('BEGIN');
    const participants = db.prepare('SELECT * FROM participants ORDER BY name').all();
    const statement = db.prepare('SELECT * FROM records WHERE participant_id = ? ORDER BY date DESC, created_at DESC');
    const csv = [['이름', '날짜', '운동 종류', '분', '사진 수', '삭제일', '인증 ID']];
    for (const participant of participants) {
      const records = statement.all(participant.id).map((record) => ({ ...record, photos: JSON.parse(record.photos) }));
      const folder = join(destination, participant.folder);
      mkdirSync(folder);
      writeFileSync(join(folder, 'records.json'), JSON.stringify({ name: participant.name, participantId: participant.id, records }, null, 2));
      for (const record of records) csv.push([participant.name, record.date, record.activity, record.minutes, record.photos.length, record.deleted_at || '', record.id]);
    }
    const escape = (value) => {
      let text = String(value);
      if (/^[=+@\-\t\r]/.test(text)) text = `'${text}`;
      return `"${text.replaceAll('"', '""')}"`;
    };
    writeFileSync(join(destination, 'records.csv'), '\uFEFF' + csv.map((row) => row.map(escape).join(',')).join('\r\n'));
    db.exec('COMMIT');
    return destination;
  } finally { db.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = loadConfig();
    const action = process.argv[2];
    if (action === 'backup') console.log(`백업 완료: ${await backupData(config)}`);
    else if (action === 'export') console.log(`이름별 내보내기 완료: ${exportData(config)}`);
    else throw new Error('사용법: node server/manage.mjs backup 또는 export');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
