const routeSegments = [
  {
    day: "1일차",
    title: "제주항/용두암 → 모슬포/대정",
    distance: "약 82km",
    stops: ["용두암", "이호테우", "애월", "협재/금능", "신창풍차해안도로", "모슬포"],
    query: "제주항 용두암 애월 협재 신창풍차해안도로 모슬포 자전거길"
  },
  {
    day: "2일차",
    title: "모슬포/대정 → 성산",
    distance: "약 96km",
    stops: ["모슬포", "송악산", "산방산", "중문", "서귀포", "쇠소깍", "표선", "성산"],
    query: "모슬포 송악산 산방산 중문 서귀포 쇠소깍 표선 성산 자전거길"
  },
  {
    day: "3일차",
    title: "성산 → 제주항/용두암",
    distance: "약 64km",
    stops: ["성산", "세화", "월정리", "김녕", "함덕", "용두암", "제주항"],
    query: "성산 세화 월정리 김녕 함덕 용두암 제주항 자전거길"
  }
];

const iconShare = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18 16.1c-.76 0-1.44.3-1.96.77L8.91 12.7a3.3 3.3 0 0 0 0-1.39l7.05-4.11A2.99 2.99 0 1 0 15 5c0 .24.03.47.08.69L8.03 9.8a3 3 0 1 0 0 4.4l7.1 4.17A2.81 2.81 0 0 0 15 19a3 3 0 1 0 3-2.9"/></svg>';

function naverSearchUrl(query) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

function renderRouteCards() {
  const target = document.querySelector("[data-route-cards]");
  if (!target) return;

  routeSegments.forEach((segment) => {
    const card = document.createElement("article");
    card.className = "route-card";
    card.innerHTML = `
      <header>
        <div>
          <strong>${segment.day}</strong>
          <div>${segment.title}</div>
        </div>
        <span class="tag">${segment.distance}</span>
      </header>
      <ul class="checkpoint-list">
        ${segment.stops.map((stop) => `<li>${stop}</li>`).join("")}
      </ul>
      <div class="action-list" style="margin-top:10px">
        <a class="btn dark small" href="${naverSearchUrl(segment.query)}" target="_blank" rel="noreferrer">네이버지도 열기</a>
      </div>
    `;
    target.appendChild(card);
  });
}

function setupScheduleTabs() {
  const tabs = document.querySelector("[data-schedule-tabs]");
  if (!tabs) return;

  const buttons = [...tabs.querySelectorAll("[data-schedule-filter]")];
  const cards = [...document.querySelectorAll("[data-day-card]")];
  const summaries = [...document.querySelectorAll("[data-summary-day]")];

  const setFilter = (filter) => {
    buttons.forEach((button) => {
      const active = button.dataset.scheduleFilter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    cards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.dayCard !== filter;
    });

    summaries.forEach((summary) => {
      summary.hidden = filter !== "all" && summary.dataset.summaryDay !== filter;
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.scheduleFilter));
  });

  setFilter("all");
}

function setupLiveTabs() {
  const menu = document.querySelector("[data-live-tabs]");
  if (!menu) return;

  const buttons = [...menu.querySelectorAll("[data-live-tab]")];
  const panels = [...document.querySelectorAll("[data-live-panel]")];

  const setTab = (tab) => {
    buttons.forEach((button) => {
      const active = button.dataset.liveTab === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    panels.forEach((panel) => {
      const active = panel.dataset.livePanel === tab;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.liveTab));
  });

  setTab(buttons[0]?.dataset.liveTab || "map");
}

function setupShare() {
  const buttons = document.querySelectorAll("[data-share]");
  const toast = document.querySelector("[data-toast]");
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 2200);
  };

  buttons.forEach((button) => {
    if (!button.innerHTML.trim()) button.innerHTML = `${iconShare} 공유`;
    button.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "전주 출발 제주도 2박 3일 자전거 여행 계획표",
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }

      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("링크를 복사했습니다.");
      } catch (error) {
        showToast("주소창의 링크를 복사해 공유하세요.");
      }
    });
  });
}

function setupTripDate() {
  const tripDate = document.querySelector("#tripDate");
  const dateHint = document.querySelector("#dateHint");
  if (!tripDate || !dateHint) return;

  const savedDate = localStorage.getItem("jeju-bike-trip-date");
  if (savedDate) {
    tripDate.value = savedDate;
    dateHint.textContent = `${savedDate} 출발 기준으로 확인하세요.`;
  }

  tripDate.addEventListener("change", () => {
    if (!tripDate.value) return;
    localStorage.setItem("jeju-bike-trip-date", tripDate.value);
    dateHint.textContent = `${tripDate.value} 출발 기준으로 확인하세요.`;
  });
}

renderRouteCards();
setupScheduleTabs();
setupLiveTabs();
setupShare();
setupTripDate();
