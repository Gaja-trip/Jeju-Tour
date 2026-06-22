const selectedRouteStorageKey = "jeju-bike-selected-day";

const routeSegments = [
  {
    id: "day1",
    day: "1일차",
    title: "전주/완도 → 제주항 → 모슬포/대정",
    distance: "라이딩 약 82km",
    rideTime: "약 5h",
    theme: "서부 해안 적응",
    stops: ["전주 집결", "완도항", "제주항/용두암", "애월", "협재/금능", "모슬포/대정"],
    query: "제주항 용두암 애월 협재 금능 신창풍차해안도로 모슬포 자전거길",
    summary: "완도항에서 배편으로 제주에 들어간 뒤 제주항에서 자전거를 조립하고 서부 해안으로 적응 라이딩을 시작합니다.",
    metrics: [
      { value: "82km", label: "예상 거리" },
      { value: "5h", label: "순수 주행" },
      { value: "서부", label: "해안도로" }
    ],
    schedule: [
      { place: "전주 집결", detail: "8명 인원 점검, 더블캡 트럭 적재품과 자전거 선적 상태 확인" },
      { place: "완도여객선터미널", detail: "승선권, 신분증, 차량 선적 접수, 자전거 고정 상태 최종 확인" },
      { place: "제주항/용두암", detail: "하선 후 자전거 조립, 브레이크와 타이어 점검, 팀 주행 순서 정리" },
      { place: "이호테우/애월", detail: "첫 휴식과 물 보충, 바람 방향과 팀 페이스 확인" },
      { place: "협재/금능", detail: "점심과 긴 휴식, 이후 신창풍차해안도로 강풍 구간 대비" },
      { place: "모슬포/대정", detail: "1박, 자전거 실내 또는 잠금 보관, 다음 날 긴 구간 보급 준비" }
    ]
  },
  {
    id: "day2",
    day: "2일차",
    title: "모슬포/대정 → 성산",
    distance: "라이딩 약 96km",
    rideTime: "약 6h",
    theme: "남부 핵심 구간",
    stops: ["모슬포/대정", "송악산", "산방산", "중문", "서귀포", "쇠소깍", "표선", "성산"],
    query: "모슬포 송악산 산방산 중문 서귀포 쇠소깍 표선 성산 자전거길",
    summary: "가장 긴 날입니다. 일찍 출발하고 보급 지점을 촘촘히 잡아야 하며, 서귀포 도심 통과 구간은 속도보다 안전을 우선합니다.",
    metrics: [
      { value: "96km", label: "예상 거리" },
      { value: "6h", label: "순수 주행" },
      { value: "최장", label: "핵심 구간" }
    ],
    schedule: [
      { place: "모슬포/대정", detail: "이른 출발, 체인 윤활과 공기압 확인" },
      { place: "송악산/사계", detail: "초반 경관 구간, 사진 정차는 짧게 운영" },
      { place: "산방산/중문", detail: "오르내림이 있는 구간, 대열 간격 유지" },
      { place: "서귀포/법환바당", detail: "점심 또는 긴 보급, 피로도에 따라 중간 탈출 지점 검토" },
      { place: "쇠소깍/표선", detail: "오후 페이스 관리, 해 질 무렵 차량 통행 주의" },
      { place: "성산", detail: "2박, 다음 날 복귀 라이딩과 배편 시간 재확인" }
    ]
  },
  {
    id: "day3",
    day: "3일차",
    title: "성산 → 제주항/용두암",
    distance: "라이딩 약 64km",
    rideTime: "약 4h",
    theme: "북동부 복귀",
    stops: ["성산", "세화", "월정리", "김녕", "함덕", "용두암", "제주항"],
    query: "성산 세화 월정리 김녕 함덕 용두암 제주항 자전거길",
    summary: "북동부 해안도로를 따라 제주항으로 복귀합니다. 배편 준비 시간을 기준으로 최소 2시간 여유를 두고 항구에 도착하는 운영이 좋습니다.",
    metrics: [
      { value: "64km", label: "예상 거리" },
      { value: "4h", label: "순수 주행" },
      { value: "복귀", label: "항구 마감" }
    ],
    schedule: [
      { place: "성산", detail: "아침 출발, 성산일출봉 주변 관광 차량 주의" },
      { place: "세화/월정리", detail: "카페와 보급 지점이 많아 팀 상태 점검에 적합" },
      { place: "김녕/함덕", detail: "마지막 긴 휴식, 바람이 강하면 속도보다 대열 안정 우선" },
      { place: "용두암", detail: "제주항 진입 전 자전거 상태와 짐 분산 확인" },
      { place: "제주항", detail: "라이딩 종료, 자전거 선적 준비와 승선권 확인" }
    ]
  },
  {
    id: "day4",
    day: "4일차",
    title: "제주항 → 완도항 → 전주 복귀",
    distance: "복귀 운영",
    rideTime: "배편 기준",
    theme: "하선/귀가",
    stops: ["제주항", "완도항", "트럭 적재", "전주 복귀"],
    query: "제주항 완도여객선터미널 전주 복귀",
    summary: "야간 또는 익일 도착 배편까지 포함해 보는 복귀 운영일입니다. 트럭은 선적과 하선, 최종 복귀 적재 용도로만 사용합니다.",
    metrics: [
      { value: "배편", label: "교통편 확인" },
      { value: "8명", label: "인원 점검" },
      { value: "1대", label: "더블캡 트럭" }
    ],
    schedule: [
      { place: "제주항 집결", detail: "출항 2시간 전 도착 기준, 신분증과 승선권 확인" },
      { place: "자전거/트럭 선적", detail: "더블캡 트럭 적재는 하선과 복귀용으로만 운영, 개인 짐 분실 방지" },
      { place: "완도항 하선", detail: "자전거 파손 여부와 개인 장비 누락 확인" },
      { place: "전주 복귀", detail: "운전자 휴식 시간을 확보하고, 야간 이동이면 교대 운전 계획 적용" },
      { place: "도착 후 정리", detail: "공용 장비 회수, 정산, 다음 라이딩을 위한 정비 목록 작성" }
    ]
  }
];

