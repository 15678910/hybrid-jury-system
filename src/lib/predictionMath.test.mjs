/**
 * 예측 계산 검증 — 3분류 모형이 기존 2분류 표와 어긋나지 않는지 확인한다.
 *
 * 왜 이 테스트가 필요한가: 파기를 「전부」와 「일부」로 쪼개면서 결합 방식을
 * 새로 만들었다. 새 방식이 기존 표와 다른 숫자를 낸다면, 둘 중 하나는 틀린
 * 것인데 화면에는 둘 다 나란히 표시된다. 같은 사건에 두 개의 다른 확률이
 * 적히는 셈이다. 그런 일이 생기지 않도록 여기서 못 박는다.
 *
 * 실행: node src/lib/predictionMath.test.mjs
 */

import {
    jointProbabilities,
    jointOutcomes,
    outcomeMarginal,
    OUTCOME,
    OUTCOME_ORDER,
} from './predictionMath.js';

let pass = 0;
let fail = 0;

const near = (a, b, tol = 1e-9) => Math.abs(a - b) < tol;
const check = (label, ok, detail = '') => {
    console.log(`${ok ? '  ✅' : '  ❌'} ${label}${ok ? '' : `\n       ${detail}`}`);
    ok ? pass++ : fail++;
};
const checkNear = (label, got, want) =>
    check(label, near(got, want), `기대: ${want}\n       실제: ${got}`);

// 여러 조합에서 검증한다. 한 조합만 맞는 것은 우연일 수 있다.
const 조합 = [];
for (const base of [0.056, 0.15, 0.4]) {
    for (const k of [1, 2, 4, 6]) {
        for (const rho of [0, 0.3, 0.85, 1]) {
            for (const share of [0, 0.25, 0.4167, 0.8, 1]) {
                조합.push({ base, k, rho, share });
            }
        }
    }
}

console.log(`■ 확률의 기본 성질 (${조합.length}개 조합)`);
{
    let 합계오차 = 0;
    let 음수 = 0;
    let 주변오차 = 0;

    for (const { base, k, rho, share } of 조합) {
        const m = outcomeMarginal(base, k, share);
        const j = jointOutcomes(m, rho);
        const cells = Object.values(j.cells);

        합계오차 = Math.max(합계오차, Math.abs(cells.reduce((a, b) => a + b, 0) - 1));
        음수 += cells.filter((v) => v < -1e-12).length;

        // 행을 다 더하면 그 사건의 주변확률이 되어야 한다
        for (const i of OUTCOME_ORDER) {
            const row = OUTCOME_ORDER.reduce((a, jj) => a + j.cells[`${i}|${jj}`], 0);
            주변오차 = Math.max(주변오차, Math.abs(row - m[i]));
        }
    }

    check('9칸의 합이 항상 1', near(합계오차, 0), `최대 오차 ${합계오차}`);
    check('음수 확률이 없음', 음수 === 0, `${음수}칸`);
    check('행 합계가 주변확률과 일치', near(주변오차, 0), `최대 오차 ${주변오차}`);
}

console.log('\n■ 요약 5줄이 9칸을 빠짐없이 덮는지');
{
    let 오차 = 0;
    for (const { base, k, rho, share } of 조합) {
        const g = jointOutcomes(outcomeMarginal(base, k, share), rho).groups;
        const s = g.bothAffirmed + g.bothPartial + g.bothFull + g.oneOnly + g.mixedReversal;
        오차 = Math.max(오차, Math.abs(s - 1));
    }
    check('요약 5줄의 합이 1 (누락도 중복도 없음)', near(오차, 0), `최대 오차 ${오차}`);
}

console.log('\n■ 기존 2분류 표와의 일치 — 파기/확정으로 되돌리면 같아야 한다');
{
    let 최대오차 = 0;
    for (const { base, k, rho, share } of 조합) {
        const m = outcomeMarginal(base, k, share);
        const g = jointOutcomes(m, rho).groups;
        const old = jointProbabilities(m.reversed, m.reversed, rho);

        // 3분류에서 파기 계열을 다시 합치면 기존 표가 나와야 한다
        최대오차 = Math.max(
            최대오차,
            Math.abs(g.bothAffirmed - old.neither),
            Math.abs(g.bothPartial + g.bothFull + g.mixedReversal - old.bothReversed),
            Math.abs(g.oneOnly - (old.onlyFirst + old.onlySecond)),
        );
    }
    check('두 표가 모든 조합에서 일치', near(최대오차, 0), `최대 오차 ${최대오차}`);
}

console.log('\n■ 결합 강도 λ 의 의미');
{
    const m = outcomeMarginal(0.056, 4, 0.4);

    // λ=1 이면 두 사건이 반드시 같은 결론 → 대각선 밖은 0
    const j1 = jointOutcomes(m, 1);
    const 비대각선 = OUTCOME_ORDER.flatMap((i) =>
        OUTCOME_ORDER.filter((k) => k !== i).map((k) => j1.cells[`${i}|${k}`]));
    check('λ=1 이면 엇갈리는 경우가 0', 비대각선.every((v) => near(v, 0)));
    checkNear('λ=1 이면 「한쪽만 파기」가 0', j1.groups.oneOnly, 0);

    // λ=0 이면 완전 독립 → 곱셈
    const j0 = jointOutcomes(m, 0);
    checkNear('λ=0 이면 독립 (둘 다 확정 = 확정률의 제곱)',
        j0.cells[`${OUTCOME.AFFIRMED}|${OUTCOME.AFFIRMED}`], m.affirmed * m.affirmed);

    // λ 는 파기/확정으로 봤을 때의 상관계수와 같아야 한다
    for (const rho of [0.2, 0.5, 0.85]) {
        const p = m.reversed;
        const both = jointOutcomes(m, rho).groups.bothPartial
            + jointOutcomes(m, rho).groups.bothFull
            + jointOutcomes(m, rho).groups.mixedReversal;
        const corr = (both - p * p) / (p * (1 - p));
        checkNear(`λ=${rho} 이면 파기 여부의 상관계수도 ${rho}`, corr, rho);
    }
}

console.log('\n■ 파기 범위 비율(partialShare)의 반영');
{
    const base = 0.056;
    const k = 4;

    // share=0 이면 일부 파기가 아예 없어야 한다
    const m0 = outcomeMarginal(base, k, 0);
    checkNear('share=0 이면 일부 파기 확률 0', m0.partial, 0);
    checkNear('share=0 이면 파기는 전부 「전부 파기」', m0.full, m0.reversed);

    // share=1 이면 반대
    const m1 = outcomeMarginal(base, k, 1);
    checkNear('share=1 이면 전부 파기 확률 0', m1.full, 0);

    // share 가 커질수록 「둘 다 일부 파기」가 커져야 한다
    const g = [0.2, 0.5, 0.8].map((s) => jointOutcomes(outcomeMarginal(base, k, s), 0.85).groups.bothPartial);
    check('share 가 커지면 「둘 다 일부 파기」도 커짐', g[0] < g[1] && g[1] < g[2], JSON.stringify(g));

    // 파기율 자체는 share 와 무관해야 한다 — 쪼개는 것이지 늘리는 것이 아니다
    const r = [0, 0.5, 1].map((s) => outcomeMarginal(base, k, s).reversed);
    check('share 를 바꿔도 전체 파기율은 그대로', r.every((v) => near(v, r[0])), JSON.stringify(r));
}

console.log(`\n결과: ${pass}건 통과, ${fail}건 실패`);
process.exit(fail ? 1 : 0);
