// 발제 PPT — 「참심제와 국민주권 사법」 (2026 직접민주주의 정치박람회 제9세션, 2026.10.16)
// 원고: Claude 문서 「발제문 — 참심제와 국민주권 사법」. 슬라이드 노트 = 발표 원고.
const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625
pres.title = '참심제와 국민주권 사법';
pres.author = '이수종 (주권자사법개혁추진준비위원회)';

const NAVY = '1B2A41', NAVY2 = '24375A', GOLD = 'C8A04A', INK = '1F2937', MUTED = '6B7280', CARD = 'EEF2F7', WHITE = 'FFFFFF', RED = 'B4442F';
const F = 'Malgun Gothic';
const T = (s, text, o) => s.addText(text, { fontFace: F, isTextBox: true, ...o });

function header(s, n, title, kicker) {
  s.background = { color: WHITE };
  s.addShape(pres.shapes.OVAL, { x: 0.5, y: 0.42, w: 0.5, h: 0.5, fill: { color: GOLD } });
  T(s, String(n), { x: 0.5, y: 0.42, w: 0.5, h: 0.5, align: 'center', valign: 'middle', fontSize: 16, bold: true, color: WHITE, margin: 0 });
  T(s, title, { x: 1.15, y: 0.34, w: 8.3, h: 0.66, fontSize: 26, bold: true, color: NAVY, valign: 'middle', margin: 0 });
  if (kicker) T(s, kicker, { x: 1.15, y: 0.98, w: 8.3, h: 0.36, fontSize: 13, color: MUTED, margin: 0 });
}
function footer(s, text) {
  T(s, text, { x: 0.5, y: 5.2, w: 9, h: 0.28, fontSize: 9, color: MUTED, margin: 0 });
}
function card(s, x, y, w, h, fill = CARD) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: fill }, rectRadius: 0.08 });
}

// 1. 표지
{
  const s = pres.addSlide(); s.background = { color: NAVY };
  T(s, '2026 직접민주주의 정치박람회 · 제9세션 「시민법정」', { x: 0.7, y: 0.7, w: 8.6, h: 0.4, fontSize: 14, color: GOLD, margin: 0 });
  T(s, '참심제와 국민주권 사법', { x: 0.7, y: 1.5, w: 8.6, h: 1.0, fontSize: 44, bold: true, color: WHITE, margin: 0 });
  T(s, '사법에서 주권자의 자리를 되찾는 길', { x: 0.7, y: 2.5, w: 8.6, h: 0.5, fontSize: 20, color: 'CBD5E1', margin: 0 });
  s.addShape(pres.shapes.OVAL, { x: 0.7, y: 3.75, w: 0.18, h: 0.18, fill: { color: GOLD } });
  T(s, '발제  이수종 (주권자사법개혁추진준비위원회 위원)', { x: 1.0, y: 3.62, w: 8, h: 0.42, fontSize: 15, color: WHITE, margin: 0 });
  T(s, '2026. 10. 16.(금) · 국회 의원회관', { x: 1.0, y: 4.05, w: 8, h: 0.4, fontSize: 13, color: 'CBD5E1', margin: 0 });
  s.addNotes('안녕하십니까. 주권자사법개혁추진준비위원회 이수종입니다. 오늘은 「참심제와 국민주권 사법」을 주제로, 사법에서 주권자의 자리를 되찾아야 하는 이유와 제도 설계의 큰 틀을 말씀드리겠습니다.');
}

