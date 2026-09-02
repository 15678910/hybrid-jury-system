/**
 * 판례 파서 검증 — 법제처 OPEN API 의 실제 응답으로 테스트한다.
 *
 * 여기 쓰인 데이터는 지어낸 것이 아니라 2026-08-06 에 실제로 받은 응답이다.
 * 조작된 픽스처로 통과시키면 파서가 맞는지 알 수 없다.
 *
 * 실행: node functions/lib/precedent_parser.test.cjs
 */

const p = require('./precedent_parser.cjs');

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    console.log(`${ok ? '  ✅' : '  ❌'} ${label}${ok ? '' : `\n       기대: ${JSON.stringify(want)}\n       실제: ${JSON.stringify(got)}`}`);
    ok ? pass++ : fail++;
};

// ─────────────────────────────────────────────────────────────
// 실제 응답 ① 상세 — 대법원 94누9948 (소부, 상고기각)
// lawService.do?target=prec&ID=199597&type=JSON 의 실제 반환값
// ─────────────────────────────────────────────────────────────
const 실제_94누9948 = {
    사건종류명: '일반행정',
    사건종류코드: '400107',
    선고일자: '19950112',
    법원명: '대법원',
    법원종류코드: '400201',
    사건명: '방송광고불가결정처분취소',
    사건번호: '94누9948',
    판례정보일련번호: '199597',
    선고: '선고',
    판결유형: '판결',
    참조판례: '나.         대법원 1981.1.27. 선고 80누447전원합의체 판결,         1983.11.22. 선고 82누343 판결<br/>',
    판례내용:
        '【원고, 상고인】   주식회사  신원<br/>【피고, 피상고인】   방송위원회<br/>' +
        '【원심판결】 서울고등법원 1994.6.22. 선고 93구30671 판결<br/>【주    문】<br/>' +
        '  상고를 기각한다. 상고비용은 원고의 부담으로 한다. <br/><br/>【이    유】  상고이유를 본다. <br/>' +
        '  그러므로 상고를 기각하고, 상고비용은 패소자인 원고의 부담으로 하기로 ' +
        '관여 법관의 의견이 일치되어 주문과 같이 판결한다. <br/><br/>' +
        '대법관 안용득(재판장) 천경송 지창권 신성택(주심) ',
};

console.log('■ 실제 응답 ① — 94누9948 (소부·상고기각)');
{
    const d = p.classifyDisposition(실제_94누9948.판례내용);
    check('주문에서 상고기각 판정', d.disposition, p.DISPOSITION.DISMISSED);
    check('판정 신뢰도 high', d.confidence, 'high');

    const e = p.classifyEnBanc(실제_94누9948);
    check('전합 아님으로 판정', e.isEnBanc, false);
    check('판결유형 근거로 확정', e.confidence, 'high');
    check('대법관 4명 인식', e.justiceCount, 4);
    // 참조판례에 「전원합의체」가 있지만 오판정되면 안 된다
    check('참조판례의 전원합의체에 속지 않음', e.signals.includes('판결유형'), false);
}

// ─────────────────────────────────────────────────────────────
// 실제 응답 ② 목록 — search=2 로 받은 실제 5건
// lawSearch.do?target=prec&query=전원합의체&search=2 의 실제 반환값
// ─────────────────────────────────────────────────────────────
const 실제_목록 = [
    { 사건번호: '2024므16033', 사건종류코드: '400103', 사건종류명: '가사', 판결유형: '판결', 법원명: '대법원', 사건명: '이혼등청구의소·이혼등청구의소', 선고일자: '2026.05.29', 판례일련번호: '622117' },
    { 사건번호: '2021두61741', 사건종류코드: '400107', 사건종류명: '일반행정', 판결유형: '판결', 법원명: '대법원', 사건명: '임금', 선고일자: '2026.05.29', 판례일련번호: '622265' },
    { 사건번호: '2021도15611', 사건종류코드: '400102', 사건종류명: '형사', 판결유형: '전원합의체 판결', 법원명: '대법원', 사건명: '의료법위반', 선고일자: '2026.05.21', 판례일련번호: '622115' },
    { 사건번호: '2018다296229', 사건종류코드: '400101', 사건종류명: '민사', 판결유형: '전원합의체 판결', 법원명: '대법원', 사건명: '단체교섭청구의소', 선고일자: '2026.05.21', 판례일련번호: '622111' },
    { 사건번호: '2022도13370', 사건종류코드: '400102', 사건종류명: '형사', 판결유형: '전원합의체 판결', 법원명: '대법원', 사건명: '의료법위반', 선고일자: '2026.05.21', 판례일련번호: '622263' },
];

