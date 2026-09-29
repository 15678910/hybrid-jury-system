// 「한 사람이 고르는 위원회」 카드뉴스 생성기 — 6장 (2026-09-29)
// 주제: 대법관후보추천위원회(대법원장)와 미래대응기금운용심의회(기획예산처장관)는 같은 설계다.
//       위원을 고르는 사람, 위원장을 정하는 사람, 결론을 받아 쓰는 사람이 한 사람이다.
// 내용 원칙: 조문 문구는 전부 원문에서 옮겼다 —
//   · 법원조직법 제41조의2 ①~⑦                      docs/bills/법원조직법_20261001시행.txt
//   · 헌법 제104조 제2항                              docs/bills/헌법_원문.txt
//   · 미래대응기금 설치 및 운용에 관한 법률안(2221052) 제15조 — 정부 제출 신·구조문대비표 원문을
//     옮긴 scripts/motion-scenes/fund-articles-2026.json 장면 13 (원문 파일은 데스크탑 budget/ 폴더,
//     2026-09-29 원격 세션에서는 재대조하지 못함)
//   · 국가재정법 개정안(2221056) 제70조 제3항 제2호·제6항  docs/bills/미래대응기금_6법안_신구대조_분석_2026-09-14.md 1절
// 대상은 사람이 아니라 구조다. 5장은 두 위원회의 다른 점을 함께 적고, 6장은 「제안」 배지를 단다.
// 렌더: node scripts/gen-cardnews-한사람의위원회.mjs && CHROME_PATH=... node scripts/render-cardnews-linux.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const F = (n) => pathToFileURL(path.join(OUT, 'fonts', n)).href;

const CSS = `
@font-face { font-family:'Pre'; src:url('${F('Pretendard-Regular.otf')}'); font-weight:400; }
@font-face { font-family:'Pre'; src:url('${F('Pretendard-Bold.otf')}'); font-weight:700 900; }
@font-face { font-family:'BHS'; src:url('${F('blackhansans.ttf')}'); }
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1600px;height:1200px;overflow:hidden;}
body{font-family:'Pre',sans-serif;background:linear-gradient(160deg,#f3efe7 0%,#ebe4d6 60%,#e0d6c3 100%);color:#23201b;display:flex;flex-direction:column;padding:38px 54px 24px;word-break:keep-all;overflow-wrap:break-word;}
.top{display:flex;align-items:flex-start;gap:26px;margin-bottom:8px;}
.chip{background:#2b2620;color:#f6d77a;font-family:'BHS';font-size:32px;padding:14px 24px;border-radius:14px;line-height:1.15;text-align:center;white-space:nowrap;}
.titles{flex:1;}
h1{font-family:'BHS';font-size:66px;color:#1d1a16;line-height:1.1;font-weight:400;}
h1 .step{color:#a4361f;}
h1 .bar{color:#b9ab93;margin:0 14px;}
.sub{font-size:34px;color:#5b5145;font-weight:700;margin-top:10px;}
.page{margin-left:auto;background:#fff;border:3px solid #2b2620;font-weight:900;font-size:28px;padding:8px 22px;border-radius:999px;white-space:nowrap;}
.badge{display:inline-block;background:#a4361f;color:#fff;font-size:26px;font-weight:900;border-radius:9px;padding:3px 14px;margin-left:14px;vertical-align:10px;font-family:'Pre';}
.cols{display:flex;gap:28px;flex:1 1 0;min-height:0;margin-top:16px;}
.col{flex:1;background:#fff;border-radius:22px;box-shadow:0 10px 24px rgba(43,38,32,.14);display:flex;flex-direction:column;overflow:hidden;}
.colhead{padding:18px 26px;color:#fff;}
.colhead .who{font-size:28px;font-weight:700;opacity:.85;}
.colhead .t{font-size:40px;font-weight:900;line-height:1.15;}
.court .colhead{background:#35465c;}
.fund .colhead{background:#7a3b22;}
.body{flex:1;display:flex;flex-direction:column;justify-content:space-evenly;padding:8px 0 14px;}
.item{padding:0 26px;display:flex;gap:14px;}
.dot{width:14px;height:14px;border-radius:3px;background:#b08a3e;margin-top:20px;flex:none;}
.dot.hot{background:#a4361f;}
.tx{font-size:37px;line-height:1.38;color:#2c2721;}
.tx.q{font-size:33px;}
.tx b{color:#111;font-weight:900;}
.tx .red{color:#a4361f;font-weight:900;}
.ref{display:block;font-size:25px;color:#8c806f;margin-top:3px;font-weight:400;}
.bottom{flex:none;margin-top:16px;background:linear-gradient(90deg,#2b2620,#5a3a26);color:#fff;border-radius:18px;padding:18px 30px;font-size:38px;font-weight:900;line-height:1.3;}
.bottom .k{color:#f6d77a;}
.foot{flex:none;margin-top:9px;display:flex;justify-content:space-between;gap:30px;font-size:20px;color:#7d7262;font-weight:700;}
.cover{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:26px;}
.cover .big{font-family:'BHS';font-size:112px;line-height:1.15;color:#1d1a16;}
.cover .big .red{color:#a4361f;}
.cover .pair{display:flex;gap:34px;margin-top:10px;}
.cover .box{background:#fff;border-radius:22px;padding:26px 38px;box-shadow:0 10px 24px rgba(43,38,32,.14);text-align:left;min-width:600px;}
.cover .box .who{font-size:30px;font-weight:700;color:#8c806f;}
.cover .box .t{font-size:46px;font-weight:900;margin-top:4px;}
.cover .box.court{border-top:12px solid #35465c;}
.cover .box.fund{border-top:12px solid #7a3b22;}
.cover .box .law{font-size:28px;color:#6b6052;margin-top:8px;}
.cover .lead{font-size:40px;font-weight:700;color:#4a4136;line-height:1.45;}
`;