// 2. 문제 제기 — 세 권력과 통로
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  T(s, '판사는 한 번도 뽑지도, 부르지도 않습니다', { x: 0.5, y: 0.35, w: 9, h: 0.7, fontSize: 28, bold: true, color: NAVY, margin: 0 });
  const cols = [['입법', '국회의원', '선거로 뽑는다', NAVY2], ['행정', '대통령', '선거로 뽑는다', NAVY2], ['사법', '판사', '통로가 거의 없다', RED]];
  cols.forEach(([a, b, c, col], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.35, 2.8, 2.3, i === 2 ? 'F8ECE9' : CARD);
    T(s, a, { x, y: 1.55, w: 2.8, h: 0.6, fontSize: 26, bold: true, color: col, align: 'center', margin: 0 });
    T(s, b, { x, y: 2.2, w: 2.8, h: 0.45, fontSize: 16, color: INK, align: 'center', margin: 0 });
    T(s, c, { x, y: 2.8, w: 2.8, h: 0.5, fontSize: 15, bold: true, color: col, align: 'center', margin: 0 });
  });
  T(s, '「대한민국의 주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다.」', { x: 0.5, y: 3.95, w: 9, h: 0.5, fontSize: 17, bold: true, color: INK, align: 'center', margin: 0 });
  T(s, '헌법 제1조 제2항 — 사법권도 「모든 권력」에 속합니다', { x: 0.5, y: 4.45, w: 9, h: 0.4, fontSize: 13, color: MUTED, align: 'center', margin: 0 });
  s.addNotes('주권자는 국회의원과 대통령을 선거로 뽑지만, 판사는 한 번도 뽑지도 부르지도 않습니다. 헌법 제1조 제2항은 모든 권력은 국민으로부터 나온다고 말합니다. 그러나 입법·행정·사법 가운데 사법권만은 국민과 이어지는 통로가 거의 없습니다. 2008년 국민참여재판이 도입됐지만 배심원의 평결은 판사를 구속하지 못하는 권고에 그칩니다. 시민은 재판의 방청객이거나 조언자일 뿐, 판단의 주체가 아닙니다.');
}

