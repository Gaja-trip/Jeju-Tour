import { CourseError,parsePost,publicRecord } from './core.mjs';
const env=Deno.env;
const url=env.get('SUPABASE_URL');
const secret=env.get('SUPABASE_SERVICE_ROLE_KEY')||JSON.parse(env.get('SUPABASE_SECRET_KEYS')||'{}').default;
const anon=env.get('SUPABASE_ANON_KEY')||JSON.parse(env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default;
const bucket='jeju-course-photos';
const originAllowed=(origin)=>origin==='https://jeju-gaja.vercel.app'||origin==='http://localhost:3000'||/^https:\/\/jeju-tour-[a-z0-9-]+-rokafap2-3990s-projects\.vercel\.app$/.test(origin);
async function backend(path,{method='GET',body,token,key=secret,headers={}}={}) {
  const response=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+(token||key),...headers},body,
    signal:AbortSignal.timeout(55000)});
  const data=await response.json().catch(()=>null);
  return {ok:response.ok,status:response.status,data};
}
const json=(value,status,headers)=>new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(request)=>{
  const origin=request.headers.get('origin')||'';
  const headers={'Access-Control-Allow-Origin':originAllowed(origin)?origin:'https://jeju-gaja.vercel.app',
    'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods':'POST,DELETE,OPTIONS','Vary':'Origin','X-Content-Type-Options':'nosniff'};
  if(origin&&!originAllowed(origin))return json({error:'이 사이트에서 사진을 등록할 수 없습니다.'},403,headers);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  let reserved;
  try {
    if(!['POST','DELETE'].includes(request.method))throw new CourseError(405,'지원하지 않는 요청입니다.');
    const token=(request.headers.get('authorization')||'').replace(/^Bearer /i,'');
    if(!token)throw new CourseError(401,'함께가기에서 참가자 인증 후 사진을 등록해주세요.');
    const auth=await backend('/auth/v1/user',{token,key:anon});
    if(!auth.ok||!auth.data?.id)throw new CourseError(401,'참가자 인증이 필요합니다. 함께가기에서 다시 인증해주세요.');
    const userId=auth.data.id;
    if(request.method==='DELETE'){
      const id=new URL(request.url).searchParams.get('id');
      if(!/^[a-f0-9-]{36}$/.test(id||''))throw new CourseError(400,'기록을 확인해주세요.');
      const found=await backend('/rest/v1/jeju_course_posts?select=*&id=eq.'+id+'&user_id=eq.'+userId);
      if(!found.ok)throw new Error('database');
      const row=found.data[0]; if(!row)throw new CourseError(404,'본인이 등록한 기록을 찾을 수 없습니다.');
      const access=await backend('/rest/v1/rpc/jeju_invitation_status',{method:'POST',body:JSON.stringify({p_trip_id:row.trip_id}),token,key:anon,headers:{'Content-Type':'application/json'}});
      if(!access.ok||!access.data?.ok)throw new CourseError(403,'유효한 참가자 인증이 필요합니다.');
      if(row.photos.length){const removed=await backend('/storage/v1/object/'+bucket,{method:'DELETE',body:JSON.stringify({prefixes:row.photos.map(p=>p.path)}),headers:{'Content-Type':'application/json'}});if(!removed.ok)throw new Error('storage');}
      const removed=await backend('/rest/v1/jeju_course_posts?id=eq.'+id+'&user_id=eq.'+userId,{method:'DELETE'});
      if(!removed.ok)throw new Error('database');
      return json({deleted:true},200,headers);
    }
    const {entry,photos,hash}=await parsePost(request);
    const access=await backend('/rest/v1/rpc/jeju_invitation_status',{method:'POST',body:JSON.stringify({p_trip_id:entry.tripId}),token,key:anon,headers:{'Content-Type':'application/json'}});
    if(!access.ok||!access.data?.ok)throw new CourseError(403,'함께가기에서 유효한 개인 초대로 참가자 인증 후 등록해주세요.');
    const reservation=await backend('/rest/v1/rpc/jeju_reserve_course_post',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      p_trip_id:entry.tripId,p_user_id:userId,p_request_id:entry.requestId,p_hash:hash,p_entry:entry,
      p_photos:photos.map(p=>({id:crypto.randomUUID(),ext:p.ext,mime:p.mime,size:p.bytes.length}))})});
    if(!reservation.ok){
      const reason=reservation.data?.message||'';
      if(reason.includes('course_membership_required'))throw new CourseError(403,'참가자 인증을 확인해주세요.');
      if(reason.includes('course_request_conflict'))throw new CourseError(409,'같은 등록 식별자로 다른 기록을 저장할 수 없습니다.');
      if(reason.includes('course_upload_processing'))throw new CourseError(409,'같은 사진을 저장 중입니다. 잠시 후 같은 내용으로 다시 시도해주세요.');
      if(reason.includes('course_upload_rate_limit'))throw new CourseError(429,'등록 횟수가 많습니다. 잠시 후 다시 시도해주세요.');
      throw new Error('reserve');
    }
    const row=reservation.data;
    if(row.duplicate)return json({record:publicRecord(row),duplicate:true},200,headers);
    reserved=row;
    for(let i=0;i<photos.length;i++){
      const response=await fetch(url+'/storage/v1/object/'+bucket+'/'+row.photos[i].path,{method:'POST',
        headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':photos[i].mime,'x-upsert':'false','cache-control':'3600'},
        body:photos[i].bytes,signal:AbortSignal.timeout(55000)});
      const data=await response.json().catch(()=>null);
      // A retry uses the original immutable paths and the identical payload hash.
      if(!response.ok&&data?.statusCode!=='409'&&response.status!==409)throw new Error('upload');
    }
    const saved=await backend('/rest/v1/jeju_course_posts?id=eq.'+row.id+'&lease_id=eq.'+row.lease_id+'&state=eq.pending',{
      method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({state:'ready',updated_at:new Date().toISOString()})});
    if(!saved.ok||saved.data?.length!==1)throw new Error('complete');
    reserved=null;
    return json({record:publicRecord(saved.data[0]),duplicate:false},201,headers);
  }catch(error){
    if(reserved){try{await backend('/rest/v1/jeju_course_posts?id=eq.'+reserved.id+'&lease_id=eq.'+reserved.lease_id+'&state=eq.pending',{
      method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({state:'failed',updated_at:new Date().toISOString()})});}catch{}}
    return json({error:error instanceof CourseError?error.message:'Supabase에 저장하지 못했습니다. 같은 내용으로 다시 시도해주세요.'},error instanceof CourseError?error.status:503,headers);
  }
});
