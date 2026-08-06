/**
 * 재판 결과 예측 데이터
 *
 * 원칙 (docs/analysis/전원합의체_1호분석.md 와 동일)
 *  1. 확률을 팔지 않고 근거를 판다. 근거가 없으면 숫자를 내지 않는다.
 *  2. 모르는 것은 모른다고 표시한다.
 *  3. 대법관 개인을 예측하지 않는다. 재판부 구성과 절차 구조만 다룬다.
 *  4. 틀린 예측을 지우지 않는다. 예측 시점을 박제하고 결과와 대조해 공개한다.
 *
 * ⚠️ baseRate.value 가 null 인 동안 화면은 확률을 표시하지 않는다.
 *    수집기(functions/collect_enbanc_precedents.cjs)를 실행해 실제 파기율을
 *    확보한 뒤 이 파일에 옮겨 적을 것. 임의의 숫자를 넣지 말 것.
 */

/** 기저율 — 수집기 실행 결과를 여기에 옮겨 적는다 */
export const BASE_RATES = {
    // 전원합의체 형사사건 파기율
    enBancCriminal: {
        value: null,              // 예: 0.42
        sampleSize: null,         // 집계에 쓰인 건수
        undetermined: null,       // 주문 판정 불가 건수
        source: '법제처 국가법령정보 OPEN API (target=prec) 직접 집계',
        collectedAt: null,
        note: '법제처 API 가 판결유형만으로 목록을 뽑는 기능을 제공하지 않아 '
            + '「본문에 전원합의체가 언급된 판례」에서 출발해 판결유형으로 걸러냈다. '
            + '전합 판례의 전수가 아닐 수 있다.',
    },
    // 비교군 — 소부 형사사건 파기율
    panelCriminal: {
        value: null,
        sampleSize: null,
        source: '위와 동일',
        collectedAt: null,
    },
};

/** 전합 회부의 의미 — 법원조직법 제7조 제1항 (조문으로 확인된 사실) */
export const EN_BANC_GROUNDS = {
    article: '법원조직법 제7조 제1항',
    url: 'https://www.law.go.kr/LSW//lsSideInfoP.do?lsiSeq=277301&joNo=0007&joBrNo=00&docCls=jo&urlMode=lsScJoRltInfoR',
    principle: '대법원의 심판권은 대법관 전원의 3분의 2 이상의 합의체에서 행사한다. '
        + '다만 대법관 3명 이상으로 구성된 부에서 먼저 심리하여 **의견이 일치한 경우에 한정하여** '
        + '다음을 제외하고 그 부에서 재판할 수 있다.',
    grounds: [
        '명령·규칙이 헌법에 위반된다고 인정하는 경우',
        '명령·규칙이 법률에 위반된다고 인정하는 경우',
        '종전에 대법원에서 판시한 헌법·법률·명령 또는 규칙의 해석 적용에 관한 의견을 변경할 필요가 있다고 인정하는 경우',
        '부에서 재판하는 것이 적당하지 아니하다고 인정하는 경우',
    ],
    implication: '어느 경로든 공통점이 하나 있다 — 소부가 그대로 확정시키지 못했다는 것이다. '
        + '따라서 전원합의체 회부는 「원심 확정」 쪽으로 기우는 신호가 아니다. '
        + '방향은 말할 수 있으나 크기는 데이터 없이 말할 수 없다.',
};

/**
 * 예측 대상 사건
 *
 * status
 *   'pending-verification' — 절차적 지위조차 확인 전 (확률 표시 안 함)
 *   'analyzing'            — 쟁점 분석 중
 *   'predicted'            — 예측 확정, 박제됨
 *   'decided'              — 선고됨, 결과 대조 완료
 */
export const PREDICTION_CASES = [
    {
        id: 'handuckso-leesangmin-2026',
        title: '한덕수 · 이상민 사건 상고심',
        summary: '내란 관련 사건의 대법원 판단. 한 방송에서 봉지욱 기자 제공 자료로 '
            + '네 시나리오의 확률이 제시된 바 있다.',
        status: 'pending-verification',
        predictedAt: null,
        lockedAt: null,

        // ⚠️ 아래는 전부 미확인. 확인 전까지 화면에 단정적으로 표시하지 않는다.
        unverified: [
            {
                claim: '두 사건 중 이진관 판사 사건만 전원합의체에 회부됐다',
                why: '사실이라면 두 사건의 절차적 지위가 달라, 두 결과를 하나의 확률 공간에 '
                    + '넣어 4분할한 표는 계산 이전에 성립하지 않는다.',
                howToVerify: '대법원 공보 또는 보도 2건 이상',
            },
            {
                claim: '전원합의체 회부 사유가 법원조직법 제7조 제1항 각 호 중 무엇인지',
                why: '제3호(판례 변경 필요)라면 기존 법리대로 판단하지 않겠다는 뜻이므로 '
                    + '원심 유지 가능성이 그만큼 줄어든다.',
                howToVerify: '대법원 공보·보도자료',
            },
        ],

        issues: [],       // 쟁점 카드 — 2심 판결문·보도로 채운다
        scenarios: null,  // 기저율 확보 후 prediction.cjs 로 계산
    },
];

/** 사후 검증 기록 — 선고된 사건의 예측 대 실제 */
export const SCORECARD = [];

/** 화면이 확률을 표시해도 되는 상태인지 */
export const canShowProbabilities = () =>
    BASE_RATES.enBancCriminal.value !== null;
