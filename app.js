const storageKeys = {
  routePlan: "jeju-bike-route-plan-v2",
  activeDay: "jeju-bike-active-day-v2",
  transport: "jeju-bike-transport-v2",
  tripDate: "jeju-bike-trip-date"
};

const dayLabels = {
  day1: "1일차",
  day2: "2일차",
  day3: "3일차",
  day4: "4일차"
};

const vworldApiKey = "5880CF73-00D8-30E9-BCF1-3DC6E80FC58B";

const jejuBikeNodes = [
  { name: "제주항", lat: 33.5162, lng: 126.5280, elevation: 8 },
  { name: "용두암", lat: 33.5161, lng: 126.5117, elevation: 12 },
  { name: "이호테우", lat: 33.4971, lng: 126.4522, elevation: 10 },
  { name: "애월", lat: 33.4637, lng: 126.3096, elevation: 18 },
  { name: "협재", lat: 33.3945, lng: 126.2397, elevation: 12 },
  { name: "신창풍차해안도로", lat: 33.3459, lng: 126.1746, elevation: 9 },
  { name: "모슬포/대정", lat: 33.2208, lng: 126.2496, elevation: 20 },
  { name: "송악산", lat: 33.2066, lng: 126.2902, elevation: 48 },
  { name: "산방산", lat: 33.2391, lng: 126.3130, elevation: 74 },
  { name: "중문", lat: 33.2497, lng: 126.4124, elevation: 64 },
  { name: "서귀포", lat: 33.2461, lng: 126.5615, elevation: 42 },
  { name: "쇠소깍", lat: 33.2525, lng: 126.6231, elevation: 16 },
  { name: "표선", lat: 33.3244, lng: 126.8324, elevation: 18 },
  { name: "성산", lat: 33.4585, lng: 126.9348, elevation: 24 },
  { name: "세화", lat: 33.5260, lng: 126.8567, elevation: 14 },
  { name: "월정리", lat: 33.5568, lng: 126.7952, elevation: 12 },
  { name: "김녕", lat: 33.5576, lng: 126.7593, elevation: 10 },
  { name: "함덕", lat: 33.5437, lng: 126.6692, elevation: 11 },
  { name: "삼양", lat: 33.5262, lng: 126.5865, elevation: 8 }
];

