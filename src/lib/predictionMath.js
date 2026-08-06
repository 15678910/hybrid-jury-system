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