console.log('\n■ 실제 응답 ② — 목록 5건 (판결유형 필드로 전합 판별)');
{
    const got = 실제_목록.map((r) => p.classifyEnBanc(r).isEnBanc);
    check('전합 판별 [F,F,T,T,T]', got, [false, false, true, true, true]);

    const conf = 실제_목록.map((r) => p.classifyEnBanc(r).confidence);
    check('모두 high 신뢰도', conf, ['high', 'high', 'high', 'high', 'high']);

    const 형사전합 = 실제_목록.filter((r) => r.사건종류코드 === '400102' && p.classifyEnBanc(r).isEnBanc);
    check('형사 전합만 추리면 2건', 형사전합.length, 2);
    check('사건종류코드 400102 = 형사', p.CASE_TYPE['400102'], '형사');
}

// ─────────────────────────────────────────────────────────────
// 주문 패턴 — 실제 대법원 주문에서 쓰이는 표현
// ─────────────────────────────────────────────────────────────
console.log('\n■ 주문 패턴 분류');
{
    const t = (주문) => `【주    문】<br/>${주문}<br/>【이    유】`;
    check('상고기각', p.classifyDisposition(t('상고를 기각한다.')).disposition, p.DISPOSITION.DISMISSED);
    check('상고 모두 기각', p.classifyDisposition(t('상고를 모두 기각한다.')).disposition, p.DISPOSITION.DISMISSED);
    check('파기환송', p.classifyDisposition(t('원심판결을 파기하고, 사건을 서울고등법원에 환송한다.')).disposition, p.DISPOSITION.REVERSED_REMANDED);
    check('파기이송', p.classifyDisposition(t('원심판결을 파기하고, 사건을 서울중앙지방법원에 이송한다.')).disposition, p.DISPOSITION.REVERSED_TRANSFERRED);
    check('파기자판', p.classifyDisposition(t('원심판결을 파기한다. 피고인은 무죄.')).disposition, p.DISPOSITION.REVERSED_SELF);
    check('일부파기는 파기로 집계', p.classifyDisposition(t('원심판결 중 유죄 부분을 파기하고 이 부분 사건을 환송한다. 나머지 상고를 기각한다.')).disposition, p.DISPOSITION.REVERSED_REMANDED);
    check('주문 없으면 unknown', p.classifyDisposition('【이    유】 …').disposition, p.DISPOSITION.UNKNOWN);
}

