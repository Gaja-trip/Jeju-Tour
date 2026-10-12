(function (root) {
  "use strict";
  function create({ onRoadview = () => {}, onAddPhotos = () => {}, onOpenPhoto = () => {}, onRefreshPhotos = () => {}, onLayout = () => {} } = {}) {
    let journal, mobileContext;
    const dialog = document.createElement("dialog");
    dialog.className = "gpx-stop-dialog";
    dialog.setAttribute("aria-label", "정지 장소와 사진");
    const bar = document.createElement("header"), heading = document.createElement("strong"), close = document.createElement("button"), body = document.createElement("div");
    bar.className = "stop-dialog-heading"; heading.textContent = "정지 장소 · 사진";
    close.type = "button"; close.textContent = "닫기 ×"; close.setAttribute("aria-label", "정지 장소 상세 닫기");
    close.addEventListener("click", () => dialog.close()); bar.append(heading, close); dialog.append(bar, body); document.body.append(dialog);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => { mobileContext = null; });
    function button(text, handler, className = "") {
      const node = document.createElement("button"); node.type = "button"; node.textContent = text; node.className = className;
      node.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); handler(); }); return node;
    }
    function paragraph(text, className) {
      const node = document.createElement("p"); node.textContent = text; node.className = className; return node;
    }
    function render(context) {
      const card = document.createElement("article"); card.className = "gpx-stop-card"; card.dataset.stopDay = context.day; card.dataset.stopNumber = context.number;
      const title = document.createElement("h2"); title.textContent = context.name;
      card.append(paragraph(context.dayLabel + " · 정지 #" + context.number, "stop-card-eyebrow"), title,
        paragraph("위치 · " + (context.address || context.point.lat.toFixed(6) + ", " + context.point.lng.toFixed(6)), "stop-card-address"));
      const details = document.createElement("details"), summary = document.createElement("summary");
      summary.textContent = "체류 시간 · 장소 정보"; details.className = "stop-card-place-details";
      details.append(summary, paragraph(context.summary, "stop-card-summary"), paragraph(context.timeRange + " · 한국 시간", "stop-card-time"));
      if (context.description) details.append(paragraph(context.description, ""));
      details.addEventListener("toggle", onLayout); card.append(details);
      const records = journal?.recordsNear(context.day, context.point) || [];
      const photos = records.flatMap((record) => record.photos.map((photo, index) => ({ record, photo, index, url: journal.photoUrl(photo) }))).filter((entry) => entry.url);
      const section = document.createElement("section"), photoHeading = document.createElement("h3");
      section.className = "stop-card-photos"; photoHeading.textContent = "등록된 사진" + (photos.length ? " · " + photos.length + "장" : ""); section.append(photoHeading);
      if (photos.length) {
        const grid = document.createElement("div"); grid.className = "stop-card-photo-grid" + (photos.length === 1 ? " has-one-photo" : "");
        for (const { record, index, url } of photos) {
          const thumb = button("", () => onOpenPhoto(record.id), "stop-card-photo"), img = document.createElement("img"), caption = document.createElement("span");
          thumb.setAttribute("aria-label", record.title + " 사진 " + (index + 1) + " 크게 보기");
          img.src = url; img.alt = record.title + " 사진 " + (index + 1); img.loading = "lazy";
          caption.textContent = record.title;
          img.addEventListener("error", () => { img.hidden = true; caption.textContent = "사진을 불러오지 못했습니다 · 다시 보기"; thumb.classList.add("is-unavailable"); });
          thumb.append(img, caption); grid.append(thumb);
        }
        section.append(grid, paragraph("같은 일차 · 이 위치 주변 50 m에 저장된 사진입니다.", "stop-card-photo-hint"));
      } else {
        const state = journal?.getPhotoStatus();
        const text = state?.refreshing || !journal ? "저장된 사진을 확인하고 있습니다." : state?.online ?
          "아직 이 장소에 등록된 사진이 없습니다." : "사진 서버에 연결할 수 없습니다.";
        const empty = paragraph(text, "stop-card-photo-empty"); empty.setAttribute("role", "status"); section.append(empty);
        if (state && !state.online && !state.refreshing) section.append(button("사진 다시 불러오기", onRefreshPhotos, "stop-card-retry"));
      }
      card.append(section);
      const actions = document.createElement("div"); actions.className = "stop-card-actions";
      actions.append(button("이 장소 사진 등록", () => { api.close(); onAddPhotos(context); }, "stop-card-add"),
        button("로드뷰 보기", () => { api.close(); onRoadview(context); }, "stop-card-roadview"));
      const location = document.createElement("a"); location.textContent = "카카오맵 위치"; location.href = "https://map.kakao.com/link/map/" +
        encodeURIComponent(context.name) + "," + context.point.lat + "," + context.point.lng; location.target = "_blank"; location.rel = "noopener noreferrer";
      actions.append(location); card.append(actions); return card;
    }
    const api = {
      render,
      setJournal(value) { journal = value; this.refresh(); },
      showMobile(context) {
        mobileContext = context; body.replaceChildren(render(context)); dialog.setAttribute("aria-label", context.name + " · 장소와 사진");
        if (!dialog.open) dialog.showModal(); close.focus({ preventScroll: true });
      },
      refresh() { if (dialog.open && mobileContext) body.replaceChildren(render(mobileContext)); },
      close() { if (dialog.open) dialog.close(); },
      isOpen() { return dialog.open; }
    };
    return api;
  }
  root.JejuCourseStopCard = { create };
})(typeof window !== "undefined" ? window : globalThis);