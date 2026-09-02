/**
 * 결과 시나리오 계산 — 두 사건의 파기 확률에서 4분할 표를 만든다.
 *
 * 봉지욱 기자가 제시한 형태의 표(두 사건 × 확정/파기 = 4칸)는
 * 사실 두 개의 확률과 한 개의 상관계수에서 전부 도출된다.
 *
 *   둘 다 확정   = (1-p1)(1-p2)
 *   A만 파기      = p1(1-p2)
 *   둘 다 파기    = p1·p2
 *   B만 파기      = (1-p1)p2
 *
 * 다만 두 사건이 독립이 아닐 수 있다. 같은 사태에서 갈라진 사건이라면
 * 한쪽이 파기되면 다른 쪽도 파기될 가능성이 높다. 그 의존도를 상관계수 rho 로 받는다.
 * (이변량 베르누이 — rho=0 이면 독립, 곱셈식과 같아진다)
 *
 * ⚠️ 이 모듈은 계산만 한다. p1·p2 를 어디서 얻을지는 별개의 문제이며,
 *    근거 없는 p 를 넣으면 근거 없는 표가 나온다. 계산의 정교함은 근거를 대신하지 못한다.
 */

/** 두 이항 사건의 결합확률. rho 는 피어슨 상관계수. */
const jointProbabilities = (p1, p2, rho = 0) => {
    if (!(p1 >= 0 && p1 <= 1) || !(p2 >= 0 && p2 <= 1)) {
        throw new Error('p1, p2 는 0~1 이어야 합니다.');
    }
    const s1 = Math.sqrt(p1 * (1 - p1));
    const s2 = Math.sqrt(p2 * (1 - p2));

    // rho 가 취할 수 있는 범위는 주변확률에 따라 제한된다(Fréchet 한계).
    const rhoMax = s1 && s2 ? Math.min((1 - p1) * p2, p1 * (1 - p2)) / (s1 * s2) : 0;
    const rhoMin = s1 && s2 ? -Math.min(p1 * p2, (1 - p1) * (1 - p2)) / (s1 * s2) : 0;
    const clampedRho = Math.max(rhoMin, Math.min(rhoMax, rho));

    const bothReversed = p1 * p2 + clampedRho * s1 * s2;
    const onlyFirst = p1 - bothReversed;
    const onlySecond = p2 - bothReversed;
    const neither = 1 - bothReversed - onlyFirst - onlySecond;

    return {
        bothReversed,
        onlyFirst,
        onlySecond,
        neither,
        rhoUsed: clampedRho,
        rhoClamped: clampedRho !== rho,
        rhoRange: [rhoMin, rhoMax],
    };
};

/**
 * 구간(불확실성)을 담은 시나리오 표를 만든다.
 *
 * 점추정 하나만 내놓으면 소수점 정밀도가 근거보다 앞서 보인다.
 * p 를 구간으로 받아 시나리오도 구간으로 낸다.
 *
 * @param {{name:string, low:number, high:number}} caseA  파기 확률 구간
 * @param {{name:string, low:number, high:number}} caseB
 * @param {{rho?:number}} opts
 */
const scenarioTable = (caseA, caseB, opts = {}) => {
    const rho = opts.rho ?? 0;
    const corners = [];
    for (const a of [caseA.low, caseA.high]) {
        for (const b of [caseB.low, caseB.high]) {
            corners.push(jointProbabilities(a, b, rho));
        }
    }
    const range = (key) => {
        const vals = corners.map((c) => c[key]);
        return { low: Math.min(...vals), high: Math.max(...vals) };
    };

    return {
        rho,
        rhoUsed: corners[0].rhoUsed,
        scenarios: [
            { label: `두 사건 모두 원심 확정`, ...range('neither') },
            { label: `${caseA.name}만 파기 · ${caseB.name} 확정`, ...range('onlyFirst') },
            { label: `두 사건 모두 파기`, ...range('bothReversed') },
            { label: `${caseB.name}만 파기 · ${caseA.name} 확정`, ...range('onlySecond') },
        ],
    };
};

/** 사람이 읽는 형태로 — 소수점 없이 정수 구간으로 표시한다 */
const formatPercent = ({ low, high }) => {
    const lo = Math.round(low * 100);
    const hi = Math.round(high * 100);
    return lo === hi ? `${lo}%` : `${lo}~${hi}%`;
};

/**
 * 기저율에 보정을 적용해 파기 확률 구간을 만든다.
 *
 * @param {{value:number, source:string}} baseRate  기저 파기율 (예: 전합 형사사건 파기율)
 * @param {Array<{label:string, factor:number, source:string}>} adjustments  곱셈 보정
 * @param {number} uncertainty  구간 폭 (0.2 이면 ±20%)
 */
const estimate = (baseRate, adjustments = [], uncertainty = 0.2) => {
    let p = baseRate.value;
    for (const a of adjustments) p *= a.factor;
    p = Math.max(0, Math.min(1, p));
    return {
        point: p,
        low: Math.max(0, p * (1 - uncertainty)),
        high: Math.min(1, p * (1 + uncertainty)),
        baseRate,
        adjustments,
        uncertainty,
    };
};

module.exports = { jointProbabilities, scenarioTable, formatPercent, estimate };
