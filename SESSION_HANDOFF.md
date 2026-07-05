# 시민법정(hybrid-jury-system) 세션 인계

> 이 프로젝트 = **"시민법정4"**. 배포: **Firebase** `siminbupjung-blog` · 도메인 시민법정.kr(punycode `xn--lg3b0kt4n41f.kr`).
> 세션 시작 시 `CLAUDE.md`(프로젝트 지침·백업 규칙)와 이 파일을 먼저 읽으세요.
> ⚠️ 이 프로젝트는 **이 폴더에서 독립 세션**으로 작업하세요 (K-VOTE 등 다른 세션과 섞지 말 것).

---

## 2026-07-06 세션 요약 (임시로 K-VOTE 세션에서 겸해 작업함)

전부 **라이브 배포 + GitHub push 완료** (origin/main `f72d3d8`, 동기화·저장소 깨끗).

### A. 재판일정 추가 (`src/data/trialSchedule.js`)
- 윤석열 공수처 체포방해 **대법원 첫 선고**(7.9, 내란) — `c176702`
- 심우정 **대검 압수수색·내란 가담**(7.3, 내란, 종합특검) + 원희룡 **양평고속도로 직권남용 소환**(7.8, 정치사건) — `7387121`
- 이창수: 기존 6.15 소환 유지(검색상 새 사건 없음)
- 규칙: 출처(`source`) 필수, 추측 배제. 실제 보도 검색 확인 후 반영.

### B. SNS 자동화
- **텔레그램 자동게시**: `notifyNewPostToTelegram` — Firestore `posts` onCreate 트리거(asia-northeast3). 새 글 → 채널 자동 게시. 실제 전송 검증됨. `13172f9`
- **RSS 피드**: `/rss.xml`(`blogRss` 함수). `25209c6` → **dlvr.it에 이 주소 넣으면 X·페북 자동게시** (아래 미완 참고)

### C. OG 공유 이미지 (자동 생성 — 일정 바뀌면 자동 갱신)
- `/trial-schedule` 전용 SSR: `trialSchedulePage`. `og:image`=`twitter:image` 동일 → **모든 SNS 동일 이미지**. `bfab7d9`
- **자동 생성**: `scripts/gen-og-trial-schedule.mjs`(prebuild 훅). 재판일정 데이터로 1200×630 PNG 자동 렌더(`@resvg/resvg-js` + `scripts/fonts/Pretendard`). 다가오는 재판 5건 표시. `5c1c144`
- 빌드 산출물 `public/og-trial-schedule.png`·`.firebase/` 캐시는 **gitignore**(빌드 시 재생성). `af44ef2`

### D. Firebase 과금 차단
- 스케줄 자동실행 함수 **7개 삭제 + 소스 un-export**(`_DISABLED_*`, 재배포 방지). 월 ~1889원 상시 과금 중단. 사이트 서빙·수동 트리거 함수는 유지. `345eaad`
- ⚠️ 부작용: 자동 뉴스 크롤('사법뉴스' 봇)도 함께 꺼짐 — 되살리려면 비용 감수 별도 논의.

---

## 자주 하는 작업 — 재판일정 추가/수정

```bash
# 1) src/data/trialSchedule.js 편집 (date/category/group/title/defendant/court/note/source)
#    - group: insurrection(12·3내란) / fabrication(검찰조작의혹·정치) / political(정치사건)
#    - source: { name, url } 필수 (url은 null 허용). 추측 배제, 실제 보도 확인.
cd C:\Users\lacoi\Desktop\hybrid-jury-system
node --check src/data/trialSchedule.js          # 문법 확인
npm run build                                   # OG 이미지 자동 재생성 + vite build
firebase deploy --only hosting --project siminbupjung-blog
#   (SSR/함수도 바꿨으면: firebase deploy --only functions:<name> --project siminbupjung-blog)
git add src/data/trialSchedule.js && git commit -m "data(trial): ..." && git push
```
- **X에서 새 카드 이미지 보려면** URL에 `?v=N`(숫자만 바꿈) 한 번 붙여 공유 — X 캐시 회피.
- `git push`는 **자동배포 안 함** (배포는 수동 `firebase deploy`). CI(ci.yml)는 빌드/검사만.
- Firestore 삭제/대량수정 전 **백업 필수**(CLAUDE.md).

---

## 후속 (미완 — 사용자 작업 필요)

- [ ] **dlvr.it에 @siminbupjung X 계정 연결** + RSS(`시민법정.kr/rss.xml`) 등록 → X·페북 자동게시 완성. (X "Authorize" 클릭은 계정 주인만 가능 — 브라우저를 @siminbupjung으로 먼저 로그인/전환)
- [ ] **GCP 콘솔 예산 알림** 설정 (요금 재발 대비)
- [ ] 이창수 새 사건(기소·구속 등) 생기면 기사 링크로 추가
- [ ] 중복 폴더 정리: `hybrid-jury-system-backup-20260228` — `Desktop/_ops` 세션에서 처리
