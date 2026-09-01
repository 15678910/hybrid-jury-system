// 형사소송법 개정 카드뉴스 생성기 — 6단계 요약 분석
// 내용 원칙: 조문·수치는 저장소에서 검증된 것만 쓰고 근거를 항목마다 표기한다.
//            6단계(대안)는 주권자사법개혁추진준비위원회 제안임을 배지로 명시한다.
import fs from 'fs';
import path from 'path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const F = (w) => path.join(OUT, 'fonts', `notokr-${w}.ttf`);

const CSS = `
@font-face { font-family:'NotoKR'; src:url('file://${F(400)}') format('truetype'); font-weight:400; }
@font-face { font-family:'NotoKR'; src:url('file://${F(700)}') format('truetype'); font-weight:700; }
@font-face { font-family:'NotoKR'; src:url('file://${F(900)}') format('truetype'); font-weight:900; }
*{margin:0;padding:0;box-sizing:border-box;}
html{width:1600px;height:1200px;}body{width:1600px;height:1200px;overflow:hidden;}
body{font-family:'NotoKR',sans-serif;background:linear-gradient(160deg,#eaf2fb 0%,#dce9f8 55%,#cfe0f4 100%);color:#12294a;display:flex;flex-direction:column;padding:36px 52px 24px;word-break:keep-all;overflow-wrap:break-word;}
.top{display:flex;align-items:flex-start;gap:26px;margin-bottom:10px;}
.chip{background:#12356b;color:#fff;font-weight:900;font-size:32px;line-height:1.25;text-align:center;padding:12px 26px;border-radius:14px;letter-spacing:1px;white-space:nowrap;align-self:flex-start;box-shadow:0 6px 14px rgba(18,53,107,.25);}
.titles{flex:1;}
h1{font-size:66px;font-weight:900;color:#0e2a55;line-height:1.08;letter-spacing:-1px;}
h1 .step{color:#1a56c9;}
h1 .bar{color:#8fa8c9;font-weight:400;margin:0 14px;}
.sub{font-size:36px;color:#3d5a85;font-weight:700;margin-top:10px;}
.page{margin-left:auto;background:#fff;border:3px solid #12356b;color:#12356b;font-weight:900;font-size:30px;padding:8px 22px;border-radius:999px;}
.cols{display:flex;gap:26px;flex:1 1 0;min-height:0;overflow:hidden;margin-top:16px;}
.col{flex:1;background:#fff;border-radius:22px;box-shadow:0 10px 24px rgba(18,53,107,.13);padding:0 0 18px;display:flex;flex-direction:column;overflow:hidden;}
.colhead{background:#12356b;color:#fff;padding:16px 22px;display:flex;align-items:center;gap:14px;}
.colhead .n{background:#fff;color:#12356b;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:29px;flex:none;}
.colhead .t{font-size:39px;font-weight:900;line-height:1.15;}
.item{padding:0 24px;display:flex;gap:13px;align-items:flex-start;}
.item .dot{width:14px;height:14px;border-radius:3px;background:#1a56c9;margin-top:20px;flex:none;}
.item .dot.warn{background:#d97706;}
.item .dot.bad{background:#c2410c;}
.item .tx{font-size:40px;line-height:1.38;color:#1e3a5f;}
.item b{color:#0e2a55;font-weight:900;}
.ref{display:block;font-size:28px;color:#6b84a8;margin-top:2px;font-weight:400;}
.big{font-size:38px;font-weight:900;color:#12356b;}
.warnbox{flex:none;margin-top:14px;background:#fff7e6;border:3px solid #f0b429;border-radius:16px;padding:14px 24px;display:flex;gap:18px;align-items:flex-start;}
.warnbox .tag{background:#b45309;color:#fff;font-weight:900;font-size:27px;padding:7px 16px;border-radius:10px;flex:none;margin-top:2px;}
.warnbox .tx{font-size:32px;line-height:1.4;color:#7c4a03;font-weight:700;}
.bottom{flex:none;margin-top:14px;background:linear-gradient(90deg,#0e2a55,#164a9e);color:#fff;border-radius:18px;padding:16px 30px;font-size:38px;font-weight:900;line-height:1.3;box-shadow:0 8px 18px rgba(14,42,85,.3);}
.bottom .k{color:#ffd34d;}
.bottom .pre{display:inline-block;background:#ffd34d;color:#0e2a55;font-size:27px;border-radius:9px;padding:3px 14px;margin-right:16px;vertical-align:6px;}
.foot{flex:none;margin-top:9px;display:flex;justify-content:space-between;font-size:21px;color:#5d7699;font-weight:700;}
.propose{margin-top:2px;margin-bottom:6px;background:#eef4ff;border:3px dashed #1a56c9;border-radius:14px;padding:8px 22px;font-size:29px;font-weight:900;color:#12356b;}
.flow{display:flex;align-items:center;gap:10px;padding:0 24px;flex-wrap:wrap;}
.fbox{background:#eef4ff;border:2.5px solid #1a56c9;color:#12356b;font-weight:900;font-size:32px;border-radius:12px;padding:9px 14px;line-height:1.2;}
.fbox.gray{background:#f1f3f7;border-color:#8fa8c9;color:#44618c;}
.colbody{flex:1;display:flex;flex-direction:column;justify-content:space-evenly;padding:6px 0 10px;}
.farr{color:#1a56c9;font-size:32px;font-weight:900;}
.chips{display:flex;flex-wrap:wrap;gap:10px;padding:0 24px;}
.chips .c{background:#eef4ff;border:2px solid #b9cdec;color:#1e3a5f;font-weight:700;font-size:31px;border-radius:999px;padding:6px 15px;}
.dense .item .tx{font-size:33.5px;line-height:1.34;}.dense .ref{font-size:24.5px;}.dense .fbox{font-size:28px;padding:7px 12px;}.dense .colhead .t{font-size:34px;}
body.m1 .chip{font-size:31px;}body.m1 h1{font-size:65px;}body.m1 .sub{font-size:35px;}body.m1 .page{font-size:29px;}
body.m1 .colhead .n{font-size:28px;}body.m1 .colhead .t{font-size:38px;}body.m1 .item .tx{font-size:39px;}
body.m1 .ref{font-size:27px;}body.m1 .big{font-size:37px;}body.m1 .warnbox .tag{font-size:26px;}body.m1 .warnbox .tx{font-size:31px;}
body.m1 .bottom{font-size:37px;}body.m1 .bottom .pre{font-size:26px;}body.m1 .propose{font-size:28px;}
body.m1 .fbox{font-size:31px;}body.m1 .farr{font-size:31px;}body.m1 .chips .c{font-size:30px;}
body.m1.dense .item .tx{font-size:32.5px;}body.m1.dense .ref{font-size:23.5px;}body.m1.dense .fbox{font-size:27px;}body.m1.dense .colhead .t{font-size:33px;}
`;

