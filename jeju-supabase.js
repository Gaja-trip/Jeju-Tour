(function(root){
  'use strict';
  let pending;
  async function getClient(){
    if(pending)return pending;
    pending=(async()=>{
      const config=root.JEJU_LIVE_CONFIG;
      if(!config?.supabaseUrl||!config.publishableKey)throw new Error('Supabase 설정을 확인해주세요.');
      if(!root.supabase?.createClient)await new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js';
        script.onload=()=>root.supabase?.createClient?resolve():reject(new Error('sdk'));
        script.onerror=()=>reject(new Error('sdk')); document.head.append(script);
      });
      return root.supabase.createClient(config.supabaseUrl,config.publishableKey,{
        auth:{storageKey:'jeju-gaja-auth-v1',flowType:'pkce',detectSessionInUrl:true},
        global:{fetch:(url,options={})=>fetch(url,{...options,
          signal:options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(15000)})}
      });
    })();
    try{return await pending;}catch(error){pending=null;throw error;}
  }
  root.JejuSupabase={getClient};
})(window);
