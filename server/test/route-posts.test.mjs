import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { resolve, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createApp } from '../index.mjs';
import { backupData } from '../manage.mjs';

const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=','base64');
function payload(values={},photos=[]) {
  const form=new FormData();
  for(const [key,value] of Object.entries({kind:'accident',day:'day1',title:'한림 사고지점',note:'내리막 주의\n동행자와 확인',author:'여행 참가자',
    latitude:'33.4',longitude:'126.25',requestId:randomUUID(),...values})) form.append(key,value);
  for(const bytes of photos) form.append('photos',new Blob([bytes],{type:'image/png'}),'../../group.png');
  return form;
}
async function start(config) {const app=createApp(config);app.server.listen(0,'127.0.0.1');await once(app.server,'listening');return {...app,url:'http://127.0.0.1:'+app.server.address().port};}
async function stop(app) {await new Promise((resolve)=>app.server.close(resolve));}

test('route accident and shared photo records persist with coordinates and original images',async(t)=>{
  const workspace=resolve(dirname(fileURLToPath(import.meta.url)),'../../.test-output');
  mkdirSync(workspace,{recursive:true});
  const directory=mkdtempSync(join(workspace,'route-post-api-'));
  const config={dataDir:join(directory,'data'),backupDir:join(directory,'backups'),eventStart:'2026-09-07',eventEnd:'2026-10-31',
    adminToken:'route-post-test-admin-123456',allowedOrigins:['https://tour.example']};
  let app=await start(config), accident,photo;
  const get=(route)=>fetch(app.url+route);
  const post=(form,headers={})=>fetch(app.url+'/api/route-posts',{method:'POST',body:form,headers});
  try {
    await t.test('saves an accident without photos and round-trips exact location and text',async()=>{
      const response=await post(payload());assert.equal(response.status,201);
      accident=(await response.json()).record;
      assert.equal(accident.latitude,33.4);assert.equal(accident.longitude,126.25);
      assert.equal(accident.note,'내리막 주의\n동행자와 확인');assert.deepEqual(accident.photos,[]);
      const file=join(config.dataDir,'route-posts',accident.id,'record.json');
      assert.equal(JSON.parse(readFileSync(file,'utf8')).title,accident.title);
    });
    await t.test('saves multiple shared photos and serves original bytes with safe image content type',async()=>{
      const response=await post(payload({kind:'photo',day:'day4',title:'제주항 단체사진'},[PNG,PNG]));
      assert.equal(response.status,201);photo=(await response.json()).record;
      assert.equal(photo.photos.length,2);
      for(const image of photo.photos) {
        const result=await get(image.url);assert.equal(result.status,200);assert.equal(result.headers.get('content-type'),'image/png');
        assert.deepEqual(Buffer.from(await result.arrayBuffer()),PNG);
        assert.equal((await fetch(app.url+image.url,{method:'HEAD'})).status,200);
      }
      assert.equal((await (await get('/api/route-posts?day=day1')).json()).records.length,1);
      assert.equal((await (await get('/api/route-posts?day=day4')).json()).records[0].id,photo.id);
      assert.equal((await (await get('/api/route-posts')).json()).records.length,2);
    });
    await t.test('retries are idempotent and changed retry payloads are rejected',async()=>{
      const requestId=randomUUID();
      const first=await post(payload({requestId,day:'day2'})),repeat=await post(payload({requestId,day:'day2'}));
      assert.equal(first.status,201);assert.equal(repeat.status,200);
      assert.equal((await first.json()).record.id,(await repeat.json()).record.id);
      assert.equal((await post(payload({requestId,title:'changed'}))).status,409);
    });
    await t.test('invalid coordinates, fields, files and photo-less photo posts do not save',async()=>{
      const before=(await (await get('/api/route-posts')).json()).records.length;
      for(const values of [{latitude:''},{latitude:'91'},{longitude:'181'},{latitude:'NaN'},{day:'day5'},{kind:'unknown'},
        {title:''},{title:'가'.repeat(81)},{note:'가'.repeat(2001)},{kind:'photo'}]) assert.equal((await post(payload(values))).status,400,JSON.stringify(values));
      assert.equal((await post(payload({},[Buffer.from('<svg onload="alert(1)"/>')]))).status,400);
      assert.equal((await post(payload({},[PNG,PNG,PNG,PNG]))).status,400);
      assert.equal((await post(payload({},[Buffer.alloc(8*1024*1024+1)]))).status,400);
      const duplicate=payload();duplicate.append('title','duplicate');assert.equal((await post(duplicate)).status,400);
      const unsupported=payload();unsupported.append('path','../../server/config.json');assert.equal((await post(unsupported)).status,400);
      assert.equal((await get('/api/route-posts?day=invalid')).status,400);
      assert.equal((await get('/api/route-photos/'+randomUUID())).status,404);
      assert.equal((await get('/assets/%2e%2e%2fserver/data/route-posts/'+accident.id+'/record.json')).status,404);
      assert.equal((await (await get('/api/route-posts')).json()).records.length,before);
    });
    await t.test('configured and same-site origins work while unrelated writes are rejected',async()=>{
      assert.equal((await post(payload(),{Origin:'https://foreign.example'})).status,403);
      const response=await post(payload({day:'day3'}),{Origin:'https://tour.example'});assert.equal(response.status,201);
      assert.equal(response.headers.get('access-control-allow-origin'),'https://tour.example');
    });
    await t.test('server restart retains route metadata and photos',async()=>{
      await stop(app);app=await start(config);
      const records=(await (await get('/api/route-posts')).json()).records;
      assert.ok(records.some((record)=>record.id===accident.id));assert.ok(records.some((record)=>record.id===photo.id));
      assert.deepEqual(Buffer.from(await (await get(photo.photos[0].url)).arrayBuffer()),PNG);
    });
    await t.test('database backup includes route files and can be restored to another server',async()=>{
      const backup=await backupData(config);
      assert.equal(existsSync(join(backup,'route-posts',photo.id,'record.json')),true);
      const restored=await start({...config,dataDir:backup});
      try {
        const records=(await (await fetch(restored.url+'/api/route-posts')).json()).records;
        assert.ok(records.some((record)=>record.id===photo.id));
        assert.deepEqual(Buffer.from(await (await fetch(restored.url+photo.photos[0].url)).arrayBuffer()),PNG);
      } finally {await stop(restored);}
    });
  } finally {
    await stop(app);
    assert.ok(resolve(directory).startsWith(workspace+sep));
    rmSync(directory,{recursive:true,force:true});
  }
});
