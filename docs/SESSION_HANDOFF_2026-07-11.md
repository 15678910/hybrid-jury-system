# 세션 인수인계 — 2026-07-11 (태블릿에서 이어가기)

> 이 문서는 데스크톱 세션에서 진행한 작업을 태블릿 등 다른 기기에서 이어가기 위한 요약입니다.
> 태블릿에서 Claude Code/claude.ai로 이 저장소를 열고 이 파일을 읽게 한 뒤, "대기 항목 중 ○○를 진행해줘"라고 지시하면 됩니다.

## ✅ 오늘 완료한 작업

### 1. 검찰개혁 심층분석 페이지 (`src/pages/ReformAnalysis.jsx`, `prosecution-reform`·`finland-reform` 탭)
- 2중·3중 안전장치에 **각 층 소속 기관**(1중 독립기구 / 2중 독립 감찰기구 / 3중 입법부(국회) 선출) 표시
- **수사기구 역할 중복 해소** 섹션 신설 — 중수청(행안부)·공수처·국수본 관할 중복 분석 + 비중복·상호견제 4원칙 (finland-reform 탭)
- 주요 논쟁점(찬반)에 **핀란드 대안** 칸 추가
- 법안 명칭 **전면 통일**: `김용민·박은정 의원안` / `더불어민주당 검찰개혁 TF안`(대표라벨은 `…TF(김한규 외 22인)안`)
- 조문별 비교표: 셀별 **조항 배지**(📌) + **클릭 시 관련 법 조항 모달**(현행+양안 발의조항) + 쟁점 **호버 툴팁**
- **신·구조문 대비표**(법안별 카테고리: 현행 vs 개정 요지)
- 카드 소개 문구 정리(대거·촘촘히 제거, 조사 정리)

### 2. 블로그 칼럼 게시 — "더불어민주당은 검찰개혁 의지가 없다" (칼럼/논평)
- **글 URL**: https://siminbupjung-blog.web.app/blog/l5Sb12frQxrpGpv7wShG (한글도메인: https://시민법정.kr/blog/l5Sb12frQxrpGpv7wShG)
- **글 ID**: `l5Sb12frQxrpGpv7wShG` (Firestore `posts` 컬렉션)
- **카드 이미지**: 응원봉 시민 배경, 노란 띠 제거 → Storage `blog-images/mdp-reform-column-20260711-v2.png`
- 서명 = reform-analysis 페이지 링크
- ⚠️ **주의**: `/blog/admin` 리치에디터로 저장하면 본문 `<a>` 링크가 제거됨 → 편집 후 "서명 링크 다시 걸어줘" 요청 필요
- 참고: `/blog/admin` 편집으로 글쓴이(author)가 `시민법정`으로 바뀜(원래 `주권자사법개혁추진준비위원회`)

### 3. 김태효 전 국가안보실 1차장 구속(2026.7.10) 반영
- 4곳: 양형분석·내란재판종합분석·재판일정(trialSchedule)·모의재판(simulationCases)
- 서울중앙지법 내란 전담 영장부(부동식) "증거인멸 염려", 2차 종합특검(권창영) 7.7 청구

### 4. 윤석열 「평양 무인기 침투」 항소심 7/15 일정 추가 (trialSchedule) — 이번 세션 마지막

## ⏳ 대기 / 다음에 할 수 있는 작업

### A. 8개 형사소송법 개정안 비교 (분석 완료, 사이트 미반영)
사용자가 8개 PDF를 제공(Google Drive: `G:\내 드라이브\Obsidan\obsidian\Myplan\정책연합당\정책\입법\형사소송법\`). 4개 주제로 갈림:
- **검찰개혁 종합안 3개**: 김용민·박은정(2219564, 포괄형) / 김한규TF(2219875, 이행강제형) / **차규근(2219614, 원칙·인권형 — 제1조 신설·별건수사 금지·피해자보호)**
- **재심청구권자 확대 3개**(2026.6.24 헌재 헌법불합치 대응): 서영교(2219858, 4촌 이내 친족) / 권향엽(2219860, 4촌 이내 방계혈족) / 정춘생(2219656, 민법 777조 친족 — 최광의)
- **체포 시 아동보호**: 백혜련(2219733, 제214조의5 신설)
- **허위 법령 인용 제재**: 이성윤(2219731, 제299조의2 과태료 500만원)
- **추천 다음 작업**: 차규근안을 검찰개혁 심층분석에 **3번째 종합안**으로 추가(현재 2개→3개). 조문별 비교·모달·신구조문 카테고리도 3개로 확장.
- (참고) 추출 텍스트는 데스크톱 scratchpad(`b2219*.txt`)에 있으나 기기별 임시폴더라 태블릿에선 재추출 필요. PDF는 Google Drive에 있음.

### B. 기타 대기
- `sentencingData` Firestore 오염 감사 (김태효↔양문석 유형, 약 29개 문서) — 정적 데이터와 불일치 여부 점검
- 블로그 글쓴이 `시민법정` → `주권자사법개혁추진준비위원회` 복원 여부
- 일회성 스크립트 정리: `functions/create_blog_post_reform.cjs`, `update_blog_post_reform.cjs`, `read_blog_post_reform.cjs`, `link_signature_reform.cjs`

## 🔧 핵심 컨텍스트 / 명령

| 항목 | 방법 |
|------|------|
| 프론트 배포 | `npm run build && firebase deploy --only hosting` (사용자 승인 후) |
| push 지연 대응 | `git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 push origin main`, 실패 시 `git pull --rebase origin main` 후 재시도 |
| 블로그 게시/수정 | `functions/*_reform.cjs` (firebase-admin, **updateDoc만 — 삭제·재작성 금지**, 글 ID 유지) |
| Firestore 백업(삭제 전 필수) | `cd functions && node backup_firestore.js` |
| PDF 텍스트 추출 | PyMuPDF(`import fitz`) → scratchpad 저장 |
| 프리뷰 검증 | 스크린샷 자주 타임아웃 → `javascript_tool`(navigate 후 텍스트 검증) 사용 |
| 법률/뉴스 반영 | **반드시 뉴스 원문 2개+ 교차확인**(추측 금지) — CLAUDE.md 규칙 |

## 📱 태블릿에서 이어가기
1. 태블릿에서 이 저장소를 열고(또는 GitHub `docs/SESSION_HANDOFF_2026-07-11.md`에서 읽고),
2. "대기 항목 A(차규근안 추가) 진행해줘" 처럼 지시.
3. 또는 이 대화를 태블릿에서 그대로 이어서 열기.

---
*생성: 2026-07-11 · 데스크톱 세션 인수인계*