const transportOptions = [
  {
    id: "truck-ferry",
    badge: "추천",
    title: "더블캡 트럭 + 완도 배편",
    summary: "8명 장비와 자전거 선적을 한 번에 관리하기 좋은 기본 운영안입니다.",
    outbound: "전주 집결 → 완도항 차량 이동 → 완도항 승선 → 제주항 하선",
    returnPlan: "제주항 승선 → 완도항 하선 → 자전거/짐 재적재 → 전주 복귀",
    truck: "트럭은 항구 승하선, 짐 이동, 비상 회수 용도로만 사용",
    checks: ["차량 선적 예약", "8명 신분증", "자전거 고정 스트랩", "운전자 휴식"],
    links: [
      { label: "전주 → 완도항 지도", href: "https://map.naver.com/p/search/%EC%A0%84%EC%A3%BC%EC%97%90%EC%84%9C%20%EC%99%84%EB%8F%84%EC%97%AC%EA%B0%9D%EC%84%A0%ED%84%B0%EB%AF%B8%EB%84%90" },
      { label: "배편 확인", href: "https://island.haewoon.co.kr/" },
      { label: "제주항 지도", href: "https://map.naver.com/p/search/%EC%A0%9C%EC%A3%BC%ED%95%AD" }
    ]
  },
  {
    id: "train-ferry",
    badge: "대체",
    title: "기차 + 현지 이동 + 배편",
    summary: "차량 운전 부담을 줄이는 방식입니다. 자전거 포장, 환승 동선, 항구 접근 시간이 핵심입니다.",
    outbound: "전주역 → 광주송정/목포권 환승 → 완도 또는 목포 항구 이동 → 제주행 배편",
    returnPlan: "제주항 또는 목포/완도 도착 → 기차역 이동 → 전주역 복귀",
    truck: "트럭은 별도 선적하지 않거나, 장비 운반 전담 차량으로 분리 운영",
    checks: ["자전거 포장 규정", "역-항구 환승 시간", "단체 승차권", "우천 시 택시/밴 대안"],
    links: [
      { label: "코레일", href: "https://www.letskorail.com/" },
      { label: "전주역 → 광주송정역", href: "https://map.naver.com/p/search/%EC%A0%84%EC%A3%BC%EC%97%AD%EC%97%90%EC%84%9C%20%EA%B4%91%EC%A3%BC%EC%86%A1%EC%A0%95%EC%97%AD" },
      { label: "배편 확인", href: "https://island.haewoon.co.kr/" }
    ]
  },
  {
    id: "bus-ferry",
    badge: "예비",
    title: "버스 + 배편",
    summary: "트럭 운행이 어려울 때 쓰는 예비안입니다. 자전거 적재 가능 여부를 출발 전에 반드시 확인해야 합니다.",
    outbound: "전주터미널 → 광주/해남/완도권 버스 → 완도항 이동 → 제주행 배편",
    returnPlan: "완도항 하선 → 터미널 이동 → 전주행 버스 복귀",
    truck: "트럭 미사용 또는 항구 구간 보조 차량으로만 제한 운영",
    checks: ["버스 자전거 적재 가능 여부", "터미널-항구 이동", "단체 수하물", "막차 시간"],
    links: [
      { label: "고속버스", href: "https://www.kobus.co.kr/" },
      { label: "시외버스", href: "https://txbus.t-money.co.kr/" },
      { label: "완도항 지도", href: "https://map.naver.com/p/search/%EC%99%84%EB%8F%84%EC%97%AC%EA%B0%9D%EC%84%A0%ED%84%B0%EB%AF%B8%EB%84%90" }
    ]
  },
  {
    id: "mokpo-ferry",
    badge: "대안",
    title: "목포항 대체 배편",
    summary: "완도 배편 시간대가 맞지 않을 때 검토하는 대안입니다. 제주 도착 항구와 첫날 코스를 다시 맞춥니다.",
    outbound: "전주 → 목포항 이동 → 제주행 배편 → 제주항 또는 제주 여객터미널 하선",
    returnPlan: "제주 출항 → 목포항 하선 → 전주 복귀",
    truck: "트럭 선적 가능 여부와 항구 주차 동선을 별도로 확인",
    checks: ["목포 출항 시간", "차량 선적 마감", "제주 도착 항구", "첫날 라이딩 시작점 조정"],
    links: [
      { label: "전주 → 목포항 지도", href: "https://map.naver.com/p/search/%EC%A0%84%EC%A3%BC%EC%97%90%EC%84%9C%20%EB%AA%A9%ED%8F%AC%ED%95%AD" },
      { label: "배편 확인", href: "https://island.haewoon.co.kr/" },
      { label: "목포항 지도", href: "https://map.naver.com/p/search/%EB%AA%A9%ED%8F%AC%ED%95%AD%EC%97%AC%EA%B0%9D%ED%84%B0%EB%AF%B8%EB%84%90" }
    ]
  }
];

