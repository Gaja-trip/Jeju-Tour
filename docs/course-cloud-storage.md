# 코스 사진의 Supabase 저장

운영 화면: https://jeju-gaja.vercel.app/course.html?panel=course

코스 사진과 사고 기록은 Supabase 프로젝트 `rcsbfdnzxlihxngytwfa`의
`public.jeju_course_posts`에 저장하고, 원본 사진은 `jeju-course-photos` Storage
버킷에 보관한다. 운영 사이트와 localhost의 코스 화면 모두 같은 클라우드
저장소를 사용한다. PC와 로컬 Node 서버를 꺼도 Vercel 사이트에서 조회된다.
사진 등록은 기존 **함께가기 → 개인 초대 참가자 인증**을 재사용한다.
`jeju-supabase.js`가 위치 공유와 사진 등록에 동일한 인증 클라이언트를 제공한다.
사진을 올리는 것만으로 GPS 위치 공유를 시작하지 않는다.

코스 탭에서 일차와 지도 위치를 선택하고 사진을 저장한다. GPX 정지 지점
카드의 **이 장소에 사진 등록**을 사용하면 일차, 위치, 제목이 자동 지정된다.
정지 지점을 누르면 같은 일차의 반경 50m 내 사진이 표시되고, 썸네일을 누르면
원본 사진을 크게 볼 수 있다. 일반 사진/사고 기록에도 지도 마커가 표시된다.
새로고침과 다른 브라우저에서도 동일한 저장 기록을 조회한다.

## 공개 범위와 권한

- 저장을 완료한 사진과 장소 기록은 여행 사이트에 공개된다. 등록 폼에 안내한다.
- Data API에는 표시용 열만 SELECT 권한을 부여했다. 작성자 계정 ID, 요청 해시,
  업로드 상태와 예약 식별자는 공개 조회할 수 없다.
- RLS는 `ready` 기록만 공개한다. 미완료 업로드는 지도에 나타나지 않는다.
- 클라이언트의 DB/Storage 쓰기 권한은 없다. `course-journal` Edge Function이
  JWT, Supabase Auth 사용자, 유효한 여행 초대와 활성 참가자 여부를 검사한다.
- 서버 전용 키는 Edge Function 환경에서만 사용한다. 공개 파일에는 기존
  publishable 키만 들어 있고, service-role 키/비공개 초대/로컬 DB는 배포하지 않는다.
- 사진은 실제 JPG/PNG/WebP, 최대 3장, 장당 8MB. multipart 총량은 26MB로 제한한다.
  같은 요청의 재전송은 중복 저장하지 않고, 제목/파일이 바뀐 재전송은 거절한다.
- 일부 사진 업로드가 실패하면 같은 요청으로 다시 저장할 수 있다. 사진 파일과
  메타데이터를 모두 저장한 뒤 기록을 공개한다. 장기 정지는 만료된 5분 예약 후 재시도한다.
- 참가자당 10분에 20개, 하루 200개 등록 제한이 있다. 원본 파일에는 자동 삭제나
  만료 URL을 사용하지 않는다. Supabase 프로젝트와 Storage가 유지되는 동안 보관한다.

## 배포와 검증

2026-10-12 배포: `dpl_9GnF2DsTEQnrMw1cUdnzaZafCZ1d`, 기존 Vercel 프로젝트
`jeju-tour` / `rokafap2-3990s-projects`. 58개 공개 파일과 Build Output API 설정만
배포했다. 로컬 서버 데이터, 개인 초대 QR, SQL, 테스트 파일은 제외했다.

마이그레이션은 원격 적용 이력과 같은 이름/버전으로 보관했다.
`20261012094441_course_photo_storage.sql`과
`20261012094932_course_photo_participant_permissions.sql`을 다시 적용하지 않는다.
서버 전용 참가자 조회 권한 누락을 실제 업로드 검사에서 찾아 두 번째 마이그레이션으로 수정했다.

기존 로컬 코스 서버의 `/api/route-posts`에는 등록된 기록이 0개여서 옮길 사진은 없었다.
Node의 기존 `/api/route-posts`와 `/api/route-photos`는 로컬 백업/관리 호환용으로 유지한다.
사진 인증 이벤트 메뉴의 로컬 API는 별도 기능이며, 이 배포의 클라우드 전환 대상은 코스 메뉴이다.

검증은 실제 참가자 초대나 GPS 기록을 사용하지 않는 별도 임시 여행에서 실행했다.
실제 Storage 업로드, 원본 바이트 재조회, 중복 요청, 공개 조회를 확인했다.
브라우저 검증에서는 동일한 운영 파일을 사용하되 임시 테스트 여행 ID만 치환했다.
테스트 세션과 초대 토큰은 `.private/`에만 보관하며 배포하지 않는다.
운영 브라우저의 실제 업로드, 지도 장소·사진 카드, 원본 확대, 새로고침, 새 게스트 브라우저 조회,
미인증 업로드 거부, 모바일 카드 표시가 통과했다. 로컬 서버를 끄고 검사했으며 localhost 의존 요청은 없었다.
검증 후 테스트 기록·원본 파일·초대·계정·여행과 로컬 테스트 세션 파일을 삭제했다.

Supabase 보안 점검에서 코스 사진에 새 권한 문제가 발견되지 않았다.
기존 비공개 초대 테이블의 정책 없음은 의도적인 접근 차단이다. 기존 프로젝트의
`rls_auto_enable()` 권한 경고 등은 사진 기능과 별개이며 변경하지 않았다.
[Supabase 보안 점검 안내](https://supabase.com/docs/guides/database/database-advisors)

## 다시 검증하기

- `npm test`: 기존 서버/GPX/장소 표시와 클라우드 입력 검증.
- `npm run prepare:site`: 공개 파일만 포함한 `.vercel/output` 패키지 생성.
- `tests/course-cloud-live-check.mjs`: 명시적으로 실행하는 실제 클라우드 검사.
  `--prepare` / SQL 등록 / `--claim` / `--upload` 순서이며 테스트 비공개 파일이
  남아 있으면 새 fixture를 만들지 않는다. 실제 참여자의 초대를 소비하지 않는다.

운영 도메인의 카카오 JavaScript SDK 응답 200 및 사고 1 지점에서 2m 떨어진 로드뷰 연결도 확인했다.
새 도메인으로 변경하면 Kakao JavaScript SDK의 해당 도메인 등록이 필요하다.
사진 저장과 조회에는 카카오 키나 로컬 PC가 필요하지 않다.
