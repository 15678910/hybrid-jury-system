// 대통령령 절차 카드뉴스 생성기 — 7단계 시리즈 (2026-09-08)
// 주제: 대통령령(공소청 직제안·검사정원법 시행령)은 어떻게 법이 되나 — 입법예고·국회 검토·법원/헌재.
// 내용 원칙: 1~4단계 숫자·문구는 전부 원문에서 확인했다 —
//   · 헌법 제75조·제89조·제107조                        docs/bills/헌법_원문.txt
//   · 행정절차법 제41~45조                              docs/bills/행정절차법_입법예고_제41~45조.txt (law.go.kr 2026-09-08 수집)
//   · 법제업무 운영규정 제14~15조                       docs/bills/법제업무운영규정_제14~15조.txt
//   · 국회법 제98조의2 (2026.9.8 시행분)                law.go.kr 수집 (본문 인용)
//   · 헌법재판소법 제68조 (2026.3.12 개정)              docs/bills/헌법재판소법_제68조.txt
//   · 정부조직법 제2조① · 공소청법 제4조·제15조 · 검사정원법 제1·2조 · 형소법 제195조③ 등
//   · 법무부공고 제2026-349호(검사정원법 시행령 입법예고) docs/bills/공소청직제_2026입법예고/법무부공고_제2026-349호.txt
//   · 법무부 보도자료 2026.9.4                            docs/bills/공소청직제_2026입법예고/보도자료_20260904.txt
// 직제안 자체의 공고(행정안전부공고 제2026-1090호, 국민참여입법센터 목록 기준)는 원문을 열지 못했다 — 카드에 그렇게 적는다.
// 5단계는 평가, 6단계는 제안, 7단계는 질문임을 배지로 명시한다.
// 렌더: bash scripts/render-cardnews.sh dcard 대통령령절차_7단계 대통령령절차 decree-process-2026 7
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
{ step:'1단계', title:'대통령령은 누가 만드나', sub:'국회 표결 없이 법이 되는 규범 — 그 절차를 조문으로 본다 (원문 확인)', page:'1 / 7',
 cols:[
  {n:'1',t:'헌법이 준 권한',items:[
   ['「대통령은 … 법률을 집행하기 위하여 필요한 사항에 관하여 <b>대통령령을 발할 수 있다</b>」','헌법 제75조'],
   ['「대통령령안」은 <b>국무회의의 심의</b>를 거쳐야 한다','헌법 제89조 제3호'],
   ['「중앙행정기관의 설치와 <b>직무범위는 법률</b>로 정한다」 — 직제는 그 안에서 사무를 나눌 뿐이다','정부조직법 제2조①'],
  ],quote:[0,1,2],tight:true},
  {n:'2',t:'이번 직제의 위임 근거',items:[
   ['「부·사무국 및 과의 설치와 분장사무에 관한 제반사항은 <b>대통령령으로 정한다</b>」','공소청법 제15조 (광역 제20조·지방 제27조)'],
   ['검사 정원 <b>2,292명은 법률</b>. 청별 배정만 대통령령 — 그것이 「검사정원법 시행령」','검사정원법 제1조·제2조'],
   ['직제는 <b>행정안전부</b>, 정원령은 <b>법무부</b> 소관 — 공고가 둘로 나뉜다','국민참여입법센터 목록 · 법무부공고 제2026-349호'],
  ],tight:true},
  {n:'3',t:'절차의 흐름',items:[
   ['<b>입법예고</b> → (규제심사) → <b>법제처 심사</b> → 차관회의 → <b>국무회의 의결</b> → 대통령 재가·공포 → 시행','행정절차법 제41조 · 법제업무 운영규정 · 헌법 제89조'],
   ['이 줄 어디에도 <b>국회 표결은 없다</b> — 국회는 사후 검토만 한다 (4단계)','국회법 제98조의2'],
   ['시행 예정 <b>2026.10.2</b> — 검찰청 폐지·공소청 출범일','법무부 보도자료 2026.9.4'],
  ],warnDots:[1],tight:true},
 ],
 bottom:'법을 집행하는 규범인데 — <span class="k">국회 표결 없이</span> 태어난다'},