const COURT = { cls:'court', who:'대법원장 (현재 조희대)', t:'대법관후보추천위원회' };
const FUND  = { cls:'fund',  who:'기획예산처장관', t:'미래대응기금운용심의회' };

const cards = [
// ───────────────────────── 1
{ cover:true, page:'1 / 6',
  big:'위원도, 위원장도,<br>결론을 쓰는 사람도 — <span class="red">한 사람</span>',
  lead:'대법관 후보를 고르는 위원회와 162조 기금의 계획을 바꾸는 위원회는<br>조문의 설계가 같다',
  bottom:'두 조문을 나란히 읽는다 — <span class="k">사람이 아니라 구조를 본다</span>'},
// ───────────────────────── 2
{ step:'①', title:'위원은 누가 고르나', sub:'두 위원회의 위원 구성 조문 (원문)', page:'2 / 6',
  cols:[
   {...COURT, items:[
     ['「위원은 다음 각 호에 해당하는 사람을 <b>대법원장이 임명하거나 위촉한다</b>」','법원조직법 제41조의2 제3항',1],
     ['10명 중 6명은 직책으로 정해진다 — 선임대법관·법원행정처장·법무부장관·대한변협회장·법학교수회장·법학전문대학원협의회 이사장','같은 항 제1~6호'],
     ['나머지 <b>4명</b>(법관 1명, 비법조인 3명)은 <span class="red">누구를 앉힐지까지 대법원장이 정한다</span>','같은 항 제7·8호',1],
   ], q:[0]},
   {...FUND, items:[
     ['「위원은 1. 차관급 이상 공무원 2. <b>기획예산처장관이 위촉하는 사람</b>」','미래대응기금법안 제15조 제3항',1],
     ['「제2호 위원의 정수는 <b>전체의 2분의 1 이상</b>」','같은 항',1],
     ['위원의 <span class="red">절반 이상을 장관이 고른다.</span> 나머지는 정부 공무원이다','조문 구성'],
   ], q:[0,1]},
  ],
  bottom:'위원을 고르는 사람이 — <span class="k">위원회의 결론을 받아 쓸 사람</span>이다'},
// ───────────────────────── 3
{ step:'②', title:'위원장은 누구인가', sub:'회의를 소집하고 이끄는 자리 (원문)', page:'3 / 6',
  cols:[
   {...COURT, items:[
     ['「위원장은 위원 중에서 <b>대법원장이 임명하거나 위촉한다</b>」','법원조직법 제41조의2 제4항',1],
     ['위원장이 추천위원회를 <b>소집</b>한다 — 대법원장도 소집을 요청할 수 있다','같은 조 제5항'],
     ['추천위원회는 대법원장이 <b>제청할 때마다</b> 새로 꾸려지고, 추천하면 해산된다','같은 조 제2항·제8항'],
   ], q:[0]},
   {...FUND, items:[
     ['「위원장은 <b>기획예산처장관</b>이 되고」','미래대응기금법안 제15조 제3항',1],
     ['심의회는 「<b>기획예산처에</b> 둔다」','같은 조 제1항'],
     ['기금의 관리·운용도 <b>기획예산처장관</b>이 한다 — <span class="red">운용하는 사람이 심의회 의장</span>','같은 법안 제13조 제1항',1],
   ], q:[0,1]},
  ],
  bottom:'위원장 자리까지 — <span class="k">한 사람이 정하거나, 그 사람 자신이다</span>'},
// ───────────────────────── 4
{ step:'③', title:'결론은 어디로 가나', sub:'위원회의 결론이 가진 힘 (원문)', page:'4 / 6',
  cols:[
   {...COURT, items:[
     ['후보자를 「제청할 대법관의 <b>3배수 이상</b>」 추천한다','법원조직법 제41조의2 제6항'],
     ['「대법원장은 … 추천 내용을 <b>존중한다</b>」 — 따라야 한다가 아니라 <span class="red">존중한다</span>','같은 조 제7항',1],
     ['그 안에서 누구를 제청할지는 <b>대법원장</b>이 고른다. 이후 국회 동의·대통령 임명','헌법 제104조 제2항'],
   ], q:[1]},
   {...FUND, items:[
     ['심의·의결 사항 — 「<b>기금운용계획의 수립 및 변경</b>」','미래대응기금법안 제15조 제1항'],
     ['국회가 확정한 기금 지출의 <b>30%까지</b> 국회 의결 없이 변경 — 외평기금 같은 금융성 기금과 같은 줄','국가재정법 개정안 제70조 제3항 제2호',1],
     ['국회에는 변경 내역을 <b>제출</b>한다 — <span class="red">승인이 아니라 통보</span>','같은 조 제6항',1],
   ], q:[1]},
  ],
  bottom:'위원회는 있으되 — <span class="k">결정은 위원회를 고른 사람의 손에 남는다</span>'},
// ───────────────────────── 5
{ step:'④', title:'없는 자리, 그리고 다른 점', sub:'같은 설계 안에서도 정확히 구분한다', page:'5 / 6',
  cols:[
   {...COURT, items:[
     ['<b>국회가 추천하는 위원 자리는 조문에 없다</b>','법원조직법 제41조의2 제3항',1],
     ['다만 위원 6명은 법무부장관·변협회장 등 <b>다른 기관의 장</b>이 직책으로 들어온다','같은 항 제1~6호'],
     ['최종 임명에는 <b>국회 동의</b>가 필요하다 — 국회는 마지막에 한 번 막을 수 있다','헌법 제104조 제2항'],
   ]},
   {...FUND, items:[
     ['<b>국회 추천도, 지방자치단체·교육청 몫도 조문에 없다</b>','미래대응기금법안 제15조 제3항',1],
     ['직책으로 들어오는 <b>외부 기관장은 없다</b> — 공무원 아니면 장관 위촉','같은 항'],
     ['30% 변경에는 <b>국회 동의 절차가 없다</b> — <span class="red">국회가 막을 자리가 없다</span>','국가재정법 개정안 제70조 제3항·제6항',1],
   ]},
  ],
  bottom:'같은 설계에서 — <span class="k">기금 쪽은 마지막 문까지 닫혀 있다</span>'},
// ───────────────────────── 6
{ step:'⑤', title:'한 사람에게서 떼어 내자', badge:'제안', sub:'누가 그 자리에 있든 혼자 고를 수 없게 — 두 법에 같은 원칙을', page:'6 / 6',
  cols:[
   {...COURT, items:[
     ['위원의 절반 이상을 <b>국회(여야 동수)와 시민 몫</b>으로','법원조직법 제41조의2 제3항 개정'],
     ['위원장은 <b>위원들이 호선</b>한다','같은 조 제4항 개정'],
     ['추천 사유와 회의 결과를 <b>문서로 공개</b>한다','같은 조 제9항(대법원규칙 위임) 보완'],
   ]},
   {...FUND, items:[
     ['위원의 절반 이상을 <b>국회·지방·교육청 추천</b>으로','미래대응기금법안 제15조 제3항 수정'],
     ['위원장은 <b>장관이 아닌 사람</b> — 위원 호선','같은 항 수정'],
     ['기금 지출 변경은 <b>국회 의결</b>로 — 미래대응기금을 30% 자체 변경 대상에서 뺀다','국가재정법 개정안 제70조 제3항 제2호 수정'],
   ]},
  ],
  bottom:'<span class="k">「위원회가 있다」가 아니라 「누가 위원을 고르나」</span>를 물어야 한다'},
];

