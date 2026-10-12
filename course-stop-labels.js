(function (root) {
  "use strict";
  // Names describe GPX positions. Nearby facilities do not establish a visit.
  // Entries match only the original stop number and a coordinate within 50 m.
  const locations = {
    "day1": {
      "1": {
        "name": "물항식당",
        "lat": 33.51666,
        "lng": 126.529035,
        "direction": "top",
        "method": "사용자 지정",
        "address": "제주특별자치도 제주시 건입동 1429",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EB%AC%BC%ED%95%AD%EC%8B%9D%EB%8B%B9,33.5168066,126.5289283",
        "sourceDistanceM": null,
        "description": "사용자가 지정한 장소 이름을 유지하고 GPX 좌표의 주소를 대조했습니다."
      },
      "2": {
        "name": "물항식당",
        "lat": 33.516725,
        "lng": 126.5288966,
        "direction": "bottom",
        "method": "사용자 지정",
        "address": "제주특별자치도 제주시 건입동 1429",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EB%AC%BC%ED%95%AD%EC%8B%9D%EB%8B%B9,33.51671,126.5288816",
        "sourceDistanceM": null,
        "description": "사용자가 지정한 장소 이름을 유지하고 GPX 좌표의 주소를 대조했습니다."
      },
      "3": {
        "name": "첫번째 사고지점",
        "lat": 33.4967433,
        "lng": 126.452125,
        "direction": "bottom",
        "method": "사용자 지정",
        "address": "제주특별자치도 제주시 이호일동 1699-1",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EC%B2%AB%EB%B2%88%EC%A7%B8%20%EC%82%AC%EA%B3%A0%EC%A7%80%EC%A0%90,33.4969383,126.4520216",
        "sourceDistanceM": null,
        "description": "CU 앞 GPX 정지 지점의 실제 좌표 주소입니다. 사용자 지정 사고 주소 ‘이호일동 1962’와 구분하여 표시합니다."
      },
      "4": {
        "lat": 33.47838,
        "lng": 126.3636583,
        "direction": "top",
        "method": "좌표 주소 대조",
        "address": "제주특별자치도 제주시 애월읍 신엄리 2730-3",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EB%A8%B8%EB%AC%B8%20%EA%B3%B3%204,33.47838,126.3636583",
        "sourceDistanceM": null,
        "description": "GPX 대표 좌표로 조회한 신엄리 해안 지점의 주소입니다."
      },
      "5": {
        "name": "가방 잃어버린 곳 · 곽지해변 화장실",
        "lat": 33.45186,
        "lng": 126.307015,
        "direction": "top",
        "method": "사용자 지정",
        "address": "제주특별자치도 제주시 애월읍 곽지리 1565-48",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EA%B0%80%EB%B0%A9%20%EC%9E%83%EC%96%B4%EB%B2%84%EB%A6%B0%20%EA%B3%B3%20%C2%B7%20%EA%B3%BD%EC%A7%80%ED%95%B4%EB%B3%80%20%ED%99%94%EC%9E%A5%EC%8B%A4,33.45175,126.3069433",
        "sourceDistanceM": null,
        "description": "사용자가 지정한 장소 이름을 유지하고 GPX 좌표의 주소를 대조했습니다."
      },
      "6": {
        "name": "두번째 사고지점",
        "lat": 33.4422316,
        "lng": 126.289705,
        "direction": "bottom",
        "method": "사용자 지정",
        "address": "제주특별자치도 제주시 한림읍 귀덕리 3027-5",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EB%91%90%EB%B2%88%EC%A7%B8%20%EC%82%AC%EA%B3%A0%EC%A7%80%EC%A0%90,33.442125,126.2894233",
        "sourceDistanceM": null,
        "description": "사용자가 지정한 장소 이름을 유지하고 GPX 좌표의 주소를 대조했습니다."
      },
      "7": {
        "name": "버스정류장",
        "lat": 33.4419283,
        "lng": 126.2889066,
        "direction": "left",
        "method": "사용자 지정",
        "address": "제주특별자치도 제주시 한림읍 귀덕리 3028-3",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EB%B2%84%EC%8A%A4%EC%A0%95%EB%A5%98%EC%9E%A5,33.4418916,126.28871",
        "sourceDistanceM": null,
        "description": "사용자가 지정한 장소 이름을 유지하고 GPX 좌표의 주소를 대조했습니다."
      },
      "8": {
        "name": "흑돼지 바당돈",
        "lat": 33.394265,
        "lng": 126.240995,
        "direction": "top",
        "method": "사용자 지정",
        "address": "제주특별자치도 제주시 한림읍 협재리 2872",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%ED%9D%91%EB%8F%BC%EC%A7%80%20%EB%B0%94%EB%8B%B9%EB%8F%88,33.39434,126.2413166",
        "sourceDistanceM": null,
        "description": "사용자가 지정한 장소 이름을 유지하고 GPX 좌표의 주소를 대조했습니다."
      }
    },
    "day2": {
      "1": {
        "name": "신창풍차해안도로 해안 구간",
        "lat": 33.3453133,
        "lng": 126.1695466,
        "direction": "top",
        "address": "제주특별자치도 제주시 한경면 신창리 1481-16",
        "description": "신창리 해안의 GPX 좌표와 신창풍차해안도로 지명을 대조했습니다. 특정 시설 방문으로 해석하지 않고 해안 구간으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "신창풍차해안도로",
        "sourceUrl": "https://place.map.kakao.com/26239274",
        "sourceDistanceM": 499,
        "offset": [
          0,
          -21
        ]
      },
      "2": {
        "name": "신창풍차해안도로 주차장 인근",
        "lat": 33.3436333,
        "lng": 126.1707566,
        "direction": "bottom",
        "address": "제주특별자치도 제주시 한경면 신창리 1481-16",
        "description": "신창해안풍차도로 주차장에서 약 151 m 떨어진 신창리 해안 지점입니다. 주차장 인근으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "신창해안풍차도로 주차장",
        "sourceUrl": "https://place.map.kakao.com/181630563",
        "sourceDistanceM": 151
      },
      "3": {
        "name": "용수리 해안도로",
        "lat": 33.329755,
        "lng": 126.16696,
        "direction": "top",
        "address": "제주특별자치도 제주시 한경면 용수리 4020-1",
        "description": "용수리 4020-1로 조회된 해안 지점입니다. 가까운 시설을 특정하기 어려워 마을과 해안도로 이름으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 지번 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EC%9A%A9%EC%88%98%EB%A6%AC%20%ED%95%B4%EC%95%88%EB%8F%84%EB%A1%9C,33.329755,126.16696",
        "sourceDistanceM": null
      },
      "4": {
        "name": "일과리 · 일주서로",
        "lat": 33.2344,
        "lng": 126.2362433,
        "direction": "left",
        "address": "제주특별자치도 서귀포시 대정읍 일과리 1257-4",
        "description": "일과리 1257-4로 조회되며 지도상 해안을 따라가는 일주서로 구간입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 지번 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EC%9D%BC%EA%B3%BC%EB%A6%AC%20%C2%B7%20%EC%9D%BC%EC%A3%BC%EC%84%9C%EB%A1%9C,33.2344,126.2362433",
        "sourceDistanceM": null
      },
      "5": {
        "name": "송악산 입구 · CU 인근",
        "lat": 33.2076083,
        "lng": 126.2911466,
        "direction": "top",
        "address": "제주특별자치도 서귀포시 대정읍 상모리 130-1",
        "description": "CU 제주송악산점과 약 11 m, 산이물식당과 약 9 m 거리입니다. 인접 시설이 여러 곳이므로 송악산 입구·CU 인근으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "CU 제주송악산점",
        "sourceUrl": "https://place.map.kakao.com/14594232",
        "sourceDistanceM": 11
      },
      "6": {
        "name": "산방산 공영주차장 인근",
        "lat": 33.2360883,
        "lng": 126.3125933,
        "direction": "top",
        "address": "제주특별자치도 서귀포시 안덕면 사계리 163-9",
        "description": "산방산 공영주차장에서 약 54 m, 산방산주차장에서 약 22 m 거리인 사계리 지점입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "산방산 공영주차장",
        "sourceUrl": "https://place.map.kakao.com/20517083",
        "sourceDistanceM": 54
      },
      "7": {
        "name": "감산리 · 일주서로",
        "lat": 33.25584,
        "lng": 126.3464233,
        "direction": "top",
        "address": "제주특별자치도 서귀포시 안덕면 감산리 1456-2",
        "description": "감산리 1456-2의 일주서로 지점입니다. 건강과성박물관 주차장에서 약 147 m 떨어져 있습니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "건강과성박물관 주차장",
        "sourceUrl": "https://place.map.kakao.com/17577519",
        "sourceDistanceM": 147
      },
      "8": {
        "name": "중문색달해변 · 더클리프 인근",
        "lat": 33.2445566,
        "lng": 126.414755,
        "direction": "bottom",
        "address": "제주특별자치도 서귀포시 중문관광로 154-17",
        "description": "중문관광로 154-17로 조회되며 더클리프와 약 29 m, GS25 퍼시픽랜드점과 약 14 m 거리입니다. 특정 업소 이용 대신 해변 인근 위치로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "더클리프",
        "sourceUrl": "https://place.map.kakao.com/1378746048",
        "sourceDistanceM": 29
      },
      "9": {
        "name": "법환바당 인증센터 인근",
        "lat": 33.2359883,
        "lng": 126.5151183,
        "direction": "top",
        "address": "제주특별자치도 서귀포시 법환동 163-7",
        "description": "법환바당 인증센터에서 약 13 m 떨어진 법환동 지점입니다. 인증 여부를 추정하지 않고 인증센터 인근으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "법환바당 인증센터",
        "sourceUrl": "https://place.map.kakao.com/27600986",
        "sourceDistanceM": 13
      }
    },
    "day3": {
      "1": {
        "name": "남원리 해안 · 노인과바다펜션 인근",
        "lat": 33.27469,
        "lng": 126.710265,
        "direction": "left",
        "address": "제주특별자치도 서귀포시 남원읍 남원리 1383-9",
        "description": "남원리 1383-9 해안 지점으로, 노인과바다펜션에서 약 57 m 거리입니다. 숙박 여부를 추정하지 않고 주변 위치로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "노인과바다펜션",
        "sourceUrl": "https://place.map.kakao.com/18268425",
        "sourceDistanceM": 57
      },
      "2": {
        "name": "제주할망밥상 표선점 인근",
        "lat": 33.3202416,
        "lng": 126.8294432,
        "direction": "top",
        "address": "제주특별자치도 서귀포시 표선면 표선리 1010-5",
        "description": "표선리 1010-5로 조회되며 제주할망밥상 표선점과 약 21 m 거리입니다. 실제 식사 여부는 GPX만으로 확인할 수 없어 인근으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "제주할망밥상 표선점",
        "sourceUrl": "https://place.map.kakao.com/547856828",
        "sourceDistanceM": 21
      },
      "3": {
        "name": "표선해변 · 카페플로 인근",
        "lat": 33.326725,
        "lng": 126.8367766,
        "direction": "bottom",
        "address": "제주특별자치도 서귀포시 표선면 표선리 483-2",
        "description": "표선해변 상가 구간으로, 카페플로와 약 16 m, 롯데리아 제주표선해변점과 약 22 m 거리입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "카페플로",
        "sourceUrl": "https://place.map.kakao.com/1403258007",
        "sourceDistanceM": 16
      },
      "4": {
        "name": "신산리 · 환해장성로",
        "lat": 33.3888083,
        "lng": 126.897565,
        "direction": "right",
        "address": "제주특별자치도 서귀포시 성산읍 신산리 49-5",
        "description": "신산리 49-5로 조회되며 지도상 환해장성로를 따라가는 해안 지점입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "GPX 좌표의 카카오 지번 주소",
        "sourceUrl": "https://map.kakao.com/link/map/%EC%8B%A0%EC%82%B0%EB%A6%AC%20%C2%B7%20%ED%99%98%ED%95%B4%EC%9E%A5%EC%84%B1%EB%A1%9C,33.3888083,126.897565",
        "sourceDistanceM": null,
        "offset": [
          30,
          10
        ]
      },
      "5": {
        "name": "광치기해변 북측 해안",
        "lat": 33.4578933,
        "lng": 126.9288783,
        "direction": "bottom",
        "address": "제주특별자치도 서귀포시 성산읍 고성리 224-1",
        "description": "고성리 224-1로 조회되는 해안 지점입니다. 광치기중간 지명과 주변 해안 위치를 대조해 광치기해변 북측으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "광치기중간",
        "sourceUrl": "https://place.map.kakao.com/13723496",
        "sourceDistanceM": 279
      },
      "6": {
        "name": "성산일출봉 공영주차장 인근",
        "lat": 33.46216,
        "lng": 126.9357283,
        "direction": "right",
        "address": "제주특별자치도 서귀포시 성산읍 일출로 284-6",
        "description": "일출로 284-6으로 조회되며 성산일출봉 공영주차장과 약 44 m 거리입니다. 등반 여부를 추정하지 않고 입구 주차장 인근으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "성산일출봉 공영주차장",
        "sourceUrl": "https://place.map.kakao.com/1502905056",
        "sourceDistanceM": 44
      },
      "7": {
        "name": "종달리 · 제주청년회 인근",
        "lat": 33.4970216,
        "lng": 126.91107,
        "direction": "right",
        "address": "제주특별자치도 제주시 구좌읍 종달리 478-20",
        "description": "종달리 478-20로 조회되며 제주청년회와 약 21 m 거리입니다. 종달항해맞이집 등 주변 업소도 있어 인근 위치로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "제주청년회",
        "sourceUrl": "https://place.map.kakao.com/828053028",
        "sourceDistanceM": 21
      },
      "8": {
        "name": "평대리 해안 · 평대식당 인근",
        "lat": 33.5349483,
        "lng": 126.8399966,
        "direction": "left",
        "address": "제주특별자치도 제주시 구좌읍 평대리 · 해안 지점",
        "description": "좌표의 지번 주소는 조회되지 않았지만 행정구역은 평대리로 확인됐습니다. 평대식당·세븐일레븐 평대해안로점과 각각 약 33 m 거리인 해안 지점입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "평대식당",
        "sourceUrl": "https://place.map.kakao.com/2917003",
        "sourceDistanceM": 33,
        "offset": [
          -16,
          -12
        ]
      },
      "9": {
        "name": "아쿠아뷰티크 숙소",
        "lat": 33.55698,
        "lng": 126.8015016,
        "direction": "top",
        "address": "제주특별자치도 제주시 구좌읍 행원리 1515-9",
        "description": "기존 숙박 일정의 아쿠아뷰티크와 GPX 지점이 약 20 m 거리로 일치합니다. 15:12~20:33 사이 기록으로, 긴 기록 공백을 포함합니다.",
        "method": "일정·좌표 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "아쿠아뷰티크",
        "sourceUrl": "https://place.map.kakao.com/25462842",
        "sourceDistanceM": 20
      },
      "10": {
        "name": "월정리 카페거리",
        "lat": 33.5554716,
        "lng": 126.7965883,
        "direction": "bottom",
        "address": "제주특별자치도 제주시 구좌읍 월정리 3-2",
        "description": "월정리 3-2로 조회되며 월정리카페거리 기준 지점과 약 10 m 거리입니다. 여러 상점이 붙어 있어 거리 이름으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "월정리카페거리",
        "sourceUrl": "https://place.map.kakao.com/27583373",
        "sourceDistanceM": 10
      }
    },
    "day4": {
      "1": {
        "name": "월정리해변 · CU 월정모살점 인근",
        "lat": 33.5558783,
        "lng": 126.7958883,
        "direction": "top",
        "address": "제주특별자치도 제주시 구좌읍 월정리 652-4",
        "description": "월정리 652-4로 조회되며 CU 제주월정모살점과 약 31 m, 월정리해안도로 기준 지점과 약 42 m 거리입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "CU 제주월정모살점",
        "sourceUrl": "https://place.map.kakao.com/27354400",
        "sourceDistanceM": 31
      },
      "2": {
        "name": "함덕 · 오드랑베이커리 인근",
        "lat": 33.5420566,
        "lng": 126.6715083,
        "direction": "bottom",
        "address": "제주특별자치도 제주시 조천읍 함덕리 272-19",
        "description": "함덕리 272-19로 조회되며 오드랑베이커리와 약 10 m 거리입니다. 구매·식사 여부를 추정하지 않고 인근 위치로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "오드랑베이커리",
        "sourceUrl": "https://place.map.kakao.com/1578746387",
        "sourceDistanceM": 10
      },
      "3": {
        "name": "함덕해변 서쪽 해안",
        "lat": 33.5429016,
        "lng": 126.667435,
        "direction": "top",
        "address": "제주특별자치도 제주시 조천읍 함덕리 1004",
        "description": "함덕리 1004 해안 지점입니다. 주변 식당보다 해안 쪽에 위치하며 함덕해수욕장 기준 지점에서 약 168 m 서쪽입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "함덕해수욕장",
        "sourceUrl": "https://place.map.kakao.com/8148451",
        "sourceDistanceM": 168
      },
      "4": {
        "name": "함덕 정주항 주차장 인근",
        "lat": 33.5459183,
        "lng": 126.6618366,
        "direction": "left",
        "address": "제주특별자치도 제주시 조천읍 함덕리 3113-5",
        "description": "함덕리 3113-5로 조회되며 함덕마을정주항주차장과 약 31 m 거리입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "함덕마을정주항주차장",
        "sourceUrl": "https://place.map.kakao.com/20588613",
        "sourceDistanceM": 31,
        "offset": [
          -16,
          8
        ]
      },
      "5": {
        "name": "사라봉공원 입구 인근",
        "lat": 33.5163516,
        "lng": 126.5475816,
        "direction": "bottom",
        "address": "제주특별자치도 제주시 건입동 387-9",
        "description": "건입동 387-9로 조회되며 사라봉공원 주차장1과 약 67 m, 성안올레 1코스 기준 지점과 약 52 m 거리입니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "사라봉공원 주차장1",
        "sourceUrl": "https://place.map.kakao.com/17556673",
        "sourceDistanceM": 67
      },
      "6": {
        "name": "사라봉 북측 · 제주항 방면",
        "lat": 33.520605,
        "lng": 126.5446866,
        "direction": "top",
        "address": "제주특별자치도 제주시 건입동 355-3",
        "description": "건입동 355-3의 사라봉 북측 지점입니다. 사라봉산책로 기준 지점과 약 137 m, 국제여객터미널 공영주차장과 약 233 m 거리로 주변 지형을 기준으로 표시합니다.",
        "method": "좌표·주변 지명 대조",
        "checkedAt": "2026-10-12",
        "sourceName": "사라봉산책로",
        "sourceUrl": "https://place.map.kakao.com/1236775664",
        "sourceDistanceM": 137
      }
    }
  };
  root.JejuCourseStopLabels = locations;
  if (typeof module === "object" && module.exports) module.exports = locations;
})(typeof window !== "undefined" ? window : globalThis);
