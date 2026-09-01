// 판결서 공개 카드뉴스 생성기 — 6단계 시리즈 (⚠ 초안)
// 내용 원칙: 이 시리즈의 제도 세부(연혁·수수료·조문)는 아직 1차 자료로 확인하지 못했다.
//            항목마다 「확인 필요」를 표기했고, 게시 전 데스크탑 검증이 필수다.
//            5~6단계는 주권자사법개혁추진준비위원회 제안임을 배지로 명시한다.
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
body{font-family:'NotoKR',sans-serif;background:linear-gradient(160deg,#f3efe7 0%,#ece5d8 55%,#e2d8c6 100%);color:#2c2416;display:flex;flex-direction:column;padding:36px 52px 24px;}
.top{display:flex;align-items:flex-start;gap:26px;margin-bottom:10px;}
.chip{background:#5b3a10;color:#fff;font-weight:900;font-size:31px;padding:14px 26px;border-radius:14px;letter-spacing:1px;white-space:nowrap;align-self:flex-start;box-shadow:0 6px 14px rgba(91,58,16,.25);}
.titles{flex:1;}
h1{font-size:65px;font-weight:900;color:#3a2a0e;line-height:1.08;letter-spacing:-1px;}
h1 .step{color:#a16207;}
h1 .bar{color:#c2ad8a;font-weight:400;margin:0 14px;}
.sub{font-size:35px;color:#6b5636;font-weight:700;margin-top:10px;}
.page{margin-left:auto;background:#fff;border:3px solid #5b3a10;color:#5b3a10;font-weight:900;font-size:29px;padding:8px 22px;border-radius:999px;}
.cols{display:flex;gap:26px;flex:1 1 0;min-height:0;overflow:hidden;margin-top:16px;}
.col{flex:1;background:#fff;border-radius:22px;box-shadow:0 10px 24px rgba(91,58,16,.13);padding:0 0 18px;display:flex;flex-direction:column;overflow:hidden;}
.colhead{background:#5b3a10;color:#fff;padding:16px 22px;display:flex;align-items:center;gap:14px;}
.colhead .n{background:#fff;color:#5b3a10;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:28px;flex:none;}
.colhead .t{font-size:38px;font-weight:900;line-height:1.15;}
.item{padding:0 24px;display:flex;gap:13px;align-items:flex-start;}
.item .dot{width:14px;height:14px;border-radius:3px;background:#a16207;margin-top:20px;flex:none;}
.item .dot.warn{background:#c2410c;}
.item .tx{font-size:39px;line-height:1.38;color:#43371f;}
.item b{color:#3a2a0e;font-weight:900;}
.ref{display:block;font-size:27px;color:#9a8a68;margin-top:2px;font-weight:400;}
.warnbox{flex:none;margin-top:14px;background:#fff2ee;border:3px solid #e0693c;border-radius:16px;padding:14px 24px;display:flex;gap:18px;align-items:flex-start;}
.warnbox .tag{background:#b23c17;color:#fff;font-weight:900;font-size:26px;padding:7px 16px;border-radius:10px;flex:none;margin-top:2px;}
.warnbox .tx{font-size:31px;line-height:1.4;color:#7f2e12;font-weight:700;}
.bottom{flex:none;margin-top:14px;background:linear-gradient(90deg,#3a2a0e,#7a5215);color:#fff;border-radius:18px;padding:16px 30px;font-size:37px;font-weight:900;line-height:1.3;box-shadow:0 8px 18px rgba(58,42,14,.3);}
.bottom .k{color:#ffd34d;}
.bottom .pre{display:inline-block;background:#ffd34d;color:#3a2a0e;font-size:26px;border-radius:9px;padding:3px 14px;margin-right:16px;vertical-align:6px;}
.foot{flex:none;margin-top:9px;display:flex;justify-content:space-between;font-size:21px;color:#8a7a58;font-weight:700;}
.propose{margin-top:2px;margin-bottom:6px;background:#fdf6e3;border:3px dashed #a16207;border-radius:14px;padding:8px 22px;font-size:28px;font-weight:900;color:#5b3a10;}
`;

const cards = [
// ───────────────────────── 1단계
{ step:'1단계', title:'재판은 공개다 — 그런데 판결문은?', sub:'헌법의 선언과 열람의 현실', page:'1 / 6',
 cols:[
  {n:'1',t:'헌법은 이렇게 선언한다',items:[
   ['「재판의 심리와 판결은 <b>공개</b>한다」','헌법 제109조'],
   ['공개가 <b>원칙</b>이고 비공개가 예외다'],
   ['비공개도 <b>법원의 결정</b>이 있어야 한다','같은 조 단서 · 문언 확인 필요'],
  ]},
  {n:'2',t:'그런데 판결문을 보려면',items:[
   ['<b>사건번호를 알아야</b> 찾을 수 있고','통합 검색 제한적 · 확인 필요'],
   ['<b>건당 수수료</b>를 내야 하며','확인 필요'],
   ['<b>비실명화된 문서 한 건씩</b>만 볼 수 있다','확인 필요'],
  ]},
  {n:'3',t:'무엇이 이상한가',items:[
   ['법정 방청은 <b>누구나</b> — 판결문은 <b>아는 사람만</b>'],
   ['재판 감시가 <b>언론 보도에 의존</b>하게 된다'],
   ['「어느 재판부가 어떤 판결을 하나」를 <b>데이터로 검증할 수 없다</b>'],
  ],warnDots:[2]},
 ],
 bottom:'공개는 <span class="k">선언돼</span> 있다 — 닫혀 있는 것은 <span class="k">문서</span>다'},
// ───────────────────────── 2단계
{ step:'2단계', title:'지금 제도는 어떻게 되어 있나', sub:'판결서 인터넷 열람 — 알려진 골격 (⚠ 1차 자료 검증 전)', page:'2 / 6',
 cols:[
  {n:'1',t:'언제부터 열렸나',items:[
   ['형사 — <b>2013년 이후 확정</b> 사건부터','연혁 확인 필요'],
   ['민사 — <b>2015년 이후</b> 사건부터','연혁 확인 필요'],
   ['민사 쪽 <b>미확정</b> 판결서는 2023년부터','연혁 확인 필요'],
  ]},
  {n:'2',t:'어떻게 볼 수 있나',items:[
   ['대법원 <b>판결서 인터넷 열람</b>에서 사건 특정 후 신청'],
   ['<b>건당 수수료</b> 납부','금액 확인 필요'],
   ['<b>비실명화 처리</b>된 문서로 제공'],
  ]},
  {n:'3',t:'근거 조문 (미수집)',items:[
   ['형사 — <b>형사소송법 제59조의3</b>','원문 미수집 ⚠'],
   ['민사 — <b>민사소송법 제163조의2</b>','원문 미수집 ⚠'],
   ['심리 공개 — <b>법원조직법 제57조</b>','원문 미수집 ⚠'],
  ],warnDots:[0,1,2]},
 ],
 warn:'이 카드의 연혁·수수료·조문은 아직 국가법령정보센터 원문과 대법원 안내로 확인하지 못했다 — 게시 전 검증 필수',
 bottom:'제도는 <span class="k">있다</span> — 다만 「한 건씩, 돈 내고, 아는 사람만」의 공개다'},
// ───────────────────────── 3단계
{ step:'3단계', title:'막히는 다섯 지점', sub:'무엇을, 어떻게, 어디서 못 보는가', page:'3 / 6',
 cols:[
  {n:'1',t:'무엇을 못 보나',items:[
   ['<b>형사 미확정</b> 판결서 — 진행 중 재판은 감시 불가','범위 확인 필요'],
   ['<b>과잉 비실명화</b> — 맥락까지 지워져 판독이 어렵다'],
  ]},
  {n:'2',t:'어떻게 못 보나',items:[
   ['<b>유료·건별</b> — 대량 분석이 불가능하다'],
   ['<b>기계가 읽기 어려운 문서</b> — 데이터가 되지 못한다'],
  ]},
  {n:'3',t:'어떻게 못 찾나',items:[
   ['<b>사건번호를 모르면</b> 접근이 어렵다'],
   ['기일 조회·판결서·보도가 <b>따로 논다</b> — 통합 조회가 없다'],
  ]},
 ],
 bottom:'다섯 구멍의 공통점 — <span class="k">「한 건씩」은 되지만 「전체를」은 안 된다</span>'},
// ───────────────────────── 4단계
{ step:'4단계', title:'왜 문제인가', sub:'보이지 않으면 검증할 수 없다', page:'4 / 6',
 cols:[
  {n:'1',t:'양형을 검증할 수 없다',items:[
   ['같은 죄, 다른 형 — <b>재판부별 경향</b>을 시민이 확인할 길이 없다'],
   ['비교하려면 <b>전체가 데이터로</b> 열려야 한다'],
  ]},
  {n:'2',t:'감시가 언론에 묶인다',items:[
   ['보도되는 사건만 보인다 — <b>보도되지 않으면 아무도 모른다</b>'],
   ['언론 요약은 사건을 섞는다 — <b>원문 없이는 바로잡을 수도 없다</b>'],
  ],warnDots:[1]},
  {n:'3',t:'열쇠는 있는데 문이 없다',items:[
   ['이름 검색은 사건을 섞는다 — <b>사건번호만이 하나를 가리킨다</b>'],
   ['그런데 시민에게는 사건번호로 기일·판결·기록을 <b>한 번에 볼 곳이 없다</b>'],
  ]},
 ],
 bottom:'잘못한 사람과 손해 보는 사람이 다른 구조는 — <span class="k">보이지 않는 곳에서 자란다</span>'},
// ───────────────────────── 5단계
{ step:'5단계', title:'제안 — 다섯 가지', sub:'「신청하면 열어 준다」에서 「기본이 열려 있다」로', page:'5 / 6',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 제안입니다 — 1~4단계의 현황 설명과 구분됩니다',
 cols:[
  {n:'1',t:'원칙을 뒤집는다',items:[
   ['<b>기본 공개</b> — 비공개는 법률에 열거된 예외만'],
   ['성폭력 피해자·미성년자 보호 등 <b>보호 사유는 법정화</b>'],
   ['비공개 결정에는 <b>불복 절차</b>를 둔다'],
  ]},
  {n:'2',t:'범위를 넓힌다',items:[
   ['<b>전 심급</b> — 1심부터 공개해야 항소심 감시가 된다'],
   ['<b>미확정 포함</b> — 형사는 비실명 즉시 공개 + 확정 후 실명 전환'],
   ['무죄추정과의 긴장은 <b>단계 설계</b>로 푼다'],
  ]},
  {n:'3',t:'방식을 바꾼다',items:[
   ['<b>무료 · 기계판독 형식 · 오픈 API</b>'],
   ['비실명화 기준 공개 — <b>판사·검사 등 공적 수행자는 실명 유지</b>'],
   ['<b>사건번호 하나로</b> 기일·판결서·공보 통합 조회'],
  ]},
 ],
 bottom:'<span class="pre">제안</span>③이 핵심이다 — <span class="k">데이터가 아니면 검증이 아니다</span>'},
// ───────────────────────── 6단계
{ step:'6단계', title:'이것은 별도 쟁점이 아니다', sub:'시민 감시 제안 전체의 기반 시설', page:'6 / 6',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 제안입니다',
 cols:[
  {n:'1',t:'우리 안의 「밖의 눈」들',items:[
   ['<b>시민기소심사위원회</b> — 기소·불기소를 시민이 심사'],
   ['<b>법률감찰단</b> — 행정부 밖에서 상시 감찰'],
   ['<b>시민옴부즈만</b> — 진정을 조사해 공표'],
  ]},
  {n:'2',t:'눈이 보려면 빛이 필요하다',items:[
   ['판결문·불기소장이 <b>데이터로 열려야</b> 눈이 작동한다'],
   ['닫힌 채라면 밖의 눈을 만들어도 <b>볼 것이 없다</b>'],
  ],warnDots:[1]},
  {n:'3',t:'공개는 예방이다',items:[
   ['보이는 곳에서는 <b>행동이 달라진다</b>'],
   ['제재도 조직도 필요 없는 — <b>가장 값싼 예방 장치</b>'],
   ['수사 기록의 「밖의 눈」 논리와 같다 — 터지기 전에 행동을 바꾼다'],
  ]},
 ],
 bottom:'<span class="pre">제안</span>밖의 눈은 만들었다 — 이제 <span class="k">불을 켜는 일</span>이 남았다'},
];

function renderCol(c){
  let h = `<div class="col"><div class="colhead"><div class="n">${c.n}</div><div class="t">${c.t}</div></div><div class="colbody" style="flex:1;display:flex;flex-direction:column;justify-content:space-evenly;padding:6px 0 10px;">`;
  (c.items||[]).forEach((it,i)=>{
    const [tx,ref] = it;
    const cls = (c.warnDots||[]).includes(i) ? 'dot warn' : 'dot';
    h += `<div class="item"><div class="${cls}"></div><div class="tx">${tx}${ref?`<span class="ref">${ref}</span>`:''}</div></div>`;
  });
  return h + `</div></div>`;
}

cards.forEach((card,idx)=>{
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
  <div class="top">
    <div class="chip">판결서 공개</div>
    <div class="titles"><h1><span class="step">${card.step}</span><span class="bar">|</span>${card.title}</h1>
    <div class="sub">${card.sub}</div></div>
    <div class="page">${card.page}</div>
  </div>
  ${card.propose?`<div class="propose">※ ${card.propose}</div>`:''}
  <div class="cols">${card.cols.map(renderCol).join('')}</div>
  ${card.warn?`<div class="warnbox"><div class="tag">주의</div><div class="tx">${card.warn}</div></div>`:''}
  <div class="bottom">${card.bottom}</div>
  <div class="foot"><span>시민법정 · 주권자사법개혁추진준비위원회(준) — 시민법정.kr/law-diff</span><span>※ 초안 — 게시 전 조문·연혁·수수료 원문 검증 필요</span></div>
  </body></html>`;
  fs.writeFileSync(path.join(OUT, `jcard${idx+1}.html`), html);
  console.log(`jcard${idx+1}.html 생성`);
});