const cards = [
// ───────────────────────── 1단계
{ step:'1단계', title:'지금 제도는?', sub:'수사와 기소가 어떻게 나뉘어 있나 (2026.10.1까지)', page:'1 / 9',
 cols:[
  {n:'1',t:'검사는 무엇을 하나',items:[
   ['부패·경제범죄 등 <b>수사 개시</b>','검찰청법 제4조①1'],
   ['<b>기소와 공소유지</b> — 재판에 넘길지를 결정','검찰청법 제4조'],
   ['<b>영장 청구</b>는 검사만','헌법 제12조③'],
  ]},
  {n:'2',t:'경찰은 무엇을 하나',items:[
   ['대부분 사건의 <b>1차 수사</b>'],
   ['혐의 없다고 보면 <b>불송치로 종결</b>','형사소송법 제245조의5'],
   ['불송치에는 고소인 <b>이의신청 → 검사에게 자동 송치</b>','형사소송법 제245조의7'],
  ]},
  {n:'3',t:'이미 한 번 크게 바뀌었다',items:[
   ['2021 수사권 조정 — 검·경을 <b>협력관계</b>로'],
   ['2022 개정 — 검사 직접수사를 <b>부패·경제</b>로 축소','검찰청법 제4조①1 각 목'],
   ['그래도 수사와 기소는 <b>한 지붕(검찰청)</b> 아래'],
  ]},
 ],
 bottom:'핵심은 — <span class="k">검사가 수사도 하고 기소도 하는 구조?</span>, 여기가 출발점'},
// ───────────────────────── 2단계
{ step:'2단계', title:'뭐가 달라지나', sub:'검찰청 폐지 — 「공소청 + 중수청」으로 (2026.10.2 시행)', page:'2 / 9',
 cols:[
  {n:'1',t:'조직이 갈린다',flow:['검찰청 폐지','→','공소청 (법무부)<br>기소·공소유지','＋','중수청 (행안부)<br>중대범죄 수사'],items:[
   ['공소청법 <b>법률 제21490호</b> · 중수청법 <b>제21491호</b>','2026.3.24 공포 · 10.2 시행'],
  ]},
  {n:'2',t:'권한이 갈린다',items:[
   ['공소청 검사는 <b>수사를 개시하지 못한다</b>','공소청법 제4조 — 수사개시 조항 없음'],
   ['대신 <b>보완수사요구</b> — 경찰은 <b>1개월 내</b> 이행','형사소송법 제197조의2④(신설)'],
   ['영장 청구는 <b>검사에게 존속</b>','헌법 제12조③'],
  ]},
  {n:'3',t:'절차도 새로 생겼다',items:[
   ['압수수색 <b>전 과정 의무녹화</b>','형소법 제220조의2 · 공포 후 1년 시행'],
   ['수사기록 <b>시스템 등재 의무</b>','형소법 제199조의2'],
   ['이의신청에 <b>기한 3개월</b> 신설','형소법 제245조의7③'],
  ]},
 ],
 warn:'검사가 없어지는 것이 아니라 「수사하는 검사」가 없어진다 · 조항마다 시행일이 다르다(본칙 10.2, 녹화는 공포 후 1년)',
 bottom:'<span class="k">「하나의 검찰」</span>에서 <span class="k">「기소의 공소청 + 수사의 중수청」</span>으로'},
// ───────────────────────── 3단계 (신설)
{ step:'3단계', title:'시민의 절차는 어떻게 달라지나', sub:'늘어난 권리, 그리고 그 안의 약한 고리 (조문 확인)', page:'3 / 9',
 cols:[
  {n:'1',t:'고발인 이의신청 부활',items:[
   ['2022년부터 막혀 있던 <b>고발인의 이의신청</b>이 되살아난다','형소법 제245조의7②(신설)'],
   ['다만 <b>대통령령으로 정하는 범죄에 한정</b>','같은 항'],
   ['이의신청이 있으면 <b>검사에게 자동 송치</b>','같은 조 ④(종전 ②)'],
  ]},
  {n:'2',t:'수사 기한 3개월 신설',items:[
   ['고소·고발 수리일부터 <b>3개월 내</b> 수사를 마쳐 송치 여부 결정','형소법 제238조'],
   ['그런데 지연 이의제기는 <b>6개월</b>이 지나야 가능','형소법 제245조의11①1'],
   ['<b>그 사이 석 달</b>은 다툴 통로가 없는 구간',''],
  ],warnDots:[2]},
  {n:'3',t:'검사 면담의 문제',items:[
   ['「면담을 <b>신청할 수 있다</b>」 곁에 「검사는 <b>수리 여부를 결정할 수 있다</b>」','형소법 제245조의13②(신설)'],
   ['거부 사유 제한 <b>없음</b> · 이유 통지 <b>없음</b> · 불복 절차 <b>없음</b>',''],
   ['같은 조문이 피의자 면담엔 <b>변호인 조력을 보장</b>, 고소인 면담엔 <b>없다</b>','제245조의13⑤ 대비'],
  ],warnDots:[1,2]},
 ],
 warn:'면담 수리의 기준은 「사실관계 확인의 필요성」 — 고소인의 사정이 아니라 검사의 사건 처리에 필요한가이다 (제245조의13①)',
 bottom:'권리는 늘었다 — 다만 <span class="k">어떤 것은 문이고, 면담은 문의 그림</span>이다'},
// ───────────────────────── 4단계(구 3단계)
{ step:'4단계', title:'중수청이 「검찰 중심」이 되면?', sub:'부칙이 열어 둔 문 — 인적 연속성의 문제', page:'4 / 9',
 cols:[
  {n:'1',t:'옮겨 갈 수 있게 설계됐다',items:[
   ['검찰청 공무원, 희망하면 <b>시행일에 중수청 수사관으로</b>','중수청법 부칙 제4조①'],
   ['검사 → 상당 계급 수사관, <b>시험 면제</b>','부칙 제4조③'],
   ['공소청에서도 <b>2027.4.30까지</b> 이동 가능','부칙 제4조②'],
  ]},
  {n:'2',t:'빗장은 2년 뒤에야 걸린다',items:[
   ['「공소청 검사, 퇴직 후 <b>2년간 수사관 결격</b>」 조항이 있긴 하다','중수청법 제19조④'],
   ['그런데 이 조항은 <b>2028.10.2부터 시행</b>','부칙 제1조 단서'],
   ['즉 <b>첫 2년간은 결격 없이</b> 옮길 수 있다',''],
  ],warnDots:[2]},
  {n:'3',t:'무엇이 걱정인가',items:[
   ['사람이 그대로면 <b>관행도 따라온다</b> — 분리 취지 약화'],
   ['5급 이상 수사관은 <b>행안부장관 제청 · 대통령 임용</b>','중수청법 제18조'],
   ['경찰청과 중수청이 <b>같은 장관 아래</b>','정부조직법 제37조⑤·⑨'],
  ]},
 ],
 bottom:'조직도가 바뀌어도 사람이 그대로면 — <span class="k">첫 2년이 갈림길</span>이다'},
// ───────────────────────── 5단계 (중수청법 원문 기반 구성도)
{ step:'5단계', dense:true, title:'중수청, 어떻게 짜야 하나', sub:'법이 세운 뼈대 위에 — 사람의 구성과 밖의 감시 (중수청법 원문 대조)', page:'5 / 9',
 propose:'②·③열은 주권자사법개혁추진준비위원회의 제안입니다 — ①열의 조문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'법이 세운 뼈대 (조문)',
   flow:['청장 — 임기 2년·중임 불가·국회 탄핵 대상','↓','차장 · 시도 지방수사청','↓','수사관 1~9급 (특정직) · 수사연구관'],
   items:[
   ['<b>감찰관</b> — 내·외부 공개모집, 임기 2년, 전보·면직 제한으로 신분 보장','중수청법 제26~28조'],
   ['칸막이 — 공소청 <b>파견·겸임 금지</b> · 퇴직 후 <b>2년 검사 임용 불가</b>','제24조·제25조'],
  ]},
  {n:'2',t:'제안 — 사람의 구성',items:[
   ['<b>공개경쟁 채용이 기본</b> + <b>출신별 상한 3분의 1</b> — 어느 출신도 다수가 안 되게','제20조① 원칙'],
   ['<b>회계사·포렌식·자금추적 전문가</b>를 경력경쟁으로','제20조① 단서 활용'],
   ['<b>적법절차관(변호사)</b> — 압수·영장의 적법성을 집행 전에 검토하는 내부 전담역'],
   ['시행 초기 <b>지휘 보직의 출신 편중 제한</b>'],
  ]},
  {n:'3',t:'제안 — 밖의 감시',items:[
   ['현행 수사심의위 — 명부는 <b>청장이 위촉</b>, 회의만 무작위 15명, 결정은 <b>권고</b>','제44조③·⑤ — 안에서 뽑은 눈'],
   ['<b>시민기소심사위원회</b> — 기소·불기소를 무작위 시민이 심사, 결정에 <b>구속력</b>'],
   ['<b>법률감찰단</b>(입법부 산하) — 수사·기소를 행정부 밖에서 상시 감찰'],
   ['<b>시민옴부즈만</b> — 시민 진정을 조사해 공표'],
  ],warnDots:[0]},
 ],
 bottom:'<span class="pre">제안</span>안의 칸막이는 법이 세웠다 — 아직 없는 것은 <span class="k">밖의 눈</span>, 그것이 우리 안이다'},