// ─────────────────────────────────────────────────────────────
// 파기 범위 — 전부인가 일부인가
// 여러 혐의가 병합된 사건에서는 일부 파기가 오히려 흔하다. 이를 전부 파기와
// 한 칸에 넣으면 예측이 실제 결과와 어긋난다.
// ─────────────────────────────────────────────────────────────
console.log('\n■ 파기 범위(전부/일부) 구분');
{
    const t = (주문) => `【주    문】<br/>${주문}<br/>【이    유】`;

    check('전부 파기환송',
        p.classifyDisposition(t('원심판결을 파기하고, 사건을 서울고등법원에 환송한다.')).scope, p.SCOPE.FULL);
    check('전부 파기자판',
        p.classifyDisposition(t('원심판결을 파기한다. 피고인은 무죄.')).scope, p.SCOPE.FULL);

    check('일부 파기 — 「중 … 부분을 파기」',
        p.classifyDisposition(t('원심판결 중 유죄 부분을 파기하고, 이 부분 사건을 서울고등법원에 환송한다.')).scope,
        p.SCOPE.PARTIAL);
    check('일부 파기 — 파기와 기각이 함께',
        p.classifyDisposition(t('원심판결 중 피고인 甲에 대한 부분을 파기하고 이 부분을 환송한다. 나머지 상고를 기각한다.')).scope,
        p.SCOPE.PARTIAL);
    check('일부 파기 — 「일부를 파기」',
        p.classifyDisposition(t('원심판결의 일부를 파기하고 그 부분을 환송한다.')).scope, p.SCOPE.PARTIAL);

    check('기각은 범위 없음',
        p.classifyDisposition(t('상고를 기각한다.')).scope, p.SCOPE.NONE);

    // 일부 파기도 파기 계열로 분류되는지 (기각으로 새면 안 된다)
    check('일부 파기의 disposition 은 파기환송',
        p.classifyDisposition(t('원심판결 중 유죄 부분을 파기하고 환송한다. 나머지 상고를 기각한다.')).disposition,
        p.DISPOSITION.REVERSED_REMANDED);

    // 실제 응답(94누9948)은 단순 기각이므로 범위가 없어야 한다
    check('실제 94누9948 은 범위 없음',
        p.classifyDisposition(실제_94누9948.판례내용).scope, p.SCOPE.NONE);
}

