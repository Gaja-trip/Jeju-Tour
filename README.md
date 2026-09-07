# Jeju-Tour

전주 출발 제주도 3박 4일 자전거 여행 공유 페이지입니다.

## 페이지

- `index.html`: 홈
- `course.html`: 코스와 네이버지도 맵
- `schedule.html`: 일자별 일정표
- `live.html`: 네이버지도, 배편, 기차편, 버스편 실시간 확인 링크
- `transport.html`: 출발, 배편, 복귀 운영안
- `event.html`: 2026-09-07~2026-10-31 제주라이딩 30분 체력훈련 챌린지 페이지

## 사진 인증 서버

알림 → 이벤트에서 사진 첨부, 이름별 서버 저장, 인증 참가자 집계, 참가자를 클릭한 인증 내역과 사진 조회를 지원합니다.

Node.js 24.14 이상 24.x를 설치한 뒤 `server/start-server.cmd`를 실행하거나 프로젝트 폴더에서 `npm start`를 실행하세요. 브라우저에서 `http://localhost:3000/course.html?panel=event`로 접속합니다.

- 사진: 선택 첨부, 최대 3장, JPG/PNG/WebP 장당 8MB
- 저장: `server/data/participants/이름--고유ID/날짜/인증ID/`와 SQLite DB
- 집계: 30분 이상, 같은 참가자·날짜당 1점
- 관리: 관리자 키로 개별 삭제, 이름별 JSON/CSV 내보내기, DB·사진 전체 백업
- 검증: `npm test`

서버 폴더와 데이터를 포함한 프로젝트 전체를 다른 컴퓨터로 복사하여 실행할 수 있습니다. **[서버 실행·관리·백업·이전 안내](server/README.md)**를 참고하세요. 기본 설정은 현재 PC에서만 접속되며, 다른 기기의 접속 설정도 안내에 포함되어 있습니다.