// ───────────────────────── 6단계(구 4단계)
{ step:'6단계', title:'변호사 시장은 어떻게 커지나', sub:'「신청할 수 있다」가 늘어날 때 생기는 일', page:'6 / 9',
 cols:[
  {n:'1',t:'신청 절차가 일곱 갈래로',chips:['시정조치 신청','녹화영상 열람·복사','불송치 이의신청','수사지연 이의제기','기록 열람·등사','검사 면담 신청','재정신청 확대'],items:[
   ['그런데 개정법 전문에 <b>「국선」 0회 · 「법률구조」 0회</b>','의안 2220257 원문 검색'],
  ]},
  {n:'2',t:'조력 없이는 좁은 문',items:[
   ['이의신청 <b>기소율 2%대 정체</b> — 신청은 4년새 2배','대검찰청 국정감사 자료 2021~25'],
   ['1심 형사재판 <b>무변호인 34%</b>','사법연감 2022 (2021년 통계)'],
   ['기록 열람 <b>거부에 불복 절차 없음</b>','형소법 제245조의12④'],
  ]},
  {n:'3',t:'값은 정해져 있지 않다',items:[
   ['상담료는 <b>부르는 게 값</b> — 공식 통계도 공시 제도도 없다','확인 가능한 가격 자료 부재'],
   ['절차가 늘수록 <b>서면 작성 수요</b>가 는다'],
   ['비용은 <b>조력 없는 쪽</b>이 치른다'],
  ]},
 ],
 bottom:'절차가 늘수록 <span class="k">「신청서를 써 줄 사람」의 값</span>이 오른다'},