// 3. 순서
{
  const s = pres.addSlide(); s.background = { color: WHITE };
  T(s, '오늘 드릴 말씀', { x: 0.5, y: 0.35, w: 9, h: 0.7, fontSize: 28, bold: true, color: NAVY, margin: 0 });
  const items = ['사법 불신은 왜 구조의 문제인가', '국민참여재판은 무엇을 이뤘고 어디서 멈췄나', '참심제는 어떻게 짜여 있고, 다른 나라는 어떻게 운영하나', '도입하려면 어떤 법을 고치고, 어떤 순서로 가야 하나'];
  items.forEach((t, i) => {
    const y = 1.3 + i * 0.92;
    s.addShape(pres.shapes.OVAL, { x: 0.8, y, w: 0.6, h: 0.6, fill: { color: GOLD } });
    T(s, String(i + 1), { x: 0.8, y, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
    T(s, t, { x: 1.65, y, w: 7.6, h: 0.6, fontSize: 19, color: INK, valign: 'middle', margin: 0 });
  });
  s.addNotes('이 발제는 그 빈자리를 참심제로 채우자고 제안합니다. 참심제는 시민 참심원이 직업 법관과 한 재판부를 이뤄 사실 인정과 양형을 함께, 같은 표로 결정하는 제도입니다. 순서는 네 가지입니다.');
}

// 4. 사법 불신의 구조
{
  const s = pres.addSlide(); header(s, 1, '사법 불신은 구조에서 나온다', '판사 몇 사람의 일탈이 아니라, 사법권이 주권자와 이어져 있지 않은 구조');
  const cs = [['닫힌 충원', '법관은 시험과 법원 내부 인사로 가려진다. 대법관후보추천위원회조차 위원 전원을 대법원장이 임명·위촉한다.', '법원조직법 제41조의2 제3항'],
    ['판단의 독점', '유죄인가, 몇 년인가를 법조인만 정한다. 양형이 크게 갈려도 시민의 상식이 들어갈 자리가 없다.', ''],
    ['법조 네트워크', '퇴직 법관이 대형 로펌으로 가고 전관예우 의심이 따라붙는다. 판단자가 한 집단 안에서만 도는 구조의 문제다.', '']];
  cs.forEach(([h, b, src], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.55, 2.8, 3.35);
    T(s, h, { x: x + 0.2, y: 1.72, w: 2.4, h: 0.5, fontSize: 19, bold: true, color: NAVY, margin: 0 });
    T(s, b, { x: x + 0.2, y: 2.3, w: 2.4, h: 2.0, fontSize: 13.5, color: INK, valign: 'top', margin: 0, paraSpaceAfter: 4 });
    if (src) T(s, src, { x: x + 0.2, y: 4.4, w: 2.4, h: 0.35, fontSize: 10, color: MUTED, margin: 0 });
  });
  s.addNotes('사법 불신은 판사 몇 사람의 일탈이 아니라, 사법권이 주권자와 연결돼 있지 않은 구조에서 나옵니다. 헌법은 사법권을 법관으로 구성된 법원에 맡기고(제101조 제1항), 법관은 독립하여 심판합니다(제103조). 독립은 있되 그 권력이 국민으로부터 나온다는 통로는 없습니다. 첫째 닫힌 충원, 둘째 판단의 독점, 셋째 법조 네트워크입니다.');
}

// 5. 민주화와 독립
{
  const s = pres.addSlide(); s.background = { color: NAVY };
  T(s, '사법 민주화는 사법 독립과 충돌하지 않는다', { x: 0.7, y: 0.6, w: 8.6, h: 0.7, fontSize: 26, bold: true, color: GOLD, margin: 0 });
  T(s, '독립은 권력으로부터의 독립이지,\n주권자로부터의 독립이 아니다.', { x: 0.7, y: 1.6, w: 8.6, h: 1.4, fontSize: 30, bold: true, color: WHITE, margin: 0 });
  T(s, '시민이 재판부 안에 앉으면 외부 압력은 한 사람이 아니라 합의체 전체를 상대해야 한다. 민주화는 독립을 더 단단하게 한다.', { x: 0.7, y: 3.35, w: 8.6, h: 1.0, fontSize: 16, color: 'CBD5E1', margin: 0 });
  s.addNotes('사법 민주화는 사법 독립과 충돌하지 않습니다. 독립은 권력으로부터의 독립이지, 주권자로부터의 독립이 아닙니다. 시민이 재판부 안에 앉으면 외부 압력은 한 사람이 아니라 합의체 전체를 상대해야 합니다. 민주화는 독립을 더 단단하게 합니다.');
}

// 6. 국민참여재판 성과 — 큰 숫자
{
  const s = pres.addSlide(); header(s, 2, '국민참여재판 — 시민의 판단은 법관과 거의 같았다', '2007년 「국민의 형사재판 참여에 관한 법률」 제정, 2008년 시행');
  const st = [['90.6%', '배심원 평결과 판결 일치', '570건 중 520건'], ['92.6%', '양형 의견이 선고형과 근접', ''], ['2.62%', '대상사건 중 실제 참여재판', '21,912건 중 574건']];
  st.forEach(([n, l, d], i) => {
    const x = 0.5 + i * 3.05;
    card(s, x, 1.6, 2.8, 2.6, i === 2 ? 'F8ECE9' : CARD);
    T(s, n, { x, y: 1.85, w: 2.8, h: 1.0, fontSize: 46, bold: true, color: i === 2 ? RED : NAVY, align: 'center', margin: 0 });
    T(s, l, { x: x + 0.15, y: 2.95, w: 2.5, h: 0.6, fontSize: 14, bold: true, color: INK, align: 'center', margin: 0 });
    if (d) T(s, d, { x: x + 0.15, y: 3.55, w: 2.5, h: 0.4, fontSize: 12, color: MUTED, align: 'center', margin: 0 });
  });
  T(s, '시민은 법관만큼 신중하게 판단한다 — 그러나 그 판단이 열린 재판은 2.62%뿐이었다.', { x: 0.5, y: 4.4, w: 9, h: 0.45, fontSize: 15, bold: true, color: NAVY, margin: 0 });
  footer(s, '출처: 법원행정처 사법지원실, 「2008년-2011년 국민참여재판 성과 분석」(2012). 최근 연도 통계는 「사법연감」으로 보강 예정');
  s.addNotes('국민참여재판은 시민의 판단이 믿을 만하다는 것을 증명했지만, 그 판단에 힘을 주지 않았습니다. 법원행정처가 도입 초기 4년을 분석한 결과, 배심원 평결과 판결이 일치한 사건은 570건 중 520건, 90.6%였습니다. 양형 의견도 92.6%가 선고형과 근접했습니다. 추첨으로 뽑힌 시민이 법관만큼 신중하게 판단한다는 뜻입니다. 시민은 감정적이라는 반대 논리를 실적이 반박합니다. 그러나 대상사건 21,912건 가운데 실제 참여재판은 574건, 2.62%였습니다. 접수 1,490건, 철회 582건, 배제 274건이었습니다.');
}

// 7. 한계 — 네 개의 문
{
  const s = pres.addSlide(); header(s, 2, '한계 — 시민의 판단을 가로막는 네 개의 문', '운영이 아니라 설계의 문제');
  const ds = [['권고적 효력', '평결은 판사를 구속하지 않는다. 헌법재판소는 이를 합헌으로 봤다(2009헌바17) — 합헌이지 바람직하다는 뜻은 아니다.'],
    ['피고인 신청제', '피고인이 원할 때만 열린다. 대상 사건의 2.62%만 참여재판으로 열렸다.'],
    ['법원의 배제', '법원이 「적절하지 않다」고 보면 참여재판을 배제할 수 있다.'],
    ['판단 이후의 무력함', '2026년 6월 이화영 사건 참여재판 — 배심원 만장일치 무죄 판단에도 재판부는 공소기각으로 끝냈다.']];
  ds.forEach(([h, b], i) => {
    const x = 0.5 + (i % 2) * 4.6, y = 1.55 + Math.floor(i / 2) * 1.75;
    card(s, x, y, 4.4, 1.55);
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.2, w: 0.45, h: 0.45, fill: { color: GOLD } });
    T(s, String(i + 1), { x: x + 0.2, y: y + 0.2, w: 0.45, h: 0.45, fontSize: 14, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
    T(s, h, { x: x + 0.8, y: y + 0.2, w: 3.4, h: 0.45, fontSize: 16, bold: true, color: NAVY, valign: 'middle', margin: 0 });
    T(s, b, { x: x + 0.2, y: y + 0.75, w: 4.0, h: 0.75, fontSize: 12, color: INK, valign: 'top', margin: 0 });
  });
  s.addNotes('한계는 네 개의 문입니다. 첫째 권고적 효력, 둘째 피고인 신청제, 셋째 법원의 배제, 넷째 판단 이후의 무력함입니다. 국민참여재판의 한계는 운영이 아니라 설계에 있습니다. 시민이 법정 밖에서 의견을 내는 한, 그 의견은 권고로 남습니다. 시민이 재판부 안에 앉아야 판단이 결정이 됩니다.');
}

// 8. 참여재판 vs 참심제
{
  const s = pres.addSlide(); header(s, 3, '참심제 — 시민과 법관이 한 재판부, 같은 표', '배심제는 유·무죄만 따로 정하지만, 참심제는 사실 인정과 양형까지 함께 결정');
  const rows = [['구분', '국민참여재판(현행)', '참심제'], ['시민의 자리', '법대 밖 배심석', '법대 위, 법관 옆'], ['판단 범위', '유·무죄 평결, 양형 의견', '사실 인정과 양형 모두'], ['효력', '권고', '결정(표결의 한 표)'], ['열리는 조건', '피고인 신청, 법원 배제 가능', '법률이 정한 사건이면 항상']];
  s.addTable(rows.map((r, ri) => r.map((c, ci) => ({ text: c, options: { fontFace: F, fontSize: 14, bold: ri === 0 || ci === 0, color: ri === 0 ? WHITE : (ci === 2 ? NAVY : INK), fill: { color: ri === 0 ? NAVY : (ri % 2 ? 'F7F9FC' : WHITE) }, valign: 'middle', margin: [4, 8, 4, 8] } }))),
    { x: 0.5, y: 1.6, w: 9, colW: [2.2, 3.4, 3.4], rowH: 0.62, border: { type: 'solid', pt: 0.75, color: 'D5DCE6' } });
  s.addNotes('참심제의 핵심은 시민과 법관이 한 재판부를 이루어 같은 표를 행사한다는 점입니다. 배심제는 배심원이 유·무죄만 따로 정하지만, 참심제는 사실 인정과 양형까지 함께 결정합니다.');
}

// 9. 해외 사례
{
  const s = pres.addSlide(); header(s, 3, '해외 사례 — 시민도 재판부의 한 표', '유럽 대륙법 국가 다수와 일본이 시민·법관 합의체를 운영');
  const rows = [['나라', '구성(법관 + 시민)', '시민 선발', '비고'],
    ['독일', '1 + 2 (큰 사건 3 + 2)', '시의회 명단 → 선정위원회', '임기 5년, 유죄·형벌 3분의 2'],
    ['스웨덴', '1 + 3 (항소심 3 + 2)', '정당 추천, 시의회 선출', '임기 4년'],
    ['핀란드', '1 + 2~3', '지방의회 선출', '임기 4년'],
    ['덴마크', '경미 사건 1 + 2', '—', '중대 사건은 3 + 배심 6'],
    ['프랑스', '중죄법원 3 + 6 (항소심 3 + 9)', '추첨', '법관과 시민이 함께 평의'],
    ['일본', '3 + 6 (재판원)', '추첨', '2009년 도입']];
  s.addTable(rows.map((r, ri) => r.map((c, ci) => ({ text: c, options: { fontFace: F, fontSize: 12, bold: ri === 0 || ci === 0, color: ri === 0 ? WHITE : INK, fill: { color: ri === 0 ? NAVY : (ri % 2 ? 'F7F9FC' : WHITE) }, valign: 'middle', margin: [3, 6, 3, 6] } }))),
    { x: 0.5, y: 1.5, w: 9, colW: [1.2, 2.9, 2.5, 2.4], rowH: 0.45, border: { type: 'solid', pt: 0.75, color: 'D5DCE6' } });
  footer(s, '출처: 시민법정 해외사례 자료(독일·스웨덴·핀란드 문헌 번역본 포함). 자료집 인쇄 전 각국 법령 원문과 대조');
  s.addNotes('운영 방식은 여러 갈래지만, 시민이 재판부 안에서 표를 갖는다는 원리는 같습니다. 독일은 법관 1명과 참심원 2명, 스웨덴은 1명과 3명, 핀란드는 1명과 2~3명입니다. 프랑스 중죄법원과 일본 재판원 재판은 법관 3명과 시민 6명입니다.');
}

// 10. 세 가지 교훈
{
  const s = pres.addSlide(); header(s, 3, '해외 사례의 세 가지 교훈');
  const ls = [['시민이 다수일 수 있다', '독일·스웨덴·핀란드는 지방법원에서 시민이 법관보다 많다. 전문성은 법관이, 민주적 정당성은 시민이 맡는다.'],
    ['선발 방식은 나라마다 다르다', '지방의회 선출(북유럽)과 추첨(프랑스·일본)이 두 축이다. 우리나라에 맞는 방식은 토론 쟁점이다.'],
    ['가중다수결로 균형을 맞춘다', '독일은 유죄·형벌에 3분의 2를 요구한다. 시민과 법관 어느 한쪽만으로 유죄를 만들 수 없게 한 것이다.']];
  ls.forEach(([h, b], i) => {
    const y = 1.3 + i * 1.25;
    s.addShape(pres.shapes.OVAL, { x: 0.6, y: y + 0.08, w: 0.6, h: 0.6, fill: { color: GOLD } });
    T(s, String(i + 1), { x: 0.6, y: y + 0.08, w: 0.6, h: 0.6, fontSize: 20, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
    T(s, h, { x: 1.45, y, w: 8, h: 0.42, fontSize: 18, bold: true, color: NAVY, margin: 0 });
    T(s, b, { x: 1.45, y: y + 0.45, w: 8, h: 0.65, fontSize: 13.5, color: INK, valign: 'top', margin: 0 });
  });
  s.addNotes('세 가지 교훈입니다. 시민이 다수일 수 있다. 선발 방식은 나라마다 다르다. 가중다수결로 균형을 맞춘다.');
}

// 11. 헌법 — 법률 먼저, 개헌은 다음
{
  const s = pres.addSlide(); header(s, 4, '법률로 시작하고, 개헌으로 굳힌다', '헌법 제27조의 「법관」은 누구인가');
  card(s, 0.5, 1.55, 4.4, 1.55);
  T(s, '헌법 제27조 제1항', { x: 0.7, y: 1.68, w: 4.0, h: 0.35, fontSize: 12, bold: true, color: GOLD, margin: 0 });
  T(s, '「모든 국민은 헌법과 법률이 정한 법관에 의하여 법률에 의한 재판을 받을 권리를 가진다.」', { x: 0.7, y: 2.05, w: 4.0, h: 0.95, fontSize: 13.5, color: INK, valign: 'top', margin: 0 });
  card(s, 5.1, 1.55, 4.4, 1.55);
  T(s, '헌법 제101조 제3항', { x: 5.3, y: 1.68, w: 4.0, h: 0.35, fontSize: 12, bold: true, color: GOLD, margin: 0 });
  T(s, '「법관의 자격은 법률로 정한다.」', { x: 5.3, y: 2.05, w: 4.0, h: 0.95, fontSize: 13.5, color: INK, valign: 'top', margin: 0 });
  T(s, '법률로 「참심법관」의 자격을 정하면 참심원도 「법률이 정한 법관」이 된다 — 법률 도입론의 핵심. 반대로 「법관」을 직업 법관으로만 읽는 해석이 있어 제27조가 위헌 시비의 중심이 되고, 제103조(독립 심판)에는 참심원의 신분 보장으로 답해야 한다.', { x: 0.5, y: 3.3, w: 9, h: 1.0, fontSize: 13, color: INK, margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 4.4, w: 9, h: 0.6, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.08 });
  T(s, '전략: ① 법률로 시범 도입해 실적을 쌓고 → ② 개헌 때 「국민의 사법 참여권」을 헌법에 적는다', { x: 0.7, y: 4.4, w: 8.6, h: 0.6, fontSize: 14, bold: true, color: WHITE, valign: 'middle', margin: 0 });
  s.addNotes('참심제는 법률 제정만으로 시작할 수 있고, 개헌은 그 뒤에 제도를 굳히는 단계로 둡니다. 법률로 참심법관의 자격을 정하면, 참심원도 법률이 정한 법관이 된다는 것이 법률 도입론의 핵심 논리입니다. 반대로 법관을 법학 교육을 받은 직업 법관으로만 읽는 해석이 있어, 제27조는 위헌 시비의 중심이 될 것입니다. 그래서 전략은 두 단계입니다.');
}

// 12. A안 vs B안
{
  const s = pres.addSlide(); header(s, 4, '두 가지 설계안 — 무엇을 고를 것인가', '주권자사법개혁추진준비위원회가 준비해 온 안');
  const col = (x, title, sub, items, color) => {
    card(s, x, 1.5, 4.4, 3.5);
    T(s, title, { x: x + 0.25, y: 1.62, w: 3.9, h: 0.45, fontSize: 19, bold: true, color, margin: 0 });
    T(s, sub, { x: x + 0.25, y: 2.07, w: 3.9, h: 0.35, fontSize: 11.5, color: MUTED, margin: 0 });
    T(s, items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.25, y: 2.5, w: 3.95, h: 2.4, fontSize: 13, color: INK, valign: 'top', margin: 0, paraSpaceAfter: 5 });
  };
  col(0.5, 'A안 — 핀란드형', '시민사법참여법 (사법개혁 4법 중 하나)', ['재판부: 법관 1 + 시민 참심원 3', '선발: 지방의회 선출, 만 25~70세, 임기제', '형사 1심 합의부 사건 전체', '시민기소심사위원회(무작위 시민 11명), 법률감찰관·사법옴부즈만과 한 묶음', '5개 지방법원 시범 → 전국 확대·개헌 추진'], NAVY);
  col(5.1, 'B안 — 대형 합의체형', '참심제 운용에 관한 법률안(가칭), 8장 36조', ['재판부: 법관 3 + 참심법관 6 (9명까지 증원)', '선발: 무작위 추첨, 만 25세 이상, 정당 추천 배제', '임기: 사건 종결까지', '형사에서 시작, 가정·회생·행정 등으로 단계 확대', '공포 후 2년 준비 → 수도권 2~3개 법원 시범 → 3년 뒤 평가'], RED);
  footer(s, '두 안 모두 시민이 재판부의 다수를 이루고 판단에 표를 갖는다는 점은 같다');
  s.addNotes('두 안의 차이는 철학의 차이입니다. A안은 지역 공동체가 고른 시민이 경험을 쌓으며 다수가 되는 설계이고, B안은 추첨으로 누구나 뽑히되 법관 3인과 함께 판단하는 설계입니다. 어느 안이든 시민이 재판부의 다수를 이루고 판단에 표를 갖는다는 점은 같습니다. 오늘 토론에서 어느 쪽이 우리 현실에 맞는지 의견을 듣고 싶습니다.');
}

// 13. 단계별 추진 경로
{
  const s = pres.addSlide(); header(s, 4, '단계별 추진 경로', '두 안의 공통 골격');
  const steps = [['입법 청원·발의', '세션 논의를 정리해 원내 정당과 함께 발의'], ['준비 기간', '참심원 명부·교육 과정·법정 시설'], ['시범 실시', '몇 개 지방법원, 형사 합의부 사건부터'], ['평가와 확대', '평결·양형·항소율 공개 평가 → 전국·다른 사건'], ['헌법적 근거', '개헌 때 국민의 사법 참여권 명시']];
  const w = 1.66, gap = 0.17;
  steps.forEach(([h, b], i) => {
    const x = 0.5 + i * (w + gap);
    card(s, x, 1.7, w, 2.7, i === 4 ? 'F6EFDD' : CARD);
    s.addShape(pres.shapes.OVAL, { x: x + w / 2 - 0.28, y: 1.9, w: 0.56, h: 0.56, fill: { color: GOLD } });
    T(s, String(i + 1), { x: x + w / 2 - 0.28, y: 1.9, w: 0.56, h: 0.56, fontSize: 18, bold: true, color: WHITE, align: 'center', valign: 'middle', margin: 0 });
    T(s, h, { x: x + 0.1, y: 2.6, w: w - 0.2, h: 0.55, fontSize: 14, bold: true, color: NAVY, align: 'center', margin: 0 });
    T(s, b, { x: x + 0.12, y: 3.2, w: w - 0.24, h: 1.1, fontSize: 11.5, color: INK, align: 'center', valign: 'top', margin: 0 });
    if (i < 4) s.addShape(pres.shapes.ISOSCELES_TRIANGLE, { x: x + w + 0.0, y: 3.0, w: 0.17, h: 0.17, fill: { color: GOLD }, line: { color: GOLD }, rotate: 90 });
  });
  s.addNotes('단계별 추진 경로입니다. 입법 청원과 법안 발의, 준비 기간, 시범 실시, 평가와 확대, 그리고 헌법적 근거 마련입니다.');
}

// 14. 토론 쟁점
{
  const s = pres.addSlide(); header(s, 5, '토론을 위한 네 가지 질문', '발제자의 입장을 함께 적는다');
  const q = [['헌법적 근거', '제27조의 「법관」과 시민 참심원의 조화', '제101조 제3항으로 법률 도입 먼저, 개헌은 근거를 굳히는 단계로'],
    ['참여 범위', '어떤 사건에, 무엇까지 판단하는가', '형사 합의부 사건부터, 사실 인정과 양형 모두'],
    ['시민 참심원 제도', '선발·임기·교육·신분 보장은', '지방의회 선출(A안)과 추첨(B안) 가운데 고를 문제 — 이 자리의 판단을 듣고 싶다'],
    ['추진 전략', '누가 함께, 어떤 일정으로', '이 세션의 결론을 입법 청원과 후속 정책 토론회로 잇는다']];
  q.forEach(([h, qq, a], i) => {
    const x = 0.5 + (i % 2) * 4.6, y = 1.5 + Math.floor(i / 2) * 1.8;
    card(s, x, y, 4.4, 1.62);
    T(s, h, { x: x + 0.2, y: y + 0.12, w: 4.0, h: 0.4, fontSize: 16, bold: true, color: NAVY, margin: 0 });
    T(s, qq, { x: x + 0.2, y: y + 0.52, w: 4.0, h: 0.4, fontSize: 12, color: MUTED, margin: 0 });
    T(s, a, { x: x + 0.2, y: y + 0.92, w: 4.0, h: 0.62, fontSize: 12.5, bold: true, color: INK, valign: 'top', margin: 0 });
  });
  s.addNotes('토론에서 함께 답하고 싶은 질문과 발제자의 입장입니다. 헌법적 근거, 참여 범위, 시민 참심원 제도, 추진 전략입니다.');
}

// 15. 맺음
{
  const s = pres.addSlide(); s.background = { color: NAVY };
  T(s, '주권자는 판결을 받기만 하는 사람이 아니라,\n판결을 함께 내리는 사람이어야 합니다.', { x: 0.7, y: 1.2, w: 8.6, h: 1.6, fontSize: 28, bold: true, color: WHITE, margin: 0 });
  T(s, '사법개혁은 지금까지 법조 안의 권한을 다시 나누는 일이었습니다. 참심제는 권한의 일부를 법조 밖, 주권자에게 돌려주는 개혁입니다.', { x: 0.7, y: 3.0, w: 8.6, h: 0.9, fontSize: 16, color: 'CBD5E1', margin: 0 });
  T(s, '주권자사법개혁추진준비위원회 · 시민법정.kr', { x: 0.7, y: 4.5, w: 8.6, h: 0.4, fontSize: 14, color: GOLD, margin: 0 });
  s.addNotes('사법개혁은 지금까지 법조 안의 권한을 다시 나누는 일이었습니다. 참심제는 권한의 일부를 법조 밖, 주권자에게 돌려주는 개혁입니다. 헌법 제1조 제2항이 사법에서도 작동하게 하는 일입니다. 주권자는 판결을 받기만 하는 사람이 아니라, 판결을 함께 내리는 사람이어야 합니다. 오늘의 논의가 그 첫걸음이 되기를 바랍니다. 감사합니다.');
}

pres.writeFile({ fileName: '/home/user/deck/참심제와_국민주권사법_발제.pptx' }).then((f) => console.log('saved', f));
