const storageKeys = {
  routePlan: "jeju-bike-route-plan-v2",
  activeDay: "jeju-bike-active-day-v2",
  transport: "jeju-bike-transport-v2",
  tripDate: "jeju-bike-trip-date",
  ferryOutboundDate: "jeju-bike-ferry-outbound-date",
  ferryReturnDate: "jeju-bike-ferry-return-date"
};

const dayLabels = {
  day1: "1일차",
  day2: "2일차",
  day3: "3일차",
  day4: "4일차"
};

const tripDefaults = {
  title: "탄감자 제주도 원정대",
  dateRange: "2026년 10월 8일(목) – 10월 11일(일)",
  startDate: "2026-10-08",
  ferryOutboundDate: "2026-10-08",
  ferryReturnDate: "2026-10-11",
  riders: "8명",
  vehicle: "전주↔목포 차량 이동, 목포↔제주 선박 이동, 제주 내 자전거 일주",
  ferryPlan: "목포 08:30 출항 / 제주 13:30~13:40 출항 예정",
  lodgingPlan: "1박 협재·금능, 2박 법환·서귀포, 3박 월정리·구좌",
  totalDistance: "237~255km",
  totalRideTime: "15시간 30분~16시간 40분",
  totalAscent: "+1,220~1,300m",
  operationNotes: [
    "1일차와 4일차는 배편 때문에 라이딩 가능 시간이 짧으므로 항구 도착 시간을 우선합니다.",
    "2일차와 3일차는 장거리 구간이므로 08:00 출발과 점심 시간 준수가 핵심입니다.",
    "8명 단체 라이딩은 선두·중간·후미 담당자를 정하고 시내·관광지 구간은 한 줄 주행을 원칙으로 합니다."
  ]
};

const vworldApiKey = "5880CF73-00D8-30E9-BCF1-3DC6E80FC58B";
const seaferryBookingUrl = "https://www.seaferry.co.kr/bbs/content.php?co_id=p201";

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

const jejuRoutePlaces = [
  { name: "제주항", aliases: ["제주항연안여객터미널", "제주 여객선터미널"], lat: 33.5162, lng: 126.5280, elevation: 8 },
  { name: "용두암", aliases: ["용두암해안도로"], lat: 33.5161, lng: 126.5117, elevation: 12 },
  { name: "이호테우", aliases: ["이호테우해변", "이호해수욕장"], lat: 33.4971, lng: 126.4522, elevation: 10 },
  { name: "애월", aliases: ["애월항", "애월해안도로"], lat: 33.4637, lng: 126.3096, elevation: 18 },
  { name: "곽지", aliases: ["곽지해수욕장"], lat: 33.4501, lng: 126.3046, elevation: 14 },
  { name: "한림", aliases: ["한림항"], lat: 33.4144, lng: 126.2634, elevation: 12 },
  { name: "협재", aliases: ["협재해수욕장", "금능"], lat: 33.3945, lng: 126.2397, elevation: 12 },
  { name: "신창풍차해안도로", aliases: ["신창", "풍차해안도로"], lat: 33.3459, lng: 126.1746, elevation: 9 },
  { name: "차귀도", aliases: ["자구내포구"], lat: 33.3080, lng: 126.1668, elevation: 12 },
  { name: "모슬포", aliases: ["모슬포항", "대정"], lat: 33.2208, lng: 126.2496, elevation: 20 },
  { name: "송악산", aliases: ["송악산둘레길"], lat: 33.2066, lng: 126.2902, elevation: 48 },
  { name: "산방산", aliases: ["산방산탄산온천"], lat: 33.2391, lng: 126.3130, elevation: 74 },
  { name: "중문", aliases: ["중문관광단지"], lat: 33.2497, lng: 126.4124, elevation: 64 },
  { name: "법환바당", aliases: ["법환포구"], lat: 33.2376, lng: 126.5159, elevation: 20 },
  { name: "서귀포", aliases: ["서귀포항", "천지연"], lat: 33.2461, lng: 126.5615, elevation: 42 },
  { name: "쇠소깍", aliases: ["하효항"], lat: 33.2525, lng: 126.6231, elevation: 16 },
  { name: "남원", aliases: ["남원포구"], lat: 33.2791, lng: 126.7209, elevation: 19 },
  { name: "표선", aliases: ["표선해수욕장"], lat: 33.3244, lng: 126.8324, elevation: 18 },
  { name: "섭지코지", aliases: ["신양섭지"], lat: 33.4241, lng: 126.9291, elevation: 26 },
  { name: "성산", aliases: ["성산일출봉", "성산항"], lat: 33.4585, lng: 126.9348, elevation: 24 },
  { name: "세화", aliases: ["세화해변"], lat: 33.5260, lng: 126.8567, elevation: 14 },
  { name: "월정리", aliases: ["월정리해변"], lat: 33.5568, lng: 126.7952, elevation: 12 },
  { name: "김녕", aliases: ["김녕해수욕장"], lat: 33.5576, lng: 126.7593, elevation: 10 },
  { name: "함덕", aliases: ["함덕해수욕장"], lat: 33.5437, lng: 126.6692, elevation: 11 },
  { name: "삼양", aliases: ["삼양해수욕장"], lat: 33.5262, lng: 126.5865, elevation: 8 },
  { name: "동문시장", aliases: ["제주동문시장"], lat: 33.5117, lng: 126.5260, elevation: 10 }
];

