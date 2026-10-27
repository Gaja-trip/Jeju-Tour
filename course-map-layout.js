(function(root){
  'use strict';
  function visibleRect(size,padding={}){
    const a=padding.paddingTopLeft||padding.padding||[24,24],b=padding.paddingBottomRight||padding.padding||[24,24];
    const left=Math.min(Math.max(0,a[0]),Math.max(0,size.x-80)),top=Math.min(Math.max(0,a[1]),Math.max(0,size.y-80));
    const right=Math.max(left+Math.min(80,size.x),size.x-Math.max(0,b[0])),bottom=Math.max(top+Math.min(80,size.y),size.y-Math.max(0,b[1]));
    return {left,top,right,bottom,width:right-left,height:bottom-top,cx:(left+right)/2,cy:(top+bottom)/2};
  }
  const intersects=(a,b,gap=6)=>a.left<b.right+gap&&a.right>b.left-gap&&a.top<b.bottom+gap&&a.bottom>b.top-gap;
  function placeLabels(items,bounds,blocked=[]){
    const placed=[],result=new Map();
    for(const item of [...items].sort((a,b)=>(b.priority||0)-(a.priority||0)||a.number-b.number)){
      const directions=[item.direction||'top','right','left','bottom','top'].filter((d,i,all)=>all.indexOf(d)===i);
      let choice;
      for(const direction of directions){
        const w=item.width,h=item.height,gap=23;
        const left=direction==='right'?item.x+gap:direction==='left'?item.x-gap-w:item.x-w/2;
        const top=direction==='bottom'?item.y+gap:direction==='top'?item.y-gap-h:item.y-h/2;
        const rect={left,top,right:left+w,bottom:top+h};
        if(rect.left<bounds.left||rect.right>bounds.right||rect.top<bounds.top||rect.bottom>bounds.bottom||placed.some(p=>intersects(rect,p))||blocked.some(p=>p.id!==item.id&&intersects(rect,p,3)))continue;
        choice={...rect,direction};placed.push(rect);break;
      }
      result.set(item.id,choice||null);
    }
    return result;
  }
  function groupStops(stops,position,distance){
    const groups=[];
    for(const stop of stops){
      const p=position(stop);
      // Only combine truly co-located stays, never separate facilities at overview zoom.
      const group=groups.find(g=>g.every(other=>distance(stop,other)<=35&&Math.hypot(p.x-position(other).x,p.y-position(other).y)<32));
      if(group)group.push(stop);else groups.push([stop]);
    }
    return groups;
  }
  const api={visibleRect,placeLabels,groupStops};
  root.JejuCourseMapLayout=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