const routeChoices = {
  day1: [
    {
      optionId: "west-standard",
      title: "제주항 → 모슬포/대정",
      theme: "서부 해안 적응",
      distance: "82km",
      rideTime: "5h",
      stops: ["제주항/용두암", "이호테우", "애월", "협재/금능", "신창풍차해안도로", "모슬포/대정"],
      summary: "제주항에서 자전거를 조립한 뒤 서부 해안도로로 몸을 풀며 모슬포까지 이동하는 기본 코스입니다.",
      schedule: [
        { time: "09:30", place: "제주항/용두암", detail: "하선, 자전거 조립, 브레이크와 타이어 점검" },
        { time: "11:00", place: "이호테우/애월", detail: "첫 보급, 바람 방향과 팀 페이스 확인" },
        { time: "13:00", place: "협재/금능", detail: "점심과 긴 휴식" },
        { time: "15:30", place: "신창풍차해안도로", detail: "강풍 주의, 대열 간격 유지" },
        { time: "17:30", place: "모슬포/대정", detail: "1박, 자전거 실내 보관 확인" }
      ]
    },
    {
      optionId: "west-short",
      title: "제주항 → 협재/한림",
      theme: "짧은 적응",
      distance: "55km",
      rideTime: "3.5h",
      stops: ["제주항/용두암", "이호테우", "애월", "곽지", "한림", "협재"],
      summary: "배편 도착이 늦거나 첫날 컨디션을 보수적으로 볼 때 쓰는 짧은 서부 적응 코스입니다.",
      schedule: [
        { time: "10:30", place: "제주항/용두암", detail: "하선 후 장비 점검" },
        { time: "12:00", place: "애월", detail: "점심과 보급" },
        { time: "14:30", place: "곽지/한림", detail: "팀 페이스 조정" },
        { time: "16:00", place: "협재", detail: "숙소 또는 추가 이동 여부 결정" }
      ]
    },
    {
      optionId: "west-scenic",
      title: "제주항 → 산방산 권역",
      theme: "서부 경관 강화",
      distance: "92km",
      rideTime: "6h",
      stops: ["제주항", "애월", "협재", "신창", "차귀도", "송악산", "산방산"],
      summary: "서부 해안 풍경을 길게 가져가는 코스입니다. 초반 배편이 빠르고 팀 체력이 좋을 때 적합합니다.",
      schedule: [
        { time: "08:40", place: "제주항", detail: "빠른 출발, 장비 점검 최소화" },
        { time: "11:00", place: "협재", detail: "첫 긴 휴식" },
        { time: "13:30", place: "신창/차귀도", detail: "점심과 사진 정차" },
        { time: "16:30", place: "송악산", detail: "오르내림 구간 주의" },
        { time: "18:00", place: "산방산 권역", detail: "숙소 도착, 다음날 남부 구간 준비" }
      ]
    }
  ],
  day2: [
    {
      optionId: "south-standard",
      title: "모슬포/대정 → 성산",
      theme: "남부 핵심 구간",
      distance: "96km",
      rideTime: "6h",
      stops: ["모슬포/대정", "송악산", "산방산", "중문", "서귀포", "쇠소깍", "표선", "성산"],
      summary: "가장 긴 라이딩 날입니다. 보급 지점을 촘촘히 잡고 서귀포 도심 통과는 안전을 우선합니다.",
      schedule: [
        { time: "08:00", place: "모슬포/대정", detail: "이른 출발, 공기압과 체인 윤활 확인" },
        { time: "10:00", place: "송악산/산방산", detail: "경관 구간, 사진 정차는 짧게" },
        { time: "12:30", place: "중문/서귀포", detail: "점심, 긴 보급" },
        { time: "15:30", place: "쇠소깍/표선", detail: "오후 페이스 관리" },
        { time: "18:00", place: "성산", detail: "2박, 다음날 복귀 배편 재확인" }
      ]
    },
    {
      optionId: "south-cut",
      title: "모슬포/대정 → 표선",
      theme: "중간 절단",
      distance: "78km",
      rideTime: "5h",
      stops: ["모슬포/대정", "송악산", "중문", "서귀포", "쇠소깍", "표선"],
      summary: "강풍이나 비가 있을 때 성산까지 무리하지 않고 표선에서 끊는 안전 운영 코스입니다.",
      schedule: [
        { time: "08:30", place: "모슬포/대정", detail: "컨디션 확인 후 출발" },
        { time: "11:00", place: "중문", detail: "보급과 우천 장비 점검" },
        { time: "13:30", place: "서귀포", detail: "점심, 필요 시 회수 판단" },
        { time: "16:30", place: "표선", detail: "숙소 또는 성산 추가 이동 결정" }
      ]
    },
    {
      optionId: "south-long",
      title: "산방산 → 성산",
      theme: "남부 완주",
      distance: "104km",
      rideTime: "6.5h",
      stops: ["산방산", "중문", "법환바당", "쇠소깍", "남원", "표선", "섭지코지", "성산"],
      summary: "1일차를 산방산까지 늘렸을 때 이어지는 남부 완주 코스입니다. 충분한 일조 시간이 필요합니다.",
      schedule: [
        { time: "07:40", place: "산방산", detail: "일찍 출발, 긴 하루 운영" },
        { time: "10:30", place: "중문/법환", detail: "보급과 도심 통과" },
        { time: "13:00", place: "쇠소깍/남원", detail: "점심" },
        { time: "16:30", place: "표선/섭지코지", detail: "마지막 보급" },
        { time: "18:30", place: "성산", detail: "숙소 도착, 야간 주행 피하기" }
      ]
    }
  ],
  day3: [
    {
      optionId: "east-standard",
      title: "성산 → 제주항/용두암",
      theme: "북동부 복귀",
      distance: "64km",
      rideTime: "4h",
      stops: ["성산", "세화", "월정리", "김녕", "함덕", "용두암", "제주항"],
      summary: "북동부 해안도로로 제주항에 복귀하는 기본 코스입니다. 배편 마감 기준으로 여유를 둡니다.",
      schedule: [
        { time: "08:30", place: "성산", detail: "아침 출발, 관광 차량 주의" },
        { time: "10:30", place: "세화/월정리", detail: "카페와 보급" },
        { time: "12:30", place: "김녕/함덕", detail: "점심 또는 긴 휴식" },
        { time: "15:00", place: "용두암/제주항", detail: "자전거 선적 준비" }
      ]
    },
    {
      optionId: "east-slow",
      title: "성산 → 함덕",
      theme: "여유 복귀",
      distance: "48km",
      rideTime: "3h",
      stops: ["성산", "세화", "월정리", "김녕", "함덕"],
      summary: "제주항 복귀 전 함덕에서 끊는 여유형 코스입니다. 다음 배편이 늦거나 제주 1박을 추가할 때 적합합니다.",
      schedule: [
        { time: "09:30", place: "성산", detail: "늦은 출발 가능" },
        { time: "11:00", place: "월정리", detail: "카페 휴식" },
        { time: "13:30", place: "김녕", detail: "점심" },
        { time: "15:30", place: "함덕", detail: "숙소 또는 제주항 추가 이동 결정" }
      ]
    },
    {
      optionId: "east-full",
      title: "성산 → 제주항 + 시내 정리",
      theme: "복귀 완결",
      distance: "72km",
      rideTime: "4.5h",
      stops: ["성산", "세화", "월정리", "김녕", "함덕", "삼양", "동문시장", "제주항"],
      summary: "제주항 복귀 전 시내 정리와 식사를 넣는 완결형 코스입니다.",
      schedule: [
        { time: "08:00", place: "성산", detail: "빠른 출발" },
        { time: "10:30", place: "월정리/김녕", detail: "보급" },
        { time: "13:00", place: "함덕/삼양", detail: "점심" },
        { time: "15:30", place: "동문시장", detail: "정리 식사 또는 장보기" },
        { time: "17:00", place: "제주항", detail: "선적 준비" }
      ]
    }
  ],
  day4: [
    {
      optionId: "return-standard",
      title: "제주항 → 완도항 → 전주",
      theme: "기본 복귀",
      distance: "복귀 운영",
      rideTime: "배편 기준",
      stops: ["제주항", "완도항", "트럭 적재", "전주 복귀"],
      summary: "제주항에서 배편으로 완도항에 도착한 뒤 트럭에 자전거와 짐을 싣고 전주로 복귀합니다.",
      schedule: [
        { time: "출항 2h 전", place: "제주항", detail: "승선권, 신분증, 자전거 선적 준비" },
        { time: "하선 직후", place: "완도항", detail: "자전거 파손과 짐 누락 확인" },
        { time: "복귀", place: "완도 → 전주", detail: "운전자 휴식, 야간 이동 시 교대 운전" }
      ]
    },
    {
      optionId: "return-mokpo",
      title: "제주항 → 목포항 → 전주",
      theme: "목포 대체",
      distance: "복귀 운영",
      rideTime: "배편 기준",
      stops: ["제주항", "목포항", "목포 시내", "전주 복귀"],
      summary: "완도 배편 시간이 맞지 않을 때 목포항 도착 배편으로 복귀하는 대체 운영입니다.",
      schedule: [
        { time: "출항 2h 전", place: "제주항", detail: "차량 선적 마감 시간 확인" },
        { time: "하선 직후", place: "목포항", detail: "자전거와 트럭 상태 확인" },
        { time: "복귀", place: "목포 → 전주", detail: "고속도로 휴게 지점과 운전자 교대 계획" }
      ]
    },
    {
      optionId: "return-extra",
      title: "제주 시내 정리 → 익일 복귀",
      theme: "여유 복귀",
      distance: "제주 시내",
      rideTime: "반나절",
      stops: ["제주항", "용두암", "동문시장", "숙소/렌트 정리", "익일 배편"],
      summary: "3일차 이후 바로 복귀하지 않고 제주 시내에서 정리한 뒤 다음날 배편으로 나가는 여유 운영입니다.",
      schedule: [
        { time: "오전", place: "제주 시내", detail: "자전거 정비, 장비 건조" },
        { time: "오후", place: "동문시장/용두암", detail: "식사와 정산" },
        { time: "익일", place: "제주항", detail: "배편 승선, 완도 또는 목포 복귀" }
      ]
    }
  ]
};

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
      { label: "완도-제주 배편", href: "https://www.hanilexpress.co.kr/service/sailingSchedule.do" },
      { label: "한일고속 예매", href: "https://www.hanilexpress.co.kr/" }
    ]
  },
  {
    id: "train-ferry",
    badge: "대체",
    title: "기차 + 항구 이동 + 배편",
    summary: "차량 운전 부담을 줄이는 방식입니다. 자전거 포장과 환승 시간이 핵심입니다.",
    outbound: "전주역 → 광주송정/목포권 환승 → 항구 이동 → 제주행 배편",
    returnPlan: "완도/목포 하선 → 기차역 이동 → 전주역 복귀",
    truck: "트럭은 별도 선적하지 않거나 장비 운반 전담 차량으로 분리 운영",
    checks: ["자전거 포장 규정", "역-항구 환승 시간", "단체 승차권", "우천 시 택시/밴 대안"],
    links: [
      { label: "코레일 실시간", href: "https://www.letskorail.com/" },
      { label: "SRT 실시간", href: "https://etk.srail.kr/" },
      { label: "전주역 → 광주송정역", href: "https://map.naver.com/p/search/%EC%A0%84%EC%A3%BC%EC%97%AD%EC%97%90%EC%84%9C%20%EA%B4%91%EC%A3%BC%EC%86%A1%EC%A0%95%EC%97%AD" }
    ]
  },
  {
    id: "bus-ferry",
    badge: "예비",
    title: "버스 + 배편",
    summary: "트럭 운행이 어려울 때 쓰는 예비안입니다. 자전거 적재 가능 여부를 반드시 확인합니다.",
    outbound: "전주터미널 → 광주/해남/완도권 버스 → 완도항 이동 → 제주행 배편",
    returnPlan: "완도항 하선 → 터미널 이동 → 전주행 버스 복귀",
    truck: "트럭 미사용 또는 항구 구간 보조 차량으로만 제한 운영",
    checks: ["버스 자전거 적재 가능 여부", "터미널-항구 이동", "단체 수하물", "막차 시간"],
    links: [
      { label: "고속버스", href: "https://www.kobus.co.kr/" },
      { label: "버스타고", href: "https://www.bustago.or.kr/" },
      { label: "티머니 시외버스", href: "https://txbus.t-money.co.kr/" }
    ]
  },
  {
    id: "mokpo-ferry",
    badge: "대안",
    title: "목포항 대체 배편",
    summary: "완도 배편 시간대가 맞지 않을 때 검토하는 대안입니다.",
    outbound: "전주 → 목포항 이동 → 제주행 배편 → 제주항 하선",
    returnPlan: "제주 출항 → 목포항 하선 → 전주 복귀",
    truck: "트럭 선적 가능 여부와 항구 주차 동선을 별도로 확인",
    checks: ["목포 출항 시간", "차량 선적 마감", "제주 도착 항구", "첫날 시작점 조정"],
    links: [
      { label: "전주 → 목포항 지도", href: "https://map.naver.com/p/search/%EC%A0%84%EC%A3%BC%EC%97%90%EC%84%9C%20%EB%AA%A9%ED%8F%AC%ED%95%AD" },
      { label: "씨월드 목포-제주", href: "https://www.seaferry.co.kr/" },
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
    // Local storage may be unavailable in private browsing modes.
  }
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function defaultRoutePlan() {
  return Object.fromEntries(Object.keys(dayLabels).map((dayId) => [dayId, { optionId: routeChoices[dayId][0].optionId }]));
}

function getRoutePlan() {
  return { ...defaultRoutePlan(), ...parseJson(readStorage(storageKeys.routePlan), {}) };
}

function saveRoutePlan(plan) {
  writeStorage(storageKeys.routePlan, JSON.stringify(plan));
}

function getSelectedTransportId() {
  const saved = readStorage(storageKeys.transport);
  return transportOptions.some((option) => option.id === saved) ? saved : "truck-ferry";
}

function getRequestedDay() {
  const params = new URLSearchParams(window.location.search);
  const day = params.get("day") || params.get("route");
  return dayLabels[day] ? day : null;
}

function getOptionById(dayId, optionId) {
  return routeChoices[dayId].find((option) => option.optionId === optionId) || routeChoices[dayId][0];
}

function splitStops(value) {
  return value
    .split(/[,>\n·]+|→|-/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function customSegment(dayId, stopsInput) {
  const stops = splitStops(stopsInput);
  const first = stops[0] || `${dayLabels[dayId]} 출발지`;
  const last = stops[stops.length - 1] || `${dayLabels[dayId]} 도착지`;

  return {
    id: dayId,
    optionId: "custom",
    custom: true,
    day: dayLabels[dayId],
    title: `${first} → ${last}`,
    theme: "직접 선택 코스",
    distance: "직접 설정",
    rideTime: "지도 확인",
    stops,
    query: `${stops.join(" ")} 자전거길`,
    summary: "사용자가 직접 입력한 경유지를 기준으로 만든 임의 코스입니다. 실제 거리와 주행 시간은 네이버지도에서 확인하세요.",
    metrics: [
      { value: "직접", label: "선택 코스" },
      { value: `${Math.max(stops.length, 1)}곳`, label: "경유지" },
      { value: "지도", label: "거리 확인" }
    ],
    schedule: stops.map((stop, index) => ({
      time: index === 0 ? "출발" : index === stops.length - 1 ? "도착" : `경유 ${index}`,
      place: stop,
      detail: index === 0 ? "출발 전 장비 점검" : index === stops.length - 1 ? "숙소, 항구, 복귀 동선 확인" : "보급과 팀 regroup 지점으로 활용"
    }))
  };
}

function mapRouteSegment(dayId, savedRoute) {
  const distance = Number(savedRoute.distanceKm || 0);
  const ascent = Math.round(Number(savedRoute.ascentM || 0));
  const descent = Math.round(Number(savedRoute.descentM || 0));
  const stops = Array.isArray(savedRoute.stops) && savedRoute.stops.length
    ? savedRoute.stops
    : [savedRoute.startName || "출발지", savedRoute.endName || "도착지"];
  const checkpoints = Array.isArray(savedRoute.checkpoints) && savedRoute.checkpoints.length
    ? savedRoute.checkpoints
    : stops.map((name, index) => ({
      time: index === 0 ? "출발" : index === stops.length - 1 ? "도착" : `경유 ${index}`,
      place: name,
      detail: index === 0 ? "지도에서 선택한 출발지" : index === stops.length - 1 ? "지도에서 선택한 도착지" : "자전거 루프 경유지"
    }));

  return {
    id: dayId,
    optionId: "map-route",
    custom: true,
    day: dayLabels[dayId],
    title: `${savedRoute.startName || stops[0]} → ${savedRoute.endName || stops[stops.length - 1]}`,
    theme: "지도 선택 자전거 코스",
    distance: distance ? `${distance.toFixed(1)}km` : "지도 선택",
    rideTime: savedRoute.rideTime || "지도 기준",
    stops,
    query: `${stops.join(" ")} 자전거길`,
    summary: `V-World 지도에서 선택한 출발/도착 지점을 제주 해안 자전거 루프에 맞춰 자동 생성한 코스입니다. 예상 상승 ${ascent}m, 하강 ${descent}m입니다.`,
    metrics: [
      { value: distance ? `${distance.toFixed(1)}km` : "지도", label: "예상 거리" },
      { value: `${ascent}m`, label: "상승 고도" },
      { value: `${descent}m`, label: "하강 고도" }
    ],
    schedule: checkpoints
  };
}

function distanceValueKm(distanceText) {
  const match = String(distanceText).match(/(\d+(?:\.\d+)?)\s*km/i);
  return match ? Number(match[1]) : Number.NaN;
}

function formatDistanceKm(distance) {
  return Number.isInteger(distance) ? `${distance}km` : `${distance.toFixed(1)}km`;
}

function resolveSegment(dayId, plan = getRoutePlan()) {
  const selected = plan[dayId] || { optionId: routeChoices[dayId][0].optionId };
  if (selected.mapRoute) return mapRouteSegment(dayId, selected);
  if (selected.custom && selected.stopsInput) return customSegment(dayId, selected.stopsInput);

  const option = getOptionById(dayId, selected.optionId);
  return {
    ...option,
    id: dayId,
    day: dayLabels[dayId],
    query: `${option.stops.join(" ")} 자전거길`,
    metrics: [
      { value: option.distance, label: "예상 거리" },
      { value: option.rideTime, label: "순수 주행" },
      { value: option.theme, label: "코스 성격" }
    ]
  };
}

function resolveSegments(plan = getRoutePlan()) {
  return Object.keys(dayLabels).map((dayId) => resolveSegment(dayId, plan));
}

function activeDay() {
  return getRequestedDay() || readStorage(storageKeys.activeDay) || "day1";
}

function setActiveDay(dayId) {
  if (dayLabels[dayId]) writeStorage(storageKeys.activeDay, dayId);
}

function showToast(message) {
  const toast = document.querySelector("[data-toast]");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderMetrics(metrics) {
  return metrics.map((metric) => `<div class="mini-metric"><strong>${metric.value}</strong><span>${metric.label}</span></div>`).join("");
}

function renderTimeline(schedule) {
  return schedule.map((stop) => `<div class="stop"><strong>${stop.time} · ${stop.place}</strong> ${stop.detail}</div>`).join("");
}

function renderScheduleCard(segment, compact = false) {
  return `
    <article class="day-card${compact ? " selected-schedule-card" : ""}" data-day-card="${segment.id}">
      <div class="day-head">
        <span>${segment.day}</span>
        <h3>${segment.title}</h3>
      </div>
      <div class="day-body">
        <div class="metric-row">${renderMetrics(segment.metrics)}</div>
        <p>${segment.summary}</p>
        <div class="timeline">${renderTimeline(segment.schedule)}</div>
        ${compact ? `<div class="action-list selected-actions"><a class="btn dark small" href="schedule.html?day=${segment.id}">일정표 연동 보기</a><a class="btn light small" target="_blank" rel="noreferrer" href="${naverSearchUrl(segment.query)}" data-naver-map data-naver-query="${segment.query}" data-web-url="${naverSearchUrl(segment.query)}">네이버지도 열기</a></div>` : ""}
      </div>
    </article>
  `;
}

function renderCourseDetail(segment) {
  return `
    <span class="tag">${segment.day}</span>
    <h3>${segment.title}</h3>
    <p>${segment.summary}</p>
    <div class="metric-row">${renderMetrics(segment.metrics)}</div>
    <div class="checkpoint-flow">${segment.stops.map((stop) => `<span>${stop}</span>`).join("")}</div>
    <div class="timeline">${renderTimeline(segment.schedule)}</div>
    <div class="action-list selected-actions">
      <a class="btn dark small" href="schedule.html?day=${segment.id}">이 코스로 일정표 보기</a>
      <a class="btn light small" target="_blank" rel="noreferrer" href="${naverSearchUrl(segment.query)}" data-naver-map data-naver-query="${segment.query}" data-web-url="${naverSearchUrl(segment.query)}">네이버지도 열기</a>
    </div>
  `;
}

function syncMap(segment, frame, link) {
  const url = naverSearchUrl(segment.query);
  if (frame) frame.src = url;
  if (link) {
    link.href = url;
    link.dataset.naverQuery = segment.query;
    link.dataset.webUrl = url;
    link.textContent = `${segment.day} 지도 열기`;
  }
}

function toRad(value) {
  return value * Math.PI / 180;
}

function distanceKm(a, b) {
  const earthRadiusKm = 6371;
  const latDelta = toRad(b.lat - a.lat);
  const lngDelta = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(latDelta / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function nearestBikeNode(point) {
  return jejuBikeNodes
    .map((node, index) => ({ ...node, index, distance: distanceKm(point, node) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function pathDistance(nodes) {
  return nodes.slice(1).reduce((sum, node, index) => sum + distanceKm(nodes[index], node), 0);
}

function circularPath(startIndex, endIndex, direction) {
  const result = [];
  let index = startIndex;
  const step = direction === "forward" ? 1 : -1;

  while (true) {
    result.push(jejuBikeNodes[index]);
    if (index === endIndex) break;
    index = (index + step + jejuBikeNodes.length) % jejuBikeNodes.length;
  }

  return result;
}

function buildBikeRoute(startPoint, endPoint) {
  const startNode = nearestBikeNode(startPoint);
  const endNode = nearestBikeNode(endPoint);
  const forward = circularPath(startNode.index, endNode.index, "forward");
  const backward = circularPath(startNode.index, endNode.index, "backward");
  const loopNodes = pathDistance(forward) <= pathDistance(backward) ? forward : backward;
  const path = [
    { ...startPoint, name: `출발지(${startNode.name} 인근)`, elevation: startNode.elevation },
    ...loopNodes,
    { ...endPoint, name: `도착지(${endNode.name} 인근)`, elevation: endNode.elevation }
  ];
  const distance = pathDistance(path);
  let ascent = 0;
  let descent = 0;

  path.slice(1).forEach((point, index) => {
    const delta = point.elevation - path[index].elevation;
    if (delta > 0) ascent += delta;
    if (delta < 0) descent += Math.abs(delta);
  });

  return {
    path,
    distanceKm: distance,
    ascentM: ascent,
    descentM: descent,
    startName: path[0].name,
    endName: path[path.length - 1].name,
    stops: path.map((point) => point.name)
  };
}

function estimatedRideTime(distance) {
  const minutes = Math.max(20, Math.round(distance / 15 * 60));
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder}분`;
  return remainder ? `${hours}시간 ${remainder}분` : `${hours}시간`;
}

function addMinutesToTime(baseHour, baseMinute, minutesToAdd) {
  const total = baseHour * 60 + baseMinute + minutesToAdd;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function routeCheckpoints(route) {
  const points = route.path;
  const total = route.distanceKm || 1;
  let accumulated = 0;

  return points.map((point, index) => {
    if (index > 0) accumulated += distanceKm(points[index - 1], point);
    const minutes = Math.round(accumulated / total * Math.max(60, route.distanceKm / 15 * 60));
    return {
      time: index === 0 ? "08:30" : addMinutesToTime(8, 30, minutes),
      place: point.name,
      detail: index === 0 ? "지도에서 선택한 출발지, 장비 점검" : index === points.length - 1 ? "지도에서 선택한 도착지, 숙소/항구 동선 확인" : `예상 고도 ${Math.round(point.elevation)}m, 보급과 regroup 후보`
    };
  });
}

function elevationSvg(route) {
  if (!route || !route.path.length) return "";
  const width = 360;
  const height = 120;
  const elevations = route.path.map((point) => point.elevation);
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  const range = Math.max(1, max - min);
  const points = elevations.map((elevation, index) => {
    const x = route.path.length === 1 ? 0 : index / (route.path.length - 1) * width;
    const y = height - ((elevation - min) / range * (height - 22) + 11);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return `
    <svg class="elevation-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="예상 고도 그래프">
      <rect width="${width}" height="${height}" rx="14" fill="#eef7f4"/>
      <polyline points="${points}" fill="none" stroke="#087c83" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="12" y="24" fill="#607176" font-size="12" font-weight="800">고도 ${Math.round(min)}m~${Math.round(max)}m</text>
    </svg>
  `;
}

function setupVWorldRouteEditor() {
  const root = document.querySelector("[data-vworld-route-editor]");
  if (!root) return;

  const mapTarget = root.querySelector("#vworldMap");
  const dayTabs = root.querySelector("[data-map-day-tabs]");
  const modeButtons = root.querySelectorAll("[data-map-mode]");
  const clearButton = root.querySelector("[data-map-clear]");
  const saveButton = root.querySelector("[data-map-save]");
  const resultTarget = root.querySelector("[data-map-result]");
  const statusTarget = root.querySelector("[data-map-status]");

  let currentDay = activeDay();
  let mode = "start";
  let startPoint = null;
  let endPoint = null;
  let calculatedRoute = null;
  let map = null;
  let routeLine = null;
  let startMarker = null;
  let endMarker = null;

  const renderDayTabs = () => {
    dayTabs.innerHTML = Object.entries(dayLabels).map(([dayId, label]) => `
      <button type="button" class="${dayId === currentDay ? "active" : ""}" data-map-day="${dayId}">${label}</button>
    `).join("");
  };

  const setStatus = (message) => {
    statusTarget.textContent = message;
  };

  const setMode = (nextMode) => {
    mode = nextMode;
    modeButtons.forEach((button) => {
      const active = button.dataset.mapMode === mode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    setStatus(mode === "start" ? "지도에서 출발지를 클릭하세요." : "지도에서 도착지를 클릭하세요.");
  };

  const drawRoute = () => {
    if (!map || !calculatedRoute) return;
    const latLngs = calculatedRoute.path.map((point) => [point.lat, point.lng]);
    if (routeLine) routeLine.remove();
    routeLine = L.polyline(latLngs, {
      color: "#ff745f",
      weight: 7,
      opacity: 0.95,
      lineJoin: "round"
    }).addTo(map);
    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
  };

  const updateResult = () => {
    if (!calculatedRoute) {
      resultTarget.innerHTML = `
        <span class="tag">대기</span>
        <h2>코스를 선택하세요</h2>
        <p>출발지와 도착지를 선택하면 거리, 예상 고도, 세부 경유지가 표시됩니다.</p>
      `;
      saveButton.disabled = true;
      return;
    }

    const checkpoints = routeCheckpoints(calculatedRoute);
    resultTarget.innerHTML = `
      <span class="tag">${dayLabels[currentDay]}</span>
      <h2>${calculatedRoute.startName} → ${calculatedRoute.endName}</h2>
      <div class="route-stat-grid">
        <div><strong>${calculatedRoute.distanceKm.toFixed(1)}km</strong><span>예상 거리</span></div>
        <div><strong>${Math.round(calculatedRoute.ascentM)}m</strong><span>상승 고도</span></div>
        <div><strong>${estimatedRideTime(calculatedRoute.distanceKm)}</strong><span>예상 주행</span></div>
      </div>
      ${elevationSvg(calculatedRoute)}
      <div class="checkpoint-flow">${calculatedRoute.stops.map((stop) => `<span>${stop}</span>`).join("")}</div>
      <div class="timeline">${checkpoints.map((item) => `<div class="stop"><strong>${item.time} · ${item.place}</strong> ${item.detail}</div>`).join("")}</div>
    `;
    saveButton.disabled = false;
  };

  const recalculate = () => {
    if (!startPoint || !endPoint) {
      calculatedRoute = null;
      updateResult();
      return;
    }
    calculatedRoute = buildBikeRoute(startPoint, endPoint);
    drawRoute();
    updateResult();
    setStatus("코스가 자동 생성되었습니다. 저장하면 일정표와 전체계획표에 반영됩니다.");
  };

  const setPoint = (latlng) => {
    const point = { lat: latlng.lat, lng: latlng.lng };
    if (mode === "start") {
      startPoint = point;
      if (startMarker) startMarker.remove();
      startMarker = L.marker([point.lat, point.lng], { title: "출발지" }).addTo(map).bindPopup("출발지");
      setMode("end");
    } else {
      endPoint = point;
      if (endMarker) endMarker.remove();
      endMarker = L.marker([point.lat, point.lng], { title: "도착지" }).addTo(map).bindPopup("도착지");
    }
    recalculate();
  };

  const clearRoute = () => {
    startPoint = null;
    endPoint = null;
    calculatedRoute = null;
    if (startMarker) startMarker.remove();
    if (endMarker) endMarker.remove();
    if (routeLine) routeLine.remove();
    startMarker = null;
    endMarker = null;
    routeLine = null;
    setMode("start");
    updateResult();
  };

  const saveRoute = () => {
    if (!calculatedRoute) return;
    const plan = getRoutePlan();
    plan[currentDay] = {
      mapRoute: true,
      startName: calculatedRoute.startName,
      endName: calculatedRoute.endName,
      distanceKm: calculatedRoute.distanceKm,
      ascentM: calculatedRoute.ascentM,
      descentM: calculatedRoute.descentM,
      rideTime: estimatedRideTime(calculatedRoute.distanceKm),
      stops: calculatedRoute.stops,
      checkpoints: routeCheckpoints(calculatedRoute),
      path: calculatedRoute.path.map((point) => ({
        name: point.name,
        lat: point.lat,
        lng: point.lng,
        elevation: point.elevation
      }))
    };
    saveRoutePlan(plan);
    setActiveDay(currentDay);
    setStatus(`${dayLabels[currentDay]} 코스를 저장했습니다. 일정표와 전체계획표에 반영되었습니다.`);
    showToast(`${dayLabels[currentDay]} 지도 코스를 저장했습니다.`);
  };

  renderDayTabs();
  updateResult();
  setMode("start");

  if (!window.L) {
    mapTarget.innerHTML = '<div class="map-load-error">지도 라이브러리를 불러오지 못했습니다. 네트워크 연결을 확인하세요.</div>';
    return;
  }

  map = L.map(mapTarget, {
    zoomControl: false,
    preferCanvas: true
  }).setView([33.38, 126.55], 10);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer(`https://api.vworld.kr/req/wmts/1.0.0/${vworldApiKey}/Base/{z}/{y}/{x}.png`, {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="https://www.vworld.kr/">V-World</a>'
  }).addTo(map);

  const saved = getRoutePlan()[currentDay];
  if (saved?.mapRoute && Array.isArray(saved.path) && saved.path.length >= 2) {
    startPoint = saved.path[0];
    endPoint = saved.path[saved.path.length - 1];
    startMarker = L.marker([startPoint.lat, startPoint.lng], { title: "출발지" }).addTo(map).bindPopup("출발지");
    endMarker = L.marker([endPoint.lat, endPoint.lng], { title: "도착지" }).addTo(map).bindPopup("도착지");
    calculatedRoute = buildBikeRoute(startPoint, endPoint);
    drawRoute();
  }
  dayTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-map-day]");
    if (!button) return;
    currentDay = button.dataset.mapDay;
    setActiveDay(currentDay);
    renderDayTabs();
    clearRoute();
    const savedRoute = getRoutePlan()[currentDay];
    if (savedRoute?.mapRoute && Array.isArray(savedRoute.path) && savedRoute.path.length >= 2) {
      startPoint = savedRoute.path[0];
      endPoint = savedRoute.path[savedRoute.path.length - 1];
      startMarker = L.marker([startPoint.lat, startPoint.lng], { title: "출발지" }).addTo(map).bindPopup("출발지");
      endMarker = L.marker([endPoint.lat, endPoint.lng], { title: "도착지" }).addTo(map).bindPopup("도착지");
      calculatedRoute = buildBikeRoute(startPoint, endPoint);
      drawRoute();
      updateResult();
    }
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mapMode));
  });
  clearButton.addEventListener("click", clearRoute);
  saveButton.addEventListener("click", saveRoute);
  map.on("click", (event) => setPoint(event.latlng));
}

function setupCourseBuilderPage() {
  const root = document.querySelector("[data-course-builder]");
  if (!root) return;

  const dayTabs = root.querySelector("[data-course-day-tabs]");
  const optionsTarget = root.querySelector("[data-course-options]");
  const detailTarget = root.querySelector("[data-course-detail]");
  const frame = root.querySelector("[data-course-map-frame]");
  const mapLink = root.querySelector("[data-course-map-link]");
  const customForm = root.querySelector("[data-course-custom-form]");
  const customInput = root.querySelector("[data-course-custom-input]");
  let currentDay = activeDay();

  const renderDayTabs = () => {
    dayTabs.innerHTML = Object.entries(dayLabels).map(([dayId, label]) => `
      <button type="button" class="${dayId === currentDay ? "active" : ""}" data-course-day="${dayId}">${label}</button>
    `).join("");
  };

  const renderOptions = () => {
    const plan = getRoutePlan();
    const selected = plan[currentDay] || {};

    optionsTarget.innerHTML = routeChoices[currentDay].map((option) => {
      const active = !selected.custom && selected.optionId === option.optionId;
      return `
        <button type="button" class="route-option${active ? " active" : ""}" data-course-option="${option.optionId}">
          <span>${option.theme}</span>
          <strong>${option.title}</strong>
          <small>${option.distance} · ${option.rideTime}</small>
        </button>
      `;
    }).join("");

    customInput.value = selected.custom ? selected.stopsInput : "";
    const segment = resolveSegment(currentDay, plan);
    detailTarget.innerHTML = renderCourseDetail(segment);
    syncMap(segment, frame, mapLink);
    setupNaverMapLinks(detailTarget);
  };

  dayTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-course-day]");
    if (!button) return;
    currentDay = button.dataset.courseDay;
    setActiveDay(currentDay);
    renderDayTabs();
    renderOptions();
  });

  optionsTarget.addEventListener("click", (event) => {
    const button = event.target.closest("[data-course-option]");
    if (!button) return;
    const plan = getRoutePlan();
    plan[currentDay] = { optionId: button.dataset.courseOption };
    saveRoutePlan(plan);
    showToast(`${dayLabels[currentDay]} 코스를 저장했습니다.`);
    renderOptions();
  });

  customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const stops = splitStops(customInput.value);
    if (stops.length < 2) {
      showToast("출발지와 도착지를 포함해 2곳 이상 입력하세요.");
      return;
    }

    const plan = getRoutePlan();
    plan[currentDay] = { custom: true, stopsInput: customInput.value.trim() };
    saveRoutePlan(plan);
    showToast(`${dayLabels[currentDay]} 임의 코스를 저장했습니다.`);
    renderOptions();
  });

  renderDayTabs();
  renderOptions();
}

