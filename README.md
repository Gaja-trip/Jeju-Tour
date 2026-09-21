# Jeju-Tour

전주 출발 제주도 3박 4일 자전거 여행 공유 페이지입니다.

## 페이지

- `index.html`: 홈
- `course.html`: 코스와 네이버지도 맵
- `schedule.html`: 일자별 일정표
- `live.html`: 네이버지도, 배편, 기차편, 버스편 실시간 확인 링크
- `transport.html`: 출발, 배편, 복귀 운영안
- `meeting.html`: 2026-09-21 제주 3박 4일 라이딩 운영계획 회의자료 열람 및 PDF 다운로드
- `event.html`: 2026-09-07~2026-10-31 제주라이딩 30분 체력훈련 챌린지 페이지

## 회의자료

알림 → 회의에서 첨부 회의자료 전체를 미리볼 수 있습니다. `meeting.html`에서는 전체 화면 열람, 이미지 확대, PDF 원본 보기와 다운로드를 제공합니다. 로그인이나 인증 서버 API 없이 정적 사이트에서도 열립니다.

- 회의 메뉴: `course.html?panel=meeting` (기존 `?panel=event` 링크도 회의 메뉴로 연결)
- PDF 원본: `assets/meetings/jeju-riding-operation-plan.pdf`
- 1페이지 미리보기: `assets/meetings/jeju-riding-operation-plan-page-1.png`

사이트를 배포할 때 `meeting.html`과 `assets/meetings`를 함께 포함하세요. 다른 사람에게는 배포된 사이트의 `/meeting.html` 주소를 공유하면 됩니다. `localhost` 주소는 해당 컴퓨터에서만 열립니다.

## 사진 인증 서버

기존 인증 페이지(`event.html`)에서는 사진 첨부, 이름별 서버 저장, 인증 참가자 집계, 참가자를 클릭한 인증 내역과 사진 조회를 계속 지원합니다. 알림 메뉴의 이벤트 항목은 회의로 변경되었습니다.

Node.js 24.14 이상 24.x를 설치한 뒤 `server/start-server.cmd`를 실행하거나 프로젝트 폴더에서 `npm start`를 실행하세요. 회의는 `http://localhost:3000/course.html?panel=meeting`, 기존 인증 페이지는 `http://localhost:3000/event.html`로 접속합니다.

- 사진: 선택 첨부, 최대 3장, JPG/PNG/WebP 장당 8MB
- 저장: `server/data/participants/이름--고유ID/날짜/인증ID/`와 SQLite DB
- 집계: 30분 이상, 같은 참가자·날짜당 1점
- 관리: 관리자 키로 개별 삭제, 이름별 JSON/CSV 내보내기, DB·사진 전체 백업
- 검증: `npm test`

서버 폴더와 데이터를 포함한 프로젝트 전체를 다른 컴퓨터로 복사하여 실행할 수 있습니다. **[서버 실행·관리·백업·이전 안내](server/README.md)**를 참고하세요. 기본 설정은 현재 PC에서만 접속되며, 다른 기기의 접속 설정도 안내에 포함되어 있습니다.
