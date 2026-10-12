(function(root) {
  "use strict";
  const escape = (text) => String(text ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const dayLabel = (day) => day.replace("day","") + "일차";
  const newId = () => crypto.randomUUID();
  function recordsNear(records, day, point, radiusM = 50) {
    const valid = (p) => p && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180;
    const distance = root.JejuGpxCore?.distance;
    if (!Array.isArray(records) || !/^day[1-4]$/.test(day) || !valid(point) || !Number.isFinite(radiusM) || radiusM < 0 || !distance) return [];
    return records.filter((record) => record?.day === day && typeof record.id === "string" && Array.isArray(record.photos) &&
      valid({ lat: record.latitude, lng: record.longitude }) && distance(point, { lat: record.latitude, lng: record.longitude }) <= radiusM);
  }
  function create({element,map,L,getDay,getSelectedPoint,getPadding,onPickMode=()=>{},onMessage=()=>{},showMap=()=>{},onChange=()=>{}}) {
    if (!element) return null;
    const base = String(root.JEJU_EVENT_API_BASE || "").replace(/\/$/,"");
    const form=element.querySelector("[data-journal-form]"), status=element.querySelector("[data-journal-status]"), message=element.querySelector("[data-journal-message]");
    const list=element.querySelector("[data-journal-list]"), input=element.querySelector("[data-journal-photos]"), previews=element.querySelector("[data-journal-previews]");
    const submit=element.querySelector("[data-journal-submit]"), pick=element.querySelector("[data-journal-pick]"), coordinate=element.querySelector("[data-journal-coordinate]");
    const allDays=element.querySelector("[data-journal-all]"), refreshButton=element.querySelector("[data-journal-refresh]");
    let records=[], photos=[], previewUrls=[], point=null, pendingMarker, picking=false, online=false, busy=false, refreshing=false, requestId=newId(), selectedDay=getDay();
    const markers=new Map(), layer=map&&L?L.layerGroup().addTo(map):null;
    if(map&&L){const pane=map.getPane("routeJournalPane")||map.createPane("routeJournalPane");pane.style.zIndex="675";}
    const dialog=document.createElement("dialog"); dialog.className="journal-photo-dialog"; dialog.setAttribute("aria-label","사고지점 및 사진 상세");
    dialog.innerHTML='<div class="journal-dialog-heading"><h2 data-journal-dialog-title></h2><button type="button" data-journal-dialog-close aria-label="상세 사진 닫기">닫기 ×</button></div><div data-journal-dialog-body></div>';
    document.body.append(dialog);
    dialog.querySelector("[data-journal-dialog-close]").addEventListener("click",()=>dialog.close());
    dialog.addEventListener("click",(event)=>{if(event.target===dialog) dialog.close();});
    function photoUrl(photo) {
      return typeof photo?.url==="string" && /^\/api\/route-photos\/[a-f0-9-]{36}$/.test(photo.url) ? base+photo.url : "";
    }
    function announce(text,error=false) { message.textContent=text; message.classList.toggle("is-error",error); }
    function changed() { requestId=newId(); }
    function setBusy(value) {
      busy=value;
      for(const control of form.querySelectorAll("input,textarea,button")) control.disabled=value;
      submit.disabled=value||!online||!point;
      submit.textContent=value?"서버에 저장 중…":"서버에 저장";
      pick.disabled=value||!map; element.querySelector("[data-journal-gpx-point]").disabled=value;
      refreshButton.disabled=value||refreshing;
    }
    async function api(path,options={}) {
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),60000);
      try {
        const response=await fetch(base+path,{...options,signal:controller.signal,cache:"no-store"});
        const result=await response.json().catch(()=>null);
        if(!response.ok||!result) throw new Error(result?.error||"저장 서버에 연결할 수 없습니다. 서버 주소로 접속해 주세요.");
        return result;
      } catch(error) {
        if(error.name==="AbortError"||error instanceof TypeError) throw new Error("서버 연결을 확인해주세요. 같은 내용으로 다시 저장하면 중복 등록되지 않습니다.");
        throw error;
      } finally {clearTimeout(timer);}
    }
    function selectPoint(latlng) {
      if(!Number.isFinite(latlng?.lat)||!Number.isFinite(latlng?.lng)) return;
      point={lat:latlng.lat,lng:latlng.lng}; changed(); picking=false; onPickMode(false);
      pick.setAttribute("aria-pressed","false"); pick.textContent="지도에서 위치 선택";
      coordinate.textContent=dayLabel(getDay())+" · "+point.lat.toFixed(6)+", "+point.lng.toFixed(6);
      coordinate.classList.add("is-selected");
      if(layer) {
        if(pendingMarker) layer.removeLayer(pendingMarker);
        pendingMarker=L.circleMarker([point.lat,point.lng],{pane:"routeJournalPane",radius:9,color:"#374151",weight:2,dashArray:"3 3",fillColor:"#fff",fillOpacity:.8,bubblingMouseEvents:false}).addTo(layer);
      }
      setBusy(busy);
      announce("위치를 선택했습니다. 내용을 입력한 뒤 서버에 저장하세요.");
    }
    function visibleRecords() {return allDays.checked?records:records.filter((record)=>record.day===getDay());}
    function configurePopup(marker) {
      if(!map||!marker?.getPopup()) return;
      const padding=getPadding(), top=padding.paddingTopLeft||padding.padding||[24,24], bottom=padding.paddingBottomRight||padding.padding||[24,24];
      Object.assign(marker.getPopup().options,{autoPan:true,autoPanPaddingTopLeft:top,autoPanPaddingBottomRight:bottom,
        maxHeight:Math.max(60,map.getSize().y-top[1]-bottom[1]-70)});
    }
    function focusRecord(record) {
      if(!map) return;
      showMap();
      const coordinates=[record.latitude,record.longitude];
      map.invalidateSize({pan:false});
      map.panInside(coordinates,{...getPadding(),animate:false});
      const marker=markers.get(record.id);
      if(marker) {configurePopup(marker);marker.openPopup();}
    }
    function showDetails(record) {
      dialog.querySelector("[data-journal-dialog-title]").textContent=(record.kind==="accident"?"⚠ 사고지점 · ":"📷 함께 찍은 사진 · ")+record.title;
      const body=dialog.querySelector("[data-journal-dialog-body]");
      body.replaceChildren();
      const meta=document.createElement("p"); meta.className="journal-dialog-meta";
      meta.textContent=dayLabel(record.day)+" · "+(record.author||"작성자 미입력")+" · "+new Date(record.createdAt).toLocaleString("ko-KR",{timeZone:"Asia/Seoul"})+" · "+record.latitude.toFixed(6)+", "+record.longitude.toFixed(6);
      const note=document.createElement("p"); note.className="journal-dialog-note"; note.textContent=record.note;
      body.append(meta,note);
      for(const [index,photo] of record.photos.entries()) {
        const url=photoUrl(photo); if(!url) continue;
        const figure=document.createElement("figure"), img=document.createElement("img");
        img.src=url; img.alt=record.title+" 사진 "+(index+1); img.loading="lazy";
        const caption=document.createElement("figcaption"); caption.textContent=(index+1)+" / "+record.photos.length;
        figure.append(img,caption); body.append(figure);
      }
      if(!record.photos.length) {const empty=document.createElement("p"); empty.textContent="첨부된 사진이 없습니다."; body.append(empty);}
      if(!dialog.open) dialog.showModal();
    }
    function popup(record) {
      const node=document.createElement("div"); node.className="journal-map-popup";
      const heading=document.createElement("strong"); heading.textContent=(record.kind==="accident"?"⚠ ":"📷 ")+record.title;
      const meta=document.createElement("small"); meta.textContent=dayLabel(record.day)+" · "+(record.author||"작성자 미입력");
      const note=document.createElement("p"); note.textContent=record.note;
      node.append(heading,meta,note);
      if(record.photos.length) {
        const thumb=document.createElement("button"); thumb.type="button"; thumb.className="journal-popup-photo"; thumb.setAttribute("aria-label",record.title+" 사진 크게 보기");
        const img=document.createElement("img"); img.src=photoUrl(record.photos[0]); img.alt=record.title+" 사진"; thumb.append(img);
        img.addEventListener("load",()=>{const marker=markers.get(record.id);if(marker?.isPopupOpen()){configurePopup(marker);marker.getPopup().update();}});
        thumb.addEventListener("click",()=>showDetails(record)); node.append(thumb);
      }
      const details=document.createElement("button"); details.type="button"; details.className="journal-popup-open"; details.textContent="내용·사진 크게 보기";
      details.addEventListener("click",()=>showDetails(record)); node.append(details);
      return node;
    }
    function render() {
      const shown=visibleRecords();
      list.innerHTML=shown.length?shown.map((record)=>'<article class="journal-record '+record.kind+'"><button type="button" class="journal-record-main" data-journal-entry="'+record.id+'"><span class="journal-record-icon">'+
        (record.kind==="accident"?"⚠":"📷")+'</span><span><strong>'+escape(record.title)+'</strong><small>'+dayLabel(record.day)+" · "+escape(record.author||"작성자 미입력")+
        '</small></span>'+(record.photos.length?'<img src="'+escape(photoUrl(record.photos[0]))+'" alt="" loading="lazy">':"")+'</button><div class="journal-record-actions"><button type="button" data-journal-location="'+record.id+'">지도 위치</button><button type="button" data-journal-detail="'+record.id+'">내용·사진 '+record.photos.length+'장</button></div></article>').join(""):'<p class="journal-empty">이 일차에 등록된 사고지점·사진이 없습니다.</p>';
      if(!layer) return;
      for(const marker of markers.values()) layer.removeLayer(marker);
      markers.clear();
      for(const record of shown) {
        const icon=L.divIcon({className:"journal-map-pin "+record.kind,html:record.kind==="accident"?"⚠":"📷",iconSize:[32,36],iconAnchor:[16,36],popupAnchor:[0,-30]});
        const marker=L.marker([record.latitude,record.longitude],{icon,pane:"routeJournalPane",title:record.title,bubblingMouseEvents:false}).addTo(layer);
        marker.on("click",()=>configurePopup(marker));
        marker.bindPopup(popup(record),{maxWidth:280,autoPan:false});
        markers.set(record.id,marker);
      }
    }
    async function refresh() {
      if(refreshing||busy) return;
      refreshing=true; refreshButton.disabled=true;
      try {
        const result=await api("/api/route-posts");
        if(!Array.isArray(result.records)) throw new Error("저장 서버 응답을 확인해주세요.");
        records=result.records.filter((record)=>typeof record.title==="string"&&/^day[1-4]$/.test(record.day)&&Number.isFinite(record.latitude)&&Number.isFinite(record.longitude)&&Array.isArray(record.photos));
        online=true; render();
        status.textContent="서버 연결됨 · 사고지점·사진 "+records.length+"개 저장";
        status.classList.remove("is-error");
      } catch(error) {online=false; status.textContent=error.message; status.classList.add("is-error");}
      finally {refreshing=false;setBusy(busy);onChange();}
    }
    pick.addEventListener("click",()=>{
      picking=!picking;onPickMode(picking);pick.setAttribute("aria-pressed",String(picking));
      pick.textContent=picking?"위치 선택 취소":"지도에서 위치 선택";
      if(picking) {showMap();onMessage("지도에서 등록할 위치를 클릭하세요.");}
    });
    element.querySelector("[data-journal-gpx-point]").addEventListener("click",()=>{
      const point=getSelectedPoint(); if(!point) {announce("GPX 파일을 먼저 불러와 주세요.",true);return;} selectPoint(point);
    });
    form.addEventListener("input",changed);
    form.addEventListener("change",changed);
    function clearPreviews(){for(const url of previewUrls) URL.revokeObjectURL(url); previewUrls=[];previews.replaceChildren();}
    input.addEventListener("change",()=>{
      clearPreviews(); const selected=Array.from(input.files||[]);
      if(selected.length>3||selected.some((file)=>file.size>8*1024*1024||!["image/jpeg","image/png","image/webp"].includes(file.type))) {
        photos=[];input.value="";announce("JPG·PNG·WebP 사진은 최대 3장, 장당 8MB까지 첨부할 수 있습니다.",true);return;
      }
      photos=selected;
      for(const file of photos){const url=URL.createObjectURL(file);previewUrls.push(url);const img=document.createElement("img");img.src=url;img.alt=file.name;previews.append(img);}
      announce(photos.length+"장의 사진을 선택했습니다.");
    });
    form.addEventListener("submit",async(event)=>{
      event.preventDefault();if(busy) return;
      if(!online) {announce("저장 서버에 연결해 주세요.",true);return;}
      if(!point) {announce("지도에서 위치를 선택하세요.",true);return;}
      const values=new FormData(form), kind=values.get("kind"), day=getDay(), author=String(values.get("author")||"");
      if(kind==="photo"&&!photos.length) {announce("함께 찍은 사진을 한 장 이상 선택해주세요.",true);return;}
      const payload=new FormData();
      for(const [key,value] of Object.entries({kind,day,title:values.get("title"),note:values.get("note")||"",author,latitude:String(point.lat),longitude:String(point.lng),requestId})) payload.append(key,value);
      for(const photo of photos) payload.append("photos",photo,photo.name);
      setBusy(true); announce("위치와 사진을 서버에 저장하고 있습니다.");
      try {
        const result=await api("/api/route-posts",{method:"POST",body:payload});
        if(!result.record?.id) throw new Error("저장 결과를 확인해주세요.");
        records=[result.record,...records.filter((record)=>record.id!==result.record.id)];
        form.reset();form.elements.author.value=author;photos=[];clearPreviews();point=null;
        if(pendingMarker){layer?.removeLayer(pendingMarker);pendingMarker=null;}
        coordinate.textContent="등록할 위치를 지도에서 선택하세요.";coordinate.classList.remove("is-selected");
        picking=false;onPickMode(false);pick.textContent="지도에서 위치 선택";pick.setAttribute("aria-pressed","false");changed();
        render();status.textContent="서버 연결됨 · 사고지점·사진 "+records.length+"개 저장";onChange();
        announce(dayLabel(day)+" 기록과 사진을 서버에 저장했습니다.");onMessage("사고지점·사진을 서버에 저장했습니다.");
        element.querySelector(".journal-compose").open=false;
        focusRecord(result.record);
      } catch(error) {announce(error.message,true);}
      finally {setBusy(false);if(getDay()!==day) changed();}
    });
    list.addEventListener("click",(event)=>{
      const location=event.target.closest("[data-journal-location]"), detail=event.target.closest("[data-journal-detail]"), main=event.target.closest("[data-journal-entry]");
      const id=location?.dataset.journalLocation||detail?.dataset.journalDetail||main?.dataset.journalEntry;
      const record=records.find((entry)=>entry.id===id);if(!record) return;
      if(detail) showDetails(record);else focusRecord(record);
    });
    allDays.addEventListener("change",render);
    refreshButton.addEventListener("click",refresh);
    root.addEventListener("pagehide",clearPreviews);
    setBusy(false);refresh();
    return {
      cancelPick(){picking=false;onPickMode(false);pick.textContent="지도에서 위치 선택";pick.setAttribute("aria-pressed","false");},
      handleMapClick(latlng){if(!picking||busy) return false;selectPoint(latlng);return true;},
      setDay(){if(selectedDay!==getDay()){selectedDay=getDay();point=null;picking=false;onPickMode(false);pick.textContent="지도에서 위치 선택";pick.setAttribute("aria-pressed","false");coordinate.textContent="등록할 위치를 지도에서 선택하세요.";coordinate.classList.remove("is-selected");if(pendingMarker){layer?.removeLayer(pendingMarker);pendingMarker=null;}if(!busy)changed();render();setBusy(busy);}},
      recordsNear(day, point) { return recordsNear(records, day, point); },
      photoUrl, getPhotoStatus() { return { online, refreshing }; },
      openDetails(id) { const record = records.find((item) => item.id === id); if (record) showDetails(record); },
      composeAt({day, point: selected, name}) {
        if (busy || day !== getDay()) { onMessage("사진 저장을 마친 뒤 장소를 선택해주세요."); return false; }
        showMap(); element.querySelector(".journal-compose").open = true; selectPoint(selected);
        form.querySelector('[name="kind"][value="photo"]').checked = true;
        if (!form.elements.title.value.trim()) form.elements.title.value = name;
        changed(); element.scrollIntoView({block:"center",behavior:"smooth"}); form.elements.title.focus({preventScroll:true}); return true;
      },
      refresh, layer
    };
  }
  root.JejuRouteJournal={create,recordsNear};
  if (typeof module === "object" && module.exports) module.exports = root.JejuRouteJournal;
})(typeof window!=="undefined"?window:globalThis);