// ───────────────────────── 2단계
{ step:'2단계', title:'입법예고는 왜, 얼마나', sub:'행정절차법이 정한 국민 의견 수렴 — 원칙은 40일 (원문 확인)', page:'2 / 7',
 cols:[
  {n:'1',t:'예고는 의무다',items:[
   ['「법령등을 제정·개정 또는 폐지 … 하려는 경우에는 … 이를 <b>예고하여야 한다</b>」','행정절차법 제41조①'],
   ['예외는 다섯뿐 — <b>긴급</b>, 상위법령의 <b>단순 집행</b>, 권리·의무와 <b>무관</b>, 자구 변경, 공공안전 저해','같은 항 단서 제1~5호'],
   ['대통령령을 예고할 때는 <b>국회 소관 상임위원회에 제출</b>하여야 한다','행정절차법 제42조②'],
  ],quote:[0],tight:true},
  {n:'2',t:'기간과 의견',items:[
   ['「입법예고기간은 … <b>특별한 사정이 없으면 40일</b>(자치법규는 20일) <b>이상</b>으로 한다」','행정절차법 제43조'],
   ['「<b>누구든지</b> … 의견을 제출할 수 있다」 「특별한 사유가 없으면 이를 <b>존중</b>하여 처리」 「<b>처리결과를 통지</b>하여야 한다」','행정절차법 제44조①·③·④'],
   ['40일 미만으로 줄이려면 <b>법제처장과 협의</b>하여야 한다','법제업무 운영규정 제14조②'],
  ],quote:[0,1],warnDots:[2],tight:true},
  {n:'3',t:'예고에 실어야 할 것',items:[
   ['주요 내용 · 접수기관 · 제출기간 · 방법 + 법령안 <b>전문</b> · 조문별 <b>제정이유서</b> · 규제영향분석서','법제업무 운영규정 제15조③'],
   ['관보와 <b>법제정보시스템</b>(국민참여입법센터)에 공고','행정절차법 제42조① 제1호'],
   ['국민생활과 직접 관련된 내용이 뒤에 추가되면 <b>다시 예고</b>해야 한다','행정절차법 제41조④'],
  ],tight:true},
 ],
 bottom:'40일은 — <span class="k">국민이 읽고 말할 시간</span>이다'},
// ───────────────────────── 3단계
{ step:'3단계', title:'이번엔 5일이었다', sub:'9월 4일 공고, 9월 9일 마감 — 공고 원문과 다른 예고들을 나란히 (원문 확인)', page:'3 / 7',
 cols:[
  {n:'1',t:'법무부공고 제2026-349호',items:[
   ['「‘행정절차법’ 제41조에 따라 다음과 같이 공고합니다 … 의견이 있는 기관·단체 또는 개인은 <b>2026년 9월 9일까지</b>」','공고 1쪽 (검사정원법 시행령)'],
   ['개정이유 — 「검사의 <b>현정원의 범위 안에서</b> 정원을 합리적으로 조정」','같은 쪽'],
   ['40일을 줄인 <b>「특별한 사정」도, 법제처 협의도 한 줄이 없다</b>','공고 전문 대조'],
  ],quote:[0,1],warnDots:[2],tight:true},
  {n:'2',t:'직제안 (행정안전부 소관)',items:[
   ['「공소청과 그 소속기관 직제」 제정안 — 「<b>9. 9.까지 입법예고</b>를 실시합니다」','법무부 보도자료 2026.9.4'],
   ['공고 원문(행정안전부공고 제2026-1090호, 국민참여입법센터 목록)은 <b>열어 보지 못했다</b> — 사유 기재 여부 미확인','2026.9.8 확인 시도'],
   ['개편·신설 부서는 「<b>3년 이내</b>의 평가기간」 — 검증은 시행 뒤로','보도자료 5쪽'],
  ],warnDots:[1],tight:true},
  {n:'3',t:'같은 주의 다른 예고',items:[
   ['교육부 고등교육법 시행령 — 9.8 ~ 10.19, <b>40일</b>','국민참여입법센터 2026.9.8 목록'],
   ['국방부 군검찰 사건사무규칙(부령) — 9.8 ~ 9.18, <b>10일</b>','같은 목록'],
   ['참여연대 9.8 — 「입법예고안을 <b>철회하고 전면 재설계</b>해야」 「‘사법통제부’라는 <b>명칭부터</b> 적절한지 의문」','참여연대 사법감시센터 성명'],
  ],tight:true},
 ],
 bottom:'40일 원칙 — <span class="k">5일로 줄인 「특별한 사정」이 적혀 있지 않다</span>'},
