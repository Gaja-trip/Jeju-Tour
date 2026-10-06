import { randomBytes, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const QRCode = require("../.test-output/invite-tools/node_modules/qrcode");
const jsQR = require("../.test-output/invite-tools/node_modules/jsqr");
const { PNG } = require("../.test-output/invite-tools/node_modules/pngjs");
const expires = new Date(process.argv[2]);
if (!Number.isFinite(expires.getTime()) || expires <= new Date()) throw new Error("Provide a future expiry timestamp.");
const output = resolve(".private", "jeju-invites-" + new Date().toISOString().replace(/[:.]/g, "-"));
await mkdir(output, { recursive: true });
const invitations = [];
for (let slot = 1; slot <= 8; slot++) {
  const token = randomBytes(32).toString("base64url");
  const url = new URL("https://jeju-gaja.vercel.app/course.html?panel=participants");
  url.hash = new URLSearchParams({ invite: token }).toString();
  const hash = createHash("sha256").update(token).digest("hex");
  const filename = `participant-${String(slot).padStart(2, "0")}.png`;
  const png = await QRCode.toBuffer(url.href, { width: 480, margin: 4, errorCorrectionLevel: "M" });
  const decoded = PNG.sync.read(png);
  const qr = jsQR(new Uint8ClampedArray(decoded.data), decoded.width, decoded.height);
  if (qr?.data !== url.href) throw new Error("QR decode check failed: " + slot);
  await writeFile(join(output, filename), png, { mode: 0o600 });
  invitations.push({ slot, token, hash, url: url.href, filename });
}
const expiry = expires.toISOString();
await writeFile(join(output, "manifest.json"), JSON.stringify({ tripId: "jeju-gaja", expiresAt: expiry, invitations }, null, 2), { mode: 0o600 });
const values = invitations.map((i) => `('jeju-gaja', ${i.slot}, '${i.hash}', '${expiry}'::timestamptz)`).join(",\n");
await writeFile(join(output, "register.sql"), `begin;\ninsert into jeju_private.participant_invitations(trip_id, slot, token_hash, expires_at) values\n${values};\nupdate jeju_private.trip_access set invitation_only = true where trip_id = 'jeju-gaja';\ncommit;\n`, { mode: 0o600 });
const date = expires.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
const cards = invitations.map((i) => `<article><h2>참가자 ${String(i.slot).padStart(2, "0")}</h2><img src="${i.filename}" width="240" height="240" alt="참가자 ${i.slot} 개인 초대 QR"><input aria-label="참가자 ${i.slot} 초대 링크" readonly value="${i.url}"><div><button type="button" onclick="navigator.clipboard.writeText(this.closest('article').querySelector('input').value).then(()=>this.textContent='복사됨').catch(()=>this.closest('article').querySelector('input').select())">링크 복사</button><a href="${i.filename}" download>QR 저장</a></div></article>`).join("");
await writeFile(join(output, "index.html"), `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>제주 여행 개인 초대 QR 8명</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f7f9;color:#19272c;font:16px/1.65 system-ui,sans-serif}header,main{max-width:1040px;margin:auto;padding:24px}h1{font-size:26px;margin:0 0 12px}p{margin:8px 0}.notice{border-left:4px solid #c2453b;padding-left:16px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px;padding-top:0}article{border:1px solid #d4dce0;border-radius:8px;background:white;padding:18px;text-align:center;min-width:0}h2{font-size:18px;margin:0 0 10px}img{display:block;margin:auto;max-width:100%;height:auto}input{width:100%;padding:10px;margin:12px 0;border:1px solid #cbd5da;border-radius:4px;font:12px system-ui}article div{display:flex;justify-content:center;gap:16px}button,a{font:inherit;color:#086a56}button{border:0;background:none;cursor:pointer}@media print{body{background:white}header,main{padding:10px}main{grid-template-columns:repeat(2,1fr)}article{break-inside:avoid}button{display:none}}</style><header><h1>제주 여행 개인 초대 QR</h1><p class="notice">운영자 전용. 이 페이지 전체는 공유하지 말고, 참가자마다 QR 또는 링크 하나만 전달하세요.</p><p>휴대폰의 기본 카메라로 QR을 연 뒤 참가 이름을 등록합니다. 위치 공유는 본인이 동의하고 시작할 때만 켜집니다.</p><p>처음 등록한 브라우저에 연결됩니다. 다른 기기, 브라우저 정보 삭제, 기기 연결 해제 시 재발급이 필요합니다.</p><p>이용 만료: ${date} (한국 시간)</p></header><main>${cards}</main></html>`, { mode: 0o600 });
console.log(JSON.stringify({ output, count: invitations.length, expiresAt: expiry, qrDecoded: 8 }));