// ─────────────────────────────────────────────────────────────
// 파기의 방향 — 2026-08-07 조사에서 실제로 본 판결문 문언
//
// 아래 두 건은 probe_reversal_direction.cjs 를 한국 IP 에서 돌려 화면으로
// 확인한 실제 문장이다. 지어낸 것이 아니다.
// ─────────────────────────────────────────────────────────────
console.log('\n■ 파기의 방향 — 실제 판결문 문언');
{
    // 실제 ③ — 공직선거법위반 전합. 무죄 판결에 검사만 상고했고 파기환송됐다.
    const 검사만_상고_파기 =
        '【주    문】<br/>  원심판결을 파기하고, 사건을 서울고등법원에 환송한다. <br/>' +
        '【이    유】  상고이유를 판단한다. <br/>' +
        '  1. 사건 개요 및 판단 요지 <br/>' +
        '  가. 이 사건은 제20대 대통령선거 후보자로 출마하였던 피고인에 대한 ' +
        '허위사실 공표에 의한 공직선거법 위반 사건이다. <br/>' +
        '  나. 검사는 피고인의 공소외 1 관련 발언과 백현동 관련 발언에 대하여 공소를 제기하였다. ' +
        '원심법원은 전부 무죄를 선고하였고, 검사가 원심판결에 대하여 상고하였으므로, ' +
        '대법원은 검사의 상고이유를 판단한다. <br/>' +
        '  다. 공직선거법 제250조 제1항은 「선거에 당선될 목적으로 연설, 방송 기타의 방법으로 ' +
        '후보자에게 유리하도록 후보자의 행위 등에 관하여 허위의 사실을 공표한 경우」에 ' +
        '처벌하도록 규정하고 있다. <br/>' +
        '  원심판결에는 허위사실공표죄에 관한 법리를 오해하여 판결에 영향을 미친 잘못이 있다. ' +
        '이 점을 지적하는 상고이유 주장은 이유 있다. <br/>';

    const d1 = p.classifyDisposition(검사만_상고_파기);
    check('검사만 상고한 파기 → 파기환송', d1.disposition, p.DISPOSITION.REVERSED_REMANDED);
    check('검사만 상고한 파기 → 전부 파기', d1.scope, p.SCOPE.FULL);
    check('검사만 상고 → 방향은 검사 쪽', d1.direction, p.DIRECTION.PROSECUTION);
    check('근거는 상고주체', d1.directionSignals.includes('상고주체:검사만'), true);
    check('신뢰도 high', d1.directionConfidence, 'high');

    // 실제 ⑤ — 2023도10405, 성폭력처벌법위반 전합. 피고인만 상고했고 모두 기각됐다.
    const 피고인만_상고_기각 =
        '【주    문】<br/>  상고를 모두 기각한다. <br/>' +
        '【이    유】  상고이유를 판단한다. <br/>' +
        '  1. 피고인 1의 상고이유에 관하여 <br/>' +
        '  가. 사건의 개요 및 쟁점 <br/>' +
        '  피고인들은 2020. 3. 28. 피해자 등과 술을 마시던 중 동석한 공소외인이 먼저 귀가하자 ' +
        '피해자를 강간하기로 공모하고, 합동하여 인근 편의점에서 구입한 숙취해소 음료에 ' +
        '미리 소지하고 있던 향정신성의약품인 졸피뎀을 넣었다. <br/>' +
        '  원심은 제15조에 따른 미수범으로 처벌되어야 한다는 피고인 1의 주장을 배척하였다. <br/>';

    const d2 = p.classifyDisposition(피고인만_상고_기각);
    check('피고인만 상고한 기각 → 상고기각', d2.disposition, p.DISPOSITION.DISMISSED);
    check('기각이면 방향 없음', d2.direction, p.DIRECTION.NONE);
    check('기각의 방향 판정은 확실', d2.directionConfidence, 'high');

    // 상고 주체 인식 — 「피고인 1의」처럼 번호가 붙는 실제 표기를 받아야 한다
    check('「피고인 1의 상고이유」 인식', p.detectAppellants('1. 피고인 1의 상고이유에 관하여').피고인, true);
    check('「피고인들의 상고이유」 인식', p.detectAppellants('피고인들의 상고이유를 본다').피고인, true);
    check('「검사의 상고이유」 인식', p.detectAppellants('검사의 상고이유를 판단한다').검사, true);
    check('「검사가 … 상고하였으므로」 인식',
        p.detectAppellants('검사가 원심판결에 대하여 상고하였으므로').검사, true);
    check('피고인 언급 없으면 피고인 상고 아님',
        p.detectAppellants('검사의 상고이유를 판단한다').피고인, false);
}

console.log('\n■ 파기의 방향 — 주문이 대상을 밝힌 경우');
{
    const t = (주문, 이유 = '') => `【주    문】<br/>${주문}<br/>【이    유】${이유}`;

    check('무죄 부분 파기 → 검사 쪽',
        p.classifyDisposition(t('원심판결 중 무죄 부분을 파기하고 이 부분 사건을 서울고등법원에 환송한다. 나머지 상고를 기각한다.')).direction,
        p.DIRECTION.PROSECUTION);
    check('유죄 부분 파기 → 피고인 쪽',
        p.classifyDisposition(t('원심판결 중 유죄 부분을 파기하고 이 부분 사건을 서울고등법원에 환송한다.')).direction,
        p.DIRECTION.DEFENSE);
    check('주문이 밝히면 신뢰도 high',
        p.classifyDisposition(t('원심판결 중 무죄 부분을 파기하고 환송한다.')).directionConfidence, 'high');

    // 주문에도 이유에도 단서가 없으면 억지로 고르지 않는다
    check('단서 없으면 판정 불가',
        p.classifyDisposition(t('원심판결을 파기하고 사건을 서울고등법원에 환송한다.')).direction,
        p.DIRECTION.UNKNOWN);
    check('판정 불가는 신뢰도 low',
        p.classifyDisposition(t('원심판결을 파기하고 사건을 서울고등법원에 환송한다.')).directionConfidence,
        'low');
}

console.log(`\n결과: ${pass}건 통과, ${fail}건 실패`);
process.exit(fail ? 1 : 0);