// ───────────────────────── 4단계
{ step:'4단계', title:'국회는 무엇을 할 수 있나', sub:'국회법 제98조의2 — 제출·검토·보고, 그리고 한계 (원문 확인)', page:'4 / 7',
 cols:[
  {n:'1',t:'제출',items:[
   ['대통령령이 「제정·개정 … 되었을 때에는 <b>10일 이내</b>에 … 국회 소관 상임위원회에 제출」 「<b>입법예고를 할 때에도</b> 그 입법예고안을 10일 이내에 제출」','국회법 제98조의2①'],
   ['기간 안에 못 내면 「그 <b>이유를</b> 소관 상임위원회에 <b>통지</b>」','같은 조 ②'],
   ['전문위원이 검토해 위원들에게 제공한다','같은 조 ⑨'],
  ],quote:[0,1],tight:true},
  {n:'2',t:'검토와 의결',items:[
   ['상임위는 정기적으로 회의를 열어 「<b>법률 위반 여부</b> 등을 검토하여야 한다」','같은 조 ③'],
   ['법률의 취지·내용에 합치되지 않으면 <b>검토결과보고서</b> → 의장 → <b>본회의 의결</b> → 정부 송부','같은 조 ④·⑤'],
   ['정부는 「처리 여부를 검토하고 그 <b>처리결과</b>(따르지 못하는 경우 <b>그 사유</b>를 포함)를 국회에 제출」','같은 조 ⑥'],
  ],tight:true},
  {n:'3',t:'한계',items:[
   ['국회가 대통령령을 <b>부결하거나 고칠 수 있다는 조문은 없다</b>'],
   ['정부가 「따르지 못하는 사유」를 적어 내면 <b>절차는 거기서 끝난다</b>','같은 조 ⑥'],
   ['국회가 확실히 할 수 있는 것은 <b>상위 법률을 고치는 것</b> — 6단계'],
  ],warnDots:[0,1],tight:true},
 ],
 bottom:'국회는 <span class="k">보고를 받고 의견을 보낼 뿐</span> — 표결권이 없다'},
// ───────────────────────── 5단계
{ step:'5단계', title:'법률 위반인가', sub:'직제안과 정원령을 조문에 대어 본 네 가지 판정', page:'5 / 7',
 propose:'이 카드는 조문 대조에 따른 평가입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'절차',items:[
   ['예고기간 <b>5일</b> — 40일 원칙(제43조)에 대한 「특별한 사정」 <b>미기재</b>, 법제처 협의 여부 <b>미공개</b> → <b>절차 위반 소지</b> (부분 성립)','행정절차법 제43조 · 운영규정 제14조②'],
   ['국회 상임위 제출(제98조의2①) — 이행 여부 <b>확인 불가</b>','국회법 제98조의2'],
  ],warnDots:[0]},
  {n:'2',t:'내용 ① 사법통제부',items:[
   ['재수사요구·직무배제·징계요구 권한은 <b>형소법에 있다</b> → 부서 신설 자체는 <b>위법 아님</b>','형소법 제245조의8⑧ · 제197조의2⑦ · 제197조의3⑦'],
   ['다만 검사 직무는 「사법경찰관리와의 <b>협의·지원</b>」 — 「통제」는 <b>법률에 없는 이름</b>','공소청법 제4조제3호'],
  ],warnDots:[1],tight:true},
  {n:'3',t:'내용 ② 대응부서 · 정원',items:[
   ['대응부서 5곳 「<b>수사개시 단계부터 전담</b>」 — 법은 사경이 <b>요청하면</b> 응하는 구조. 직무범위는 <b>법률</b>로 → <b>위임 범위 초과 소지</b> (부분 성립)','형소법 제195조③ · 정부조직법 제2조①'],
   ['검사 2,292명 유지 — 검사정원법 제1조 그대로 → <b>위법 아님</b>. 줄이려면 <b>법률</b>을 고쳐야 한다','검사정원법 제1조'],
  ],warnDots:[0],tight:true},
 ],
 bottom:'내용보다 <span class="k">절차</span>가 먼저 걸린다 — 40일이 5일이 된 이유가 없다'},
