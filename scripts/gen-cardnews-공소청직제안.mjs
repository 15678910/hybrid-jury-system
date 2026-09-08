// 공소청 직제안 카드뉴스 생성기 — 7단계 시리즈 (2026-09-08)
// 내용 원칙: 1~4단계의 숫자·문구는 전부 원문에서 확인했다 —
//   · 법무부 보도자료 「공소청과 그 소속기관 직제」 제정안·「검사정원법 시행령」 개정안 입법예고 (2026.9.4)
//       docs/bills/공소청직제_2026입법예고/보도자료_20260904.txt (PDF 6쪽 추출)
//   · 공소청법(법률 제21490호, 2026.10.2 시행)            docs/bills/공소청법_원문.txt
//   · 형사소송법(법률 제21857호, 2026.10.2 시행분)          docs/bills/형사소송법_20261002시행.txt
//   · 중대범죄수사청 조직 및 운영에 관한 법률(제21491호)     docs/bills/중수청법_원문.txt
//   · 검사정원법(법률 제12952호, 2014.12.31 개정)           docs/bills/검사정원법_원문.txt
//   · 헌법 제52조·제75조·제89조                             docs/bills/헌법_원문.txt
// 보도(2건 이상 교차): 법률신문·한국일보·경향신문·아주경제 2026.9.4, 세계일보·아시아경제·머니투데이 2026.9.6
// 5단계는 평가, 6단계는 제안, 7단계는 질문임을 배지로 명시한다.
// 6단계 정원 항목은 2026-09-08 사용자 결정: 검사 정원 3분의 1 이상 감축을 명시하고, 일반직은 공소청에
// 2,294명만 남기고 6,120명을 경찰청으로 전환 배치한다. 조국혁신당(9.6 기자회견)의 같은 요구는 참고로 한 줄만 적는다.
// 렌더: chrome.exe --headless --window-size=1600,1200 --screenshot (scripts/render-cardnews.sh 참조)
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const F = (w) => pathToFileURL(path.join(OUT, 'fonts', `notokr-${w}.ttf`)).href;

