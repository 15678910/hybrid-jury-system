/**
 * 예측 계산 — 두 사건의 파기 확률에서 4분할 시나리오 표를 만든다.
 * (functions/lib/prediction.cjs 와 같은 수식. 브라우저용 ES 모듈)
 *
 *   둘 다 확정 = (1-p1)(1-p2)
 *   A만 파기   = p1(1-p2)
 *   둘 다 파기 = p1·p2
 *   B만 파기   = (1-p1)p2
 *
 * 두 사건이 같은 사태에서 갈라졌다면 독립이 아닐 수 있어 상관계수 rho 를 반영한다.
 * rho 는 주변확률이 허용하는 Fréchet 한계로 자동 제한해 확률이 범위를 벗어나지 않게 한다.
 */

/** 두 이항 사건의 결합확률 */
export function jointProbabilities(p1, p2, rho = 0) {
    const s1 = Math.sqrt(p1 * (1 - p1));
    const s2 = Math.sqrt(p2 * (1 - p2));

    const rhoMax = s1 && s2 ? Math.min((1 - p1) * p2, p1 * (1 - p2)) / (s1 * s2) : 0;
    const rhoMin = s1 && s2 ? -Math.min(p1 * p2, (1 - p1) * (1 - p2)) / (s1 * s2) : 0;
    const r = Math.max(rhoMin, Math.min(rhoMax, rho));

    const bothReversed = p1 * p2 + r * s1 * s2;
    return {
        bothReversed,
        onlyFirst: p1 - bothReversed,
        onlySecond: p2 - bothReversed,
        neither: 1 - p1 - p2 + bothReversed,
        rhoUsed: r,
    };
}

/** 0~1 확률을 정수 퍼센트 문자열로. 근거보다 정밀해 보이지 않도록 소수점을 쓰지 않는다. */
export function pct(v) {
    return `${Math.round(v * 100)}%`;
}

/** 구간을 정수 퍼센트로 */
export function pctRange(low, high) {
    const lo = Math.round(low * 100);
    const hi = Math.round(high * 100);
    return lo === hi ? `${lo}%` : `${lo}~${hi}%`;
}

/**
 * 민감도 표 — 아직 측정하지 못한 값(전합 보정계수)을 여러 값으로 바꿔가며
 * 결과가 얼마나 달라지는지 보여준다.
 *
 * 모르는 값을 임의로 하나 정해 단일 확률을 내놓는 대신, 그 값이 결과를
 * 얼마나 좌우하는지를 드러낸다. 그러면 「무엇을 재야 하는가」가 분명해진다.
 *
 * @param {number} baseRate      기저 파기율 (소부 기준)
 * @param {number[]} multipliers 전합 보정계수 후보들
 * @param {object} opts          { enBancCase, panelCase, rho }
 */
export function sensitivityTable(baseRate, multipliers, opts = {}) {
    const { rho = 0 } = opts;
    return multipliers.map((k) => {
        const p1 = Math.min(1, baseRate * k); // 전합에 회부된 쪽
        const p2 = baseRate;                  // 소부에 남은 쪽
        const j = jointProbabilities(p1, p2, rho);
        return {
            multiplier: k,
            p1,
            p2,
            rows: [
                { key: 'neither', value: j.neither },
                { key: 'onlyFirst', value: j.onlyFirst },
                { key: 'bothReversed', value: j.bothReversed },
                { key: 'onlySecond', value: j.onlySecond },
            ],
        };
    });
}

/** 두 사건이 모두 같은 지위(둘 다 소부 또는 둘 다 전합)일 때 */
export function symmetricScenario(p, rho = 0) {
    const j = jointProbabilities(p, p, rho);
    return [
        { key: 'neither', value: j.neither },
        { key: 'onlyFirst', value: j.onlyFirst },
        { key: 'bothReversed', value: j.bothReversed },
        { key: 'onlySecond', value: j.onlySecond },
    ];
}