// ───────────────────────── 6단계
{ step:'6단계', title:'되돌리는 길 셋', sub:'국회가 못 막아도 — 법을 고치고, 법원에 묻고, 헌재에 묻는다', page:'6 / 7',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 제안입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'① 상위 법률을 고친다',items:[
   ['공소청법·형사소송법을 개정하면 대통령령은 <b>그에 맞춰야</b> 한다 — 직제는 법률의 「집행」 규범이다','헌법 제75조'],
   ['검사 정원은 <b>검사정원법 제1조 개정</b>으로만 줄어든다 — 직제로는 못 한다','검사정원법 제1조'],
   ['법사위에 <b>제98조의2 검토결과보고서 채택</b>을 요구한다 — 제출은 이미 의무, <b>검토</b>가 핵심','국회법 제98조의2③·④'],
  ],tight:true},
  {n:'2',t:'② 법원 — 명령·규칙 심사',items:[
   ['「명령·규칙 … 이 헌법이나 법률에 위반되는 여부가 <b>재판의 전제</b>가 된 경우에는 <b>대법원</b>은 이를 최종적으로 심사할 권한을 가진다」','헌법 제107조②'],
   ['직제에 근거한 처분(재배당·징계요구 등)을 다투는 재판에서 그 조항의 <b>무효</b>를 주장할 수 있다'],
   ['<b>사건이 있어야</b> 한다 — 추상적으로는 묻지 못한다'],
  ],quote:[0],warnDots:[2],tight:true},
  {n:'3',t:'③ 헌법재판소 — 헌법소원',items:[
   ['「공권력의 행사 … 로 인하여 헌법상 보장된 <b>기본권을 침해받은 자</b>는 헌법재판소에 헌법소원심판을 청구할 수 있다」','헌법재판소법 제68조①'],
   ['다른 법률에 구제절차가 있으면 <b>그 절차를 모두 거친 후</b>에 청구한다','같은 항 단서'],
   ['법령 자체를 다투려면 <b>직접·현재의 침해</b>를 보여야 한다 — 문턱이 높다'],
  ],quote:[0],warnDots:[2],tight:true},
 ],
 bottom:'<span class="pre">제안</span>국회 밖에도 — <span class="k">법을 바로잡는 길</span>이 있다'},
// ───────────────────────── 7단계
{ step:'7단계', title:'이재명 정부에 묻는다', sub:'절차에 대한 세 가지 질문 — 답을 이어 기록한다', page:'7 / 7',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 질문입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'준비위가 확인한 것',items:[
   ['예고기간 <b>5일</b> — 공고에 단축 사유가 없다','3단계 · 법무부공고 제2026-349호'],
   ['국회는 검토·의견 송부까지 — <b>표결권이 없다</b>','4단계 · 국회법 제98조의2'],
   ['직제는 <b>국무회의 의결</b>로 확정된다 — 그 자리에 앉는 것은 정부다','헌법 제89조 제3호'],
  ],tight:true},
  {n:'2',t:'묻는다',items:[
   ['① 40일 원칙을 5일로 줄인 「<b>특별한 사정</b>」은 무엇인가','행정절차법 제43조'],
   ['② 법제처장과 <b>협의</b>했는가, 국회 상임위에 <b>10일 안에 제출</b>했는가','운영규정 제14조② · 국회법 제98조의2①'],
   ['③ 제출된 의견을 「<b>존중하여 처리</b>」하고 <b>결과를 통지</b>할 것인가','행정절차법 제44조③·④'],
  ],warnDots:[0,1,2],tight:true},
  {n:'3',t:'다음 행동',items:[
   ['9월 9일까지 <b>의견서</b>를 낸다 — 그리고 <b>처리결과 통지</b>를 요구한다','행정절차법 제44조④'],
   ['법사위에 <b>검토결과보고서 채택</b>을 요구한다','국회법 제98조의2④'],
   ['정부의 답과 국무회의 결과를 <b>이 카드에 이어 기록한다</b>','주권자사법개혁추진준비위원회(준)'],
  ],tight:true},
 ],
 bottom:'<span class="pre">질문</span>절차를 지키지 않은 규범은 — <span class="k">내용을 묻기 전에</span> 묻는다'},
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
    <div class="chip">대통령령<br>절차</div>
    <div class="titles"><h1><span class="step">${card.step}</span><span class="bar">|</span>${card.title}</h1>
    <div class="sub">${card.sub}</div></div>
    <div class="page">${card.page}</div>
  </div>
  ${card.propose?`<div class="propose">※ ${card.propose}</div>`:''}
  <div class="cols">${card.cols.map(renderCol).join('')}</div>
  ${card.warn?`<div class="warnbox"><div class="tag">주의</div><div class="tx">${card.warn}</div></div>`:''}
  <div class="bottom">${card.bottom}</div>
  <div class="foot"><span>시민법정 · 주권자사법개혁추진준비위원회(준) — 시민법정.kr/cardnews</span><span>근거: 헌법·행정절차법·국회법·법제업무 운영규정·헌법재판소법 원문 대조</span></div>
  </body></html>`;
  fs.writeFileSync(path.join(OUT, `dcard${idx+1}.html`), html);
  console.log(`dcard${idx+1}.html 생성`);
});
