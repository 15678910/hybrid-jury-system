# 세션 인수인계 — 2026-07-13

> 다른 기기/세션에서 이 저장소를 열고 이 파일을 읽게 한 뒤 지시하면 이어서 작업할 수 있습니다.
> (이전 문서 `SESSION_HANDOFF_2026-07-11.md`를 대체)

## 🟢 지금 라이브 상태
- **블로그 칼럼**: https://시민법정.kr/blog/l5Sb12frQxrpGpv7wShG (id `l5Sb12frQxrpGpv7wShG`)
  - 제목: 「권력을 검찰청에서 공소청으로 옮기려는 더불어민주당?」
  - 서명 링크: `/reform-analysis?tab=prosecution-reform` (상대경로) — 정상
  - ⚠️ `/blog/admin` 리치에디터로 저장 시 본문 `<a>` 링크가 삭제됨 → AI에게 `updateDoc` 수정 맡기거나 `functions/link_signature_reform.cjs` 실행으로 복원
- **검찰개혁 심층분석**(`/reform-analysis?tab=prosecution-reform`):
  - 두 법안 카드 **PPT형** 디자인 (정책색 바·배지·목적박스·★/번호 배지·pill 출처)
  - 하단 **「관련 최신 뉴스」 섹션** — 네이버에서 매일 자동 수집(아래)
  - **형소법 개정안 3건 비교 체계** — 카드 3개 + 조문별 비교(4열) + 신·구조문 대비표(3 카테고리) + 찬반 논쟁점 + 헌법 부합성 평가:
    ① 김용민·박은정(2219564, 12인) ② 더불어민주당 TF 김한규(2219875, 22인) ③ **홍기원(2219937, 11인·여당 부분 존치안)**
    ※ 홍기원안 = 검사 수사개시권 폐지하되 사회적 약자·민생범죄 등 예외에서 **직접 보완수사권 존치**. 사이트 평가는 「분리 원칙 최대 후퇴」(단 민간 50~200명 사건심의위·고발인 이의신청권은 흡수 가치).
    ※ 원문 PDF는 Google Drive `…\입법\형사소송법\`, 추출은 PyMuPDF(fitz) 사용(Read 도구는 PDF 텍스트 안 나옴).
  - **SNS 공유 OG**: 이미지=`public/검찰개혁심층분석.png`(909×339 가로형 찬반 이미지), 제목=3법안 비교 문구. ⚠️ 변경 시 **2곳 동시 수정** — 프론트 `SEOHead`(ReformAnalysis.jsx) + SSR `reformAnalysisPage`(functions/index.js) + 캐시버스터 `?v=` 갱신. 크롤러 검증: `curl -A "KakaoTalk-Scrap" "<url>" | grep -i og:`. (로컬 dev 프리뷰는 helmet 미적용이라 OG 확인 불가 → 배포 후 크롤러 UA로만 검증)

## 🆕 개혁안 뉴스 네이버 무료 자동화 (이번 세션 신규)
- **출처**: 네이버 공식 검색 API (`functions/.env`의 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`, 무료 하루 25k)
- **자동 실행**: GitHub Actions `.github/workflows/reform-news-cron.yml` — 매일 **08:00 KST**(`cron: '0 23 * * *'`)
- **트리거 함수**: `collectReformNewsCron`(HTTPS, `functions/index.js`). 토큰 `CRON_TOKEN`(`functions/.env` **및** GitHub 저장소 Secret)로 `x-cron-key` 헤더 인증
- **Firebase 스케줄러 안 씀 → 상시 과금 0.** (구 스케줄 함수는 `_DISABLED_collectReformNews`로 비활성 유지 — 되살리면 과금 부활, 2026-07-05 비용차단 결정 존중)
- **수집 로직**(`collectReformAreaNews`): 네이버 우선 + Bing 폴백 + 최신순(pubDate) 정렬, 영역별 상위 5건
- **보안**(검토·재검증 완료): POST 전용 · 헤더 전용 토큰(쿼리 금지) · `timingSafeStrEqual` 상수시간 비교 · `checkRateLimit` · `settings/reformNewsCron` 30분 실행 락(트랜잭션, **fail-closed**) · 프론트 링크 `http(s)` 검증 · Gemini 프롬프트 인젝션 완화
- **수동 즉시 갱신**: GitHub → Actions → "개혁안 뉴스 자동수집 (무료 크론)" → Run workflow (30분 락 있음)
- **탭↔뉴스영역 매핑**(`ReformAnalysis.jsx`): `prosecution-reform`·`finland-reform` → `prosecution`, `judicial-appeal` → `trial-appeal`, 나머지는 동일 id
- **변경 지점**: 수집 시각 = 워크플로 `cron` / 키워드 = `functions/index.js`의 `REFORM_AREA_KEYWORDS`
- **firestore.rules**: `reformNews` = `read: if true`(공개) / `write: if false`(Admin SDK만)

