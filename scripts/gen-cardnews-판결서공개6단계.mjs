// 판결서 공개 카드뉴스 생성기 — 6단계 시리즈 (확정판, 2026-09-01 원문 검증 완료)
// 내용 원칙: 조문·연혁은 docs/bills/의 형소법·민소법·법원조직법 원문에서 직접 확인했다.
//            수수료 등 대법원규칙 위임 사항만 「확인 필요」로 남긴다.
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
body{font-family:'NotoKR',sans-serif;background:linear-gradient(160deg,#f3efe7 0%,#ece5d8 55%,#e2d8c6 100%);color:#2c2416;display:flex;flex-direction:column;padding:36px 52px 24px;word-break:keep-all;overflow-wrap:break-word;}
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
{ step:'1단계', title:'재판은 공개다 — 그런데 판결문은?', sub:'법이 선언한 원칙과 열람의 현실 (원문 확인)', page:'1 / 6',
 cols:[
  {n:'1',t:'법은 이렇게 선언한다',items:[
   ['「재판의 심리와 판결은 <b>공개</b>한다」','법원조직법 제57조① · 헌법 제109조와 같은 문언'],
   ['비공개 예외는 <b>심리에만</b> 있다 — <b>판결은 비공개로 할 길이 조문에 없다</b>','같은 항 단서'],
   ['비공개 결정도 <b>이유를 밝혀 선고</b>해야 한다','같은 조 ②'],
  ]},
  {n:'2',t:'그런데 판결문을 보려면',items:[
   ['형사는 <b>확정된 사건만</b> 열람·복사할 수 있다','형소법 제59조의3①'],
   ['<b>비실명화 처리</b>를 거친 문서로 제공된다','같은 조 ② · 민소법 제163조의2③'],
   ['방법·절차·수수료는 <b>대법원규칙</b>으로','같은 조 ⑥ · 수수료 실무 확인 필요'],
  ]},
  {n:'3',t:'무엇이 이상한가',items:[
   ['법정 방청은 <b>누구나</b> — 판결문은 <b>아는 사람만</b>'],
   ['재판 감시가 <b>언론 보도에 의존</b>하게 된다'],
   ['「어느 재판부가 어떤 판결을 하나」를 <b>데이터로 검증할 수 없다</b>'],
  ],warnDots:[2]},
 ],
 bottom:'공개는 <span class="k">선언돼</span> 있다 — 닫혀 있는 것은 <span class="k">문서</span>다'},
// ───────────────────────── 2단계
{ step:'2단계', title:'형사와 민사가 다르다', sub:'같은 「판결서 열람」인데 조문 제목부터 다르다 (원문 대조)', page:'2 / 6',
 cols:[
  {n:'1',t:'형사 — 확정된 것만',items:[
   ['조문 제목이 「<b>확정</b> 판결서등의 열람·복사」','형소법 제59조의3'],
   ['제한 사유 5개 호 — 비공개 심리·소년사건·증거인멸 우려·국가안전보장 등','같은 조 ① 단서'],
   ['<b>검색 제공 의무가 없다</b>',''],
  ],warnDots:[2]},
  {n:'2',t:'민사 — 선고되면 열린다',items:[
   ['「판결이 <b>선고된</b> 사건」 — <b>확정 전 판결서도 포함</b>','민소법 제163조의2① (2023.1.1.~)'],
   ['<b>문자열·숫자열이 검색어로 기능</b>하도록 제공할 의무','같은 조 ② (2020.12.8. 신설)'],
   ['다만 <b>소액사건·심리불속행 판결서는 제외</b>','같은 조 ① 괄호'],
  ],warnDots:[2]},
  {n:'3',t:'연혁 — 부칙에서 확인',items:[
   ['형사 — <b>2013. 1. 1.</b>부터, 확정 사건','법률 제10864호 부칙 제1조②'],
   ['민사 — <b>2015. 1. 1.</b>부터, 확정 판결서','법률 제10859호 부칙'],
   ['민사 — <b>2023. 1. 1.</b>부터 선고 기준(미확정 포함)','법률 제17568호 부칙'],
  ]},
 ],
 warn:'요약 — 민사가 형사보다 넓다. 민사는 확정 전에도 열리고 검색까지 의무인데, 형사는 확정돼야 열린다. 두 조문을 바꿔 쓰지 말 것',
 bottom:'같은 「공개」인데 — <span class="k">민사는 문이 넓고 형사는 좁다</span>'},
// ───────────────────────── 3단계
{ step:'3단계', title:'막히는 지점 다섯', sub:'조문을 끝까지 읽으면 보이는 구멍들', page:'3 / 6',
 cols:[
  {n:'1',t:'범위의 구멍',items:[
   ['형사 <b>미확정 비공개</b> — 진행 중 재판은 판결문으로 검증할 수 없다','형소법 제59조의3① (현행)'],
   ['민사 <b>소액사건 제외</b> — 생활 분쟁의 다수가 공개 대상 밖','민소법 제163조의2① 괄호'],
  ]},
  {n:'2',t:'방식의 구멍',items:[
   ['<b>검색 의무는 민사에만</b> 있다 — 형사는 규정 없음','민소법 제163조의2② 대비'],
   ['무료·기계판독·오픈 API — <b>어느 조문에도 없다</b>. 건별 열람으로는 대량 검증 불가'],
  ],warnDots:[1]},
  {n:'3',t:'불복의 구멍',items:[
   ['열람 제한에 불복할 수 있는 사람이 「<b>소송관계인·이해관계 있는 제3자</b>」뿐','형소법 제59조의3④⑤'],
   ['제1항은 「<b>누구든지</b>」인데 — 일반인이 제한을 받으면 <b>다툴 조문이 없다</b>'],
  ],warnDots:[1]},
 ],
 bottom:'다섯 구멍의 공통점 — <span class="k">「한 건씩」은 되지만 「전체를」은 안 된다</span>'},
// ───────────────────────── 4단계
{ step:'4단계', title:'이미 바뀌고 있다', sub:'형사 미확정 공개 — 공포는 됐고, 시행을 기다린다 (원문 확인)', page:'4 / 6',
 cols:[
  {n:'1',t:'무엇이 공포됐나',items:[
   ['<b>확정되지 아니한 형사 판결서도 열람·복사</b>할 수 있게 하는 개정','법률 제21241호 (2025.12.30. 공포)'],
   ['입법 이유 — 「국민의 <b>알 권리 및 사법정보 접근권</b>을 실질적으로 보장」','법제처 제·개정이유'],
  ]},
  {n:'2',t:'언제부터, 어디까지',items:[
   ['시행은 <b>공포 후 2년 — 2027. 12. 31.</b>','같은 법 부칙 제1조'],
   ['<b>2000. 8. 1. 이후 선고 사건까지 소급</b> 적용','같은 법 부칙 제2조'],
   ['범위·시기 등 세부는 <b>대법원규칙</b>에 위임','같은 조'],
  ]},
  {n:'3',t:'함께 확인한 것',items:[
   ['2026.10.2. 수사·기소 분리 개정은 <b>이 조문을 건드리지 않는다</b>','두 시행분 diff 대조 — 동일'],
   ['개정 후 조문의 구체 문언(비실명·제한 설계)은 <b>시행분 수집 후 확인</b> 예정','2027.12.31. 시행분 미수집'],
  ],warnDots:[1]},
 ],
 bottom:'방향은 정해졌다 — 남은 것은 <span class="k">속도(시행일)와 형식(데이터인가 문서인가)</span>이다'},
// ───────────────────────── 5단계
{ step:'5단계', title:'제안 — 남은 것을 완성하라', sub:'입법이 잡은 방향을 데이터까지 밀고 간다', page:'5 / 6',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 제안입니다 — 1~4단계의 조문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'범위를 마저 연다',items:[
   ['형사 미확정 공개의 <b>시행을 앞당긴다</b> — 2027년 말은 멀다'],
   ['<b>소액사건·심리불속행</b> 판결서도 공개 대상에'],
   ['<b>검색 의무를 형사에도</b> — 민소법 제163조의2②를 형소법에 나란히'],
  ]},
  {n:'2',t:'형식을 바꾼다',items:[
   ['<b>무료 · 기계판독 형식 · 오픈 API</b>'],
   ['수수료는 대법원규칙 사항 — <b>규칙 개정만으로도 움직일 수 있다</b>','형소법 제59조의3⑥'],
   ['비실명화 기준 공개 — <b>판사·검사 등 공적 수행자는 실명 유지</b>'],
  ]},
  {n:'3',t:'사람을 넓힌다',items:[
   ['열람 제한 불복을 <b>「누구든지」에게로</b> — 제1항과 제4항의 짝을 맞춘다','형소법 제59조의3①·④ 대비'],
   ['<b>사건번호 하나로</b> 기일·판결서·공보 통합 조회'],
  ]},
 ],
 bottom:'<span class="pre">제안</span>핵심은 형식이다 — <span class="k">데이터가 아니면 검증이 아니다</span>'},
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
  <div class="foot"><span>시민법정 · 주권자사법개혁추진준비위원회(준) — 시민법정.kr/law-diff</span><span>근거: 형소법·민소법·법원조직법 원문 대조 (법률 제21241·19516·21451호 등, 항목별 조문 표기)</span></div>
  </body></html>`;
  fs.writeFileSync(path.join(OUT, `jcard${idx+1}.html`), html);
  console.log(`jcard${idx+1}.html 생성`);
});