function renderCol(c){
  let h = `<div class="col ${c.cls}"><div class="colhead"><div class="who">${c.who}</div><div class="t">${c.t}</div></div><div class="body">`;
  c.items.forEach(([tx,ref,hot],i)=>{
    h += `<div class="item"><div class="dot${hot?' hot':''}"></div><div class="tx${(c.q||[]).includes(i)?' q':''}">${tx}${ref?`<span class="ref">${ref}</span>`:''}</div></div>`;
  });
  return h + '</div></div>';
}

const FOOT = `<div class="foot"><span>시민법정 · 주권자사법개혁추진준비위원회(준) — 시민법정.kr/cardnews</span><span>근거: 헌법 §104 · 법원조직법 §41의2 · 기금법안(2221052) §15 · 국가재정법 개정안 §70</span></div>`;

cards.forEach((card,idx)=>{
  const inner = card.cover
    ? `<div class="top"><div class="chip">한 사람의<br>위원회</div><div class="page">${card.page}</div></div>
       <div class="cover"><div class="big">${card.big}</div>
       <div class="pair">
         <div class="box court"><div class="who">${COURT.who}</div><div class="t">${COURT.t}</div><div class="law">법원조직법 제41조의2</div></div>
         <div class="box fund"><div class="who">${FUND.who}</div><div class="t">${FUND.t}</div><div class="law">미래대응기금법안 제15조</div></div>
       </div>
       <div class="lead">${card.lead}</div></div>`
    : `<div class="top"><div class="chip">한 사람의<br>위원회</div>
       <div class="titles"><h1><span class="step">${card.step}</span><span class="bar">|</span>${card.title}${card.badge?`<span class="badge">${card.badge}</span>`:''}</h1>
       <div class="sub">${card.sub}</div></div><div class="page">${card.page}</div></div>
       <div class="cols">${card.cols.map(renderCol).join('')}</div>`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${inner}<div class="bottom">${card.bottom}</div>${FOOT}</body></html>`;
  fs.writeFileSync(path.join(OUT, `wcard${idx+1}.html`), html);
  console.log(`wcard${idx+1}.html 생성`);
});