function setupLinkedSchedulePage() {
  const tabs = document.querySelector("[data-linked-schedule-tabs]");
  const summary = document.querySelector("[data-linked-schedule-summary]");
  const cards = document.querySelector("[data-linked-schedule-cards]");
  if (!tabs || !summary || !cards) return;

  let filter = activeDay() || "all";
  const segments = resolveSegments();

  tabs.innerHTML = `<button type="button" data-schedule-filter="all">전체</button>${segments.map((segment) => `<button type="button" data-schedule-filter="${segment.id}">${segment.day}</button>`).join("")}`;
  summary.innerHTML = segments.map((segment) => `
    <article class="summary-card" data-summary-day="${segment.id}">
      <strong>${segment.day} · ${segment.distance}</strong>
      <span>${segment.title} · ${segment.theme}</span>
    </article>
  `).join("");
  cards.innerHTML = segments.map((segment) => renderScheduleCard(segment)).join("");

  const setFilter = (nextFilter) => {
    filter = nextFilter;
    if (filter !== "all") setActiveDay(filter);
    tabs.querySelectorAll("[data-schedule-filter]").forEach((button) => {
      const active = button.dataset.scheduleFilter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    cards.querySelectorAll("[data-day-card]").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.dayCard !== filter;
    });
    summary.querySelectorAll("[data-summary-day]").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.summaryDay !== filter;
    });
  };

  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-schedule-filter]");
    if (button) setFilter(button.dataset.scheduleFilter);
  });

  setFilter(filter);
}

