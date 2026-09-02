// 수사준칙 개정안 카드뉴스 생성기 — 7단계 시리즈 (2026-09-02)
// 내용 원칙: 1~4단계의 조문은 전부 원문에서 확인했다 —
//   · 형사소송법(법률 제21857호, 2026.10.2 시행분)  docs/bills/형사소송법_20261002시행.txt
//   · 현행 형사소송법                                docs/bills/형사소송법_현행.txt
//   · 수사준칙 일부개정령안(입법예고 lawSeq 88322)   docs/bills/수사준칙_2026입법예고/개정령안.pdf (+조문별이유서.hwpx)
//   · 특사경 협력규정 제정안(입법예고 lawSeq 88320)  docs/bills/수사준칙_2026입법예고/특사경협력규정_제정안.txt
// 5단계는 평가, 6단계는 제안임을 배지로 명시한다. 7단계 인용문은 발언자·출처를 아직 확인하지
// 못했으므로 「확인 중」으로 비워 둔다 — 추정으로 채우지 않는다.
// 2026-09-02 사용자 확인: 7단계 인용의 발언자는 조국혁신당. 논평·브리핑의 제목과 일자는 아직 확인 못함.
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
.chip{background:#1f3b57;color:#fff;font-weight:900;font-size:31px;padding:14px 26px;border-radius:14px;letter-spacing:1px;white-space:nowrap;align-self:flex-start;box-shadow:0 6px 14px rgba(31,59,87,.25);}
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
{ step:'1단계', title:'법은 「지휘」를 지웠다', sub:'개정 형소법이 나눈 역할 — 그 준칙이 지금 입법예고 중이다 (원문 확인)', page:'1 / 7',
 cols:[
  {n:'1',t:'법이 정한 관계',items:[
   ['「검사는 <b>공소제기 및 공소유지</b>를 책임지고, 사법경찰관은 <b>수사</b>를 책임진다」 — 서로 <b>협력</b>','형소법 제195조① (2026.8.4 개정)'],
   ['사법경찰관은 검사에게 법률적 판단 등 <b>의견을 요청할 수 있다</b> — 검사는 특별한 사정이 없는 한 <b>응하여야</b>','같은 조 ③ (신설)'],
   ['협력의 <b>준칙은 대통령령</b>으로','같은 조 ④'],
  ],tight:true},
  {n:'2',t:'특사경도 「지휘」에서 「협력」으로',items:[
   ['현행 — 「<b>모든 수사에 관하여 검사의 지휘</b>를 받는다」 「지휘가 있는 때에는 <b>따라야</b> 한다」','현행 형소법 제245조의10②·④'],
   ['개정 — 「<b>상호 협력</b>하여야 한다」. 지휘 조항은 <b>삭제</b>, 「<b>지도·조언</b>」을 요청할 수 있고 검사도 할 수 있다','개정 제245조의10②·③ (④ 삭제)'],
  ],tight:true},
  {n:'3',t:'그 대통령령이 지금 예고 중',items:[
   ['수사준칙 <b>일부개정령안</b> — 공고 제2026-341호, 107쪽','법제처 입법예고 lawSeq 88322'],
   ['특사경 <b>협력규정 제정안</b> — 36개 조','법제처 입법예고 lawSeq 88320'],
   ['예고기간 <b>2026.8.28 ~ 9.4</b> — 단 7일. 시행 예정 <b>2026.10.2</b>','제정안 부칙 제1조'],
  ],warnDots:[2]},
 ],
 bottom:'법은 「지휘」를 지웠다 — <span class="k">준칙이 그 자리를 무엇으로 채우는지</span> 본다'},
// ───────────────────────── 2단계
{ step:'2단계', title:'제29조의2 ② — 「호송」', sub:'구속영장 청구 전 검사 면담 — 신설 조문을 원문으로 읽는다', page:'2 / 7',
 cols:[
  {n:'1',t:'신설 조문',items:[
   ['① 「검사는 … 피의자에게 <b>출석을 요구</b>하거나 <b>화상·전화</b> 등의 방법을 활용하여 피의자를 면담할 수 있다」','수사준칙 개정안 제29조의2①'],
   ['② 「검사는 사법경찰관에게 <b>체포된 피의자의 호송</b> 등 면담에 필요한 조치를 <b>요구할 수 있고</b>, 사법경찰관은 이에 <b>협조하여야 한다</b>」','같은 조 ② 전단'],
   ['「호송이 곤란한 특별한 사정이 있는 경우 면담 방식에 대한 <b>의견을 제시할 수 있다</b>」','같은 조 ② 후단'],
  ],quote:[0,1,2],warnDots:[1],tight:true},
  {n:'2',t:'상위법과 대조',items:[
   ['법은 「피의자를 <b>면담하거나</b> 사법경찰관에게 <b>의견제시를 요청</b>할 수 있다」까지만 정했다','형소법 제201조⑦ (신설)'],
   ['<b>호송·협조 의무는 법에 없다</b> — 대통령령이 새로 얹은 의무다'],
   ['현행 수사준칙에도 「호송」 문언은 없다 — <b>이번에 처음 생긴다</b>','신구조문대비표 대조'],
  ],warnDots:[1],tight:true},
  {n:'3',t:'이유서는 뭐라 하나',items:[
   ['주요내용 — 「<b>출석, 화상 또는 전화</b> 등 검사의 피의자 면담 방법 및 … 의견제시 요청 등 절차 구체화」. <b>호송은 한 글자도 없다</b>','조문별 개정이유서 8.'],
   ['「입법추진과정에서 논의된 주요내용 — <b>특이사항 없음</b>」','같은 항목 나.'],
   ['입법효과 — 「검사의 실효적인 심사 … <b>인권 침해 예방</b>」','같은 항목 다.'],
  ],warnDots:[0],tight:true},
 ],
 warn:'「의견을 제시할 수 있다」는 협조 의무의 예외가 아니다 — 의견을 내도 결정은 요구한 쪽에 남는다',
 bottom:'법에 없던 의무가 — <span class="k">대통령령에서 생긴다</span>'},
// ───────────────────────── 3단계
{ step:'3단계', title:'제8조의3 — 「요청」과 「요구」', sub:'사법경찰관의 의견요청 절차 — 의무가 어느 쪽에 쌓이는가 (원문 확인)', page:'3 / 7',
 cols:[
  {n:'1',t:'사법경찰관은 「하여야 한다」',items:[
   ['의견을 요청할 때 <b>개요·사실관계, 요지·쟁점, 검토의견·이유</b>를 적은 서면과 관계 서류·자료·목록을 <b>송부해야 한다</b>','개정안 제8조의3①'],
   ['검사의 의견을 「<b>존중하여 수사한다</b>」','같은 조 ③ 후단'],
   ['검사 의견과 <b>수용 여부를 기록에 편철</b>하고, 송치할 때 의견 요청 사건임을 <b>표시하여야 한다</b>','같은 조 ④'],
  ],tight:true},
  {n:'2',t:'검사는 「할 수 있다」',items:[
   ['요청 내용을 명확히 하게 하거나 관계 서류와 증거물을 송부할 것을 「<b>요구할 수 있다</b>」','같은 조 ②'],
   ['「<b>신속하게</b>」 의견을 제시하여야 한다 — <b>기한은 없다</b>. 보완수사 의견에는 7일이 있다','같은 조 ③ 전단 · 개정안 주요내용 다.'],
   ['의무 문언을 세면 — 사법경찰관 <b>「하여야 한다」 셋</b>, 검사 <b>하나</b>'],
  ],warnDots:[2],tight:true},
  {n:'3',t:'상위법과 대조',items:[
   ['법은 사법경찰관의 「<b>요청</b>」과 검사의 「<b>응할 의무</b>」만 정했다','형소법 제195조③'],
   ['「존중」·기록·표시 의무는 <b>법에 없다</b> — 대통령령이 얹었다'],
   ['법은 「<b>서로</b> 협력」이라 썼다 — 의무가 한쪽에만 쌓이면 「서로」가 아니다','형소법 제195조①'],
  ],warnDots:[1]},
 ],
 bottom:'한쪽은 「하여야 한다」 — <span class="k">다른 쪽은 「요구할 수 있다」</span>'},
// ───────────────────────── 4단계
{ step:'4단계', title:'특사경 — 「지도·조언」의 무게', sub:'제정안이 「지휘」의 빈자리에 무엇을 써 넣었나 (원문 확인)', page:'4 / 7',
 cols:[
  {n:'1',t:'법이 바꾼 것',items:[
   ['「모든 수사에 관하여 <b>검사의 지휘</b>」 → 「<b>상호 협력</b>하여야 한다」','형소법 제245조의10② (현행→개정)'],
   ['「지휘가 있는 때에는 <b>따라야 한다</b>」 — <b>삭제</b>','같은 조 ④ 삭제'],
   ['지도·조언은 「<b>요청할 수 있고</b> … 검사도 필요한 경우 <b>할 수 있다</b>」','같은 조 ③'],
  ],tight:true},
  {n:'2',t:'제정안이 얹은 것',items:[
   ['지도·조언을 「<b>존중하여 수사에 반영하여야</b> 한다」','제정안 제25조①'],
   ['이행하지 않으면 「<b>구체적 사유</b>」를 의견서에 기재해야','같은 조 ②'],
   ['정당한 이유 없이 미이행 → <b>보완수사요구·시정조치요구</b>','같은 조 ③'],
   ['검사가 기한을 정한 지도·조언은 「<b>그 기한 내에 이행해야</b>」. 못 하면 사유를 소명해 연장 요청','제정안 제24조①·②'],
  ],warnDots:[2,3],tight:true},
  {n:'3',t:'그 밖에',items:[
   ['검찰총장·지방공소청장이 「<b>일반적 지도·조언 지침</b>」을 만들어 시행','제정안 제19조①'],
   ['소속 기관장은 지명 현황·사건 처리 현황 자료 제출에 「<b>협조하여야</b>」','같은 조 ②'],
   ['다만 서류·증거물 송부는 「<b>요청</b>」 — 수사준칙 제8조의3②의 「요구」와 단어가 다르다','제정안 제23조③'],
  ],tight:true},
 ],
 bottom:'「따라야 한다」는 지웠는데 — <span class="k">「이행해야 한다」가 남았다</span>'},
// ───────────────────────── 5단계
{ step:'5단계', title:'무엇이 문제인가', sub:'조문이 현장에서 무엇을 만들어 내는가', page:'5 / 7',
 propose:'이 카드는 조문에 대한 평가입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'호송 의무의 무게',items:[
   ['체포에서 구속영장 청구까지 <b>48시간</b> — 호송 왕복이 그 시간을 갉아먹는다','형소법 제200조의2⑤'],
   ['호송에는 <b>인력이 묶이고</b>, 이동 중 <b>도주·사고</b> 위험이 따른다'],
   ['체포된 피의자를 밖으로 옮기면 피해자·참고인과 <b>동선이 겹칠</b> 수 있다 — 2차 피해 우려'],
  ],warnDots:[1,2],tight:true},
  {n:'2',t:'대안은 조문 안에 있다',items:[
   ['①항이 <b>화상·전화 면담</b>을 허용한다 — 호송 없이도 면담이 된다','제29조의2①'],
   ['검사가 유치 장소로 가면 된다 — <b>한 사람이 움직이는 쪽</b>이 싸다'],
   ['체포된 피의자는 어차피 <b>다음날까지 판사가 심문</b>한다 — 사전 면담의 필요는 그만큼 작다','형소법 제201조의2①'],
  ]},
  {n:'3',t:'「존중」의 무게',items:[
   ['「존중하여 수사」 + 「수용 여부 기록」 = <b>따르지 않으면 이유를 남겨야</b> 한다 — 이름은 협력, <b>형식은 지휘</b>','제8조의3③·④'],
   ['특사경은 한 걸음 더 — 미이행이면 <b>보완수사·시정조치</b>','제정안 제25조③'],
   ['협력은 의견을 <b>주고받는</b> 것이다 — 한쪽만 「하여야 한다」면 협력이 아니다'],
  ],warnDots:[0,1],tight:true},
 ],
 bottom:'협력은 주고받는 것이다 — <span class="k">한쪽만 「하여야 한다」면 지휘다</span>'},