const jejuRestaurants = [
  {
    name: "올래국수",
    area: "제주시",
    category: "고기국수",
    lat: 33.5009,
    lng: 126.5269,
    sentiment: 91,
    summary: "고기국수 대표 맛집으로 여행자 검색 노출과 방문 후기가 꾸준한 곳입니다."
  },
  {
    name: "자매국수",
    area: "제주시",
    category: "고기국수",
    lat: 33.5147,
    lng: 126.5274,
    sentiment: 89,
    summary: "제주항·공항권 동선에 넣기 좋은 고기국수 후보입니다."
  },
  {
    name: "우진해장국",
    area: "제주시",
    category: "몸국/고사리해장국",
    lat: 33.5115,
    lng: 126.5201,
    sentiment: 94,
    summary: "제주식 해장국으로 인지도가 높아 복귀 전 식사 후보로 좋습니다."
  },
  {
    name: "돈사돈 본관",
    area: "제주시",
    category: "흑돼지",
    lat: 33.4789,
    lng: 126.4862,
    sentiment: 90,
    summary: "흑돼지 구이 대표 후보입니다. 단체 8명은 대기와 예약 가능 여부 확인이 필요합니다."
  },
  {
    name: "숙성도 중문점",
    area: "중문",
    category: "흑돼지",
    lat: 33.2514,
    lng: 126.4148,
    sentiment: 88,
    summary: "남부 구간 중문권 저녁 후보로 넣기 좋은 흑돼지 식당입니다."
  },
  {
    name: "오는정김밥",
    area: "서귀포",
    category: "김밥/보급",
    lat: 33.2494,
    lng: 126.5626,
    sentiment: 87,
    summary: "라이딩 중 휴대 보급식으로 활용하기 좋은 서귀포권 유명 김밥집입니다."
  },
  {
    name: "명진전복",
    area: "구좌",
    category: "전복",
    lat: 33.5321,
    lng: 126.8557,
    sentiment: 92,
    summary: "동부 해안 구간에서 점심 후보로 많이 거론되는 전복 요리 식당입니다."
  },
  {
    name: "중문수두리보말칼국수",
    area: "중문",
    category: "보말칼국수",
    lat: 33.2512,
    lng: 126.4247,
    sentiment: 86,
    summary: "중문권 점심 후보입니다. 비 오는 날 따뜻한 식사 동선으로 좋습니다."
  },
  {
    name: "춘심이네 본점",
    area: "대정",
    category: "갈치",
    lat: 33.2385,
    lng: 126.2874,
    sentiment: 85,
    summary: "서남부 구간 갈치 요리 후보입니다. 가격과 영업시간 확인이 필요합니다."
  },
  {
    name: "성산일출봉 청운식당",
    area: "성산",
    category: "해산물/정식",
    lat: 33.4627,
    lng: 126.9338,
    sentiment: 83,
    summary: "성산 숙박일 저녁 또는 아침 식사 후보로 넣기 좋은 위치입니다."
  },
  {
    name: "고집돌우럭 중문점",
    area: "중문",
    category: "우럭조림",
    lat: 33.2507,
    lng: 126.4120,
    sentiment: 82,
    summary: "중문 숙박일 저녁 식사 후보입니다. 단체 식사 동선으로 잡기 좋습니다."
  },
  {
    name: "칠돈가 본점",
    area: "제주시",
    category: "흑돼지",
    lat: 33.5035,
    lng: 126.5059,
    sentiment: 81,
    summary: "제주시권 흑돼지 저녁 후보입니다. 첫날 또는 복귀 전 식사로 붙이기 좋습니다."
  },
  {
    name: "늘봄흑돼지",
    area: "제주시",
    category: "흑돼지",
    lat: 33.4815,
    lng: 126.4874,
    sentiment: 80,
    summary: "단체 좌석을 확인해볼 만한 제주시 흑돼지 후보입니다."
  },
  {
    name: "흑돈가 제주본점",
    area: "제주시",
    category: "흑돼지",
    lat: 33.4800,
    lng: 126.4850,
    sentiment: 79,
    summary: "공항·제주시 숙박권 저녁 동선에 넣기 쉬운 흑돼지 후보입니다."
  },
  {
    name: "순옥이네명가",
    area: "도두",
    category: "전복물회/전복죽",
    lat: 33.5064,
    lng: 126.4674,
    sentiment: 78,
    summary: "도두·이호테우 부근 해산물 점심 후보입니다."
  },
  {
    name: "도두해녀의집",
    area: "도두",
    category: "물회/성게미역국",
    lat: 33.5068,
    lng: 126.4695,
    sentiment: 77,
    summary: "제주시 서쪽 해안 이동 중 해산물 식사 후보로 보기 좋습니다."
  },
  {
    name: "제주김만복 본점",
    area: "제주시",
    category: "전복김밥",
    lat: 33.5005,
    lng: 126.5241,
    sentiment: 76,
    summary: "간단한 포장 보급이나 이동 전 간식 후보로 쓰기 좋습니다."
  },
  {
    name: "삼보식당",
    area: "서귀포",
    category: "해물뚝배기",
    lat: 33.2473,
    lng: 126.5614,
    sentiment: 75,
    summary: "서귀포 시내 숙박권에서 해물뚝배기 후보로 확인하기 좋습니다."
  },
  {
    name: "네거리식당",
    area: "서귀포",
    category: "갈치조림",
    lat: 33.2502,
    lng: 126.5657,
    sentiment: 74,
    summary: "서귀포권 갈치조림 후보입니다. 남부 라이딩 종료 후 저녁으로 맞습니다."
  },
  {
    name: "천짓골식당",
    area: "서귀포",
    category: "돔베고기",
    lat: 33.2477,
    lng: 126.5594,
    sentiment: 73,
    summary: "서귀포 시내 돔베고기 후보입니다. 고단백 저녁 식사로 좋습니다."
  },
  {
    name: "쌍둥이횟집",
    area: "서귀포",
    category: "회/해산물",
    lat: 33.2452,
    lng: 126.5638,
    sentiment: 72,
    summary: "서귀포권 회식형 저녁 후보입니다. 8명은 예약 가능 여부를 확인하세요."
  },
  {
    name: "미영이네식당",
    area: "모슬포",
    category: "고등어회",
    lat: 33.2176,
    lng: 126.2491,
    sentiment: 71,
    summary: "모슬포·대정권 숙박일 저녁 후보로 넣기 좋은 고등어회 식당입니다."
  },
  {
    name: "덕승식당",
    area: "모슬포",
    category: "갈치/생선요리",
    lat: 33.2189,
    lng: 126.2504,
    sentiment: 70,
    summary: "모슬포항 근처 생선요리 후보입니다. 1일차 서부 종료 후 동선이 좋습니다."
  },
  {
    name: "산방식당",
    area: "대정",
    category: "밀면/수육",
    lat: 33.2208,
    lng: 126.2520,
    sentiment: 69,
    summary: "대정권에서 가볍게 먹기 좋은 식사 후보입니다."
  },
  {
    name: "안녕협재씨",
    area: "협재",
    category: "딱새우장/해산물",
    lat: 33.3940,
    lng: 126.2390,
    sentiment: 68,
    summary: "협재·금능 구간 점심 후보입니다. 해안 경유와 연결하기 쉽습니다."
  },
  {
    name: "수우동",
    area: "협재",
    category: "우동/일식",
    lat: 33.3946,
    lng: 126.2396,
    sentiment: 67,
    summary: "서부 해안 구간에서 면 요리 후보로 확인할 만합니다."
  },
  {
    name: "협재칼국수",
    area: "협재",
    category: "칼국수",
    lat: 33.3931,
    lng: 126.2398,
    sentiment: 66,
    summary: "바람이 강한 날 따뜻한 점심 후보로 무난합니다."
  },
  {
    name: "곰막식당",
    area: "구좌",
    category: "회국수/성게국수",
    lat: 33.5310,
    lng: 126.8550,
    sentiment: 65,
    summary: "구좌 해안 동선에서 가볍게 넣기 좋은 국수·해산물 후보입니다."
  },
  {
    name: "해월정",
    area: "구좌",
    category: "보말죽/해산물",
    lat: 33.5328,
    lng: 126.8472,
    sentiment: 64,
    summary: "동부 해안에서 따뜻한 한 끼가 필요할 때 확인할 만합니다."
  },
  {
    name: "소금바치순이네",
    area: "구좌",
    category: "돌문어볶음",
    lat: 33.5259,
    lng: 126.8587,
    sentiment: 63,
    summary: "동부 구간 매콤한 식사 후보입니다. 라이딩 전후 위장 부담은 조절하세요."
  },
  {
    name: "벵디",
    area: "구좌",
    category: "문어덮밥",
    lat: 33.5325,
    lng: 126.8421,
    sentiment: 62,
    summary: "구좌권 점심 후보입니다. 대기와 영업일 확인이 필요합니다."
  },
  {
    name: "상춘재",
    area: "조천",
    category: "비빔밥/정식",
    lat: 33.5390,
    lng: 126.6682,
    sentiment: 61,
    summary: "함덕·조천 구간에서 정식류 식사를 원할 때 후보로 좋습니다."
  },
  {
    name: "오조해녀의집",
    area: "성산",
    category: "전복죽/해녀식",
    lat: 33.4674,
    lng: 126.9146,
    sentiment: 60,
    summary: "성산권 아침 또는 점심 후보입니다. 해안 동선과 잘 맞습니다."
  },
  {
    name: "맛나식당",
    area: "성산",
    category: "갈치조림",
    lat: 33.4623,
    lng: 126.9324,
    sentiment: 59,
    summary: "성산권 갈치조림 후보입니다. 회전율과 대기 시간을 확인하세요."
  },
  {
    name: "가시아방국수",
    area: "성산",
    category: "고기국수",
    lat: 33.4494,
    lng: 126.9160,
    sentiment: 58,
    summary: "성산권에서 고기국수를 먹고 싶을 때 넣기 좋은 후보입니다."
  },
  {
    name: "해녀촌",
    area: "구좌",
    category: "회국수",
    lat: 33.5420,
    lng: 126.8376,
    sentiment: 57,
    summary: "세화·구좌 해안 구간에서 회국수 후보로 많이 찾는 곳입니다."
  },
  {
    name: "월정리갈비밥",
    area: "월정리",
    category: "갈비밥",
    lat: 33.5569,
    lng: 126.7955,
    sentiment: 56,
    summary: "월정리 해안 경유 중 든든한 점심 후보로 확인할 만합니다."
  },
  {
    name: "평대스낵",
    area: "평대",
    category: "분식/튀김",
    lat: 33.5329,
    lng: 126.8385,
    sentiment: 55,
    summary: "동부 해안 라이딩 중 간식성 보급 후보입니다."
  },
  {
    name: "남양수산",
    area: "성산",
    category: "회/해산물",
    lat: 33.4614,
    lng: 126.9285,
    sentiment: 54,
    summary: "성산권 회·해산물 저녁 후보입니다. 단체 방문 전 좌석을 확인하세요."
  },
  {
    name: "모닥식탁",
    area: "함덕",
    category: "제주가정식",
    lat: 33.5420,
    lng: 126.6652,
    sentiment: 53,
    summary: "함덕 숙박 또는 동부 복귀 구간에서 편하게 볼 수 있는 식사 후보입니다."
  },
  {
    name: "고집돌우럭 함덕점",
    area: "함덕",
    category: "우럭조림",
    lat: 33.5425,
    lng: 126.6679,
    sentiment: 52,
    summary: "함덕권 단체 식사 후보입니다. 계획표의 동부 복귀일과 잘 맞습니다."
  },
  {
    name: "대우정",
    area: "제주시",
    category: "전복돌솥밥",
    lat: 33.5113,
    lng: 126.5250,
    sentiment: 51,
    summary: "제주시내 전복돌솥밥 후보입니다. 항구 복귀 전후 동선이 좋습니다."
  },
  {
    name: "어우늘",
    area: "제주시",
    category: "전복돌솥밥/해산물",
    lat: 33.5066,
    lng: 126.5313,
    sentiment: 50,
    summary: "제주시권 해산물 식사 후보로 확인해볼 만합니다."
  },
  {
    name: "용출횟집",
    area: "제주시",
    category: "회/해산물",
    lat: 33.5165,
    lng: 126.5180,
    sentiment: 49,
    summary: "제주항 가까운 회·해산물 후보입니다. 복귀 전 저녁 동선으로 맞습니다."
  },
  {
    name: "바다풍경",
    area: "제주시",
    category: "해물탕/해산물",
    lat: 33.5168,
    lng: 126.5190,
    sentiment: 48,
    summary: "제주항권 해산물 식사 후보입니다. 영업시간과 예약 가능 여부를 확인하세요."
  },
  {
    name: "만선식당",
    area: "서귀포",
    category: "생선구이/해산물",
    lat: 33.2489,
    lng: 126.5622,
    sentiment: 47,
    summary: "서귀포 시내권 생선구이 후보입니다. 2일차 남부 구간과 잘 붙습니다."
  },
  {
    name: "덕성원",
    area: "서귀포",
    category: "중식/게짬뽕",
    lat: 33.2475,
    lng: 126.5628,
    sentiment: 46,
    summary: "서귀포권 색다른 식사 후보입니다. 매운 음식은 라이딩 컨디션에 맞춰 선택하세요."
  },
  {
    name: "제주분식",
    area: "제주시",
    category: "분식/모닥치기",
    lat: 33.5117,
    lng: 126.5260,
    sentiment: 45,
    summary: "동문시장·제주시내 간단 식사 후보입니다."
  },
  {
    name: "동문시장 야시장",
    area: "제주시",
    category: "시장/간식",
    lat: 33.5117,
    lng: 126.5260,
    sentiment: 44,
    summary: "복귀 전 가볍게 여러 메뉴를 나눠 먹기 좋은 시장 후보입니다."
  },
  {
    name: "우도 로뎀가든",
    area: "우도",
    category: "한라산볶음밥",
    lat: 33.5050,
    lng: 126.9525,
    sentiment: 43,
    summary: "우도 추가 일정이 생길 때만 넣는 보너스 후보입니다. 배편과 자전거 반입 조건을 확인하세요."
  }
];

