import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {visibleRect,placeLabels,groupStops}=createRequire(import.meta.url)('../course-map-layout.js');
test('selection center accounts for the sidebar and the real analysis dock height',()=>{
 const r=visibleRect({x:1440,y:1000},{paddingTopLeft:[468,32],paddingBottomRight:[76,492]});
 assert.equal(r.cx,916);assert.equal(r.cy,270);assert.equal(r.width,896);assert.equal(r.height,476);
 const mobile=visibleRect({x:390,y:185},{padding:[24,24]});assert.equal(mobile.cx,195);assert.equal(mobile.cy,92.5);
});
test('labels try another side and hide instead of overlapping other names or leaving the map',()=>{
 const bounds={left:0,top:0,right:400,bottom:200};
 const items=[{id:1,x:180,y:100,width:150,height:30,number:1},{id:2,x:185,y:105,width:150,height:30,number:2},{id:3,x:-200,y:10,width:120,height:30,number:3}];
 const positions=placeLabels(items,bounds),a=positions.get(1),b=positions.get(2);
 assert.ok(a);assert.ok(b);assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);assert.equal(positions.get(3),null);
});
test('label placement gives the hovered or selected stop priority in crowded space',()=>{
 const bounds={left:0,top:0,right:180,bottom:100};
 const items=[{id:'a',x:90,y:65,width:150,height:30,number:1},{id:'b',x:90,y:65,width:150,height:30,number:2,priority:100}];
 const result=placeLabels(items,bounds);assert.ok(result.get('b'));assert.equal(result.get('a'),null);
});
test('stays cluster only when they are physically co-located and overlap on screen',()=>{
 const stops=[{lat:0,lng:0,x:10,y:10},{lat:0,lng:15,x:12,y:12},{lat:0,lng:100,x:14,y:14}];
 const distance=(a,b)=>Math.abs(a.lng-b.lng),position=p=>p;
 assert.deepEqual(groupStops(stops,position,distance).map(g=>g.length),[2,1]);
 stops[1].x=60;assert.deepEqual(groupStops(stops,position,distance).map(g=>g.length),[1,1,1]);
});