function renderTransportChoice(option, selected) {
  return `
    <article class="transport-pick-card${selected ? " active" : ""}" data-transport-card="${option.id}">
      <span class="tag">${option.badge}</span>
      <h3>${option.title}</h3>
      <p>${option.summary}</p>
      <dl class="transport-lines">
        <div><dt>출발</dt><dd>${option.outbound}</dd></div>
        <div><dt>복귀</dt><dd>${option.returnPlan}</dd></div>
        <div><dt>트럭</dt><dd>${option.truck}</dd></div>
      </dl>
      <div class="source-list">${option.links.map((link) => `<a class="btn light small" target="_blank" rel="noreferrer" href="${link.href}" data-naver-map>${link.label}</a>`).join("")}</div>
      <button class="btn dark small" type="button" data-transport-select="${option.id}">${selected ? "선택됨" : "이 교통편으로 확정"}</button>
    </article>
  `;
}

function setupTransportPage() {
  const target = document.querySelector("[data-transport-picker]");
  const selectedTarget = document.querySelector("[data-selected-transport]");
  if (!target || !selectedTarget) return;

  const render = () => {
    const selectedId = getSelectedTransportId();
    const selected = transportOptions.find((option) => option.id === selectedId) || transportOptions[0];
    target.innerHTML = transportOptions.map((option) => renderTransportChoice(option, option.id === selectedId)).join("");
    selectedTarget.innerHTML = `
      <span class="tag">확정 교통편</span>
      <h3>${selected.title}</h3>
      <p>${selected.summary}</p>
      <ul class="plain-check-list">${selected.checks.map((check) => `<li>${check}</li>`).join("")}</ul>
      <div class="action-list selected-actions"><a class="btn dark small" href="transport.html">전체계획표 보기</a></div>
    `;
    setupNaverMapLinks(target);
  };

  target.addEventListener("click", (event) => {
    const button = event.target.closest("[data-transport-select]");
    if (!button) return;
    writeStorage(storageKeys.transport, button.dataset.transportSelect);
    showToast("교통편을 전체계획표에 반영했습니다.");
    render();
  });

  render();
}