const routeChoices = {
  day1: [
    {
      optionId: "west-standard",
      title: "전주·목포항 → 제주항 → 협재·금능",
      theme: "10/8 목 · 서부 해안 적응",
      distance: "35~38km",
      rideTime: "약 2:20",
      ascent: "+170m 내외",
      lodging: "협재·금능",
      stops: ["전주", "목포항", "제주항", "용두암", "이호테우", "애월", "다락쉼터", "협재·금능"],
      summary: "첨부 일정표 기준 1일차입니다. 오전 전주에서 목포항으로 이동해 08:30 배편을 타고, 제주항 도착 후 용두암에서 출발해 협재·금능 숙소까지 무리 없이 적응합니다.",
      schedule: [
        { time: "04:50", place: "전주 집결", distanceKm: 0, cumulativeDistanceKm: 0, detail: "자전거 적재, 신분증·승선권·보급식 확인" },
        { time: "05:00", place: "전주 출발", detail: "차량 이동, 목포항 국제여객터미널 07:00 전후 도착 목표" },
        { time: "07:00~08:00", place: "목포항 수속", detail: "주차, 발권, 자전거 선적. 선적 마감 시간 여유 확보" },
        { time: "08:30", place: "목포 출항", detail: "선내 휴식 및 간단식" },
        { time: "12:50 전후", place: "제주항 도착", detail: "자전거 수령, 공기압·브레이크 점검" },
        { time: "13:20~13:50", place: "점심", detail: "제주항·탑동·동문시장 인근 간단식" },
        { time: "14:00~18:00", place: "용두암 → 애월 → 협재·금능", distanceKm: 35, cumulativeDistanceKm: 35, detail: "이호테우, 애월·한담, 다락쉼터를 지나 숙소 이동" },
        { time: "19:00", place: "협재·한림권 저녁", detail: "옹포별장가든 우선, 문쏘 협재점·버거307 협재점 대안" }
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
      title: "협재·금능 → 법환·서귀포",
      theme: "10/9 금 · 서남부 장거리",
      distance: "78~83km",
      rideTime: "약 5:05",
      ascent: "+500m 내외",
      lodging: "법환·서귀포",
      stops: ["협재·금능", "신창풍차해안도로", "해거름마을공원", "수월봉·차귀도", "모슬포", "송악산", "산방산·중문", "법환·서귀포"],
      summary: "첨부 일정표 기준 2일차입니다. 서남부 조망 구간과 업다운이 이어지는 핵심 장거리 날이므로 오전 출발, 모슬포 점심, 중문 이후 차량 주의를 우선합니다.",
      schedule: [
        { time: "07:00", place: "기상·조식", detail: "물 2통, 보급식, 펑크키트 확인" },
        { time: "08:00", place: "협재·금능 출발", distanceKm: 0, cumulativeDistanceKm: 0, detail: "초반은 15km/h 안팎으로 무리하지 않기" },
        { time: "09:10", place: "신창풍차해안도로", distanceKm: 18, cumulativeDistanceKm: 18, detail: "바람 강할 때 대열 좁히기" },
        { time: "09:40", place: "해거름마을공원", detail: "인증·10분 휴식" },
        { time: "11:00", place: "수월봉·차귀도 전망", distanceKm: 25, cumulativeDistanceKm: 43, detail: "사진 휴식 후 모슬포까지 페이스 유지" },
        { time: "12:00~13:00", place: "모슬포 점심", detail: "탄수화물·수분 보충" },
        { time: "14:00", place: "송악산 인증센터", distanceKm: 9, cumulativeDistanceKm: 52, detail: "오후 업다운 전 짧은 휴식" },
        { time: "15:30", place: "산방산·중문 접근", distanceKm: 21, cumulativeDistanceKm: 73, detail: "기복과 관광 차량 주의" },
        { time: "17:30~18:00", place: "법환·서귀포 도착", distanceKm: 10, cumulativeDistanceKm: 83, detail: "숙소 체크인, 세탁과 다음날 준비" },
        { time: "19:00", place: "저녁", detail: "법환나들목·서귀포 매일올레시장·숙성도 중문점 등 단체 예약 가능 식당" }
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
      title: "법환·서귀포 → 월정리",
      theme: "10/10 토 · 남동부 해안 장거리",
      distance: "82~86km",
      rideTime: "약 5:20",
      ascent: "+380~430m",
      lodging: "월정리·구좌",
      stops: ["법환·서귀포", "정방·보목", "쇠소깍", "남원·위미", "표선", "성산일출봉", "종달·세화", "월정리"],
      summary: "첨부 일정표 기준 3일차입니다. 쇠소깍, 남원, 표선, 성산, 세화·월정리로 이어지는 긴 해안 구간이라 표선 점심을 늦추지 않는 것이 핵심입니다.",
      schedule: [
        { time: "07:00", place: "기상·조식", detail: "전날 피로 확인, 스트레칭" },
        { time: "08:00", place: "법환·서귀포 출발", distanceKm: 0, cumulativeDistanceKm: 0, detail: "정방폭포·보목 방향, 시내 교통량 주의" },
        { time: "08:50", place: "쇠소깍 인증센터", distanceKm: 14, cumulativeDistanceKm: 14, detail: "인증·휴식" },
        { time: "10:20", place: "남원·위미 해안", distanceKm: 17, cumulativeDistanceKm: 31, detail: "편의점·카페 보급" },
        { time: "11:40~12:40", place: "표선해변 점심", distanceKm: 19, cumulativeDistanceKm: 50, detail: "표선에서 확실히 식사" },
        { time: "14:20", place: "성산일출봉·광치기해변", distanceKm: 22, cumulativeDistanceKm: 72, detail: "사진 휴식" },
        { time: "15:20", place: "성산 출발", detail: "종달·세화·월정리 방향, 바람 방향 확인" },
        { time: "17:00~17:40", place: "월정리 숙소 도착", distanceKm: 14, cumulativeDistanceKm: 86, detail: "체크인·세탁" },
        { time: "19:00", place: "저녁", detail: "연미정 우선, 허벅식당·월정세화권 식당 대안" }
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
      title: "월정리 → 제주항 → 목포항 → 전주",
      theme: "10/11 일 · 동북부 복귀",
      distance: "42~48km",
      rideTime: "약 2:50~3:10",
      ascent: "+170~200m",
      lodging: "귀환",
      stops: ["월정리", "김녕성세기해변", "함덕서우봉해변", "조천·삼양", "제주항/용두암", "목포항", "전주"],
      summary: "첨부 일정표 기준 4일차입니다. 13:30~13:40 제주발 목포행 배편을 고려해 늦어도 12:00 전후 제주항 도착을 목표로 합니다.",
      schedule: [
        { time: "06:40", place: "기상·정리", detail: "짐 최소화, 승선권·신분증 확인" },
        { time: "07:10", place: "조식", detail: "숙소 또는 월정리 간단식" },
        { time: "07:40", place: "월정리 출발", distanceKm: 0, cumulativeDistanceKm: 0, detail: "김녕 방향으로 가볍게 워밍업" },
        { time: "08:10", place: "김녕성세기해변", distanceKm: 8, cumulativeDistanceKm: 8, detail: "인증·사진" },
        { time: "08:50", place: "함덕서우봉해변", distanceKm: 9, cumulativeDistanceKm: 17, detail: "15분 휴식" },
        { time: "10:10", place: "조천·삼양 해안", distanceKm: 17, cumulativeDistanceKm: 34, detail: "마지막 보급, 바람 방향 확인" },
        { time: "11:40~12:10", place: "제주항 도착", distanceKm: 12, cumulativeDistanceKm: 46, detail: "자전거 선적 준비. 용두암 인증 선택 시 더 일찍 출발" },
        { time: "13:30~13:40", place: "제주 출항", detail: "목포행 배편" },
        { time: "18:00 전후", place: "목포 도착", detail: "자전거 수령·차량 적재" },
        { time: "21:00 전후", place: "전주 도착", detail: "해산" }
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
    title: "전주 집결 + 목포항 주차 + 자전거 선적",
    summary: "첨부 일정표의 기본 운영안입니다. 8명은 전주에서 차량으로 목포항까지 이동하고, 목포 08:30 출항·제주 13:30~13:40 복귀 배편을 기준으로 자전거 8대를 선적합니다.",
    outbound: "04:50 전주 집결 → 05:00 차량 출발 → 07:00 목포항 수속·주차 → 08:30 목포 출항 → 12:50 전후 제주항 하선",
    returnPlan: "월정리 조기 출발 → 12:00 전후 제주항 도착 → 13:30~13:40 제주 출항 → 18:00 전후 목포 도착 → 21:00 전후 전주 도착",
    truck: "전주↔목포 구간 자전거 적재와 귀환 회수를 담당하고, 제주도 내 라이딩 중에는 목포항 주차장에 대기",
    checks: ["8명 승선권·신분증", "자전거 8대 선적권", "목포항 주차 위치", "제주항 선적 부두", "예비 튜브 4개 이상·펌프 2개"],
    links: [
      { label: "전주 → 목포항 지도", href: "https://map.naver.com/p/search/%EC%A0%84%EC%A3%BC%EC%97%90%EC%84%9C%20%EB%AA%A9%ED%8F%AC%ED%95%AD" },
      { label: "목포항 주차", href: "https://map.naver.com/p/search/%EB%AA%A9%ED%8F%AC%ED%95%AD%20%EC%A3%BC%EC%B0%A8%EC%9E%A5" },
      { label: "씨월드 목포-제주", href: seaferryBookingUrl }
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
      { label: "씨월드 목포-제주", href: seaferryBookingUrl },
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

function kakaoSearchUrl(query) {
  return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
}

function googleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
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

function getFerryDates() {
  return {
    outbound: readStorage(storageKeys.ferryOutboundDate) || tripDefaults.ferryOutboundDate,
    returnDate: readStorage(storageKeys.ferryReturnDate) || tripDefaults.ferryReturnDate
  };
}

function ferrySearchQuery(direction, date) {
  const route = direction === "return"
    ? "제주항 목포항 배편"
    : "목포항 제주항 배편";
  return `${route} ${date || ""} 자전거 선적 씨월드고속훼리`.trim();
}

function ferrySearchUrl(direction, date) {
  return naverSearchUrl(ferrySearchQuery(direction, date));
}

function renderFerrySearchPanel() {
  const dates = getFerryDates();
  return `
    <article class="ferry-search-card">
      <div class="ferry-search-head">
        <span class="tag">목포항 ↔ 제주항 왕복</span>
        <h3>배편 날짜 검색</h3>
      </div>
      <div class="ferry-date-row">
        <label class="ferry-date-field">
          <span>출발일</span>
          <input type="date" value="${dates.outbound}" data-ferry-date="outbound" aria-label="목포항에서 제주항 출발일">
        </label>
        <label class="ferry-date-field">
          <span>도착일</span>
          <input type="date" value="${dates.returnDate}" data-ferry-date="return" aria-label="제주항에서 목포항 복귀일">
        </label>
      </div>
      <div class="source-list ferry-source-list">
        <a class="btn dark small" target="_blank" rel="noreferrer" href="${ferrySearchUrl("outbound", dates.outbound)}" data-ferry-link="outbound">목포→제주 검색</a>
        <a class="btn light small" target="_blank" rel="noreferrer" href="${ferrySearchUrl("return", dates.returnDate)}" data-ferry-link="return">제주→목포 검색</a>
        <a class="btn light small" target="_blank" rel="noreferrer" href="${seaferryBookingUrl}">씨월드 예매</a>
      </div>
      <p class="route-source-note">선박 시간, 자전거 선적, 터미널 도착 마감은 운항사 공지 기준으로 최종 확인하세요.</p>
    </article>
  `;
}

function setupFerrySearchPanel(scope = document) {
  const root = scope.querySelector("[data-ferry-search]");
  if (!root) return;
  const isReady = root.dataset.ferryReady === "true";
  root.innerHTML = renderFerrySearchPanel();

  const updateLinks = () => {
    const outbound = root.querySelector('[data-ferry-date="outbound"]')?.value || "";
    const returnDate = root.querySelector('[data-ferry-date="return"]')?.value || "";
    const outboundLink = root.querySelector('[data-ferry-link="outbound"]');
    const returnLink = root.querySelector('[data-ferry-link="return"]');
    if (outboundLink) outboundLink.href = ferrySearchUrl("outbound", outbound);
    if (returnLink) returnLink.href = ferrySearchUrl("return", returnDate);
  };

  if (!isReady) {
    root.addEventListener("change", (event) => {
      const input = event.target.closest("[data-ferry-date]");
      if (!input) return;
      const key = input.dataset.ferryDate === "return"
        ? storageKeys.ferryReturnDate
        : storageKeys.ferryOutboundDate;
      writeStorage(key, input.value);
      updateLinks();
    });
    root.dataset.ferryReady = "true";
  }
  updateLinks();
  setupNaverMapLinks(root);
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
      detail: index === 0 ? "출발 전 장비 점검" : index === stops.length - 1 ? "숙소, 항구, 복귀 동선 확인" : "경로 확인 및 짧은 휴식"
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
    summary: `선택한 출발/도착 지점을 기준으로 자동 생성한 코스입니다. 예상 상승 ${ascent}m, 하강 ${descent}m입니다.`,
    metrics: [
      { value: distance ? `${distance.toFixed(1)}km` : "지도", label: "예상 거리" },
      { value: `${ascent}m`, label: "상승 고도" },
      { value: `${descent}m`, label: "하강 고도" }
    ],
    schedule: checkpoints,
    path: Array.isArray(savedRoute.path) ? savedRoute.path : [],
    waypoints: Array.isArray(savedRoute.waypoints) ? savedRoute.waypoints : [],
    sourceName: savedRoute.sourceName,
    elevationSource: savedRoute.elevationSource,
    accessDistanceKm: Number(savedRoute.accessDistanceKm || 0),
    learnedMatch: Number(savedRoute.learnedMatch || 0)
  };
}

function distanceValueKm(distanceText) {
  const match = String(distanceText).match(/(\d+(?:\.\d+)?)\s*km/i);
  return match ? Number(match[1]) : Number.NaN;
}

function formatDistanceKm(distance) {
  return Number.isInteger(distance) ? `${distance}km` : `${distance.toFixed(1)}km`;
}

function shortDayLabel(dayId) {
  return dayLabels[dayId]?.replace("일차", "일") || dayId;
}

function resolveSegment(dayId, plan = getRoutePlan()) {
  const selected = plan[dayId] || { optionId: routeChoices[dayId][0].optionId };
  if (selected.mapRoute) return mapRouteSegment(dayId, selected);
  if (selected.custom && selected.stopsInput) return customSegment(dayId, selected.stopsInput);

  const option = getOptionById(dayId, selected.optionId);
  const metrics = [
    { value: option.distance, label: "예상 거리" },
    { value: option.rideTime, label: "순수 주행" },
    { value: option.ascent || option.theme, label: option.ascent ? "획득고도" : "코스 성격" }
  ];
  if (option.lodging) metrics.push({ value: option.lodging, label: "숙박/귀환" });
  return {
    ...option,
    id: dayId,
    day: dayLabels[dayId],
    query: `${option.stops.join(" ")} 자전거길`,
    metrics
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

function cleanPlaceName(value = "") {
  return String(value)
    .split(/[\/,>|·]/)[0]
    .replace(/\([^)]*\)/g, "")
    .trim();
}

function compactPlaceName(value = "") {
  return cleanPlaceName(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[-_]/g, "");
}

function elevationForPlaceName(placeName) {
  const compact = compactPlaceName(placeName);
  if (!compact) return null;
  const match = jejuRoutePlaces.find((place) => {
    const names = [place.name, ...(place.aliases || [])];
    return names.some((name) => {
      const candidate = compactPlaceName(name);
      return candidate && (candidate.includes(compact) || compact.includes(candidate));
    });
  });
  return Number.isFinite(match?.elevation) ? Math.round(match.elevation) : null;
}

function enrichScheduleLegs(segment) {
  const schedule = Array.isArray(segment.schedule) ? segment.schedule : [];
  const knownDistance = distanceValueKm(segment.distance);
  const hasExplicitDistance = schedule.some((stop) => (
    Number.isFinite(stop.distanceKm) || Number.isFinite(stop.cumulativeDistanceKm)
  ));
  const fallbackLegDistance = !hasExplicitDistance && Number.isFinite(knownDistance) && schedule.length > 1
    ? knownDistance / (schedule.length - 1)
    : null;

  return schedule.map((stop, index) => {
    const distance = Number.isFinite(stop.distanceKm)
      ? stop.distanceKm
      : index === 0
        ? 0
        : fallbackLegDistance;
    const cumulativeDistance = Number.isFinite(stop.cumulativeDistanceKm)
      ? stop.cumulativeDistanceKm
      : Number.isFinite(fallbackLegDistance)
        ? fallbackLegDistance * index
        : index === 0
          ? 0
          : null;
    const elevation = Number.isFinite(stop.elevationM)
      ? stop.elevationM
      : elevationForPlaceName(stop.place);

    return {
      ...stop,
      distanceKm: Number.isFinite(distance) ? distance : null,
      cumulativeDistanceKm: Number.isFinite(cumulativeDistance) ? cumulativeDistance : null,
      elevationM: Number.isFinite(elevation) ? elevation : null
    };
  });
}

function renderStopMeta(stop, index) {
  const meta = [];
  if (Number.isFinite(stop.distanceKm)) {
    meta.push(index === 0 ? "출발" : `이동 ${formatDistanceKm(stop.distanceKm)}`);
  }
  if (index > 0 && Number.isFinite(stop.cumulativeDistanceKm)) {
    meta.push(`누적 ${formatDistanceKm(stop.cumulativeDistanceKm)}`);
  }
  if (Number.isFinite(stop.elevationM)) {
    meta.push(`예상 고도 ${Math.round(stop.elevationM)}m`);
  }
  return meta.length ? `<span class="stop-meta">${meta.join(" · ")}</span>` : "";
}

function renderTimeline(schedule) {
  return schedule.map((stop, index) => `
    <div class="stop">
      <strong>${stop.time} · ${stop.place}</strong>
      ${renderStopMeta(stop, index)}
      ${stop.detail ? `<p>${stop.detail}</p>` : ""}
    </div>
  `).join("");
}

function renderScheduleCard(segment, compact = false) {
  const hasMappedPath = Array.isArray(segment.path) && segment.path.length > 1;
  return `
    <article class="day-card${compact ? " selected-schedule-card" : ""}" data-day-card="${segment.id}">
      <div class="day-head">
        <span>${segment.day}</span>
        <h3>${segment.title}</h3>
      </div>
      <div class="day-body">
        <div class="metric-row">${renderMetrics(segment.metrics)}</div>
        <p>${segment.summary}</p>
        ${segment.accessDistanceKm ? `<p class="route-source-note">숙소/장소 접속 구간 약 ${segment.accessDistanceKm.toFixed(1)}km 포함</p>` : ""}
        ${hasMappedPath ? elevationSvg(segment) : ""}
        <div class="checkpoint-flow">${segment.stops.map((stop) => `<span>${stop}</span>`).join("")}</div>
        <div class="timeline">${renderTimeline(enrichScheduleLegs(segment))}</div>
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
    <div class="timeline">${renderTimeline(enrichScheduleLegs(segment))}</div>
    <div class="action-list selected-actions">
      <a class="btn dark small" href="schedule.html?day=${segment.id}">이 코스로 일정표 보기</a>
      <a class="btn light small" target="_blank" rel="noreferrer" href="${naverSearchUrl(segment.query)}" data-naver-map data-naver-query="${segment.query}" data-web-url="${naverSearchUrl(segment.query)}">네이버지도 열기</a>
    </div>
  `;
}

function selectedTransportOption() {
  return transportOptions.find((option) => option.id === getSelectedTransportId()) || transportOptions[0];
}

function renderMasterPlanContent({ printable = false } = {}) {
  const segments = resolveSegments();
  const selectedTransport = selectedTransportOption();
  const foodLimit = printable ? 8 : 6;

  return `
    <div class="plan-doc-title">
      <span class="tag">기본값 · 첨부 일정표 반영</span>
      <h2>${tripDefaults.title}</h2>
      <p>${tripDefaults.dateRange} | ${tripDefaults.vehicle}</p>
    </div>
    <div class="master-summary">
      <div><strong>${tripDefaults.riders}</strong><span>참가 인원</span></div>
      <div><strong>${tripDefaults.totalDistance}</strong><span>전체 제주 라이딩</span></div>
      <div><strong>${tripDefaults.totalRideTime}</strong><span>전체 순수 주행</span></div>
      <div><strong>${tripDefaults.totalAscent}</strong><span>전체 추정 획득고도</span></div>
    </div>
    <div class="plan-brief-grid">
      <article><span>배편 기준</span><strong>${tripDefaults.ferryPlan}</strong></article>
      <article><span>숙박 기준</span><strong>${tripDefaults.lodgingPlan}</strong></article>
      <article><span>확정 교통편</span><strong>${selectedTransport.title}</strong></article>
    </div>
    <div class="master-flow">
      <article><span>출발</span><h3>전주 → 목포항 → 제주항</h3><p>${selectedTransport.outbound}</p></article>
      <article><span>제주 라이딩</span><h3>1~4일차 자전거 이동</h3><p>${segments.map((segment) => segment.title).join(" / ")}</p></article>
      <article><span>복귀</span><h3>제주항 → 목포항 → 전주</h3><p>${selectedTransport.returnPlan}</p></article>
    </div>
    <section class="plan-note-section">
      <h3>운영 핵심</h3>
      <ul class="plain-check-list">${tripDefaults.operationNotes.map((note) => `<li>${note}</li>`).join("")}</ul>
    </section>
    <div class="planner-schedule-grid master-day-grid">
      ${segments.map((segment) => renderScheduleCard(segment, true)).join("")}
    </div>
    <section class="plan-food-section">
      <div class="section-mini-head">
        <h3>맛집 후보 TOP ${foodLimit}</h3>
        ${printable ? "" : `<a class="btn light small" href="restaurants.html">50선 전체 보기</a>`}
      </div>
      <p class="route-source-note">각 맛집 카드는 지도 화면과 연결됩니다. 후보는 라이딩 동선에서 식사와 보급에 쓰기 좋은 순서로 정리했습니다.</p>
      <div class="restaurant-list">${renderRestaurantList(foodLimit)}</div>
    </section>
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

function estimateElevation(point) {
  const nearest = jejuRoutePlaces
    .map((place) => ({ ...place, distance: Math.max(0.15, distanceKm(point, place)) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);
  const weighted = nearest.reduce((sum, place) => sum + place.elevation / place.distance, 0);
  const weights = nearest.reduce((sum, place) => sum + 1 / place.distance, 0);
  return weights ? weighted / weights : 10;
}

let preparedGpxRoute = null;
let preparedRoutePlaces = null;
let learnedCyclingNetwork = null;

function getPreparedGpxRoute() {
  if (preparedGpxRoute) return preparedGpxRoute;
  const rawPoints = Array.isArray(window.JEJU_FANTASY_GPX?.points) ? window.JEJU_FANTASY_GPX.points : [];
  const hasGpxElevation = rawPoints.some((point) => Number(point[2]) > 0);
  let totalDistanceKm = 0;
  const points = [];

  rawPoints.forEach((point, index) => {
    const lat = Number(point[0]);
    const lng = Number(point[1]);
    const gpxElevation = Number(point[2] || 0);
    if (index > 0) totalDistanceKm += distanceKm(points[index - 1], { lat, lng });
    const current = {
      lat,
      lng,
      elevation: hasGpxElevation ? gpxElevation : estimateElevation({ lat, lng }),
      gpxElevation,
      index,
      distanceFromStart: totalDistanceKm
    };
    points.push(current);
  });

  preparedGpxRoute = {
    name: window.JEJU_FANTASY_GPX?.name || "제주환상자전거길.gpx",
    points,
    totalDistanceKm,
    hasGpxElevation
  };
  return preparedGpxRoute;
}

function nearestRoutePoint(point) {
  const route = getPreparedGpxRoute();
  if (!route.points.length) return null;
  return route.points.reduce((closest, candidate) => {
    const distance = distanceKm(point, candidate);
    return !closest || distance < closest.distance ? { ...candidate, distance } : closest;
  }, null);
}

function getPreparedRoutePlaces() {
  if (preparedRoutePlaces) return preparedRoutePlaces;
  preparedRoutePlaces = jejuRoutePlaces.map((place) => {
    const nearest = nearestRoutePoint(place);
    return {
      ...place,
      routeIndex: nearest?.index ?? 0,
      routeDistance: nearest?.distanceFromStart ?? 0,
      snapDistanceKm: nearest?.distance ?? 0
    };
  });
  return preparedRoutePlaces;
}

function nearestKnownPlace(point) {
  return jejuRoutePlaces
    .map((place) => ({ ...place, distance: distanceKm(point, place) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function nearbyRestaurants(point, limit = 2) {
  return jejuRestaurants
    .map((restaurant, index) => ({
      ...restaurant,
      rank: index + 1,
      distance: distanceKm(point, restaurant)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

function routePlacePopup(place) {
  const routeText = Number.isFinite(place.routeDistance)
    ? `자전거길 누적 약 ${formatDistanceKm(place.routeDistance)} 지점`
    : "자전거길 경유 지점";
  const elevationText = Number.isFinite(place.elevation)
    ? `예상 고도 ${Math.round(place.elevation)}m`
    : "예상 고도 확인 필요";
  const restaurants = nearbyRestaurants(place, 2)
    .map((restaurant) => `${restaurant.rank}위 ${restaurant.name}(${formatDistanceKm(restaurant.distance)})`)
    .join(" · ");
  const searchTerm = `${place.name} 제주 자전거길`;

  return `
    <div class="place-popup">
      <strong>${place.name}</strong>
      <p>${routeText} · ${elevationText}</p>
      <p>해안 라이딩 중 속도와 바람 방향을 다시 확인하기 좋은 지점입니다.</p>
      ${restaurants ? `<p>근처 맛집 후보: ${restaurants}</p>` : ""}
      <div class="place-popup-links">
        <a target="_blank" rel="noreferrer" href="${naverSearchUrl(searchTerm)}">네이버</a>
        <a target="_blank" rel="noreferrer" href="${kakaoSearchUrl(searchTerm)}">다음</a>
        <a target="_blank" rel="noreferrer" href="${googleSearchUrl(`${searchTerm} 설명`)}">구글</a>
      </div>
    </div>
  `;
}

function learnedAreaName(point) {
  if (point.lat > 33.49 && point.lng < 126.63) return "북서부";
  if (point.lat > 33.49 && point.lng >= 126.63) return "북동부";
  if (point.lat <= 33.32 && point.lng < 126.55) return "남서부";
  if (point.lat <= 33.32 && point.lng >= 126.55) return "남동부";
  if (point.lng < 126.36) return "서부";
  if (point.lng > 126.75) return "동부";
  return "중부";
}

function learnedGridKey(point, size = 0.018) {
  const lat = Math.round(point.lat / size) * size;
  const lng = Math.round(point.lng / size) * size;
  return `${lat.toFixed(3)},${lng.toFixed(3)}`;
}

function buildLearnedSegment(route, startIndex, endIndex) {
  const start = route.points[startIndex];
  const end = route.points[endIndex];
  const startPlace = nearestKnownPlace(start);
  const endPlace = nearestKnownPlace(end);
  const points = route.points.slice(startIndex, endIndex + 1);
  const distance = Math.max(0, end.distanceFromStart - start.distanceFromStart);
  const cells = new Set(points.map((point) => learnedGridKey(point)));
  return {
    id: `learned-${startIndex}-${endIndex}`,
    startIndex,
    endIndex,
    title: `${startPlace.name} → ${endPlace.name}`,
    area: learnedAreaName(points[Math.floor(points.length / 2)] || start),
    distanceKm: distance,
    pointCount: points.length,
    cellCount: cells.size,
    confidence: Math.min(99, Math.max(72, Math.round(72 + Math.min(points.length / 140, 18) + Math.min(distance / 3, 9))))
  };
}

function getLearnedCyclingNetwork() {
  if (learnedCyclingNetwork) return learnedCyclingNetwork;
  const route = getPreparedGpxRoute();
  const points = route.points;
  if (!points.length) {
    learnedCyclingNetwork = {
    sourceName: "기본 자전거 경로",
      routeCount: 0,
      pointCount: 0,
      totalDistanceKm: 0,
      coverageCells: 0,
      segments: []
    };
    return learnedCyclingNetwork;
  }

  const segments = [];
  const chunkKm = 14;
  let startIndex = 0;
  let nextDistance = chunkKm;
  for (let index = 1; index < points.length; index += 1) {
    if (points[index].distanceFromStart >= nextDistance) {
      segments.push(buildLearnedSegment(route, startIndex, index));
      startIndex = index;
      nextDistance = points[index].distanceFromStart + chunkKm;
    }
  }
  if (startIndex < points.length - 2) {
    segments.push(buildLearnedSegment(route, startIndex, points.length - 1));
  }

  learnedCyclingNetwork = {
    sourceName: route.name,
    routeCount: 1,
    pointCount: points.length,
    totalDistanceKm: route.totalDistanceKm,
    coverageCells: new Set(points.map((point) => learnedGridKey(point))).size,
    segments,
    note: "iGPSPORT 공개 Explorer는 로그인 후 접근되는 화면이라, 현재 앱은 제공된 GPX를 로컬 학습 데이터로 사용합니다."
  };
  return learnedCyclingNetwork;
}

function learnedMatchPercent(route) {
  if (!route || !route.distanceKm) return 0;
  const accessDistance = Number(route.accessDistanceKm || 0);
  return Math.max(0, Math.min(100, Math.round((route.distanceKm - accessDistance) / route.distanceKm * 100)));
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function findLocalPlace(query) {
  const normalized = normalizeText(query);
  if (!normalized) return null;
  return getPreparedRoutePlaces().find((place) => {
    const names = [place.name, ...(place.aliases || [])];
    return names.some((name) => normalizeText(name).includes(normalized) || normalized.includes(normalizeText(name)));
  }) || null;
}

function parseCoordinateQuery(query) {
  const match = String(query).match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const first = Number(match[1]);
  const second = Number(match[2]);
  if (first > 32 && first < 34 && second > 125 && second < 128) return { lat: first, lng: second, name: "입력 좌표" };
  if (second > 32 && second < 34 && first > 125 && first < 128) return { lat: second, lng: first, name: "입력 좌표" };
  return null;
}

async function searchVWorldLocation(query) {
  const endpoint = "https://api.vworld.kr/req/search";
  const common = `service=search&request=search&version=2.0&crs=EPSG:4326&size=1&page=1&format=json&key=${encodeURIComponent(vworldApiKey)}&query=${encodeURIComponent(query)}`;
  const urls = [
    `${endpoint}?${common}&type=PLACE`,
    `${endpoint}?${common}&type=ADDRESS`
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const data = await response.json();
      const item = data?.response?.result?.items?.[0];
      const x = Number(item?.point?.x);
      const y = Number(item?.point?.y);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return { lat: y, lng: x, name: item.title || query };
      }
    } catch (error) {
      continue;
    }
  }
  return null;
}

function snapLocationToRoute(point, fallbackName = "선택 지점") {
  const actualPoint = {
    lat: Number(point.actualLat ?? point.lat),
    lng: Number(point.actualLng ?? point.lng),
    elevation: Number(point.actualElevation ?? point.elevation ?? estimateElevation(point))
  };
  const nearest = nearestRoutePoint(actualPoint);
  const placeName = point.placeName || point.name || fallbackName;
  if (!nearest) {
    return {
      lat: actualPoint.lat,
      lng: actualPoint.lng,
      elevation: actualPoint.elevation,
      routeIndex: 0,
      placeName,
      actualLat: actualPoint.lat,
      actualLng: actualPoint.lng,
      actualElevation: actualPoint.elevation,
      accessDistanceKm: 0
    };
  }

  return {
    lat: nearest.lat,
    lng: nearest.lng,
    elevation: nearest.elevation,
    routeIndex: nearest.index,
    routeDistance: nearest.distanceFromStart,
    snapDistanceKm: nearest.distance,
    placeName,
    actualLat: actualPoint.lat,
    actualLng: actualPoint.lng,
    actualElevation: actualPoint.elevation,
    accessDistanceKm: nearest.distance
  };
}

function nearestBikeNode(point) {
  return jejuBikeNodes
    .map((node, index) => ({ ...node, index, distance: distanceKm(point, node) }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function pathDistance(nodes) {
  return nodes.slice(1).reduce((sum, node, index) => sum + distanceKm(nodes[index], node), 0);
}

function interpolatePoint(start, end, ratio, name) {
  const elevation = Number(start.elevation || 0) + (Number(end.elevation || 0) - Number(start.elevation || 0)) * ratio;
  return {
    lat: start.lat + (end.lat - start.lat) * ratio,
    lng: start.lng + (end.lng - start.lng) * ratio,
    elevation,
    name
  };
}

function buildRoadLikeConnector(start, end, label = "도로 접속 경로") {
  const directDistance = distanceKm(start, end);
  if (directDistance < 0.03) return [start, end];

  const lngFirst = Math.abs(end.lng - start.lng) >= Math.abs(end.lat - start.lat);
  const elbowA = lngFirst
    ? { ...interpolatePoint(start, end, 0.45, label), lat: start.lat }
    : { ...interpolatePoint(start, end, 0.45, label), lng: start.lng };
  const elbowB = lngFirst
    ? { ...interpolatePoint(start, end, 0.70, label), lng: end.lng }
    : { ...interpolatePoint(start, end, 0.70, label), lat: end.lat };
  const controls = [start, elbowA, elbowB, end]
    .filter((point, index, array) => index === 0 || distanceKm(array[index - 1], point) > 0.01);
  const path = [];

  controls.slice(1).forEach((point, index) => {
    const previous = controls[index];
    const segments = Math.max(1, Math.ceil(distanceKm(previous, point) / 0.35));
    for (let step = 0; step <= segments; step += 1) {
      if (path.length && step === 0) continue;
      const ratio = step / segments;
      const generated = interpolatePoint(previous, point, ratio, label);
      if (step === 0) path.push(previous);
      else if (step === segments) path.push(point);
      else path.push(generated);
    }
  });

  return path.length ? path : [start, end];
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

function routeIndexProgress(index, startIndex, endIndex, direction, totalCount) {
  if (direction === "backward") {
    return index <= startIndex ? startIndex - index : startIndex + totalCount - index;
  }
  return index >= startIndex ? index - startIndex : totalCount - startIndex + index;
}

function sliceGpxPath(startIndex, endIndex, direction = "auto") {
  const route = getPreparedGpxRoute();
  const points = route.points;
  if (!points.length) return [];
  const totalCount = points.length;
  const forwardLength = routeIndexProgress(endIndex, startIndex, endIndex, "forward", totalCount);
  const backwardLength = routeIndexProgress(endIndex, startIndex, endIndex, "backward", totalCount);
  const selectedDirection = direction === "backward" || (direction === "auto" && backwardLength < forwardLength) ? "backward" : "forward";
  const path = [];
  let index = startIndex;

  while (true) {
    path.push({ ...points[index], routeIndex: index });
    if (index === endIndex) break;
    index = selectedDirection === "forward" ? (index + 1) % totalCount : (index - 1 + totalCount) % totalCount;
    if (path.length > totalCount + 1) break;
  }

  return { path, direction: selectedDirection };
}

function buildFallbackBikeRoute(startPoint, endPoint) {
  const startNode = nearestBikeNode(startPoint);
  const endNode = nearestBikeNode(endPoint);
  const forward = circularPath(startNode.index, endNode.index, "forward");
  const backward = circularPath(startNode.index, endNode.index, "backward");
  const loopNodes = pathDistance(forward) <= pathDistance(backward) ? forward : backward;
  const startActual = { ...startPoint, name: `출발지(${startNode.name} 인근)`, elevation: startNode.elevation };
  const endActual = { ...endPoint, name: `도착지(${endNode.name} 인근)`, elevation: endNode.elevation };
  const path = [
    ...buildRoadLikeConnector(startActual, loopNodes[0], "도로 접속 경로"),
    ...loopNodes.slice(1),
    ...buildRoadLikeConnector(loopNodes[loopNodes.length - 1], endActual, "도로 이탈 경로").slice(1)
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
    stops: path.map((point) => point.name),
    waypoints: path,
    sourceName: "기본 자전거 경로",
    elevationSource: "장소 기준 추정 고도",
    accessDistanceKm: 0
  };
}

function routePlacesOnPath(startIndex, endIndex, direction) {
  const route = getPreparedGpxRoute();
  const totalCount = route.points.length;
  const selectedLength = routeIndexProgress(endIndex, startIndex, endIndex, direction, totalCount);
  return getPreparedRoutePlaces()
    .map((place) => ({
      ...place,
      progress: routeIndexProgress(place.routeIndex, startIndex, endIndex, direction, totalCount)
    }))
    .filter((place) => place.progress > 12 && place.progress < selectedLength - 12)
    .sort((a, b) => a.progress - b.progress);
}

function buildBikeRoute(startPoint, endPoint, direction = "auto") {
  const route = getPreparedGpxRoute();
  if (!route.points.length) return buildFallbackBikeRoute(startPoint, endPoint);

  const start = snapLocationToRoute(startPoint, startPoint.placeName || startPoint.name || "선택 지점");
  const end = snapLocationToRoute(endPoint, endPoint.placeName || endPoint.name || "선택 지점");
  const sliced = sliceGpxPath(start.routeIndex, end.routeIndex, direction);
  const mainPath = sliced.path.map((point, index) => ({
    ...point,
    name: index === 0 ? `주 경로 접속(${start.placeName})` : index === sliced.path.length - 1 ? `주 경로 이탈(${end.placeName})` : "주 경로"
  }));
  const startActual = {
    lat: start.actualLat,
    lng: start.actualLng,
    elevation: start.actualElevation,
    routeIndex: start.routeIndex,
    name: `출발지(${start.placeName})`,
    access: true
  };
  const endActual = {
    lat: end.actualLat,
    lng: end.actualLng,
    elevation: end.actualElevation,
    routeIndex: end.routeIndex,
    name: `도착지(${end.placeName})`,
    access: true
  };
  const startConnector = buildRoadLikeConnector(startActual, mainPath[0], "도로 접속 경로");
  const endConnector = buildRoadLikeConnector(mainPath[mainPath.length - 1], endActual, "도로 이탈 경로");
  const path = [
    ...startConnector,
    ...mainPath.slice(1),
    ...endConnector.slice(1)
  ].filter((point, index, array) => index === 0 || distanceKm(array[index - 1], point) > 0.005);
  const distance = pathDistance(path);
  let ascent = 0;
  let descent = 0;

  path.slice(1).forEach((point, index) => {
    const delta = point.elevation - path[index].elevation;
    if (delta > 0) ascent += delta;
    if (delta < 0) descent += Math.abs(delta);
  });

  const placeStops = routePlacesOnPath(start.routeIndex, end.routeIndex, sliced.direction);
  const waypoints = [
    startActual,
    ...(start.accessDistanceKm > 0.3 ? [{ ...mainPath[0], name: `주 경로 접속(${start.placeName} 인근)` }] : []),
    ...placeStops.map((place) => ({
      lat: place.lat,
      lng: place.lng,
      elevation: place.elevation,
      routeIndex: place.routeIndex,
      name: place.name
    })),
    ...(end.accessDistanceKm > 0.3 ? [{ ...mainPath[mainPath.length - 1], name: `주 경로 이탈(${end.placeName} 인근)` }] : []),
    endActual
  ];

  const accessDistanceKm = (start.accessDistanceKm || 0) + (end.accessDistanceKm || 0);
  const result = {
    path,
    distanceKm: distance,
    ascentM: ascent,
    descentM: descent,
    startName: path[0].name,
    endName: path[path.length - 1].name,
    stops: waypoints.map((point) => point.name),
    waypoints,
    direction: sliced.direction,
    sourceName: route.name,
    elevationSource: route.hasGpxElevation ? "예상 고도" : "장소 기준 추정 고도",
    accessDistanceKm
  };
  result.learnedMatch = learnedMatchPercent(result);
  return result;
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
  const points = route.waypoints?.length ? route.waypoints : route.path;
  const total = route.distanceKm || 1;
  let accumulated = 0;

  return points.map((point, index) => {
    const legDistance = index > 0 ? distanceKm(points[index - 1], point) : 0;
    if (index > 0) accumulated += legDistance;
    const minutes = Math.round(accumulated / total * Math.max(60, route.distanceKm / 15 * 60));
    return {
      time: index === 0 ? "08:30" : addMinutesToTime(8, 30, minutes),
      place: point.name,
      distanceKm: legDistance,
      cumulativeDistanceKm: accumulated,
      elevationM: Number.isFinite(point.elevation) ? Math.round(point.elevation) : null,
      detail: index === 0
        ? "출발 전 장비 점검"
        : index === points.length - 1
          ? "도착 후 숙소/항구 동선 확인"
          : ""
    };
  });
}

function elevationSvg(route) {
  if (!route || !route.path.length) return "";
  const width = 360;
  const height = 120;
  const labelHeight = 12;
  const chartBottom = 12;
  const chartHeight = height - labelHeight - chartBottom;
  const step = Math.max(1, Math.ceil(route.path.length / 160));
  const profilePoints = route.path.filter((point, index) => index % step === 0 || index === route.path.length - 1);
  const elevations = profilePoints.map((point) => point.elevation);
  const min = Math.min(...elevations);
  const max = Math.max(...elevations);
  const range = Math.max(1, max - min);
  const points = elevations.map((elevation, index) => {
    const x = profilePoints.length === 1 ? 0 : index / (profilePoints.length - 1) * width;
    const y = labelHeight + chartHeight - ((elevation - min) / range * chartHeight);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return `
    <svg class="elevation-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="예상 고도 그래프">
      <rect width="${width}" height="${height}" rx="14" fill="#eef7f4"/>
      <polyline points="${points}" fill="none" stroke="#087c83" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
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
  const placeInput = root.querySelector("[data-place-search]");
  const placeList = root.querySelector("[data-place-list]");
  const placeApplyButtons = root.querySelectorAll("[data-place-apply]");
  const viewTabs = root.querySelectorAll("[data-panel-view-tab]");
  const panelViews = root.querySelectorAll("[data-panel-view]");
  const routePanel = root.querySelector("[data-route-panel]");
  const overlayScheduleTabs = root.querySelector("[data-overlay-schedule-tabs]");
  const overlaySchedule = root.querySelector("[data-overlay-schedule]");
  const overlayRestaurants = root.querySelector("[data-overlay-restaurants]");
  const overlayTransport = root.querySelector("[data-overlay-transport]");
  const overlayPlan = root.querySelector("[data-overlay-plan]");

  let currentDay = activeDay();
  let mode = "start";
  let startPoint = null;
  let endPoint = null;
  let calculatedRoute = null;
  let map = null;
  let baseRouteLine = null;
  let learnedRouteLayer = null;
  let routeLine = null;
  let startMarker = null;
  let endMarker = null;
  let placeLayer = null;
  let restaurantLayer = null;
  const restaurantMarkers = new Map();
  let overlayScheduleFilter = "all";
  let currentView = "course";

  const renderDayTabs = () => {
    dayTabs.innerHTML = Object.entries(dayLabels).map(([dayId, label]) => `
      <button type="button" class="${dayId === currentDay ? "active" : ""}" data-map-day="${dayId}">${shortDayLabel(dayId)}</button>
    `).join("");
  };

  const setPanelView = (view) => {
    currentView = view;
    panelViews.forEach((section) => {
      section.hidden = section.dataset.panelView !== view;
    });
    viewTabs.forEach((button) => {
      const active = button.dataset.panelViewTab === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (view !== "course") renderOverlayViews();
    window.setTimeout(() => map?.invalidateSize(), 80);
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

  const setPanelCollapsed = (collapsed) => {
    root.classList.toggle("panel-collapsed", collapsed);
    routePanel?.setAttribute("aria-expanded", String(!collapsed));
    routePanel?.setAttribute("aria-label", collapsed ? "패널 열기" : "패널 숨기기");
    window.setTimeout(() => map?.invalidateSize(), 220);
  };

  const isPanelControlTarget = (target) => {
    return !!target.closest("a, button, input, textarea, select, label, [role='button']");
  };

  const focusRestaurant = (index) => {
    const restaurant = jejuRestaurants[index];
    if (!restaurant || !map) return;
    if (restaurantLayer && !map.hasLayer(restaurantLayer)) restaurantLayer.addTo(map);
    setPanelView("restaurants");
    const marker = restaurantMarkers.get(index);
    map.flyTo([restaurant.lat, restaurant.lng], Math.max(map.getZoom(), 14), { duration: 0.7 });
    window.setTimeout(() => marker?.openPopup(), 450);
    setStatus(`${restaurant.name} 위치를 지도에 표시했습니다.`);
    if (window.matchMedia("(max-width: 760px)").matches) setPanelCollapsed(true);
  };

  const requestedRestaurantIndex = () => {
    const params = new URLSearchParams(window.location.search);
    const rawIndex = params.get("restaurant");
    if (rawIndex && /^\d+$/.test(rawIndex)) {
      const index = Number(rawIndex);
      return jejuRestaurants[index] ? index : null;
    }
    const requestedName = params.get("restaurantName") || rawIndex;
    if (!requestedName) return null;
    return jejuRestaurants.findIndex((restaurant) => restaurant.name === requestedName);
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

  const drawEndpointMarker = (type, point) => {
    const markerTitle = type === "start" ? "출발지" : "도착지";
    const popup = `${markerTitle}: ${point.placeName || point.name || "선택 지점"}`;
    const markerLat = point.actualLat ?? point.lat;
    const markerLng = point.actualLng ?? point.lng;
    if (type === "start") {
      if (startMarker) startMarker.remove();
      startMarker = L.marker([markerLat, markerLng], { title: markerTitle }).addTo(map).bindPopup(popup);
    } else {
      if (endMarker) endMarker.remove();
      endMarker = L.marker([markerLat, markerLng], { title: markerTitle }).addTo(map).bindPopup(popup);
    }
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
      <div class="timeline">${renderTimeline(checkpoints)}</div>
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

  const setPoint = (latlng, label) => {
    const point = snapLocationToRoute({ lat: latlng.lat, lng: latlng.lng, name: label }, label || "지도 선택 지점");
    if (mode === "start") {
      startPoint = point;
      drawEndpointMarker("start", point);
      setMode("end");
    } else {
      endPoint = point;
      drawEndpointMarker("end", point);
    }
    recalculate();
  };

  const setRoutePointFromMapClick = (latlng) => {
    const nearest = nearestRoutePoint({ lat: latlng.lat, lng: latlng.lng });
    if (!nearest) {
      setStatus("자전거길을 먼저 불러와야 지도에서 지점을 선택할 수 있습니다.");
      return;
    }
    setPoint({
      lat: nearest.lat,
      lng: nearest.lng,
      elevation: nearest.elevation,
      name: "자전거길 선택 지점",
      placeName: "자전거길 선택 지점"
    }, "자전거길 선택 지점");
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

  const storagePath = (path) => {
    const step = Math.max(1, Math.ceil(path.length / 900));
    return path
      .filter((point, index) => index === 0 || index === path.length - 1 || index % step === 0)
      .map((point) => ({
        name: point.name,
        lat: point.lat,
        lng: point.lng,
        elevation: point.elevation,
        routeIndex: point.routeIndex
      }));
  };

  const storageWaypoints = (waypoints) => waypoints.map((point) => ({
    name: point.name,
    lat: point.lat,
    lng: point.lng,
    elevation: point.elevation,
    routeIndex: point.routeIndex
  }));

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
      path: storagePath(calculatedRoute.path),
      waypoints: storageWaypoints(calculatedRoute.waypoints || []),
      sourceName: calculatedRoute.sourceName,
      elevationSource: calculatedRoute.elevationSource,
      direction: calculatedRoute.direction,
      accessDistanceKm: calculatedRoute.accessDistanceKm,
      learnedMatch: calculatedRoute.learnedMatch,
      startPoint,
      endPoint
    };
    saveRoutePlan(plan);
    setActiveDay(currentDay);
    renderOverlayViews();
    setStatus(`${dayLabels[currentDay]} 코스를 저장했습니다. 일정표와 전체계획표에 반영되었습니다.`);
    showToast(`${dayLabels[currentDay]} 지도 코스를 저장했습니다.`);
  };

  const renderOverlaySchedule = () => {
    if (!overlayScheduleTabs || !overlaySchedule) return;
    const segments = resolveSegments();
    overlayScheduleTabs.innerHTML = `<button type="button" data-overlay-schedule-filter="all">전체</button>${segments.map((segment) => `<button type="button" data-overlay-schedule-filter="${segment.id}">${shortDayLabel(segment.id)}</button>`).join("")}`;
    overlayScheduleTabs.querySelectorAll("[data-overlay-schedule-filter]").forEach((button) => {
      const active = button.dataset.overlayScheduleFilter === overlayScheduleFilter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    overlaySchedule.innerHTML = segments
      .filter((segment) => overlayScheduleFilter === "all" || segment.id === overlayScheduleFilter)
      .map((segment) => renderScheduleCard(segment))
      .join("");
    setupNaverMapLinks(overlaySchedule);
  };

  const renderOverlayTransport = () => {
    if (!overlayTransport) return;
    const selectedId = getSelectedTransportId();
    const selected = transportOptions.find((option) => option.id === selectedId) || transportOptions[0];
    overlayTransport.innerHTML = `
      <div data-ferry-search></div>
      <article class="route-result-card">
        <span class="tag">확정 교통편</span>
        <h2>${selected.title}</h2>
        <p>${selected.summary}</p>
        <ul class="plain-check-list">${selected.checks.map((check) => `<li>${check}</li>`).join("")}</ul>
      </article>
      <div class="overlay-card-list">${transportOptions.map((option) => renderTransportChoice(option, option.id === selectedId)).join("")}</div>
    `;
    setupFerrySearchPanel(overlayTransport);
    setupNaverMapLinks(overlayTransport);
  };

  const renderOverlayRestaurants = () => {
    if (!overlayRestaurants) return;
    overlayRestaurants.innerHTML = `
      <div class="restaurant-panel-list">
        ${renderRestaurantList()}
      </div>
    `;
    setupNaverMapLinks(overlayRestaurants);
  };

  const renderOverlayPlan = () => {
    if (!overlayPlan) return;
    overlayPlan.innerHTML = renderMasterPlanContent();
    setupNaverMapLinks(overlayPlan);
  };

  function renderOverlayViews() {
    renderOverlayRestaurants();
    renderOverlaySchedule();
    renderOverlayTransport();
    renderOverlayPlan();
  }

  const resolveLocation = async (query) => {
    const local = findLocalPlace(query);
    if (local) return { lat: local.lat, lng: local.lng, name: local.name };
    const coordinates = parseCoordinateQuery(query);
    if (coordinates) return coordinates;
    return searchVWorldLocation(query);
  };

  const applySearchLocation = async (type) => {
    const query = placeInput?.value.trim();
    if (!query) {
      setStatus("장소명이나 주소를 입력하세요.");
      return;
    }
    setStatus(`'${query}' 위치를 찾는 중입니다.`);
    const found = await resolveLocation(query);
    if (!found) {
      setStatus("장소를 찾지 못했습니다. 제주 지명 또는 위도,경도 형식으로 다시 입력하세요.");
      return;
    }
    setMode(type);
    setPoint(found, found.name || query);
    map.flyTo([found.lat, found.lng], Math.max(map.getZoom(), 13));
  };

  const loadSavedRoute = () => {
    const saved = getRoutePlan()[currentDay];
    if (!saved?.mapRoute) return;
    const savedStart = saved.startPoint || saved.path?.[0];
    const savedEnd = saved.endPoint || saved.path?.[saved.path.length - 1];
    if (!savedStart || !savedEnd) return;
    startPoint = snapLocationToRoute(savedStart, savedStart.placeName || savedStart.name || "저장 출발지");
    endPoint = snapLocationToRoute(savedEnd, savedEnd.placeName || savedEnd.name || "저장 도착지");
    drawEndpointMarker("start", startPoint);
    drawEndpointMarker("end", endPoint);
    calculatedRoute = buildBikeRoute(startPoint, endPoint, saved.direction || "auto");
    drawRoute();
    updateResult();
  };

  renderDayTabs();
  updateResult();
  setMode("start");
  renderOverlayViews();
  setPanelView("course");

  if (!window.L) {
    mapTarget.innerHTML = '<div class="map-load-error">지도 라이브러리를 불러오지 못했습니다. 네트워크 연결을 확인하세요.</div>';
    return;
  }

  map = L.map(mapTarget, {
    zoomControl: false,
    preferCanvas: true
  }).setView([33.38, 126.55], 10);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  const baseMapLayer = L.tileLayer(`https://api.vworld.kr/req/wmts/1.0.0/${vworldApiKey}/Base/{z}/{y}/{x}.png`, {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="https://www.vworld.kr/">V-World</a>'
  }).addTo(map);
  const satelliteLayer = L.tileLayer(`https://api.vworld.kr/req/wmts/1.0.0/${vworldApiKey}/Satellite/{z}/{y}/{x}.jpeg`, {
    maxZoom: 19,
    attribution: 'Imagery &copy; <a href="https://www.vworld.kr/">V-World</a>'
  });

  const gpxRoute = getPreparedGpxRoute();
  if (gpxRoute.points.length) {
    baseRouteLine = L.polyline(gpxRoute.points.map((point) => [point.lat, point.lng]), {
      color: "#087c83",
      weight: 4,
      opacity: 0.58,
      lineJoin: "round"
    }).addTo(map);
    map.fitBounds(baseRouteLine.getBounds(), { padding: [28, 28] });
    setStatus("출발지를 선택하세요.");
  } else {
    setStatus("기본 경로 데이터를 불러오지 못했습니다. 경로 파일을 확인하세요.");
  }

  learnedRouteLayer = L.layerGroup().addTo(map);
  getLearnedCyclingNetwork().segments.forEach((segment, index) => {
    const points = gpxRoute.points
      .slice(segment.startIndex, segment.endIndex + 1)
      .map((point) => [point.lat, point.lng]);
    const hue = 185 + (index % 6) * 18;
    const line = L.polyline(points, {
      color: `hsl(${hue}, 72%, 38%)`,
      weight: 6,
      opacity: 0.78,
      lineJoin: "round"
    }).addTo(learnedRouteLayer);
    line.bindTooltip(`${segment.area} · ${segment.title} · ${segment.distanceKm.toFixed(1)}km · 신뢰 ${segment.confidence}`, {
      sticky: true
    });
  });

  placeLayer = L.layerGroup().addTo(map);
  getPreparedRoutePlaces().forEach((place) => {
    const marker = L.circleMarker([place.lat, place.lng], {
      radius: 6,
      color: "#0b5d67",
      weight: 2,
      fillColor: "#fff7d7",
      fillOpacity: 0.95
    }).addTo(placeLayer);
    marker.bindTooltip(place.name, { direction: "top", offset: [0, -4] });
    marker.bindPopup(routePlacePopup(place));
    marker.on("click", (event) => {
      L.DomEvent.stopPropagation(event);
      marker.openPopup();
      setPoint(place, place.name);
    });
  });

  restaurantLayer = L.layerGroup().addTo(map);
  jejuRestaurants.forEach((restaurant, index) => {
    const marker = L.circleMarker([restaurant.lat, restaurant.lng], {
      radius: 7,
      color: "#7a3d00",
      weight: 2,
      fillColor: "#ffbf47",
      fillOpacity: 0.95
    }).addTo(restaurantLayer);
    marker.bindPopup(`
      <strong>${index + 1}위 · ${restaurant.name}</strong><br>
      ${restaurant.area} · ${restaurant.category}<br>
      ${restaurant.summary}<br>
      <a target="_blank" rel="noreferrer" href="${naverSearchUrl(restaurantSearchTerm(restaurant))}">네이버</a>
      · <a target="_blank" rel="noreferrer" href="${kakaoSearchUrl(restaurantSearchTerm(restaurant))}">다음</a>
      · <a target="_blank" rel="noreferrer" href="${googleSearchUrl(`${restaurantSearchTerm(restaurant)} 리뷰`)}">구글</a>
    `);
    restaurantMarkers.set(index, marker);
  });

  L.control.layers(
    { "일반지도": baseMapLayer, "항공사진": satelliteLayer },
    { "자전거길": learnedRouteLayer, "장소": placeLayer, "맛집": restaurantLayer },
    { position: "topright", collapsed: true }
  ).addTo(map);

  if (placeList) {
    placeList.innerHTML = getPreparedRoutePlaces()
      .flatMap((place) => [place.name, ...(place.aliases || [])])
      .map((name) => `<option value="${name}"></option>`)
      .join("");
  }

  loadSavedRoute();

  dayTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-map-day]");
    if (!button) return;
    currentDay = button.dataset.mapDay;
    setActiveDay(currentDay);
    renderDayTabs();
    clearRoute();
    overlayScheduleFilter = currentDay;
    loadSavedRoute();
    renderOverlayViews();
  });

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mapMode));
  });
  clearButton.addEventListener("click", clearRoute);
  saveButton.addEventListener("click", saveRoute);
  map.on("click", (event) => setRoutePointFromMapClick(event.latlng));
  placeApplyButtons.forEach((button) => {
    button.addEventListener("click", () => applySearchLocation(button.dataset.placeApply));
  });
  placeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applySearchLocation(mode);
    }
  });
  viewTabs.forEach((button) => {
    button.addEventListener("click", () => setPanelView(button.dataset.panelViewTab));
  });
  routePanel?.addEventListener("click", (event) => {
    const collapsed = root.classList.contains("panel-collapsed");
    if (collapsed) {
      event.preventDefault();
      setPanelCollapsed(false);
      return;
    }
    if (isPanelControlTarget(event.target) && !collapsed) return;
    if (event.target.closest("[data-panel-toggle-area]")) {
      setPanelCollapsed(true);
    }
  });
  overlayScheduleTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-overlay-schedule-filter]");
    if (!button) return;
    overlayScheduleFilter = button.dataset.overlayScheduleFilter;
    if (overlayScheduleFilter !== "all") setActiveDay(overlayScheduleFilter);
    renderOverlaySchedule();
  });
  overlayRestaurants?.addEventListener("click", (event) => {
    const mapLink = event.target.closest("[data-restaurant-map-link]");
    if (mapLink) {
      event.preventDefault();
      focusRestaurant(Number(mapLink.dataset.restaurantIndex));
      return;
    }
    if (event.target.closest("a, button")) return;
    const card = event.target.closest("[data-restaurant-card]");
    if (!card) return;
    focusRestaurant(Number(card.dataset.restaurantCard));
  });
  overlayTransport?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-transport-select]");
    if (!button) return;
    writeStorage(storageKeys.transport, button.dataset.transportSelect);
    showToast("교통편을 전체계획표에 반영했습니다.");
    renderOverlayViews();
  });

  const initialParams = new URLSearchParams(window.location.search);
  const requestedPanel = initialParams.get("panel");
  const initialRestaurant = requestedRestaurantIndex();
  if (initialRestaurant !== null && initialRestaurant >= 0) {
    window.setTimeout(() => focusRestaurant(initialRestaurant), 260);
  } else if (["course", "restaurants", "schedule", "transport", "plan"].includes(requestedPanel)) {
    setPanelView(requestedPanel);
  }
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

  tabs.innerHTML = `<button type="button" data-schedule-filter="all">전체</button>${segments.map((segment) => `<button type="button" data-schedule-filter="${segment.id}">${shortDayLabel(segment.id)}</button>`).join("")}`;
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

