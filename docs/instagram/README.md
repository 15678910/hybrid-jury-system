# 인스타그램 릴스 자동 게시

사이트에 배포된 영상을 GitHub Actions 버튼 하나로 인스타그램(@siminbupjung) 릴스에 올린다.
파일을 PC 에 받아 수동으로 올리는 번거로움을 없애려고 만들었다(2026-09-30 사용자 요청).

- 방식: **Instagram API with Instagram Login** — 페이스북 페이지 연결이 필요 없다. 프로페셔널(크리에이터·비즈니스) 계정이면 된다.
- 코드: `scripts/ig_publish.mjs` · 버튼: `.github/workflows/instagram-publish.yml` 「인스타그램 게시 (수동)」
- 설명 문구: `docs/instagram/captions/*.txt` (2,200자 이내)

## 1. 한 번만 하는 준비 (사용자)

> Meta 화면의 메뉴 이름은 자주 바뀐다. 아래와 다르면 비슷한 이름을 찾거나 캡처를 보여 주고 함께 확인한다.

1. **프로페셔널 계정 전환** — 인스타그램 앱 → 프로필 → ☰ → 설정 → 「계정 유형 및 도구」 → 「프로페셔널 계정으로 전환」 → 크리에이터 또는 비즈니스(무료, 게시물·팔로워 그대로). 이미 프로페셔널이면 건너뛴다.
2. **Meta 개발자 등록** — developers.facebook.com 에 페이스북 계정으로 로그인 → 개발자 등록.
3. **앱 만들기** — 「앱 만들기」 → 용도(유스케이스)에서 **인스타그램 API**(「Instagram에서 메시지 및 콘텐츠 관리」 류) 선택 → 앱 이름(예: 시민법정 게시) → 만들기.
4. **인스타그램 로그인 방식 설정** — 앱 대시보드의 인스타그램 → 「API setup with Instagram login(인스타그램 로그인을 통한 API 설정)」.
5. **계정 연결·토큰 발급** — 같은 화면의 「Generate access tokens(액세스 토큰 생성)」에서 **siminbupjung 계정 추가** → 인스타그램 로그인·권한 허용(게시 권한 `instagram_business_content_publish` 포함) → 토큰이 표시되면 복사. 계정 ID(숫자)도 같은 줄에 보인다.
   - 필요하면 인스타그램 쪽에서 테스터 초대를 수락한다(인스타그램 설정 → 앱 및 웹사이트 → 테스터 초대).
   - 앱은 「개발 모드」 그대로 두어도 **자기 계정에는 게시할 수 있다**(심사 불필요로 알려져 있음 — 첫 게시에서 확인).
6. **GitHub 에 저장** — github.com/15678910/hybrid-jury-system → Settings → Secrets and variables → Actions → New repository secret
   - `IG_ACCESS_TOKEN` = 5번의 토큰
   - `IG_USER_ID` = 5번의 계정 ID(숫자)
   - **토큰은 채팅·코드·커밋에 붙여넣지 않는다.** Secrets 에만 넣는다.

## 2. 올릴 때마다

1. 영상이 사이트에 **배포돼 있는지** 확인한다(인스타 서버가 시민법정.kr 에서 직접 받아 간다).
2. 설명 파일을 `docs/instagram/captions/<이름>.txt` 로 만들어 push 한다(AI 에게 부탁하면 된다).
3. GitHub → Actions → **인스타그램 게시 (수동)** → Run workflow
   - video: `cardnews/<slug>/<파일>.mp4`
   - caption_file: `docs/instagram/captions/<이름>.txt`
   - confirm: `게시`
4. 1~3분 뒤 실행 요약에 게시물 링크가 뜬다.

## 3. 알아 둘 것

- **영상 형식**: 세로 9:16, H.264 + AAC. 우리 생성기 출력(1080×1920)이 그대로 맞다. 가로 12분 해설편은 `scripts/excerpt_vertical.py` 로 발췌 세로판을 만들어 올린다(릴스 길이 제한).
- **토큰 만료**: 장기 토큰은 60일. 만료 전에 5번에서 다시 발급해 Secrets 를 바꾼다. 만료되면 실행이 `code 190` 오류로 멈춘다.
- **하루 게시 수 제한**이 있다(API 게시 기준). 여러 편을 한 번에 몰아 올리지 않는다.
- 실패 메시지는 Actions 실행 기록에 한국어로 남는다(영상 주소 안 열림 / 토큰 없음 / 처리 실패 등).
- 첫 실행은 아직 검증되지 않았다 — 원격 세션은 인스타그램 서버에 접속할 수 없어 시험하지 못했다. 첫 게시 결과를 보고 이 문서를 고친다.