const CSS = `
@font-face { font-family:'NotoKR'; src:url('${F(400)}') format('truetype'); font-weight:400; }
@font-face { font-family:'NotoKR'; src:url('${F(700)}') format('truetype'); font-weight:700; }
@font-face { font-family:'NotoKR'; src:url('${F(900)}') format('truetype'); font-weight:900; }
*{margin:0;padding:0;box-sizing:border-box;}
html{width:1600px;height:1200px;}body{width:1600px;height:1200px;overflow:hidden;}
body{font-family:'NotoKR',sans-serif;background:linear-gradient(160deg,#eef2f6 0%,#e4eaf1 55%,#d6dfe9 100%);color:#1c2733;display:flex;flex-direction:column;padding:36px 52px 24px;word-break:keep-all;overflow-wrap:break-word;}
.top{display:flex;align-items:flex-start;gap:26px;margin-bottom:10px;}
.chip{background:#1f3b57;color:#fff;font-weight:900;font-size:31px;padding:14px 26px;border-radius:14px;letter-spacing:1px;white-space:nowrap;align-self:flex-start;box-shadow:0 6px 14px rgba(31,59,87,.25);line-height:1.15;text-align:center;}
.titles{flex:1;}
h1{font-size:65px;font-weight:900;color:#162c42;line-height:1.08;letter-spacing:-1px;}
h1 .step{color:#b45309;}
h1 .bar{color:#9fb0c2;font-weight:400;margin:0 14px;}
.sub{font-size:35px;color:#4a5d72;font-weight:700;margin-top:10px;}
.page{margin-left:auto;background:#fff;border:3px solid #1f3b57;color:#1f3b57;font-weight:900;font-size:29px;padding:8px 22px;border-radius:999px;}
.cols{display:flex;gap:26px;flex:1 1 0;min-height:0;overflow:hidden;margin-top:16px;}
.col{flex:1;background:#fff;border-radius:22px;box-shadow:0 10px 24px rgba(31,59,87,.13);padding:0 0 18px;display:flex;flex-direction:column;overflow:hidden;}
.colhead{background:#1f3b57;color:#fff;padding:16px 22px;display:flex;align-items:center;gap:14px;}
.colhead .n{background:#fff;color:#1f3b57;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:28px;flex:none;}
.colhead .t{font-size:38px;font-weight:900;line-height:1.15;}
.item{padding:0 24px;display:flex;gap:13px;align-items:flex-start;}
.item .dot{width:14px;height:14px;border-radius:3px;background:#b45309;margin-top:20px;flex:none;}
.item .dot.warn{background:#c2410c;}
.item .tx{font-size:39px;line-height:1.38;color:#2b3a49;}
.col.tight .item .tx{font-size:34px;line-height:1.34;}
.col.tight .item .tx.quote{font-size:31px;line-height:1.36;}
.col.tight .ref{font-size:25px;}
.item b{color:#162c42;font-weight:900;}
.ref{display:block;font-size:27px;color:#7d8fa3;margin-top:2px;font-weight:400;}
.warnbox{flex:none;margin-top:14px;background:#fff2ee;border:3px solid #e0693c;border-radius:16px;padding:14px 24px;display:flex;gap:18px;align-items:flex-start;}
.warnbox .tag{background:#b23c17;color:#fff;font-weight:900;font-size:26px;padding:7px 16px;border-radius:10px;flex:none;margin-top:2px;}
.warnbox .tx{font-size:31px;line-height:1.4;color:#7f2e12;font-weight:700;}
.bottom{flex:none;margin-top:14px;background:linear-gradient(90deg,#162c42,#2f5f8a);color:#fff;border-radius:18px;padding:16px 30px;font-size:37px;font-weight:900;line-height:1.3;box-shadow:0 8px 18px rgba(22,44,66,.3);}
.bottom .k{color:#ffd34d;}
.bottom .pre{display:inline-block;background:#ffd34d;color:#162c42;font-size:26px;border-radius:9px;padding:3px 14px;margin-right:16px;vertical-align:6px;}
.foot{flex:none;margin-top:9px;display:flex;justify-content:space-between;gap:30px;font-size:20px;color:#6f8196;font-weight:700;}
.foot span{white-space:nowrap;}
.propose{margin-top:2px;margin-bottom:6px;background:#fdf6e3;border:3px dashed #b45309;border-radius:14px;padding:8px 22px;font-size:28px;font-weight:900;color:#5b3a10;}
`;