function restaurantSearchTerm(restaurant) {
  return `${restaurant.name} 제주 ${restaurant.area}`;
}

function restaurantMapHref(restaurant, index) {
  return `course.html?panel=restaurants&restaurant=${encodeURIComponent(String(index))}&restaurantName=${encodeURIComponent(restaurant.name)}`;
}

function renderRestaurantActions(restaurant, index) {
  const term = restaurantSearchTerm(restaurant);
  return `
    <div class="restaurant-actions">
      <a class="btn dark small" href="${restaurantMapHref(restaurant, index)}" data-restaurant-map-link data-restaurant-index="${index}">지도</a>
      <a class="btn light small" target="_blank" rel="noreferrer" href="${naverSearchUrl(term)}" data-naver-map data-naver-query="${term}" data-web-url="${naverSearchUrl(term)}">네이버</a>
      <a class="btn light small" target="_blank" rel="noreferrer" href="${kakaoSearchUrl(term)}">다음</a>
      <a class="btn light small" target="_blank" rel="noreferrer" href="${googleSearchUrl(`${term} 리뷰`)}">구글</a>
    </div>
  `;
}

function renderRestaurantCard(restaurant, index) {
  return `
    <article class="restaurant-card" data-restaurant-card="${index}">
      <div>
        <strong>${restaurant.name}</strong>
        <span>${restaurant.area} · ${restaurant.category}</span>
      </div>
      <em>${index + 1}위</em>
      <p>${restaurant.summary}</p>
      ${renderRestaurantActions(restaurant, index)}
    </article>
  `;
}