// ───────────────────────── 6단계
{ step:'6단계', title:'제안 — 9월 4일 전에', sub:'입법예고가 끝나기 전에 고칠 것 세 가지', page:'6 / 7',
 propose:'이 카드는 주권자사법개혁추진준비위원회의 제안입니다 — 1~4단계의 원문 확인과 구분됩니다',
 cols:[
  {n:'1',t:'제29조의2 ②를 뺀다',items:[
   ['<b>호송·협조 의무를 삭제</b>한다 — 법 제201조⑦이 준 것은 「면담」과 「의견제시 요청」뿐이다'],
   ['면담은 <b>화상·전화·검사 출장</b>을 원칙으로 쓴다'],
   ['호송은 <b>사법경찰관이 동의한 경우에만</b> — 요구가 아니라 협의로'],
  ]},
  {n:'2',t:'제8조의3을 대칭으로',items:[
   ['검사의 「<b>요구</b>」를 「<b>요청</b>」으로 — 법이 쓴 단어로 돌린다'],
   ['검사 회신에 <b>기한</b>을 둔다 — 보완수사 의견처럼 7일. 기한을 넘기면 <b>사법경찰관 판단으로 진행</b>'],
   ['「존중」·수용 여부 기록은 삭제하거나, 남기려면 <b>양방향</b>으로 — 검사도 사법경찰관 의견의 수용 여부를 남긴다'],
  ],tight:true},
  {n:'3',t:'특사경 제정안과 절차',items:[
   ['제25조③ 「미이행 → 보완수사·시정조치」를 뺀다 — 그 요건은 <b>법 제197조의2·3이 이미 정한다</b>'],
   ['<b>9월 4일까지</b> 의견서를 낸다 — 법무부 형사법제과','입법예고 공고'],
   ['사법제도비서관실이 <b>회의를 다시 열어</b> 국무회의 전에 초안을 고친다'],
  ],tight:true},
 ],
 bottom:'<span class="pre">제안</span>법이 지운 「지휘」를 — <span class="k">준칙이 되살리지 못하게 한다</span>'},