const cards = [
// ───────────────────────── 1단계
{ step:'1단계', title:'「직제」는 누가 정하나', sub:'공소청법이 대통령령에 맡긴 것 — 그 안이 지금 입법예고 중이다 (원문 확인)', page:'1 / 7',
 cols:[
  {n:'1',t:'법이 맡긴 것',items:[
   ['「공소청에 <b>부와 사무국</b>을 두고 … 부·사무국 및 과의 설치와 분장사무에 관한 제반사항은 <b>대통령령으로 정한다</b>」','공소청법 제15조 (광역 제20조·지방 제27조 같은 구조)'],
   ['「검사의 정원을 <b>2,292명</b>으로 한다」 — 정원은 <b>법률</b>이다. 2014.12.31 개정 뒤 그대로','검사정원법 제1조'],
   ['청별 배정만 대통령령으로 — 그것이 이번 「검사정원법 시행령」 개정안','검사정원법 제2조'],
  ],quote:[0,1],tight:true},
  {n:'2',t:'그 안이 지금 예고 중',items:[
   ['「<b>공소청과 그 소속기관 직제</b>」 제정안 — 대통령령','법무부 보도자료 2026.9.4'],
   ['예고기간 <b>2026.9.4 ~ 9.9</b> — 단 5일. 시행 예정 <b>2026.10.2</b>, 검찰청 폐지·공소청 출범일','법무부 공고 · 경향신문 9.4'],
   ['개편·신설 부서는 「<b>3년 이내</b>의 평가기간」 — 시행 뒤에 본다는 뜻','보도자료 5쪽 「향후 계획」'],
  ],warnDots:[1],tight:true},
  {n:'3',t:'규모 — 보도자료의 표',items:[
   ['본청 <b>6부 6국·관 30과</b> · 광역공소청 6 · 지방공소청 18 · 지청 42 · 일선 <b>221부</b>','보도자료 1쪽 【기구 규모】'],
   ['정원 <b>8,412명</b> = 검사 <b>2,292</b> + 일반직 <b>6,120</b>','보도자료 1쪽 【인력 규모】'],
   ['현 검찰 10,706명에서 <b>2,294명(21.4%) 감축</b> — 일반직 8,414→6,120. <b>검사는 0명</b>','한국일보 9.4 · 법무부 보도참고자료 9.6'],
  ],warnDots:[2],tight:true},
 ],
 bottom:'조직은 대통령령으로, 정원은 법률로 — <span class="k">어디를 고쳐야 하는지</span>부터 본다'},
// ───────────────────────── 2단계
{ step:'2단계', title:'없어진 것과 남은 것', sub:'수사 부서는 지웠는데 검사 수는 그대로다 (보도자료 원문 확인)', page:'2 / 7',
 cols:[
  {n:'1',t:'폐지',items:[
   ['<b>범죄정보기획관</b>과 산하 2담당관 — 「검사 수사개시 범죄 관련 정보 분석·검증·평가」 기능 <b>모두 폐지</b>','보도자료 2쪽'],
   ['인지·합동수사부서 <b>43부 폐지</b> → 중대범죄전담부 <b>29부</b>로 통·폐합','같은 쪽'],
   ['수·조사과 <b>67과 전면 폐지</b>. 서울중앙 제4차장·대구·부산 제2차장 폐지','같은 쪽'],
  ],tight:true},
  {n:'2',t:'이름이 바뀐 것',items:[
   ['반부패부 + 마약·조직범죄부 → <b>중대범죄부</b>','보도자료 2쪽'],
   ['과학수사부(검사장급 4과) → <b>법과학기획관</b>(차장검사급 3과) — 교차감정·증거보존·분석시스템에 집중','같은 쪽'],
   ['형사부에 <b>형사기획관</b> 신설, <b>특별사법경찰협력과</b> 신설, 범죄수익환수과는 공판송무부로','보도자료 3·5쪽'],
  ],tight:true},
  {n:'3',t:'숫자',items:[
   ['검사 <b>2,292명 — 그대로</b>. 법률 정원과 같은 숫자','검사정원법 제1조'],
   ['일반직 8,414 → 6,120 — <b>−2,294명</b>. 감축은 전부 여기서','한국일보 9.4 · 헤럴드경제 9.4'],
   ['검사직무대리 <b>122명 유지</b> — 경미 민생사건 16.7% 처리','보도자료 3쪽'],
   ['줄어든 2,294명이 <b>어디로 가는지</b>는 보도자료에 없다','보도자료 6쪽 전문 대조'],
  ],warnDots:[0,3],tight:true},
 ],
 bottom:'수사 부서 <span class="k">110곳</span>(43부+67과)이 사라졌다 — <span class="k">검사는 한 명도</span> 줄지 않았다'},
// ───────────────────────── 3단계
{ step:'3단계', title:'「사법통제부」', sub:'불송치 전담 부서 — 보도자료 문구와 형소법 조문을 나란히 (원문 확인)', page:'3 / 7',
 cols:[
  {n:'1',t:'보도자료가 말하는 것',items:[
   ['「지방공소청 단위에 <b>‘사법통제부’</b>를 신설」 — 「<b>송치사건과 동일한 수준</b>으로 불송치 사건을 면밀히 점검」','보도자료 4쪽'],
   ['「보완수사요구·시정조치요구에 … 정당한 이유 없이 따르지 않아 직무배제·징계요구가 필요한 사건 … <b>사법통제부에 재배당</b>」 「<b>통일된 기준</b>에 따라 징계 등을 요구」','같은 쪽'],
   ['항고청 재기결정 사건 배당 · <b>KICS 기록·등재 의무</b> 점검','같은 쪽'],
  ],quote:[0,1],warnDots:[1],tight:true},
  {n:'2',t:'법에 있는 권한',items:[
   ['보완수사요구·재수사요구 불이행 → 공소청장이 <b>직무배제·징계 요구</b>','형소법 제197조의2⑦ · 제245조의8⑧'],
   ['법령위반·인권침해·수사권 남용 → <b>징계 요구</b>','형소법 제197조의3⑦'],
   ['<b>사실관계 확인</b> — 피의자·전문가·사법경찰관 의견 청취. 진술은 <b>증거로 못 쓴다</b>','형소법 제245조의13①·③'],
   ['검사 직무는 「사법경찰관리와의 <b>협의·지원</b>」 — 「통제」는 <b>법률에 없는 말</b>','공소청법 제4조제3호'],
  ],warnDots:[3],tight:true},
  {n:'3',t:'우려는 어디서 나왔나',items:[
   ['김용민 의원(민주당) — 「사법통제를 받아야 할 건 <b>검사</b>인데 사법통제부 신설은 모순」. 전담부는 「<b>상시 수사지휘</b>」','세계일보 2026.9.6'],
   ['합수단 경험 검사(익명) — 「결국 <b>수사에 검사가 관여</b>하는 구조」','한국일보 2026.9.4'],
   ['법무부 — 「부실수사, 사건암장 등 수사권 남용에 대한 <b>국민들의 우려를 불식</b>」. 차진아 교수 — 「필요성은 인정」','보도자료 4쪽 · 세계일보 9.6'],
  ],tight:true},
 ],
 bottom:'권한은 법에 있다 — 문제는 <span class="k">「통제」라는 이름</span>과 <span class="k">「통일된 기준」을 누가 만드는가</span>'},
// ───────────────────────── 4단계
{ step:'4단계', title:'합동수사 「대응 부서」 5곳', sub:'중수청 합동수사과와 1대1 — 법이 세운 칸막이와 대조한다 (원문 확인)', page:'4 / 7',
 cols:[
  {n:'1',t:'보도자료가 말하는 것',items:[
   ['「중대범죄전담부 중 <b>5개 부서</b>는 중수청에 설치될 <b>5개의 합동수사과에 대응</b>하여, <b>수사개시, 영장신청 단계</b>에서의 법률판단·증거수집 의견제시를 <b>전담</b>」','보도자료 3쪽'],
   ['「기존 검사가 <b>직접 참여</b>하던 범정부 합동수사기구의 <b>강점과 효율성이 유지</b>될 수 있도록」','보도자료 2쪽'],
   ['합동대응 사건이 생기면 유관 부서를 「<b>합동수사단 전담부서</b>로 지정」','보도자료 3쪽 · 수사준칙안 제7조의2'],
  ],quote:[0,1,2],warnDots:[1],tight:true},
  {n:'2',t:'법이 세운 칸막이',items:[
   ['「수사관은 공소청에 <b>파견되거나</b> 공소청의 직위를 <b>겸임할 수 없다</b>」','중수청법 제24조'],
   ['수사관은 퇴직 후 <b>2년</b>이 지나야 검사로 임용될 수 있다','중수청법 제25조'],
   ['사법경찰관이 「의견을 <b>요청할 수 있다</b>」 — 검사는 응하여야 한다. <b>출발점은 요청</b>이다','형소법 제195조③'],
  ],tight:true},
  {n:'3',t:'나란히 놓으면',items:[
   ['법 — 「요청이 오면 응한다」 / 직제 — 「<b>수사개시 단계부터 전담</b>한다」'],
   ['법 — 파견·겸임 금지 / 직제 — <b>1대1 대응 부서</b>가 옆에 앉는다'],
   ['평가 기준은 「<b>업무량·성과·실적</b>」 — 무엇을 실적으로 셀지는 적혀 있지 않다','보도자료 5쪽'],
  ],warnDots:[0,1],tight:true},
 ],
 bottom:'파견·겸임은 법이 막았다 — <span class="k">직제는 「대응 부서」로 옆에 앉는다</span>'},
// ───────────────────────── 5단계
{ step:'5단계', title:'무엇이 문제인가', sub:'직제가 현장에서 무엇을 만들어 내는가', page:'5 / 7',
 propose:'이 카드는 직제안에 대한 평가입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'통제의 방향',items:[
   ['검사가 경찰을 통제하는 부서는 생겼다 — 검사를 통제하는 <b>밖의 눈</b>은 이 직제에 없다. 감찰부는 <b>안의 눈</b>이다'],
   ['「통일된 기준」을 공소청이 <b>스스로 만들고 스스로 적용</b>한다 — 기준을 검증할 자리가 없다'],
   ['8월 5일 대통령 — 「경찰이 엄청난 권한을 갖게 되는데 … 안전한 걸까」. <b>그 답이 검사 내부 부서인가</b>','MBC 뉴스투데이 2026.8.5'],
  ],warnDots:[0,1],tight:true},
  {n:'2',t:'상시 관여의 통로',items:[
   ['5개 대응 부서 — <b>요청이 있을 때</b>가 아니라 <b>전담·상시</b>. 법 제195조③의 순서가 뒤집힌다'],
   ['평가가 「업무량·성과·실적」이면 — <b>관여할수록 실적</b>이 된다'],
   ['「강점과 효율성 유지」는 <b>분리 전 방식의 보존</b>을 뜻한다 — 보도자료가 스스로 적었다'],
  ],warnDots:[0,1],tight:true},
  {n:'3',t:'숫자와 절차',items:[
   ['수사 부서 110곳 폐지, 수사관 2,294명 감축 — 검사 <b>0명</b>. 이유는 <b>설명되지 않았다</b>'],
   ['검사 정원은 <b>법률</b>이다 — 정부가 검사정원법 개정안을 내지 않는 한 <b>2,292는 그대로</b>다','검사정원법 제1조'],
   ['입법예고 <b>5일</b>, 국회 심의 없음(대통령령), 평가는 <b>시행 뒤 3년</b>'],
  ],warnDots:[0]},
 ],
 bottom:'이름은 「통제」인데 — <span class="k">통제받는 쪽에 검사가 없다</span>'},