function renderRestaurantList(limit = jejuRestaurants.length) {
  return jejuRestaurants.slice(0, limit).map((restaurant, index) => renderRestaurantCard(restaurant, index)).join("");
}

function setupRestaurantPage() {
  const target = document.querySelector("[data-restaurant-page]");
  if (!target) return;

  target.innerHTML = `
    <div class="restaurant-summary-bar">
      <div><strong>${jejuRestaurants.length}</strong><span>맛집 후보</span></div>
      <div><strong>4</strong><span>지도·검색 링크</span></div>
      <div><strong>지도</strong><span>코스 화면 마커 연동</span></div>
    </div>
    <div class="restaurant-scroll-list">
      ${renderRestaurantList()}
    </div>
  `;
  target.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    const card = event.target.closest("[data-restaurant-card]");
    if (!card) return;
    const restaurant = jejuRestaurants[Number(card.dataset.restaurantCard)];
    if (restaurant) window.location.href = restaurantMapHref(restaurant, Number(card.dataset.restaurantCard));
  });
  setupNaverMapLinks(target);
}

function setupTransportPage() {
  const target = document.querySelector("[data-transport-picker]");
  const selectedTarget = document.querySelector("[data-selected-transport]");
  if (!target || !selectedTarget) return;
  document.querySelector("#tripDate")?.closest(".date-panel")?.remove();

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
    setupFerrySearchPanel(document);
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

  target.innerHTML = renderMasterPlanContent();
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

function preparePdfExportRoot() {
  document.querySelector("[data-pdf-export-root]")?.remove();
  const root = document.createElement("section");
  root.className = "pdf-export-root";
  root.dataset.pdfExportRoot = "true";
  root.innerHTML = `
    <header class="pdf-export-header">
      <p>Jeju-Tour Plan</p>
      <h1>${tripDefaults.title}</h1>
      <span>${tripDefaults.dateRange}</span>
    </header>
    <div class="master-plan pdf-master-plan">
      ${renderMasterPlanContent({ printable: true })}
    </div>
  `;
  document.body.append(root);
  return root;
}

function setupPdfExport() {
  document.querySelectorAll("[data-export-pdf]").forEach((button) => {
    button.addEventListener("click", () => {
      const root = preparePdfExportRoot();
      const cleanup = () => {
        document.body.classList.remove("is-exporting-pdf");
        root.remove();
        window.removeEventListener("afterprint", cleanup);
      };
      document.body.classList.add("is-exporting-pdf");
      window.addEventListener("afterprint", cleanup, { once: true });
      showToast("전체 계획표 PDF 저장 창을 엽니다. 대상에서 PDF 저장을 선택하세요.");
      window.setTimeout(() => {
        window.print();
        window.setTimeout(cleanup, 1800);
      }, 120);
    });
  });
}

function setupTripDate() {
  const tripDate = document.querySelector("#tripDate");
  const dateHint = document.querySelector("#dateHint");
  if (!tripDate || !dateHint) return;

  const savedDate = readStorage(storageKeys.tripDate) || tripDefaults.startDate;
  tripDate.value = savedDate;
  dateHint.textContent = `${savedDate} 출발 기준으로 확인하세요. 기본값은 첨부 일정표 기준입니다.`;

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
setupRestaurantPage();
setupShare();
setupPdfExport();
setupTripDate();
setupNaverMapLinks();