// ───────────────────────── 7단계
{ step:'7단계', title:'핵심 인용', sub:'개정안을 둘러싼 조국혁신당의 말 — 논평·브리핑 일자는 확인 후 기재한다', page:'7 / 7',
 cols:[
  {n:'1',t:'글자 몇 개의 문제가 아니다',items:[
   ['「검찰 개혁은 법에서 수사권이라는 글자 몇 개를 지우는 것으로 끝나지 않습니다. 검사가 수사 기관의 <b>상관이라는 오랜 선민의식과 조직 문화</b>까지 걷어내야 비로소 기소의 분리가 완성됩니다.」','조국혁신당 (2026.8. 입법예고 관련 발언) — 논평·브리핑 일자 확인 중'],
  ],quote:[0]},
  {n:'2',t:'협력의 뜻',items:[
   ['「협력은 의견을 주고받는 것이지 <b>한쪽의 의견을 사실상 따르게 만드는 것</b>이 아닙니다. … 법무부는 검사가 수사 기관보다 우월하다는 <b>낡은 인식부터 버려야</b> 할 것입니다.」','조국혁신당 (2026.8. 입법예고 관련 발언) — 논평·브리핑 일자 확인 중'],
  ],quote:[0]},
  {n:'3',t:'막아야 할 것',items:[
   ['「경찰에게 <b>이전엔 없던 호송 의무</b>를 부과하는 그러한 대통령령이 제정되는 것은 <b>반드시 막아야</b> 한다고 생각합니다.」','조국혁신당 (2026.8. 입법예고 관련 발언) — 논평·브리핑 일자 확인 중'],
   ['조문으로 확인한 사실 — 호송 의무는 현행 수사준칙에도, 개정 형소법에도 없다','2단계'],
  ],quote:[0],tight:true},
 ],
 bottom:'기소의 분리는 — <span class="k">조직 문화까지 걷어내야</span> 완성된다'},
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
    <div class="chip">수사준칙</div>
    <div class="titles"><h1><span class="step">${card.step}</span><span class="bar">|</span>${card.title}</h1>
    <div class="sub">${card.sub}</div></div>
    <div class="page">${card.page}</div>
  </div>
  ${card.propose?`<div class="propose">※ ${card.propose}</div>`:''}
  <div class="cols">${card.cols.map(renderCol).join('')}</div>
  ${card.warn?`<div class="warnbox"><div class="tag">주의</div><div class="tx">${card.warn}</div></div>`:''}
  <div class="bottom">${card.bottom}</div>
  <div class="foot"><span>시민법정 · 주권자사법개혁추진준비위원회(준) — 시민법정.kr/law-diff</span><span>근거: 형소법(법률 제21857호)·수사준칙 개정령안·특사경 제정안 원문 대조</span></div>
  </body></html>`;
  fs.writeFileSync(path.join(OUT, `pcard${idx+1}.html`), html);
  console.log(`pcard${idx+1}.html 생성`);
});