// ───────────────────────── 6단계
{ step:'6단계', title:'제안 — 9월 9일 전에', sub:'입법예고가 끝나기 전에 고칠 것 세 갈래', page:'6 / 7',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 제안입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'줄일 것은 검사다',items:[
   ['검사 정원 <b>3분의 1 이상 감축</b> — 2,292 → <b>1,528명 이하</b>. 정부가 <b>검사정원법 개정안</b>을 낸다','검사정원법 제1조 · 헌법 제52조'],
   ['일반직 8,414명 중 공소청에 <b>2,294명만</b>, <b>6,120명은 경찰청</b>(국가수사본부)으로 전환 배치 — 중수청처럼 <b>희망자 무시험 임용</b>령을 함께'],
   ['9월 6일 조국혁신당도 「평검사 3분의 1 이상 감축」 요구','아시아경제 9.6 (참고)'],
  ],tight:true},
  {n:'2',t:'통제에는 시민이 앉는다',items:[
   ['불송치 사건 심사에 <b>시민기소심사위원회</b>(무작위 추첨·구속력)를 결합 — 「통일된 기준」에 <b>시민이 앉는다</b>'],
   ['직무배제·징계 요구는 <b>요구서와 결과를 공표</b>한다'],
   ['부서 이름을 법률 용어 「<b>협의·지원</b>」에 맞춘다 — 「통제」는 법에 없는 말이다','공소청법 제4조제3호'],
  ],tight:true},
  {n:'3',t:'대응 부서와 절차',items:[
   ['5개 대응 부서는 「<b>요청이 있을 때</b>」로 한정하고 관여 내역을 <b>기록·공표</b> — 형소법 제195조③ 문언대로'],
   ['법과학기획관의 증거보존·분석시스템 — <b>접근기록 자동 보존·외부 감사</b>를 법률에'],
   ['입법예고를 <b>연장</b>하고 국회 법사위에 직제안을 <b>보고</b>한다. <b>9월 9일까지</b> 의견서 — 법무부 검찰국 검찰과','보도자료 6쪽'],
  ],tight:true},
 ],
 bottom:'<span class="pre">제안</span>줄일 것은 <span class="k">검사</span>, 세울 것은 <span class="k">시민의 눈</span>'},