function setupMasterPlanPage() {
  const target = document.querySelector("[data-master-plan-page]");
  if (!target) return;

  const segments = resolveSegments();
  const selectedTransport = transportOptions.find((option) => option.id === getSelectedTransportId()) || transportOptions[0];
  const rideDistance = segments
    .map((segment) => distanceValueKm(segment.distance))
    .filter(Number.isFinite)
    .reduce((sum, distance) => sum + distance, 0);

  target.innerHTML = `
    <div class="master-summary">
      <div><strong>${selectedTransport.title}</strong><span>확정 교통편</span></div>
      <div><strong>${rideDistance ? formatDistanceKm(rideDistance) : "직접"}</strong><span>예상 라이딩</span></div>
      <div><strong>8명</strong><span>라이더</span></div>
      <div><strong>트럭 1대</strong><span>승하선/짐 지원</span></div>
    </div>
    <div class="master-flow">
      <article><span>출발</span><h3>전주 → 항구</h3><p>${selectedTransport.outbound}</p></article>
      <article><span>제주 라이딩</span><h3>1~3일차 자전거 이동</h3><p>${segments.slice(0, 3).map((segment) => segment.title).join(" / ")}</p></article>
      <article><span>복귀</span><h3>4일차 복귀 운영</h3><p>${selectedTransport.returnPlan}</p></article>
    </div>
    <div class="planner-schedule-grid master-day-grid">
      ${segments.map((segment) => renderScheduleCard(segment, true)).join("")}
    </div>
    <div class="master-columns">
      <section>
        <h3>교통 체크리스트</h3>
        <ul class="plain-check-list">${selectedTransport.checks.map((check) => `<li>${check}</li>`).join("")}</ul>
      </section>
      <section>
        <h3>실시간 확인 링크</h3>
        <div class="source-list">${selectedTransport.links.map((link) => `<a class="btn light small" target="_blank" rel="noreferrer" href="${link.href}" data-naver-map>${link.label}</a>`).join("")}</div>
      </section>
    </div>
  `;
  setupNaverMapLinks(target);
}

function setupShare() {
  const buttons = document.querySelectorAll("[data-share]");
  buttons.forEach((button) => {
    if (!button.innerHTML.trim()) button.innerHTML = `${iconShare} 공유`;
    button.addEventListener("click", async () => {
      const shareData = {
        title: document.title,
        text: "전주 출발 제주도 자전거 여행 계획표",
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

  const savedDate = readStorage(storageKeys.tripDate);
  if (savedDate) {
    tripDate.value = savedDate;
    dateHint.textContent = `${savedDate} 출발 기준으로 확인하세요.`;
  }

  tripDate.addEventListener("change", () => {
    if (!tripDate.value) return;
    writeStorage(storageKeys.tripDate, tripDate.value);
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

setupCourseBuilderPage();
setupVWorldRouteEditor();
setupLinkedSchedulePage();
setupTransportPage();
setupMasterPlanPage();
setupShare();
setupTripDate();
setupNaverMapLinks();