const iconShare = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18 16.1c-.76 0-1.44.3-1.96.77L8.91 12.7a3.3 3.3 0 0 0 0-1.39l7.05-4.11A2.99 2.99 0 1 0 15 5c0 .24.03.47.08.69L8.03 9.8a3 3 0 1 0 0 4.4l7.1 4.17A2.81 2.81 0 0 0 15 19a3 3 0 1 0 3-2.9"/></svg>';

function naverSearchUrl(query) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

function naverAppUrl(query) {
  return `nmap://search?query=${encodeURIComponent(query)}&appname=jeju-bike-tour`;
}

function getRouteSegment(dayId) {
  return routeSegments.find((segment) => segment.id === dayId);
}

function getValidDay(dayId) {
  return getRouteSegment(dayId) ? dayId : null;
}

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value) {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    // Storage can be unavailable in some private browsing modes.
  }
}

function getRequestedDay() {
  const params = new URLSearchParams(window.location.search);
  return getValidDay(params.get("day") || params.get("route"));
}

function renderMetrics(metrics) {
  return metrics
    .map((metric) => `<div class="mini-metric"><strong>${metric.value}</strong><span>${metric.label}</span></div>`)
    .join("");
}

function renderTimeline(schedule) {
  return schedule
    .map((stop) => `<div class="stop"><strong>${stop.place}</strong> ${stop.detail}</div>`)
    .join("");
}

function renderScheduleCard(segment, options = {}) {
  const compactClass = options.compact ? " selected-schedule-card" : "";
  const action = options.compact
    ? `<div class="action-list selected-actions">
        <a class="btn dark small" href="schedule.html?day=${segment.id}">일정표에서 크게 보기</a>
        <a class="btn light small" href="${naverSearchUrl(segment.query)}" target="_blank" rel="noreferrer" data-naver-map data-naver-query="${segment.query}" data-web-url="${naverSearchUrl(segment.query)}">네이버지도 열기</a>
      </div>`
    : "";

  return `
    <article class="day-card${compactClass}" data-day-card="${segment.id}">
      <div class="day-head">
        <span>${segment.day}</span>
        <h3>${segment.title}</h3>
      </div>
      <div class="day-body">
        <div class="metric-row">
          ${renderMetrics(segment.metrics)}
        </div>
        <p>${segment.summary}</p>
        <div class="timeline">
          ${renderTimeline(segment.schedule)}
        </div>
        ${action}
      </div>
    </article>
  `;
}