// ───────────────────────── 7단계
{ step:'7단계', title:'이재명 정부에 묻는다', sub:'이 직제안은 정부의 뜻인가 — 주권자가 판단할 수 있도록 묻는다', page:'7 / 7',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 질문입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'대통령령은 대통령의 이름으로 나온다',items:[
   ['「대통령은 … 법률을 집행하기 위하여 필요한 사항에 관하여 <b>대통령령을 발할 수 있다</b>」','헌법 제75조'],
   ['「대통령령안」은 <b>국무회의의 심의</b>를 거쳐야 한다 — 법무부가 올린 안을 국무회의가 의결하고 대통령이 공포한다','헌법 제89조 제3호'],
   ['시행 예정 <b>2026년 10월 2일</b> — 검찰청이 문을 닫는 날','경향신문 · 법률방송 2026.9.4'],
  ],quote:[0,1],tight:true},
  {n:'2',t:'준비위가 확인한 것',items:[
   ['수사 부서 <b>110곳</b> 폐지, 수사관 2,294명 감축 — <b>검사 0명</b>','2단계 · 보도자료 대조'],
   ['사법통제부 — 검사가 경찰을 통제한다. <b>검사를 통제하는 밖의 눈은 없다</b>','3단계 · 공소청법 제4조 대조'],
   ['5개 대응 부서 — 법은 「<b>요청</b>」, 직제는 「<b>전담</b>」','4단계 · 형소법 제195조③ 대조'],
   ['검사 정원은 법률 — 줄이려면 <b>정부가 개정안을 내야</b> 한다','검사정원법 제1조 · 헌법 제52조'],
  ],tight:true},
  {n:'3',t:'묻는다',items:[
   ['① 8월 5일 「경찰이 엄청난 권한 … 안전한 걸까」 — 그 답이 <b>검사의 사법통제부</b>인가, <b>시민의 눈</b>인가'],
   ['② 수사 직무가 사라진 검사 <b>2,292명을 그대로 두는 것</b>이 정부의 뜻인가 — 검사정원법 개정안을 낼 것인가'],
   ['③ <b>5일 입법예고</b>로 조직을 확정해 국무회의에서 의결할 것인가'],
   ['정부의 답과 국무회의 결과를 <b>이 카드에 이어 기록한다</b>','주권자사법개혁추진준비위원회(준)'],
  ],warnDots:[0,1,2],tight:true},
 ],
 bottom:'<span class="pre">질문</span>「지휘」를 지운 정부가 — <span class="k">「통제」라는 이름으로 되돌릴 것인가</span>'},
];