// =============================================================================
// 파기를 「전부」와 「일부」로 나눈 3분류 모형
//
// 왜 나누는가: 위 4칸 표는 결론을 파기/확정 둘로만 본다. 그런데 여러 공소사실이
// 병합된 사건에서는 「원심 중 일부를 파기하고 나머지 상고는 기각」이 오히려 흔하다.
// 실제로 판례를 집계해 보니 형사 소부 사건에서 파기된 건의 상당수가 일부 파기였다.
// 이를 전부 파기와 한 칸에 넣으면 가장 나올 법한 결론이 표에서 사라진다.
// =============================================================================

/** 결과 3분류 */
export const OUTCOME = { AFFIRMED: 'affirmed', PARTIAL: 'partial', FULL: 'full' };
export const OUTCOME_ORDER = [OUTCOME.AFFIRMED, OUTCOME.PARTIAL, OUTCOME.FULL];

/**
 * 한 사건의 결과 분포를 만든다.
 *
 * @param {number} baseRate     기저 파기율(소부 기준)
 * @param {number} multiplier   전합 보정계수
 * @param {number} partialShare 파기된 사건 중 「일부 파기」가 차지하는 비율 (측정값)
 */
export function outcomeMarginal(baseRate, multiplier, partialShare) {
    const reversed = Math.min(1, baseRate * multiplier);
    return {
        [OUTCOME.AFFIRMED]: 1 - reversed,
        [OUTCOME.PARTIAL]: reversed * partialShare,
        [OUTCOME.FULL]: reversed * (1 - partialShare),
        reversed,
    };
}

/**
 * 두 사건의 결과를 3×3 으로 결합한다 — 공통충격 혼합모형.
 *
 *   P(i, j) = λ·[i=j]·m_i + (1−λ)·m_i·m_j
 *
 * 확률 λ 로 두 사건이 **같은 결론**을 받고, 1−λ 로 서로 무관하게 갈린다고 본다.
 * 대법원이 「공범 관계에서 함께 심리」한다고 밝혔으므로, 하나의 재판부가 같은
 * 법리로 동시에 판단하는 구조를 이 형태로 옮긴 것이다.
 *
 * λ 는 새로 지어낸 값이 아니다. 결과를 파기/확정 둘로 다시 합치면 두 사건의
 * 상관계수가 정확히 λ 가 된다(Cov = λ·p(1−p), Corr = λ). 그래서 기존 4칸 표에
 * 쓰던 ρ 를 그대로 넣으면 되고, 3분류를 파기/확정으로 되돌렸을 때 기존 표와
 * 숫자가 어긋나지 않는다.
 *
 * 두 사건의 주변분포가 같다고 전제한다. 대법원이 두 사건을 같은 재판부에서
 * 함께 심리한다고 밝혔으므로 이 전제가 성립한다.
 *
 * @returns {{cells: Object, groups: Object}} cells 는 'affirmed|partial' 형태의 키
 */
export function jointOutcomes(marginal, lambda) {
    const l = Math.max(0, Math.min(1, lambda));
    const cells = {};

    OUTCOME_ORDER.forEach((i) => {
        OUTCOME_ORDER.forEach((j) => {
            const same = i === j ? l * marginal[i] : 0;
            cells[`${i}|${j}`] = same + (1 - l) * marginal[i] * marginal[j];
        });
    });

    const c = (i, j) => cells[`${i}|${j}`];
    const { AFFIRMED: A, PARTIAL: P, FULL: F } = OUTCOME;

    return {
        cells,
        lambdaUsed: l,
        groups: {
            bothAffirmed: c(A, A),
            bothPartial: c(P, P),
            bothFull: c(F, F),
            // 한쪽은 그대로 확정되고 다른 쪽만 파기되는 경우
            oneOnly: c(A, P) + c(A, F) + c(P, A) + c(F, A),
            // 둘 다 파기되지만 파기 범위가 서로 다른 경우
            mixedReversal: c(P, F) + c(F, P),
        },
    };
}
