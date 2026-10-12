import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CourseError,parsePost,validateEntry,publicRecord,limits} from '../supabase/functions/course-journal/core.mjs';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64');
const input={tripId:'jeju-gaja',requestId:'cloud-request-12345',kind:'photo',day:'day1',title:'  단체 사진  ',note:'',author:'',latitude:'33.5',longitude:'126.4'};
const request=(fields=input,files=[png])=>{
  const form=new FormData();for(const [key,value]of Object.entries(fields))form.append(key,value);
  for(const bytes of files)form.append('photos',new Blob([bytes],{type:'image/png'}),'photo.png');
  return new Request('https://example.test',{method:'POST',body:form});
};
test('cloud uploads validate coordinates and real image bytes rather than file names',async()=>{
  assert.equal((await parsePost(request())).entry.title,'단체 사진');
  for(const fields of [{...input,latitude:''},{...input,longitude:'181'},{...input,title:''},{...input,tripId:'../trip'},{...input,note:'x\0'}])assert.throws(()=>validateEntry(fields),CourseError);
  await assert.rejects(parsePost(request(input,[Buffer.from('<svg></svg>')])),/실제 JPG/);
  await assert.rejects(parsePost(request(input,[Buffer.alloc(limits.maxPhotoBytes+1)])),/8MB/);
});
test('cloud idempotency fingerprints include image bytes and ordered metadata',async()=>{
  const first=await parsePost(request()),retry=await parsePost(request());
  assert.equal(first.hash,retry.hash);
  assert.notEqual(first.hash,(await parsePost(request({...input,title:'다른 제목'}))).hash);
  const changed=Buffer.from(png);changed[changed.length-1]^=1;
  assert.notEqual(first.hash,(await parsePost(request(input,[changed]))).hash);
});
test('cloud photos are required for photo records, optional for accident records; max three',async()=>{
  await assert.rejects(parsePost(request(input,[])),/한 장 이상/);
  assert.equal((await parsePost(request({...input,kind:'accident'},[]))).photos.length,0);
  await assert.rejects(parsePost(request(input,[png,png,png,png])),/최대 3장/);
  const duplicated=new FormData();for(const [key,value]of Object.entries({...input,kind:'accident'}))duplicated.append(key,value);duplicated.append('title','duplicate');
  await assert.rejects(parsePost(new Request('https://example.test',{method:'POST',body:duplicated})),/중복/);
});
test('public cloud responses exclude authentication and retry identifiers',()=>{
  const row={id:'a',...input,user_id:'secret-user',request_hash:'secret-hash',lease_id:'private-lease',photos:[],created_at:'date'};
  const result=publicRecord(row);
  for(const field of ['user_id','request_hash','lease_id','requestId','tripId'])assert.equal(result[field],undefined);
  assert.equal(result.createdAt,'date');
});