function renderCol(c){
  let h = `<div class="col${c.tight?' tight':''}"><div class="colhead"><div class="n">${c.n}</div><div class="t">${c.t}</div></div><div class="colbody" style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;padding:6px 0 10px;">`;
  (c.items||[]).forEach((it,i)=>{
    const [tx,ref] = it;
    const cls = (c.warnDots||[]).includes(i) ? 'dot warn' : 'dot';
    const txc = (c.quote||[]).includes(i) ? 'tx quote' : 'tx';
    h += `<div class="item"><div class="${cls}"></div><div class="${txc}">${tx}${ref?`<span class="ref">${ref}</span>`:''}</div></div>`;
  });
  return h + `</div></div>`;
}

cards.forEach((card,idx)=>{
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="top">
    <div class="chip">공소청<br>직제안</div>
    <div class="titles"><h1><span class="step">${card.step}</span><span class="bar">|</span>${card.title}</h1>
    <div class="sub">${card.sub}</div></div>
    <div class="page">${card.page}</div>
  </div>
  ${card.propose?`<div class="propose">※ ${card.propose}</div>`:''}
  <div class="cols">${card.cols.map(renderCol).join('')}</div>
  ${card.warn?`<div class="warnbox"><div class="tag">주의</div><div class="tx">${card.warn}</div></div>`:''}
  <div class="bottom">${card.bottom}</div>
  <div class="foot"><span>시민법정 · 주권자사법개혁추진준비위원회(준) — 시민법정.kr/cardnews</span><span>근거: 법무부 보도자료(2026.9.4)·공소청법·형소법·중수청법·검사정원법 원문 대조</span></div>
  </body></html>`;
  fs.writeFileSync(path.join(OUT, `ocard${idx+1}.html`), html);
  console.log(`ocard${idx+1}.html 생성`);
});
