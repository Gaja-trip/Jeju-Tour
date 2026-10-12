(function(root){
  'use strict';
  const columns='id,trip_id,kind,day,title,note,author,latitude,longitude,photos,created_at';
  const config=()=>root.JEJU_LIVE_CONFIG||{};
  const settings=()=>root.JEJU_COURSE_STORAGE||{};
  function photoUrl(photo){
    const path=photo?.path;
    if(typeof path!=='string'||!/^([a-z0-9_-]{1,80})\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/.test(path))return '';
    if(path.split('/')[0]!==config().tripId)return '';
    return config().supabaseUrl+'/storage/v1/object/public/'+settings().bucket+'/'+path;
  }
  const record=(row)=>({id:row.id,kind:row.kind,day:row.day,title:row.title,note:row.note,author:row.author,
    latitude:row.latitude,longitude:row.longitude,createdAt:row.created_at,photos:row.photos});
  async function request(path,{method='GET',body,signal}={}){
    const {supabaseUrl,publishableKey,tripId}=config();
    if(!supabaseUrl||!publishableKey||!tripId)throw new Error('Supabase 연결 설정을 확인해주세요.');
    if(path!=='/api/route-posts')throw new Error('지원하지 않는 코스 요청입니다.');
    if(method==='GET'){
      const records=[];
      for(let offset=0;;offset+=500){
        const query=new URLSearchParams({select:columns,trip_id:'eq.'+tripId,order:'created_at.desc,id.desc',limit:'500',offset:String(offset)});
        const response=await fetch(supabaseUrl+'/rest/v1/jeju_course_posts?'+query,{headers:{apikey:publishableKey},signal,cache:'no-store'});
        const result=await response.json().catch(()=>null);
        if(!response.ok||!Array.isArray(result))throw new Error('Supabase 사진 저장소에 연결할 수 없습니다. 새로고침해주세요.');
        records.push(...result.map(record)); if(result.length<500)break;
      }
      return {records};
    }
    if(method!=='POST')throw new Error('지원하지 않는 코스 요청입니다.');
    const client=await root.JejuSupabase.getClient();
    const {data,error}=await client.auth.getSession();
    if(error||!data?.session)throw new Error('함께가기에서 개인 초대로 참가자 인증 후 사진을 등록해주세요.');
    body.set('tripId',tripId);
    const response=await fetch(supabaseUrl+'/functions/v1/'+settings().functionName,{method:'POST',body,signal,
      headers:{apikey:publishableKey,Authorization:'Bearer '+data.session.access_token},cache:'no-store'});
    const result=await response.json().catch(()=>null);
    if(!response.ok||!result)throw new Error(result?.error||'Supabase에 저장하지 못했습니다. 같은 내용으로 다시 시도해주세요.');
    return result;
  }
  root.JejuCourseStorage={request,photoUrl,isCloud:()=>settings().provider==='supabase'};
})(window);
