import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

export const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
export const SITE_DIR = resolve(SERVER_DIR, '..');

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function loadConfig() {
  const configPath = resolve(SERVER_DIR, 'config.json');
  const defaults = JSON.parse(readFileSync(resolve(SERVER_DIR, 'config.example.json'), 'utf8'));
  const saved = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
  const config = { ...defaults, ...saved };
  if (!config.adminToken) {
    config.adminToken = randomBytes(24).toString('hex');
    writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('port는 1~65535 정수여야 합니다.');
  if (typeof config.host !== 'string' || !config.host) throw new Error('host를 입력해주세요.');
  if (!validDate(config.eventStart) || !validDate(config.eventEnd) || config.eventStart > config.eventEnd) throw new Error('이벤트 시작/종료일을 확인해주세요.');
  if (typeof config.adminToken !== 'string' || config.adminToken.length < 24) throw new Error('adminToken은 24자 이상이어야 합니다.');
  if (!Array.isArray(config.allowedOrigins) || config.allowedOrigins.some((origin) => {
    try { return new URL(origin).origin !== origin || !/^https?:/.test(origin); } catch { return true; }
  })) throw new Error('allowedOrigins에는 http(s) 출처만 입력해주세요.');
  return { ...config, dataDir: resolve(SERVER_DIR, config.dataDir), backupDir: resolve(SERVER_DIR, config.backupDir) };
}
