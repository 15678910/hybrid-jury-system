/**
 * 수사·기소 분리 — 쟁점의 사실 확인
 *
 * 설계: docs/analysis/수사기소분리_쟁점분석_설계.md
 * 조문 대비: src/data/lawDiffs.js
 *
 * 이 파일은 세 가지를 엄격히 나눈다.
 *   concern      제기된 우려 — 누가 언제 말했는지 기록. 우리 판단이 아니다
 *   factCheck    조문으로 검증한 결과 — 근거를 전부 남긴다
 *   ourProposal  우리 판단 — isPolicyJudgment 로 사실이 아님을 명시
 *
 * ⚠️ 현재 concern.raisedBy 가 비어 있는 항목이 있다. 언론 보도 수집이
 *    아직 안 됐기 때문이다(원격 세션에서 언론 도메인이 차단된다).
 *    보도가 확보되기 전까지 그 쟁점은 status: 'draft' 로 둔다.
 *    우려의 출처 없이 사실 확인만 공개하면, 우리가 우려를 지어낸 것이 된다.
 */

export const ISSUES = [
    // ─────────────────────────────────────────────────────────────
    {
        id: 'police-power-concentration',
        title: '경찰 권력이 지나치게 커지는가',
        category: '통제',
        relatedArticles: ['공소청법 제4조제3호', '중수청법 제2조제2호가목', '중수청법 제6조', '중수청법 제43조'],

        concern: {
            claim: '검찰의 수사권이 사라지면 경찰을 견제할 기관이 없어져 경찰 권력이 비대해진다.',
            raisedBy: [],   // 보도 수집 후 채운다 — 원격 세션에서 언론 도메인 차단
        },

        factCheck: {
            verdict: '부분 성립',
            reasoning:
                '조문상 경찰을 견제하는 장치는 남아 있다. 중수청법 제2조제2호가목은 경찰공무원이 재직 중 저지른 범죄를 중수청의 수사 대상으로 명시하고, 퇴직자까지 포함한다. 중수청법 제43조제3항은 경찰이 수사 중인 사건이라도 중수청이 이첩을 요청하면 정당한 사유가 없는 한 따르도록 한다. 공수처도 그대로 존치한다. 따라서 「견제 기관이 없어진다」는 서술은 조문과 맞지 않는다.\n\n' +
                '그러나 견제의 구조에는 조문으로 확인되는 약점이 있다. 정부조직법 제34조제5항은 경찰청을, 같은 조 제9항은 중대범죄수사청을 **모두 행정안전부장관 소속**으로 둔다. 그리고 중수청법 제6조는 그 행정안전부장관이 중수청장을 지휘·감독하도록 한다(구체적 사건은 청장만). 즉 **경찰을 수사하는 기관과 경찰이 같은 장관 아래 있고, 그 장관이 수사기관의 장을 지휘·감독한다.**\n\n' +
                '견제 기관이 없어진 것이 아니라, 견제자와 피견제자가 같은 장(場) 안에 놓인 것이다. 우려의 결론은 과장이지만 문제의식은 조문상 근거가 있다.',
            basis: [
                { type: '조문', tier: null, ref: '중수청법 제2조제2호가목', file: 'docs/bills/중수청법_원문.txt', url: '', billNo: '', billRole: '' },
                { type: '조문', tier: null, ref: '중수청법 제6조', file: 'docs/bills/중수청법_원문.txt', url: '', billNo: '', billRole: '' },
                { type: '조문', tier: null, ref: '중수청법 제43조제3항', file: 'docs/bills/중수청법_원문.txt', url: '', billNo: '', billRole: '' },
                { type: '조문', tier: null, ref: '정부조직법 제34조제5항·제9항', file: 'docs/bills/정부조직법_20261002시행.txt', url: '', billNo: '', billRole: '' },
                { type: '제·개정이유', tier: 1, ref: '중대범죄수사청 조직 및 운영에 관한 법률 제정이유 아. 다른 수사기관과의 관계(제43조) [법률 제21491호]', file: 'docs/bills/중수청법_원문.txt', url: '', billNo: '', billRole: '' },
            ],
        },

        ourProposal: {
            text: '수사기관을 감시하는 기구를 행정부 밖에 둔다. 입법부 산하 법률감찰단과 시민옴부즈만이 수사·기소 양쪽을 상시 감시하도록 하고, 중수청의 수사심의위원회처럼 사후·신청 기반인 장치와 별도로 둔다.',
            rationale: '감시자가 감시 대상과 같은 장 안에 있으면 감시는 작동하지 않는다. 지금 구조는 견제 기관을 없앤 것이 아니라 같은 지붕 아래 넣은 것이므로, 지붕 밖에 있는 눈이 따로 필요하다.',
            isPolicyJudgment: true,
        },

        otherProposals: [],
        status: 'draft',
    },

    // ─────────────────────────────────────────────────────────────
    {
        id: 'prosecution-maintenance-gap',
        title: '공소유지에 공백이 생기는가',
        category: '권한',
        relatedArticles: ['공소청법 제4조제1호', '공소청법 제4조제3호'],

        concern: {
            claim: '검사가 수사를 하지 못하면 사건을 충분히 파악하지 못한 채 재판을 맡게 되어 공소유지가 부실해진다.',
            raisedBy: [],
        },

        factCheck: {
            verdict: '판단 불가',
            reasoning:
                '조문만으로는 결론이 나지 않는다. 확인되는 사실은 셋이다.\n\n' +
                '① 공소청법 제4조제1호는 검사의 직무를 「공소 제기 여부 결정 및 그 유지에 필요한 사항」으로 정한다. 「그 유지에 필요한 사항」이 무엇까지 포함하는지는 조문에 정의가 없다.\n' +
                '② 제4조제3호는 사법경찰관리와의 관계를 「협의ㆍ지원」으로 정한다. 검찰청법의 「지휘ㆍ감독」과 달리 검사가 경찰에게 보완을 명할 근거가 이 조문에는 없다.\n' +
                '③ 다만 보완수사 요구의 근거는 형사소송법에 있고, 그 개정 내용은 이 대비표에 아직 반영되지 않았다.\n\n' +
                '따라서 「공백이 생기는가」는 형사소송법 제197조의2 등 보완수사 관련 조문을 함께 놓고 봐야 답할 수 있다. 지금 단계에서 성립·불성립을 적으면 추론이 된다.',
            basis: [
                { type: '조문', tier: null, ref: '공소청법 제4조제1호·제3호', file: 'docs/bills/공소청법_원문.txt', url: '', billNo: '', billRole: '' },
                { type: '조문', tier: null, ref: '검찰청법 제4조제1항제1호·제2호 (대비)', file: 'docs/bills/검찰청법_현행.txt', url: '', billNo: '', billRole: '' },
            ],
        },

        ourProposal: { text: '', rationale: '', isPolicyJudgment: true },
        otherProposals: [],
        status: 'draft',
    },

    // ─────────────────────────────────────────────────────────────
    {
        id: 'citizen-participation-asymmetry',
        title: '시민 참여 장치가 두 법에서 다르게 설계됐다',
        category: '통제',
        relatedArticles: ['공소청법 제21조', '중수청법 제44조'],

        concern: {
            claim: '(우리가 대비 과정에서 발견한 것이며, 외부에서 제기된 우려가 아니다)',
            raisedBy: [],
        },

        factCheck: {
            verdict: '성립',
            reasoning:
                '두 법의 시민 참여 장치는 이름이 비슷하지만 설계가 다르다.\n\n' +
                '설치 의무 — 공소청법 제21조제1항은 「둔다」(의무), 중수청법 제44조제2항은 「둘 수 있다」(임의).\n' +
                '회의 구성 — 중수청법 제44조제5항은 「회의 시마다 무작위 추첨을 통하여 선정하는 위원 15명」으로 정한다. 공소청법 제21조에는 추첨 규정이 없다.\n' +
                '위촉 주체 — 양쪽 다 해당 기관의 장이 「사회 각계의 전문가」 중에서 위촉한다. 무작위로 뽑힌 일반 시민이 아니다.\n' +
                '심의의 효력 — 양쪽 조문 모두 심의 결과의 구속력을 정하지 않는다.\n\n' +
                '즉 참여의 형식은 중수청 쪽이 무작위성에 가깝고, 설치의 확실성은 공소청 쪽이 높다. 어느 쪽도 위원 자체를 추첨으로 뽑지는 않는다.',
            basis: [
                { type: '조문', tier: null, ref: '공소청법 제21조', file: 'docs/bills/공소청법_원문.txt', url: '', billNo: '', billRole: '' },
                { type: '조문', tier: null, ref: '중수청법 제44조', file: 'docs/bills/중수청법_원문.txt', url: '', billNo: '', billRole: '' },
            ],
        },

        ourProposal: {
            text: '위원 명부 자체를 무작위 추첨으로 구성하고, 심의 결과에 구속력을 부여한다. 설치는 두 기관 모두 의무로 한다.',
            rationale: '「사회 각계의 전문가」를 기관장이 위촉하는 구조는 법조 게이트키핑을 시민에게 여는 것이 아니라 전문가 집단 안에서 옮기는 것이다. 무작위 추첨과 구속력이 없으면 시민 참여는 자문에 머문다.',
            isPolicyJudgment: true,
        },

        otherProposals: [],
        status: 'draft',
    },

    // ─────────────────────────────────────────────────────────────
    // 아래는 자료가 확보되지 않아 아직 채우지 못한 쟁점이다.
    // 조문 근거 또는 보도가 확보되면 위와 같은 형식으로 채운다.
    {
        id: 'ndfa-transfer',
        title: '대검 과학수사부는 어디로 가야 하는가',
        category: '조직',
        relatedArticles: [],
        concern: { claim: '', raisedBy: [] },
        factCheck: { verdict: '판단 불가', reasoning: '이관처를 정한 조문을 아직 확인하지 못했다. 공소청법 부칙과 정부조직법, 행정안전부 직제에서 승계 규정을 찾아야 한다.', basis: [] },
        ourProposal: { text: '', rationale: '', isPolicyJudgment: true },
        otherProposals: [],
        status: 'draft',
    },
    {
        id: 'search-seizure-recording',
        title: '압수수색 의무녹화 (2027년 8월 시행)',
        category: '시행시기',
        relatedArticles: [],
        concern: { claim: '', raisedBy: [] },
        factCheck: { verdict: '판단 불가', reasoning: '근거 조문과 시행일을 형사소송법 개정안에서 확인해야 한다.', basis: [] },
        ourProposal: { text: '', rationale: '', isPolicyJudgment: true },
        otherProposals: [],
        status: 'draft',
    },
    {
        id: 'crime-intelligence-officer',
        title: '범죄정보기획관',
        category: '조직',
        relatedArticles: [],
        concern: { claim: '', raisedBy: [] },
        factCheck: { verdict: '판단 불가', reasoning: '직제 규정에서 근거를 찾아야 한다. docs/bills/행정안전부와_그_소속기관_직제.txt 및 검찰청 사무기구 규정을 대조할 것.', basis: [] },
        ourProposal: { text: '', rationale: '', isPolicyJudgment: true },
        otherProposals: [],
        status: 'draft',
    },
];

export const VERDICT_LABELS = {
    '성립': { label: '성립', tone: 'red' },
    '부분 성립': { label: '부분 성립', tone: 'amber' },
    '불성립': { label: '불성립', tone: 'blue' },
    '판단 불가': { label: '판단 불가', tone: 'gray' },
};