function renderPlannerScheduleCard(segment, activeDay) {
  const active = segment.id === activeDay;
  return `
    <article class="planner-day-card${active ? " active" : ""}" data-plan-day="${segment.id}">
      <div class="planner-day-badge">${segment.day}</div>
      <h3>${segment.title}</h3>
      <p>${segment.summary}</p>
      <div class="planner-day-metrics">
        ${segment.metrics.map((metric) => `<span><b>${metric.value}</b>${metric.label}</span>`).join("")}
      </div>
      <ol>
        ${segment.schedule.map((stop) => `<li><strong>${stop.place}</strong><span>${stop.detail}</span></li>`).join("")}
      </ol>
    </article>
  `;
}

function setupPlannerApp() {
  const app = document.querySelector("[data-planner-app]");
  if (!app) return;

  const routeTabs = document.querySelector("[data-planner-route-tabs]");
  const routeFocus = document.querySelector("[data-planner-route-focus]");
  const mapFrame = document.querySelector("[data-planner-map-frame]");
  const mapLink = document.querySelector("[data-planner-map-link]");
  const mapOverlayTitle = document.querySelector("[data-map-overlay-title]");
  const schedule = document.querySelector("[data-planner-schedule]");
  const transportTarget = document.querySelector("[data-transport-options]");
  const transportDetail = document.querySelector("[data-transport-detail]");
  const masterPlan = document.querySelector("[data-master-plan]");

  if (!routeTabs || !routeFocus || !mapFrame || !mapLink || !schedule || !transportTarget || !transportDetail || !masterPlan) return;

  let selectedDay = getRequestedDay() || getValidDay(readStorage(selectedRouteStorageKey)) || "day1";
  let selectedTransport = readStorage("jeju-bike-transport") || "truck-ferry";
  if (!transportOptions.some((option) => option.id === selectedTransport)) selectedTransport = "truck-ferry";

  routeTabs.innerHTML = routeSegments.map((segment) => `
    <button type="button" data-planner-route="${segment.id}">
      <span>${segment.day}</span>
      <strong>${segment.theme}</strong>
      <small>${segment.distance}</small>
    </button>
  `).join("");

  transportTarget.innerHTML = transportOptions.map((option) => `
    <button type="button" class="transport-choice" data-transport-choice="${option.id}">
      <span>${option.badge}</span>
      <strong>${option.title}</strong>
      <small>${option.summary}</small>
    </button>
  `).join("");

  const renderTransportDetail = (option) => `
    <span class="tag">${option.badge}</span>
    <h3>${option.title}</h3>
    <p>${option.summary}</p>
    <dl class="transport-lines">
      <div><dt>출발</dt><dd>${option.outbound}</dd></div>
      <div><dt>복귀</dt><dd>${option.returnPlan}</dd></div>
      <div><dt>트럭</dt><dd>${option.truck}</dd></div>
    </dl>
    <div class="source-list">
      ${option.links.map((link) => `<a class="btn light small" href="${link.href}" target="_blank" rel="noreferrer" data-naver-map>${link.label}</a>`).join("")}
    </div>
  `;

  const renderMasterPlan = (dayId, transportId) => {
    const activeRoute = getRouteSegment(dayId) || routeSegments[0];
    const transport = transportOptions.find((option) => option.id === transportId) || transportOptions[0];
    const totalDistance = routeSegments
      .map((segment) => Number.parseInt(segment.distance.replace(/[^0-9]/g, ""), 10))
      .filter(Number.isFinite)
      .reduce((sum, value) => sum + value, 0);

    return `
      <div class="master-summary">
        <div><strong>${transport.title}</strong><span>선택 교통편</span></div>
        <div><strong>${totalDistance}km</strong><span>예상 라이딩</span></div>
        <div><strong>${activeRoute.day}</strong><span>지도 선택 코스</span></div>
        <div><strong>8명</strong><span>운영 인원</span></div>
      </div>
      <div class="master-flow">
        <article>
          <span>출발</span>
          <h3>전주 → 항구</h3>
          <p>${transport.outbound}</p>
        </article>
        <article>
          <span>제주 라이딩</span>
          <h3>1~3일차 자전거 이동</h3>
          <p>${routeSegments.slice(0, 3).map((segment) => segment.title).join(" / ")}</p>
        </article>
        <article>
          <span>복귀</span>
          <h3>4일차 항구 운영</h3>
          <p>${transport.returnPlan}</p>
        </article>
      </div>
      <div class="master-columns">
        <section>
          <h3>일자별 운영</h3>
          <div class="compact-plan-list">
            ${routeSegments.map((segment) => `
              <div class="${segment.id === dayId ? "active" : ""}">
                <b>${segment.day}</b>
                <span>${segment.title}</span>
              </div>
            `).join("")}
          </div>
        </section>
        <section>
          <h3>교통 체크</h3>
          <ul class="plain-check-list">
            ${transport.checks.map((check) => `<li>${check}</li>`).join("")}
          </ul>
        </section>
      </div>
    `;
  };

  const syncNaverLink = (segment) => {
    const url = naverSearchUrl(segment.query);
    mapFrame.src = url;
    mapLink.href = url;
    mapLink.dataset.naverQuery = segment.query;
    mapLink.dataset.webUrl = url;
    mapLink.textContent = `${segment.day} 지도 열기`;
  };

  const setRoute = (dayId) => {
    const segment = getRouteSegment(dayId) || routeSegments[0];
    selectedDay = segment.id;
    writeStorage(selectedRouteStorageKey, selectedDay);

    routeTabs.querySelectorAll("[data-planner-route]").forEach((button) => {
      const active = button.dataset.plannerRoute === selectedDay;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    routeFocus.innerHTML = `
      <span class="tag">${segment.day}</span>
      <h3>${segment.title}</h3>
      <p>${segment.summary}</p>
      <div class="checkpoint-flow">
        ${segment.stops.map((stop) => `<span>${stop}</span>`).join("")}
      </div>
    `;

    syncNaverLink(segment);
    if (mapOverlayTitle) mapOverlayTitle.textContent = `${segment.day} ${segment.theme}`;
    schedule.innerHTML = routeSegments.map((item) => renderPlannerScheduleCard(item, selectedDay)).join("");
    masterPlan.innerHTML = renderMasterPlan(selectedDay, selectedTransport);
    setupNaverMapLinks(app);
  };

  const setTransport = (transportId) => {
    const option = transportOptions.find((item) => item.id === transportId) || transportOptions[0];
    selectedTransport = option.id;
    writeStorage("jeju-bike-transport", selectedTransport);

    transportTarget.querySelectorAll("[data-transport-choice]").forEach((button) => {
      const active = button.dataset.transportChoice === selectedTransport;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    transportDetail.innerHTML = renderTransportDetail(option);
    masterPlan.innerHTML = renderMasterPlan(selectedDay, selectedTransport);
    setupNaverMapLinks(transportDetail);
  };

  routeTabs.querySelectorAll("[data-planner-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.plannerRoute));
  });

  transportTarget.querySelectorAll("[data-transport-choice]").forEach((button) => {
    button.addEventListener("click", () => setTransport(button.dataset.transportChoice));
  });

  setRoute(selectedDay);
  setTransport(selectedTransport);
}

function renderRouteCards() {
  const target = document.querySelector("[data-route-cards]");
  if (!target) return;

  target.innerHTML = routeSegments.map((segment) => {
    const mapUrl = naverSearchUrl(segment.query);
    return `
      <article class="route-card" data-route-card="${segment.id}">
        <header>
          <div>
            <strong>${segment.day}</strong>
            <div>${segment.title}</div>
          </div>
          <span class="tag">${segment.distance}</span>
        </header>
        <p class="route-card-summary">${segment.theme} · ${segment.rideTime}</p>
        <ul class="checkpoint-list">
          ${segment.stops.map((stop) => `<li>${stop}</li>`).join("")}
        </ul>
        <div class="action-list route-actions">
          <button class="btn dark small" type="button" data-route-select="${segment.id}">코스 선택</button>
          <a class="btn light small" href="schedule.html?day=${segment.id}">일정표 보기</a>
          <a class="btn light small" href="${mapUrl}" target="_blank" rel="noreferrer" data-naver-map data-naver-query="${segment.query}" data-web-url="${mapUrl}">지도 열기</a>
        </div>
      </article>
    `;
  }).join("");
}

function setupCourseSelection() {
  const output = document.querySelector("[data-selected-schedule]");
  const buttons = [...document.querySelectorAll("[data-route-select]")];
  if (!output || !buttons.length) return;

  const cards = [...document.querySelectorAll("[data-route-card]")];

  const setSelectedRoute = (dayId) => {
    const segment = getRouteSegment(dayId) || routeSegments[0];
    writeStorage(selectedRouteStorageKey, segment.id);

    cards.forEach((card) => {
      const active = card.dataset.routeCard === segment.id;
      card.classList.toggle("selected", active);
    });

    buttons.forEach((button) => {
      const active = button.dataset.routeSelect === segment.id;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "선택됨" : "코스 선택";
    });

    output.innerHTML = renderScheduleCard(segment, { compact: true });
    setupNaverMapLinks(output);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setSelectedRoute(button.dataset.routeSelect));
  });

  setSelectedRoute(getRequestedDay() || getValidDay(readStorage(selectedRouteStorageKey)) || "day1");
}

function renderScheduleControls() {
  const tabs = document.querySelector("[data-schedule-tabs]");
  const summaries = document.querySelector("[data-schedule-summary]");
  const cards = document.querySelector("[data-schedule-cards]");

  if (tabs) {
    tabs.innerHTML = `
      <button class="active" type="button" data-schedule-filter="all">전체 4일</button>
      ${routeSegments.map((segment) => `<button type="button" data-schedule-filter="${segment.id}">${segment.day}</button>`).join("")}
    `;
  }

  if (summaries) {
    summaries.innerHTML = routeSegments.map((segment) => `
      <article class="summary-card" data-summary-day="${segment.id}">
        <strong>${segment.day} · ${segment.distance}</strong>
        <span>${segment.title} · ${segment.theme}</span>
      </article>
    `).join("");
  }

  if (cards) {
    cards.innerHTML = routeSegments.map((segment) => renderScheduleCard(segment)).join("");
  }
}

function setupScheduleTabs() {
  const tabs = document.querySelector("[data-schedule-tabs]");
  if (!tabs) return;

  renderScheduleControls();

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

    writeStorage(selectedRouteStorageKey, filter === "all" ? "" : filter);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.scheduleFilter));
  });

  const initialFilter = getRequestedDay() || getValidDay(readStorage(selectedRouteStorageKey)) || "all";
  setFilter(initialFilter);
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

  const savedDate = readStorage("jeju-bike-trip-date");
  if (savedDate) {
    tripDate.value = savedDate;
    dateHint.textContent = `${savedDate} 출발 기준으로 확인하세요.`;
  }

  tripDate.addEventListener("change", () => {
    if (!tripDate.value) return;
    writeStorage("jeju-bike-trip-date", tripDate.value);
    dateHint.textContent = `${tripDate.value} 출발 기준으로 확인하세요.`;
  });
}

