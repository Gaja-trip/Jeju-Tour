import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
const {createClient}=createRequire(import.meta.url)('../.test-output/invite-tools/node_modules/@supabase/supabase-js');
const context={window:{}}; vm.runInNewContext(await readFile('live-location-config.js','utf8'),context);
const config=context.window.JEJU_LIVE_CONFIG;
const fixturePath='.private/course-cloud-fixture.json';
const client=createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}});
if(process.argv.includes('--prepare')){
  try{await readFile(fixturePath);throw Error('Fixture already exists');}catch(e){if(e.code!=='ENOENT')throw e;}
  const result=await client.auth.signInAnonymously({options:{data:{jeju_course_test:true}}});assert.equal(result.error,null);
  const token=randomBytes(32).toString('base64url'),tripId='course-check-'+randomBytes(8).toString('hex');
  const fixture={tripId,token,session:result.data.session};await writeFile(fixturePath,JSON.stringify(fixture),{mode:0o600});
  const sql="insert into jeju_private.trip_access(trip_id,password_hash,invitation_only) values('"+tripId+"','unused',true); insert into jeju_private.participant_invitations(trip_id,slot,token_hash,expires_at) values('"+tripId+"',1,'"+createHash('sha256').update(token).digest('hex')+"',now()+interval '1 hour');";
  await writeFile('.test-output/course-cloud-prepare.sql',sql);console.log('Isolated cloud fixture prepared; no real participant invitation used.');
}else{
  const f=JSON.parse(await readFile(fixturePath,'utf8'));
  const session=await client.auth.setSession(f.session);assert.equal(session.error,null);
  if(process.argv.includes('--claim')){
    const claimed=await client.rpc('jeju_claim_invitation',{p_trip_id:f.tripId,p_token:f.token,p_name:'코스 저장 검증'});assert.equal(claimed.error,null);assert.equal(claimed.data.ok,true);
    f.session=(await client.auth.getSession()).data.session;await writeFile(fixturePath,JSON.stringify(f),{mode:0o600});console.log('Isolated invitation claimed.');
  }else if(process.argv.includes('--upload')){
    const bytes=await readFile('assets/lodging/aqua-beautique.jpg');
    const form=new FormData();for(const [key,value]of Object.entries({tripId:f.tripId,kind:'photo',day:'day1',title:'클라우드 저장 확인',note:'검증 후 삭제되는 테스트 사진',author:'검증',latitude:'33.4970366',longitude:'126.4519783',requestId:'cloud-test-'+f.tripId}))form.append(key,value);
    form.append('photos',new Blob([bytes],{type:'image/jpeg'}),'photo.jpg');
    const post=()=>fetch(config.supabaseUrl+'/functions/v1/course-journal',{method:'POST',body:form,headers:{apikey:config.publishableKey,Authorization:'Bearer '+f.session.access_token,Origin:'https://jeju-gaja.vercel.app'}});
    const r=await post(),saved=await r.json();assert.ok(r.ok,'Upload failed: '+JSON.stringify({status:r.status,error:saved.error,message:saved.message}));assert.equal(r.status,201);
    f.record=saved.record;await writeFile(fixturePath,JSON.stringify(f),{mode:0o600});
    const retry=await post(),duplicate=await retry.json();assert.equal(retry.status,200);assert.equal(duplicate.duplicate,true);assert.equal(duplicate.record.id,f.record.id);
    const photo=await fetch(config.supabaseUrl+'/storage/v1/object/public/jeju-course-photos/'+f.record.photos[0].path);assert.equal(photo.status,200);assert.deepEqual(Buffer.from(await photo.arrayBuffer()),bytes);
    const query=new URLSearchParams({select:'id,trip_id,title,photos',trip_id:'eq.'+f.tripId});
    const list=await fetch(config.supabaseUrl+'/rest/v1/jeju_course_posts?'+query,{headers:{apikey:config.publishableKey}});assert.equal(list.status,200);assert.equal((await list.json())[0].id,f.record.id);
    console.log('Actual Supabase upload, duplicate retry, original photo download and unauthenticated lookup passed.');
  }
}