// ───────────────────────── 5단계
{ step:'7단계', title:'왜 논란이 되나', sub:'방향의 논쟁이 아니라 「구멍을 메웠는가」의 논쟁', page:'7 / 9',
 cols:[
  {n:'1',t:'숫자가 어긋난다',items:[
   ['수사 구속 <b>최대 30일</b> — 경찰 10일 + 검사 10일 + 연장 10일(1회)','형소법 제202조·제203조·제205조①'],
   ['보완수사요구 이행 기한 <b>1개월</b>','형소법 제197조의2④'],
   ['구속 사건에선 <b>수사가 끝나기 전에 기간이 끝난다</b>',''],
  ],warnDots:[2]},
  {n:'2',t:'「한 지붕」 논란',items:[
   ['경찰청·중수청 모두 <b>행안부장관 소속</b>','정부조직법 제37조⑤·⑨'],
   ['그 장관이 <b>중수청장을 지휘·감독</b>','중수청법 제6조'],
   ['범죄정보 조직·NDFaaS 향방은 <b>대통령령(직제)으로</b> — 국회 심의 없음','현 근거: 검찰청 사무기구 규정 제3조의5·제9조의2'],
  ]},
  {n:'3',t:'참여 장치의 한계',items:[
   ['사건심의위·수사심의위 위원은 <b>기관장이 위촉</b>','공소청법 제21조 · 중수청법 제44조'],
   ['심의 결과에 <b>구속력 없음</b>'],
   ['후속 입법·직제 미완, 공소유지 공백 <b>우려 보도</b> 계속','언론 보도 종합'],
  ]},
 ],
 warn:'확정되어 시행되는 것과 앞으로 논의될 것을 구분해서 볼 것 — 섞이면 오보가 된다',
 bottom:'쟁점은 폐지 여부가 아니라 — <span class="k">어긋난 숫자와 빈 통제 장치</span>'},