function isLikelyMobile() {
  return window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
}

function queryFromNaverUrl(href) {
  try {
    const url = new URL(href, window.location.href);
    const searchPath = "/p/search/";
    const index = url.pathname.indexOf(searchPath);
    if (index === -1) return "";
    return decodeURIComponent(url.pathname.slice(index + searchPath.length));
  } catch (error) {
    return "";
  }
}

function setupNaverMapLinks(scope = document) {
  const links = [...scope.querySelectorAll('[data-naver-map], a[href*="map.naver.com"]')];

  links.forEach((link) => {
    if (link.dataset.naverReady === "true") return;
    link.dataset.naverReady = "true";

    link.addEventListener("click", (event) => {
      const query = link.dataset.naverQuery || queryFromNaverUrl(link.href);
      const webUrl = link.dataset.webUrl || link.href;

      if (!query || !isLikelyMobile()) return;

      event.preventDefault();
      const startedAt = Date.now();
      window.location.href = naverAppUrl(query);

      window.setTimeout(() => {
        const stillHere = document.visibilityState === "visible" && Date.now() - startedAt < 1900;
        if (stillHere) window.location.href = webUrl;
      }, 1200);
    });
  });
}

renderRouteCards();
setupCourseSelection();
setupScheduleTabs();
setupLiveTabs();
setupPlannerApp();
setupShare();
setupTripDate();
setupNaverMapLinks();
