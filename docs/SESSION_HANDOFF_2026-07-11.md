# 세션 인수인계 — 2026-07-11 (외출·태블릿에서 이어가기)

> 다른 기기(태블릿·claude.ai·Claude Code)에서 이 저장소를 열고 이 파일을 읽게 한 뒤,
> "대기 항목 중 ○○를 진행해줘" 라고 지시하면 이어서 작업할 수 있습니다.

## 🔴 지금 라이브 상태 (블로그 칼럼)
- **글 URL**: https://siminbupjung-blog.web.app/blog/l5Sb12frQxrpGpv7wShG (한글도메인: https://시민법정.kr/blog/l5Sb12frQxrpGpv7wShG)
- **글 ID**: `l5Sb12frQxrpGpv7wShG` (Firestore `posts` 컬렉션)
- **현재 제목**: 「권력을 검찰청에서 공소청으로 옮기려는 더불어민주당?」 (회원이 admin에서 변경)
- **카드 이미지**: 응원봉 배경 + 「검찰 개혁에 / 헌법 제1조가 안보인다」 → Storage `blog-images/mdp-reform-column-20260711-v4.png`
- **서명 링크**: `/reform-analysis?tab=prosecution-reform` (상대경로) — 정상 연결됨

### ⚠️ 반복 이슈 — /blog/admin 편집 시 서명 `<a>` 링크가 삭제됨
`/blog/admin` 리치 에디터로 저장할 때마다 본문 `<a>`가 제거됨(이미 3회 발생). 대응:
- 블로그 문구 수정은 **AI에게 맡기면** `updateDoc`으로 링크 유지한 채 반영됨.
- admin에서 직접 편집한 뒤엔 **"서명 링크 걸어줘"** → `functions/link_signature_reform.cjs` 실행으로 즉시 복원.
- (영구 해결안 대기) 블로그 하단에 「검찰개혁 심층분석 보기」 버튼을 본문과 별개로 고정하는 코드 작업 — 회원 승인 시 진행.

## ✅ 오늘 완료한 주요 작업
### 블로그 칼럼 (Firestore, git 아님)
- 게시 + 여러 차례 회원 수정본 반영. 최종: 「협업·상호견제 모델」 섹션 포함, 띄어쓰기 붙임 통일, 굵은 글씨 0, 서명 링크(상대경로).

### 검찰개혁 심층분석 페이지 (`src/pages/ReformAnalysis.jsx`, prosecution-reform 탭) — 전부 배포됨
- 2중·3중 안전장치에 각 층 소속(독립기구/행정부/입법부) 표시
- 수사기구 역할 중복 해소(중수청·공수처·국수본) 비중복·견제 4원칙 (finland-reform 탭)
- 조문별 비교표: 셀별 조항 배지 + 클릭 시 관련 법 조항 모달 + 쟁점 호버 툴팁
- 신·구조문 대비표(법안별 카테고리)
- 법안 명칭 통일: 「김용민·박은정 의원안」 / 「더불어민주당 검찰개혁 TF안」
- 논쟁점(찬반)에 핀란드 대안 칸
- **사건 이송권(TF안, 제197조의2 ⑦)**·**고발인 이의신청권 부활(제245조의7, 양안 공통)** 조문별 비교표 행 추가
- **「주권자 협업·상호견제 모델」 섹션 신설** (수직 이행강제 → 수평 협업 + 입법부 산하 독립기구 문제제기, 3회로: 수사부실→공소청 / 불기소→수사기관 / 인권침해→시민 직접)
- 장윤기 「보완수사권 존치론」 반론에 **민변 여론조사 데이터** 추가(403명·존치 67%·부분존치 45.9%=요구권 유지 관점)

### 내란 사건
- **김태효 전 국가안보실 1차장 구속(2026.7.10)** 4곳 반영(양형분석·내란종합분석·재판일정·모의재판)
- **윤석열 평양 무인기 침투 항소심 7/15** 일정 추가(trialSchedule)

## ⏳ 대기 / 다음에 할 수 있는 작업
- **8개 형사소송법 개정안 비교**(분석 완료, PDF는 Google Drive `…\입법\형사소송법\`):
  - **차규근안(2219614)을 검찰개혁 심층분석에 3번째 종합안으로 추가** (현재 2개→3개) ← 추천
  - 재심청구권자 확대 3안(서영교·권향엽·정춘생) 비교 코너
  - 4개 주제 분류: 검찰개혁 종합안 3(김용민박은정·김한규·차규근) / 재심 3 / 아동보호(백혜련) / 허위법령인용(이성윤)
- 블로그 「검찰개혁 심층분석 보기」 링크 영구 고정(코드 작업, 승인 대기)
- 카드 가운데 줄 「더불어민주당은 검찰개혁 의지가 있는가」를 새 제목에 맞춰 바꿀지
- sentencingData Firestore 오염 감사(김태효↔양문석 유형)
- 블로그 글쓴이 author='시민법정' → '주권자사법개혁추진준비위원회' 복원 여부

## 🔧 핵심 명령 / 컨텍스트
| 항목 | 방법 |
|------|------|
| 프론트 배포 | `npm run build && firebase deploy --only hosting` (사용자 승인 후) |
| push 지연 대응 | `git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 push origin main`, 실패 시 `git pull --rebase origin main` 후 재시도 (원격에 매일 자동백업 커밋 올라옴) |
| 블로그 본문+제목 수정 | `functions/update_blog_content_v2.cjs` (scratchpad `blog_post.html` 읽어 updateDoc) |
| 블로그 이미지 교체 | `functions/update_blog_image.cjs` (Storage 업로드 + imageUrl) |
| 서명 링크 복원 | `functions/link_signature_reform.cjs` (정규식 wrap, 삭제 없음) |
| 블로그 현재 상태 읽기 | `functions/read_blog_post_reform.cjs` / `check_blog_spaces.cjs` |
| Firestore 백업(삭제 전 필수) | `cd functions && node backup_firestore.js` |
| 카드 이미지 생성 | scratchpad `make_card.py` (Pillow + 맑은고딕, 응원봉 배경) |
| 프리뷰 검증 | 스크린샷 자주 타임아웃 → navigate + javascript_tool 텍스트 검증. eval에 ⓐ·🔺 등 특수문자 넣으면 파싱 실패하니 피할 것 |
| 법률/뉴스 반영 | 반드시 뉴스 원문 2개+ 교차확인 (추측 금지) |

- 최신 커밋(사이트): `b6efd37` (민변 여론조사) — 이후 사이트 변경 없음. 블로그는 Firestore라 git 무관.
- scratchpad 임시파일(추출 PDF·blog_post.html·make_card.py 등)은 기기별이라 태블릿에선 없음. 원본 PDF는 Google Drive에 있음.

## 📱 태블릿에서 이어가기
1. 저장소를 열고(또는 GitHub `docs/SESSION_HANDOFF_2026-07-11.md`에서 읽고),
2. 예: "차규근안을 검찰개혁 심층분석 3번째 종합안으로 추가해줘" / "블로그 링크 영구 고정해줘" 등으로 지시.
3. 또는 이 대화를 태블릿에서 그대로 이어 열기.

---
*갱신: 2026-07-11 · 데스크톱 세션 인수인계 (2차 갱신)*