// ───────────────────────── 6단계
{ step:'8단계', title:'대안은 무엇인가', sub:'시민이 이해관계자가 되면 되돌리기 어렵다', page:'8 / 9',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 제안입니다 — 조문 확인 결과와 구분됩니다',
 cols:[
  {n:'1',t:'시민이 결정에 들어간다',items:[
   ['<b>시민기소심사위원회</b> — 위원은 무작위 추첨, 결정엔 구속력'],
   ['<b>참심제</b> — 시민이 법관과 함께 재판부에'],
   ['기소·재판에 시민이 앉으면 <b>되돌리는 일이 「권리 박탈」</b>이 된다'],
  ]},
  {n:'2',t:'감시는 지붕 밖에',items:[
   ['<b>법률감찰관 · 사법옴부즈만</b> — 행정부 밖에서 수사·기소 상시 감시'],
   ['수사기록·증거서버의 <b>접근기록을 법률로</b> — 자동 보존·외부 감사'],
   ['감시자와 피감시자가 <b>같은 지붕 아래 있지 않게</b>'],
  ]},
  {n:'3',t:'숫자를 맞추고, 값을 공개한다',items:[
   ['구속 사건의 보완수사 기한 <b>정합화</b> (20일 ↔ 1개월)'],
   ['무죄율·절차 이행을 <b>기관 단위로 정기 공표</b>'],
   ['수임료·상담료 <b>가격 공시</b> — 조력의 값을 보이게'],
  ]},
 ],
 bottom:'<span class="pre">제안</span>되돌릴 수 없게 만드는 힘은 — <span class="k">시민이 이해관계자가 되는 것</span>'},