## ✅ 이번 세션(2026-07-12~13) 완료
| 커밋 | 내용 |
|------|------|
| `b8a4df8` | 두 법안 카드 PPT형 재디자인 |
| `3814674` | reformNews 공개 읽기 규칙 추가(권한 에러 해결) |
| `d95e125` | 「관련 최신 뉴스」 표시 섹션 복원(과거 삭제분, 승인 후) |
| `9ca20d0` | 네이버 무료 자동화(외부 크론 + 토큰 트리거 + 보안) — 실행 테스트 Success |
| `21b44d3` | 재판일정에 윤석열 1심 선고 2건 추가(정치자금법 7/13 형사33부 이진관·공직선거법 7/27 형사21부 조순표) |
| `79629e1` | 검찰개혁 심층분석 SNS 공유 이미지를 사용자 찬반 이미지(`public/검찰개혁심층분석.png`)로 교체 |
| `825f3fa` | 국가 비교 나라명 1행 표시(whitespace-nowrap) + 국기(Windows에서 KR/DE/JP/FI 코드로 보임) 제거 |
| `875ea1e` | 공유 설명(og:description)에 더불어민주당 검찰개혁 TF안(김한규 외 22인) 추가 |
| `99aa901` | 양형분석: 명태균 인물 신설(사진+무상여론조사 7/13 징역1.6년 법정구속·창원 별건), 심우정 내란 구속영장 청구(7/14 권창영특검), 본문 폰트 text-sm→text-base. 재판일정 윤석열 정치자금법 7/13 선고결과 반영 |
| `f3c747f` | 양형분석 「군 자체 징계 현황」 섹션 폰트 확대(text-xs→text-base/sm) |
| `a927d3a` | 「보완수사권 폐지 시 경찰 견제 방법」 표 추가(11행) — 외부 이미지 아이디어를 우리 안(독립기구) 관점으로 재구성 |
| `3598409` | **홍기원안(2219937) 3번째 법안 추가** + 3개 법안 발의자 전체 명단(12·22·11인, 원문 PDF 추출) |
| `7ee985f` | 홍기원안을 조문별 비교(4열)·신구조문 대비표(3번째 카테고리)·찬반 논쟁점에 반영 |
| `ad4bbaa` | 홍기원안 헌법 부합성 심층 분석 — 헌법 제1조·제10조(인간의 존엄)·독일 기본법 제1조③ 3대 기준 심사 + 위배 6·반론 4 |
| `9dbb4fe` | 카톡 공유 카드 갱신 — og 제목을 3법안 비교로, OG 이미지 909×339 가로형 교체(v=20260716) |
| `3d39887` | 심우정 내란 구속영장 기각(2026.7.16, 부동식 판사 "증거인멸·도망 염려 소명 부족") 반영 — 배지 '불구속(내란 영장 기각)' |
| `56da3c8` | 판사평가(judges.js)에 영장전담판사 부동식·이종록 부장판사 추가 (부동식=심우정 기각·김태효 발부 / 이종록=종합특검 영장 잇단 기각). 이종록 사진 포함, 부동식 사진은 미추가(이니셜 폴백) |
- 그 외: 화면의 영어 토스트는 미리보기 도구 안내(사이트 오류 아님)로 규명
- ⏳ **미완료(사진)**: `public/부동식.png` 미추가 → 판사평가 영장전담판사 부동식 카드가 이니셜("부") 폴백. 사진 저장 후 재빌드·배포하면 됨. (판사 사진은 수동 규칙)

## ⏳⏳ 다음 세션 최우선 — 미배포/대기 (2026-07-23 기준)
> 아래는 **커밋·푸시는 됐으나 라이브에 미배포**된 상태다. 배포하려면: `npm run build && firebase deploy --only hosting` (사용자 승인 후).
- **검찰개혁 페이지에 추가됨(미배포)**: ① 민변 설문 상세(전건송치·폐지 대책·민변 사법센터 「폐지+요구권」 개정안) ② TF안 3대 이행강제(수사관서 지정권·사건 이송권 제197조의2⑦·직무배제/교체/징계) vs 김용민·박은정 안 원문 대조표. (장윤기 반론 섹션 + 협업모델 뒤)
- **재판일정(미배포·미푸시였던 커밋 `7451caa`)**: 종합특검 내란 영장 무더기 기각 3건(강호필·심우정·전무곤) — 이번 정리에서 푸시함, 배포는 대기.
- **블로그 칼럼 초안**: `docs/blog-drafts/정의는-누구의-것인가.md` — 「검찰개혁과 법조 시장의 정치경제」 전문. 사용자가 편집 후 **블로그에 게시 예정**(페이지 섹션에서는 제거함, 블로그 전용). 게시 시 제목·응원봉 카드 이미지·서명 링크 추가.
- **박찬운 교수 반박문**: 개인 글이라 게시 중단(파일·사이트 미반영, 대화에만 존재). 검증 결과 = 정책 논증은 유효하나 「검찰 권력 옹호자」 프레임은 부정확(그는 인권법 학자·원칙적 이견자, 수사개시권 폐지엔 동의). 인신·동기 공격은 명예훼손 위험이라 지양 — 논점·구조 분석으로 대체.

