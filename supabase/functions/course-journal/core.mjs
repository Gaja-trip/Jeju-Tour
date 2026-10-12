export class CourseError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const limits = Object.freeze({ maxPhotos: 3, maxPhotoBytes: 8 * 1024 * 1024, maxBodyBytes: 26 * 1024 * 1024 });
const fail = (message) => { throw new CourseError(400, message); };
export function validateEntry(input) {
  const text = (value, max, label, required = false, multiline = false) => {
    if (typeof value !== 'string') fail(label + '을 확인해주세요.');
    let clean = value.normalize('NFC').trim();
    clean = multiline ? clean.replace(/\r\n?/g, '\n') : clean.replace(/\s+/gu, ' ');
    if ((required && !clean) || clean.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(clean)) fail(label + '을 확인해주세요.');
    return clean;
  };
  if (!['photo','accident'].includes(input.kind)) fail('기록 종류를 선택해주세요.');
  if (!/^day[1-4]$/.test(input.day)) fail('기록 일차를 확인해주세요.');
  if (typeof input.tripId !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(input.tripId)) fail('여행을 확인해주세요.');
  if (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.requestId)) fail('등록 식별자를 확인해주세요.');
  const coordinate = (value, max) => {
    if (typeof value !== 'string' || !value.trim() || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > max) fail('지도에서 올바른 위치를 선택해주세요.');
    return Number(value);
  };
  return { tripId: input.tripId, requestId: input.requestId, kind: input.kind, day: input.day,
    title: text(input.title,80,'제목',true), note: text(input.note,2000,'설명',false,true), author: text(input.author,40,'작성자'),
    latitude: coordinate(input.latitude,90), longitude: coordinate(input.longitude,180) };
}
export function imageType(bytes) {
  const ascii = (start,end) => String.fromCharCode(...bytes.subarray(start,end));
  if (bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b) && ascii(12,16)==='IHDR' && new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(16)>0 && new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(20)>0) return {ext:'png',mime:'image/png'};
  if (bytes.length >= 4 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255 && bytes.at(-2)===255 && bytes.at(-1)===217) return {ext:'jpg',mime:'image/jpeg'};
  if (bytes.length >= 30 && ascii(0,4)==='RIFF' && ascii(8,12)==='WEBP' && ['VP8 ','VP8L','VP8X'].includes(ascii(12,16)) && new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(4,true)+8===bytes.length) return {ext:'webp',mime:'image/webp'};
  fail('사진은 실제 JPG·PNG·WebP 파일만 첨부할 수 있습니다.');
}
export async function digest(bytes) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
}
export async function parsePost(request) {
  if (!/^multipart\/form-data;.*boundary=/i.test(request.headers.get('content-type')||'')) fail('사진 업로드 형식을 확인해주세요.');
  if (Number(request.headers.get('content-length')) > limits.maxBodyBytes) throw new CourseError(413,'첨부 용량을 초과했습니다.');
  const reader=request.body?.getReader(), chunks=[]; let length=0;
  if (!reader) fail('등록 내용을 확인해주세요.');
  try { for (;;) { const {value,done}=await reader.read(); if(done)break; length+=value.length; if(length>limits.maxBodyBytes){await reader.cancel();throw new CourseError(413,'첨부 용량을 초과했습니다.');} chunks.push(value); } }
  finally {reader.releaseLock();}
  const body=new Uint8Array(length); let offset=0; for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  const form=await new Response(body,{headers:{'content-type':request.headers.get('content-type')}}).formData();
  const fields=['tripId','requestId','kind','day','title','note','author','latitude','longitude'];
  for(const key of form.keys())if(key!=='photos'&&!fields.includes(key))fail('알 수 없는 등록 항목입니다.');
  for(const key of fields)if(form.getAll(key).length>1)fail('중복된 등록 항목입니다.');
  const entry=validateEntry(Object.fromEntries(fields.map(key=>[key,form.get(key)])));
  const files=form.getAll('photos');
  if(files.length>limits.maxPhotos)fail('사진은 최대 3장까지 첨부할 수 있습니다.');
  if(entry.kind==='photo'&&!files.length)fail('사진을 한 장 이상 첨부해주세요.');
  const photos=[];
  for(const file of files){
    if(typeof file==='string'||!file.size||file.size>limits.maxPhotoBytes)fail('사진 한 장은 8MB 이하여야 합니다.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    photos.push({bytes,...imageType(bytes)});
  }
  const hash=await digest(new TextEncoder().encode(JSON.stringify(entry)+JSON.stringify(await Promise.all(photos.map(p=>digest(p.bytes))))));
  return {entry,photos,hash};
}
export function publicRecord(row) {
  return {id:row.id,kind:row.kind,day:row.day,title:row.title,note:row.note,author:row.author,
    latitude:row.latitude,longitude:row.longitude,createdAt:row.created_at,photos:row.photos};
}