// ───────────────────────── 9단계 (문해력 문턱 — 조문 확인 + 제안)
{ step:'9단계', title:'글을 몰라도 작동하는 권리', sub:'문해력의 문턱 — 절차의 입구와 출구가 다르다 (조문 확인)', page:'9 / 9', dense:true,
 propose:'③열은 주권자사법개혁추진준비위원회의 제안입니다 — ①·②열의 조문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'입구는 이미 열려 있다',items:[
   ['고소·고발은 <b>서면 또는 구술</b>로 할 수 있다','형소법 제237조①'],
   ['구술이면 <b>경찰이 서류를 작성할 의무</b>','같은 조 ②'],
   ['<b>대리인을 통한 고소</b>도 가능','형소법 제236조'],
  ]},
  {n:'2',t:'출구는 침묵한다',items:[
   ['이의신청 조문에는 <b>방식 규정이 없다</b> — 실무는 서식으로','형소법 제245조의7 확인'],
   ['불송치 통지에 <b>안내와 서식 동봉</b> 의무는 신설됐다','형소법 제245조의6 (개정)'],
   ['그런데 서식은 <b>읽고 쓸 수 있는 사람</b>을 전제한다 — 문해력이 곧 문턱',''],
  ],warnDots:[2]},
  {n:'3',t:'제안 — 쓸 필요를 없앤다',items:[
   ['<b>구술 이의신청 + 조서 작성 의무</b>를 명문화 — 제237조의 원리를 출구에도'],
   ['장애인·아동·고령 피해자 사건 불송치는 <b>자동으로 검사 재검토</b>(원치 않으면 제외)'],
   ['<b>쉬운 언어 통지</b> + 무료 조력 안내 의무 + <b>절차조력인</b> 동행'],
  ]},
 ],
 warn:'「신청할 수 있다」는 읽고 쓸 수 있는 사람의 말이다 — 신청이 필요 없으면 문해력도 필요 없다',
 bottom:'<span class="pre">제안</span>권리는 <span class="k">마지막 한 사람에게 닿아야</span> 권리다'},
];

function renderCol(c){
  let h = `<div class="col"><div class="colhead"><div class="n">${c.n}</div><div class="t">${c.t}</div></div><div class="colbody">`;
  if (c.flow) h += `<div class="flow">` + c.flow.map(f=>/^(→|＋)$/.test(f)?`<span class="farr">${f}</span>`:`<span class="fbox">${f}</span>`).join('') + `</div>`;
  if (c.chips) h += `<div class="chips">` + c.chips.map(x=>`<span class="c">${x}</span>`).join('') + `</div>`;
  (c.items||[]).forEach((it,i)=>{
    const [tx,ref] = it;
    const cls = (c.warnDots||[]).includes(i) ? 'dot warn' : 'dot';
    h += `<div class="item"><div class="${cls}"></div><div class="tx">${tx}${ref?`<span class="ref">${ref}</span>`:''}</div></div>`;
  });
  return h + `</div></div>`;
}

cards.forEach((card,idx)=>{
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body class="${idx>0?'m1 ':''}${card.dense?'dense':''}">
  <div class="top">
    <div class="chip">형사소송법 개정<br>문제와 보완</div>
    <div class="titles"><h1><span class="step">${card.step}</span><span class="bar">|</span>${card.title}</h1>
    <div class="sub">${card.sub}</div></div>
    <div class="page">${card.page}</div>
  </div>
  ${card.propose?`<div class="propose">※ ${card.propose}</div>`:''}
  <div class="cols">${card.cols.map(renderCol).join('')}</div>
  ${card.warn?`<div class="warnbox"><div class="tag">주의</div><div class="tx">${card.warn}</div></div>`:''}
  <div class="bottom">${card.bottom}</div>
  <div class="foot"><span>시민법정 · 주권자사법개혁추진준비위원회(준) — 시민법정.kr/law-diff</span><span>근거: 법률 제21490·21491호, 의안 2220257 원문 (항목별 조문 표기)</span></div>
  </body></html>`;
  fs.writeFileSync(path.join(OUT, `card${idx+1}.html`), html);
  console.log(`card${idx+1}.html 생성`);
});
