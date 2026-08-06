/**
 * 재판 결과 예측 데이터
 *
 * 목적: 우리 스스로 예측을 낸다.
 *
 * 원칙
 *  1. 모르는 값이 있어도 멈추지 않는다. 그 값을 여러 후보로 바꿔가며
 *     결과가 얼마나 달라지는지 보여주고, 무엇을 재야 하는지 지목한다.
 *  2. 모든 수치에 출처와 신뢰 등급을 붙인다.
 *  3. 대법관 개인을 예측하지 않는다. 재판부 구성과 절차 구조만 다룬다.
 *  4. 틀린 예측을 지우지 않는다. 예측 시점을 박제하고 결과와 대조해 공개한다.
 */

/** 수치의 신뢰 등급 — 화면에 그대로 표시한다 */
export const TIER = {
    PRIMARY: { id: 'primary', label: '1차 자료', desc: '원문·원자료에서 직접 확인' },
    REPORTED: { id: 'reported', label: '보도 인용', desc: '복수 언론이 인용한 통계. 원자료 재확인 필요' },
    ESTIMATED: { id: 'estimated', label: '미측정', desc: '아직 재지 못한 값. 구간으로 다룬다' },
};

/** 기저율 */
export const BASE_RATES = {
    /** 형사 상고심 전체 파기율 — 예측의 출발점 */
    criminalAppeal: {
        value: 0.056,
        display: '5.6%',
        detail: '2023년 형사공판사건 상고심 — 기각 4,707건(94.4%), 파기 281건(5.6%)',
        source: '법원행정처 「2024 사법연감」',
        sourceUrl: 'https://www.scourt.go.kr/portal/justicesta/JusticestaListAction.work?gubun=10',
        tier: TIER.REPORTED,
        caveat: '복수 보도가 동일하게 인용한 수치이나 사법연감 원자료를 직접 대조하지 못했다. '
            + '또한 합계 4,988건은 형사 상고 접수 규모에 비해 적어 보여, 집계 대상(판결로 종국된 '
            + '사건만인지 등)을 원자료에서 확인해야 한다.',
    },

    /** 항소심 파기율 — 참고용 대조군 */
    criminalAppellate: {
        value: 0.411,
        display: '41.1%',
        detail: '2023년 형사 항소심 파기율 (2019년 36.7% → 2023년 41.1%)',
        source: '법원행정처 「2024 사법연감」',
        tier: TIER.REPORTED,
    },

    /**
     * 전원합의체 보정계수 — 예측을 막고 있는 단 하나의 값
     *
     * 전합에 회부된 사건의 파기율이 소부의 몇 배인가.
     * 공개된 공식 통계를 찾지 못했고, 사법연감도 전합/소부를 구분하지 않는다.
     * functions/collect_enbanc_precedents.cjs 로 판례를 직접 집계하면 측정된다.
     */
    enBancMultiplier: {
        value: null,
        candidates: [2, 4, 6, 8],
        tier: TIER.ESTIMATED,
        howToMeasure: 'functions/collect_enbanc_precedents.cjs --compare 실행 → '
            + '법제처 판례 API 에서 전합·소부 형사사건을 직접 집계해 파기율 비를 구한다.',
        why: '전원합의체 회부는 소부가 그대로 확정시키지 못했다는 뜻이므로 파기율이 높을 수밖에 없다. '
            + '방향은 확실하나 크기를 아직 재지 못했다.',
    },
};

/** 전합 회부의 의미 — 법원조직법 제7조 제1항 (조문으로 확인된 사실) */
export const EN_BANC_GROUNDS = {
    article: '법원조직법 제7조 제1항',
    url: 'https://www.law.go.kr/LSW//lsSideInfoP.do?lsiSeq=277301&joNo=0007&joBrNo=00&docCls=jo&urlMode=lsScJoRltInfoR',
    principle: '대법원의 심판권은 대법관 전원의 3분의 2 이상의 합의체에서 행사한다. '
        + '다만 대법관 3명 이상으로 구성된 부에서 먼저 심리하여 의견이 일치한 경우에 한정하여 '
        + '다음을 제외하고 그 부에서 재판할 수 있다.',
    grounds: [
        '명령·규칙이 헌법에 위반된다고 인정하는 경우',
        '명령·규칙이 법률에 위반된다고 인정하는 경우',
        '종전 대법원 판례의 해석 적용에 관한 의견을 변경할 필요가 있다고 인정하는 경우',
        '부에서 재판하는 것이 적당하지 아니하다고 인정하는 경우',
    ],
    implication: '어느 경로든 공통점이 하나 있다 — 소부가 그대로 확정시키지 못했다는 것이다. '
        + '따라서 전원합의체 회부는 원심 확정 쪽으로 기우는 신호가 아니다. '
        + '방향은 조문으로 말할 수 있고, 크기는 판례를 세어야 나온다.',
};

/** 시나리오 이름표 */
export const SCENARIO_LABELS = {
    neither: '두 사건 모두 원심 확정',
    onlyFirst: '전합 회부 사건만 파기',
    bothReversed: '두 사건 모두 파기',
    onlySecond: '소부 사건만 파기',
};

/**
 * 예측 대상 사건
 *
 * branches — 아직 확정하지 못한 사실을 「막는 조건」이 아니라 「갈래」로 다룬다.
 *            어느 갈래든 예측 결과가 나온다.
 */
export const PREDICTION_CASES = [
    {
        id: 'handuckso-leesangmin-2026',
        title: '한덕수 · 이상민 사건 상고심',
        summary: '내란 관련 사건의 대법원 판단. 두 사건의 절차적 지위(전원합의체 회부 여부)에 따라 '
            + '예측이 갈리므로, 갈래별로 결과를 함께 제시한다.',
        status: 'predicted',
        predictedAt: '2026-08-06',

        /** 두 사건의 지위에 대한 갈래 */
        branches: [
            {
                id: 'split',
                label: '한 사건만 전원합의체 회부',
                detail: '두 사건의 절차적 지위가 다른 경우. 회부된 쪽의 파기 확률이 보정계수만큼 높아진다.',
                asymmetric: true,
                confirmed: false,
            },
            {
                id: 'both-panel',
                label: '두 사건 모두 소부',
                detail: '전원합의체 회부가 없는 경우. 두 사건 모두 기저율을 그대로 적용한다.',
                asymmetric: false,
                multiplier: 1,
                confirmed: false,
            },
        ],

        /**
         * 두 사건의 상관계수.
         * 같은 사태에서 갈라진 사건이라 법리 판단이 겹칠 가능성이 높다고 보아 양의 값을 둔다.
         * 이 값도 측정된 것이 아니므로 화면에 가정임을 밝힌다.
         */
        rho: 0.5,
        rhoNote: '같은 사태에서 갈라진 사건이라 법리 판단이 겹칠 가능성이 높다고 보아 0.5 로 두었다. '
            + '측정값이 아니라 설정값이다.',

        /** 확인되면 예측이 좁혀지는 사실 */
        openQuestions: [
            {
                q: '두 사건 중 전원합의체에 회부된 것이 있는가',
                effect: '갈래가 하나로 확정된다.',
                how: '대법원 공보 또는 보도 2건 이상',
            },
            {
                q: '회부 사유가 법원조직법 제7조 제1항 각 호 중 무엇인가',
                effect: '제3호(판례 변경 필요)라면 보정계수를 높은 쪽으로 좁힐 근거가 된다.',
                how: '대법원 공보·보도자료',
            },
        ],

        issues: [],
    },
];

/** 사후 검증 기록 — 선고된 사건의 예측 대 실제 */
export const SCORECARD = [];
