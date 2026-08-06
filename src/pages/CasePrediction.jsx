import { useState } from 'react';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import {
    BASE_RATES,
    EN_BANC_GROUNDS,
    PREDICTION_CASES,
    SCENARIO_LABELS,
    SCORECARD,
    TIER,
    COURT_STATEMENT,
} from '../data/predictions';
import { jointProbabilities, pct, pctRange } from '../lib/predictionMath';

// =============================================================================
// 재판 결과 예측 — 우리 예측을 낸다
//
// 설계 원칙
//  1. 모르는 값이 있어도 멈추지 않는다. 구간으로 내고 무엇을 재야 하는지 지목한다.
//  2. 모든 수치에 출처와 신뢰 등급을 붙인다.
//  3. 대법관 개인을 예측하지 않는다.
//  4. 틀린 예측을 지우지 않는다.
// =============================================================================

const TABS = [
    { id: 'cases', label: '예측' },
    { id: 'method', label: '방법과 근거' },
    { id: 'scorecard', label: '적중률' },
];

const TIER_STYLE = {
    primary: 'bg-green-100 text-green-800',
    reported: 'bg-blue-100 text-blue-800',
    estimated: 'bg-amber-100 text-amber-800',
};

function TierBadge({ tier }) {
    return (
        <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${TIER_STYLE[tier.id]}`}>
            {tier.label}
        </span>
    );
}

/** 시나리오 4행 표 */
function ScenarioTable({ rows, labelFor }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-lg">
                <thead>
                    <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-3 font-semibold text-gray-700">예상 결론</th>
                        <th className="text-right py-3 px-3 font-semibold text-gray-700">확률</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.key} className="border-b border-gray-100">
                            <td className="py-3.5 px-3 text-gray-800">{labelFor(r.key)}</td>
                            <td className="py-3.5 px-3 text-right font-bold text-gray-900 text-xl">
                                {typeof r.value === 'string' ? r.value : pct(r.value)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** 보정계수 구간 — 아직 재지 못한 값을 여러 후보로 바꿔가며 보여준다 */
function RangeBranch({ c, branch }) {
    const base = BASE_RATES.criminalAppeal.value;
    const [lo, hi] = branch.symmetricRange;
    const ks = [];
    for (let k = lo; k <= hi; k++) ks.push(k);

    // 두 사건 모두 전합이므로 p1 = p2 = base * k
    const rows = ks.map((k) => {
        const p = Math.min(1, base * k);
        const j = jointProbabilities(p, p, c.rho);
        return { k, p, j };
    });

    const range = (key) => {
        const v = rows.map((r) => r.j[key]);
        return pctRange(Math.min(...v), Math.max(...v));
    };
    const summary = Object.keys(SCENARIO_LABELS).map((key) => ({ key, value: range(key) }));

    return (
        <div>
            <ScenarioTable rows={summary} labelFor={(k) => SCENARIO_LABELS[k]} />

            <details className="mt-5">
                <summary className="cursor-pointer text-lg text-blue-700 hover:underline font-medium">
                    구간이 왜 넓은가 — 보정계수별 상세 보기
                </summary>
                <div className="mt-4 bg-gray-50 rounded-lg p-5">
                    <p className="text-base text-gray-700 leading-relaxed mb-4">
                        전합 사건의 파기율이 소부의 <strong>몇 배</strong>인지가 아직 측정되지 않았습니다.
                        그 값을 {lo}배부터 {hi}배까지 바꿔가며 계산한 결과입니다.
                        <strong className="text-gray-900"> 이 하나의 숫자만 재면 구간이 한 줄로 좁혀집니다.</strong>
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-base">
                            <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="text-left py-2.5 pr-4 font-semibold text-gray-700 whitespace-nowrap">보정계수</th>
                                    <th className="text-right py-2.5 px-2 font-semibold text-gray-700 whitespace-nowrap">각 사건 파기율</th>
                                    {Object.values(SCENARIO_LABELS).map((l) => (
                                        <th key={l} className="text-right py-2.5 px-2 font-semibold text-gray-700 text-sm">{l}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.k} className="border-b border-gray-200">
                                        <td className="py-2.5 pr-4 font-medium text-gray-900">{r.k}배</td>
                                        <td className="py-2.5 px-2 text-right text-gray-800">{pct(r.p)}</td>
                                        {Object.keys(SCENARIO_LABELS).map((key) => (
                                            <td key={key} className="py-2.5 px-2 text-right text-gray-800">{pct(r.j[key])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </details>
        </div>
    );
}

/** 보정계수를 하나로 고정한 경우 */
function FixedBranch({ c, branch }) {
    const p = Math.min(1, BASE_RATES.criminalAppeal.value * branch.symmetric);
    const j = jointProbabilities(p, p, c.rho);
    const rows = Object.keys(SCENARIO_LABELS).map((key) => ({ key, value: j[key] }));
    return (
        <div>
            <ScenarioTable rows={rows} labelFor={(k) => SCENARIO_LABELS[k]} />
            <p className="text-base text-gray-600 mt-4">
                각 사건의 파기 확률 {pct(p)} (기저율 {BASE_RATES.criminalAppeal.display} × {branch.symmetric}배) 적용.
            </p>
        </div>
    );
}

/** 대법원이 밝힌 사실 — 예측의 골격 */
function CourtStatementCard() {
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">대법원이 밝힌 사실</h3>
                <TierBadge tier={COURT_STATEMENT.tier} />
            </div>
            <blockquote className="border-l-4 border-blue-400 bg-blue-50/60 pl-5 py-4 rounded-r mb-5">
                <p className="text-base md:text-lg text-gray-800 leading-relaxed">{COURT_STATEMENT.text}</p>
                <p className="text-base text-gray-500 mt-3">출처: {COURT_STATEMENT.source}</p>
            </blockquote>
            <p className="text-lg font-semibold text-gray-800 mb-3">예측에 어떻게 반영되는가</p>
            <div className="space-y-4">
                {COURT_STATEMENT.facts.map((f, i) => (
                    <div key={i} className="border-l-4 border-gray-300 pl-4 py-1">
                        <p className="text-lg font-bold text-gray-900 mb-1">{f.fact}</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">→ {f.effect}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/** 사건 카드 */
function CaseCard({ c }) {
    const [branchId, setBranchId] = useState(c.branches[0].id);
    const branch = c.branches.find((b) => b.id === branchId);

    return (
        <div className="bg-white rounded-xl border shadow-sm p-7 md:p-8 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{c.title}</h3>
                <span className="text-sm px-3 py-1.5 rounded-full font-medium bg-green-100 text-green-700">
                    예측 {c.predictedAt}
                </span>
            </div>
            <p className="text-lg text-gray-600 mb-7 leading-relaxed">{c.summary}</p>

            {/* 갈래 선택 */}
            <div className="mb-6">
                <p className="text-base font-semibold text-gray-700 mb-3">전합 보정계수 처리 방식</p>
                <div className="flex flex-wrap gap-2">
                    {c.branches.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => setBranchId(b.id)}
                            className={`px-4 py-2.5 rounded-lg text-base font-medium border transition ${
                                branchId === b.id
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                            }`}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
                <p className="text-base text-gray-600 mt-3 leading-relaxed">{branch.detail}</p>
            </div>

            {branch.symmetricRange ? <RangeBranch c={c} branch={branch} /> : <FixedBranch c={c} branch={branch} />}

            <p className="text-base text-gray-500 mt-5 leading-relaxed">
                두 사건의 상관계수 ρ = {c.rho} 적용. {c.rhoNote}
            </p>

            {/* 확인되면 좁혀지는 것 */}
            {c.openQuestions?.length > 0 && (
                <div className="mt-8">
                    <h4 className="font-bold text-gray-900 mb-2 text-xl">확인되면 예측이 좁혀집니다</h4>
                    <p className="text-base text-gray-600 mb-4">
                        아래는 예측을 막는 조건이 아니라, 채워지면 구간이 줄어드는 항목입니다.
                    </p>
                    <div className="space-y-4">
                        {c.openQuestions.map((u, i) => (
                            <div key={i} className="border-l-4 border-blue-400 bg-blue-50/60 pl-5 pr-4 py-4 rounded-r">
                                <p className="font-bold text-gray-900 text-lg md:text-xl mb-2 leading-snug">{u.q}</p>
                                <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-2">→ {u.effect}</p>
                                <p className="text-gray-500 text-base">확인 방법: {u.how}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/** 예측을 좁히지 못하는 원인 — 딱 하나 */
function BlockerCard() {
    const m = BASE_RATES.enBancMultiplier;
    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mb-10">
            <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">🎯</span>
                <div>
                    <h3 className="font-bold text-amber-900 mb-2 text-xl">
                        예측 구간을 좁히려면 숫자 하나가 필요합니다
                    </h3>
                    <p className="text-amber-900 text-lg leading-relaxed mb-3">
                        <strong>전원합의체 보정계수</strong> — 전합에 회부된 사건의 파기율이 소부의 몇 배인가.
                        {' '}{m.why}
                    </p>
                    <p className="text-amber-800 text-base leading-relaxed">
                        <strong>재는 방법:</strong> {m.howToMeasure}
                    </p>
                </div>
            </div>
        </div>
    );
}

/** 방법과 근거 탭 */
function MethodTab() {
    const br = BASE_RATES.criminalAppeal;
    const ap = BASE_RATES.criminalAppellate;
    const m = BASE_RATES.enBancMultiplier;

    return (
        <div className="space-y-8">
            <section className="bg-white rounded-xl border shadow-sm p-7">
                <h3 className="text-2xl font-bold text-gray-900 mb-5">네 칸은 숫자 두 개에서 나옵니다</h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    두 사건의 결과를 네 칸으로 나눈 표는 <strong>파기 확률 두 개와 상관계수 하나</strong>에서 전부 도출됩니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-5 font-mono text-base md:text-lg text-gray-800 overflow-x-auto">
                    <div>둘 다 확정 = (1 − p₁)(1 − p₂)</div>
                    <div>A만 파기 &nbsp;= p₁(1 − p₂)</div>
                    <div>둘 다 파기 = p₁ · p₂</div>
                    <div>B만 파기 &nbsp;= (1 − p₁)p₂</div>
                </div>
                <p className="text-gray-600 text-base mt-5 leading-relaxed">
                    같은 사태에서 갈라진 사건이라면 두 결과가 독립이 아닐 수 있어 상관계수를 반영합니다.
                    계산의 정교함은 근거를 대신하지 못하므로 <strong>p₁·p₂를 어디서 얻는지가 전부</strong>입니다.
                </p>
            </section>

            <section className="bg-white rounded-xl border shadow-sm p-7">
                <h3 className="text-2xl font-bold text-gray-900 mb-5">쓰인 숫자와 그 출처</h3>
                <div className="space-y-6">
                    {[br, ap].map((x) => (
                        <div key={x.detail} className="border-b border-gray-100 pb-5 last:border-0">
                            <div className="flex flex-wrap items-baseline gap-3 mb-2">
                                <span className="text-3xl font-bold text-gray-900">{x.display}</span>
                                <TierBadge tier={x.tier} />
                            </div>
                            <p className="text-lg text-gray-800 mb-1">{x.detail}</p>
                            <p className="text-base text-gray-500">출처: {x.source}</p>
                            {x.caveat && (
                                <p className="text-base text-amber-800 bg-amber-50 rounded p-3 mt-3 leading-relaxed">
                                    ⚠️ {x.caveat}
                                </p>
                            )}
                        </div>
                    ))}

                    <div>
                        <div className="flex flex-wrap items-baseline gap-3 mb-2">
                            <span className="text-3xl font-bold text-amber-700">미측정</span>
                            <TierBadge tier={m.tier} />
                        </div>
                        <p className="text-lg text-gray-800 mb-1">전원합의체 보정계수</p>
                        <p className="text-base text-gray-600 leading-relaxed mb-2">{m.why}</p>
                        <p className="text-base text-gray-500 leading-relaxed">재는 방법: {m.howToMeasure}</p>
                    </div>
                </div>
            </section>

            <section className="bg-white rounded-xl border shadow-sm p-7">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">전원합의체 회부가 뜻하는 것</h3>
                <p className="text-base text-gray-500 mb-4">방향은 조문으로 말할 수 있고, 크기는 판례를 세어야 나옵니다.</p>
                <blockquote className="border-l-4 border-blue-400 bg-blue-50/60 pl-5 py-4 rounded-r mb-4">
                    <p className="text-lg font-semibold text-gray-900 mb-2">{EN_BANC_GROUNDS.article}</p>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed">{EN_BANC_GROUNDS.principle}</p>
                    <ol className="list-decimal list-inside text-base md:text-lg text-gray-700 mt-4 space-y-2">
                        {EN_BANC_GROUNDS.grounds.map((g, i) => <li key={i}>{g}</li>)}
                    </ol>
                </blockquote>
                <p className="text-lg text-gray-800 leading-relaxed">{EN_BANC_GROUNDS.implication}</p>
                <a href={EN_BANC_GROUNDS.url} target="_blank" rel="noopener noreferrer"
                   className="inline-block mt-5 text-blue-600 hover:underline text-lg">
                    조문 원문 보기 →
                </a>
            </section>

            <section className="bg-gray-900 text-white rounded-xl p-7">
                <h3 className="text-2xl font-bold mb-5">이 페이지가 지키는 것</h3>
                <ul className="space-y-3 text-base md:text-lg text-gray-200">
                    <li>1. <strong className="text-white">모르는 값이 있어도 멈추지 않는다.</strong> 구간으로 내고 무엇을 재야 하는지 지목한다.</li>
                    <li>2. <strong className="text-white">모든 수치에 출처와 신뢰 등급을 붙인다.</strong> 1차 자료인지 보도 인용인지 구분해 표시한다.</li>
                    <li>3. <strong className="text-white">개인을 예측하지 않는다.</strong> 대법관 개인의 성향을 점수화하지 않는다.</li>
                    <li>4. <strong className="text-white">틀린 예측을 지우지 않는다.</strong> 예측 시점을 박제하고 결과와 대조해 공개한다.</li>
                </ul>
            </section>
        </div>
    );
}

/** 적중률 탭 */
function ScorecardTab() {
    if (!SCORECARD.length) {
        return (
            <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
                <p className="text-xl text-gray-800 font-medium mb-3">아직 검증할 예측이 없습니다.</p>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                    예측을 공개하면 그 시점을 기록하고, 선고 후 실제 결과와 대조해 이 자리에 남깁니다.
                    <strong className="text-gray-900"> 맞은 것도 틀린 것도 지우지 않습니다.</strong>{' '}
                    적중률을 공개하는 예측만이 예측이기 때문입니다.
                </p>
            </div>
        );
    }
    const hit = SCORECARD.filter((s) => s.hit).length;
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-7">
                <p className="text-lg text-gray-600 mb-1">전체 적중률</p>
                <p className="text-4xl font-bold text-gray-900">
                    {Math.round((hit / SCORECARD.length) * 100)}%
                    <span className="text-lg font-normal text-gray-500 ml-2">({hit}/{SCORECARD.length})</span>
                </p>
            </div>
            {SCORECARD.map((s) => (
                <div key={s.caseId} className="bg-white rounded-xl border shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${s.hit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.hit ? '적중' : '빗나감'}
                        </span>
                        <h4 className="text-lg font-bold text-gray-900">{s.title}</h4>
                    </div>
                    <p className="text-base text-gray-600">예측: {s.predicted} · 실제: {s.actual}</p>
                    {s.note && <p className="text-base text-gray-500 mt-2">{s.note}</p>}
                </div>
            ))}
        </div>
    );
}

export default function CasePrediction() {
    const [tab, setTab] = useState('cases');

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title="재판 결과 예측 — 근거를 공개하는 분석 | 시민법정"
                description="대법원 사건의 결론을 확률로 제시하되, 그 확률이 어디서 나왔는지를 함께 공개합니다. 기저율과 조문 근거를 밝히고, 예측 적중률을 검증해 남깁니다."
                image="https://siminbupjung-blog.web.app/og-prediction.png"
            />
            <Header />

            {/* 헤더가 fixed top-0 이므로 상단 여백이 필요하다. 다른 페이지와 같은 pt-28. */}
            <main className="max-w-4xl mx-auto px-4 pt-28 pb-16">
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">재판 결과 예측</h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                        확률을 팔지 않고 근거를 팝니다. 숫자보다 <strong className="text-gray-800">그 숫자가 어디서 나왔는지</strong>를 먼저 보여주고,
                        예측한 뒤에는 <strong className="text-gray-800">맞았는지 틀렸는지를 남깁니다.</strong>
                    </p>
                </div>

                {tab === 'cases' && <BlockerCard />}

                <div className="flex gap-2 mb-8 border-b overflow-x-auto">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`px-5 py-3 text-lg font-medium whitespace-nowrap transition border-b-2 -mb-px ${
                                tab === t.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'cases' && <><CourtStatementCard />{PREDICTION_CASES.map((c) => <CaseCard key={c.id} c={c} />)}</>}
                {tab === 'method' && <MethodTab />}
                {tab === 'scorecard' && <ScorecardTab />}

                <div className="mt-10">
                    <SNSShareBar
                        title="재판 결과 예측 — 근거를 공개하는 분석"
                        url="https://xn--lg3b0kt4n41f.kr/prediction"
                    />
                </div>
            </main>
        </div>
    );
}