## 📋 재판일정(trialSchedule.js) 갱신 방식 — 결정: **수동(무료)**
- **자동화 워크플로는 존재하지만 의도적으로 OFF**: `.github/workflows/auto-trial-update.yml` + `scripts/auto-trial-update.mjs` (Claude Opus 4.8 + 웹검색으로 매일 초안 PR 생성, 사람 검토·머지 방식).
- **잠든 상태**: GitHub 시크릿 `ANTHROPIC_API_KEY` **미등록** → 매일 즉시 종료(과금 0, PR 안 열림). 켜려면 그 시크릿 등록 필요(단 **Claude API 유료** — 뉴스 네이버 자동화와 달리 호출당 과금).
- **결정(2026-07-13)**: 법률 사실(날짜·형량·재판부) 정확성 위험 + 비용 때문에 **수동 유지**. 회원이 기사/이미지 주면 → WebSearch 2개+ 교차확인 → 검증된 사실만 반영 → 빌드·프리뷰 → 승인 후 배포. (auto-trial-update는 켜지 않음)

## ⏳ 대기 / 다음에 할 수 있는 작업
- **차규근안(2219614)** 을 검찰개혁 심층분석 3번째 종합안으로 추가 (조문별 비교표/모달/신구조문)
- 재심청구권자 확대 3안(서영교·권향엽·정춘생) 비교 코너
- 블로그 「검찰개혁 심층분석 보기」 링크를 본문과 별개로 **템플릿 레벨 고정**(admin 저장 시 링크 삭제 방지)
- 블로그 author `시민법정` → `주권자사법개혁추진준비위원회`
- **Gemini AI 요약 점검**: 현재 `aiSummary`가 실패해 플레이스홀더("…뉴스 N건")로 저장됨 → 프론트에서 숨김 처리 중. 실제 요약을 살리려면 `GOOGLE_API_KEY`/모델(`gemini-2.0-flash`) 점검 필요
- `functions/.env`에 `GOOGLE_API_KEY` 중복 라인 존재(기존) — 정리 검토
- sentencingData Firestore 오염 감사(김태효↔양문석 유형)

## 🔧 핵심 명령
| 항목 | 방법 |
|------|------|
| 프론트 배포 | `npm run build && firebase deploy --only hosting` (사용자 승인 후) |
| 함수 배포 | `firebase deploy --only functions` |
| 규칙 배포 | `firebase deploy --only firestore:rules` |
| 뉴스 수동 갱신 | GitHub Actions → Run workflow (또는 `curl -X POST -d '' -H "x-cron-key: <값>" https://us-central1-siminbupjung-blog.cloudfunctions.net/collectReformNewsCron`) |
| push 지연 대응 | `git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 push origin main`, 실패 시 `git pull --rebase origin main` 후 재시도 |
| Firestore 백업(삭제 전 필수) | `cd functions && node backup_firestore.js` |
| CRON_TOKEN 값 확인(PowerShell) | `(Get-Content "functions\.env" | Where-Object { $_ -match '^CRON_TOKEN=' }) -replace '^CRON_TOKEN=',''` |
| 블로그 서명 링크 복원 | `functions/link_signature_reform.cjs` |

## 🔑 시크릿 관리
- 전부 `functions/.env`(gitignore: 루트 `.gitignore`의 `**/.env`, `functions/.env`)에만 저장. 커밋 금지.
- `CRON_TOKEN`은 `functions/.env` + GitHub 저장소 Secret 두 곳에 동일 값(자동화 작동 조건).
- 네이버 curl로 한국어 파라미터 전송 금지(인코딩 깨짐) — 자동화는 함수 내부에서만 호출하므로 무관.

---
*갱신: 2026-07-13 · 데스크톱 세션. 이전: `SESSION_HANDOFF_2026-07-11.md`(대체됨)*
