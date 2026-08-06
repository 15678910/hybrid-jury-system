import { useState } from 'react';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import {
    BASE_RATES,
    EN_BANC_GROUNDS,
    PREDICTION_CASES,
    SCORECARD,
    canShowProbabilities,
} from '../data/predictions';

// =============================================================================
// 재판 결과 예측 — 확률이 아니라 근거를 보여주는 페이지
//
// 설계 원칙 (docs/analysis/전원합의체_1호분석.md)
//  1. 근거 없는 숫자는 표시하지 않는다. 기저율이 없으면 「수집 전」이라고 쓴다.
//  2. 모든 수치에 출처를 붙인다.
//  3. 대법관 개인을 예측하지 않는다.
//  4. 틀린 예측을 지우지 않는다 — 적중률 탭에 남긴다.
// =============================================================================

const TABS = [
    { id: 'cases', label: '사건 분석' },
    { id: 'method', label: '방법과 근거' },
    { id: 'scorecard', label: '적중률' },
];

/** 근거 없는 상태를 정직하게 보여주는 배너 */
function PendingDataBanner() {
    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mb-10">
            <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">⚠️</span>
                <div>
                    <h3 className="font-bold text-amber-900 mb-2 text-xl">아직 확률을 표시하지 않습니다</h3>
                    <p className="text-amber-800 text-lg leading-relaxed">
                        예측의 출발점이 되는 <strong>기저율(형사 상고심 파기율)</strong>을 아직 확보하지 못했습니다.
                        근거 없이 숫자를 만들어 표시하는 것은 이 페이지가 가장 하지 않으려는 일입니다.
                        기저율이 확보되면 이 자리에 시나리오별 확률 구간이 표시됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}

/** 사건 카드 */
function CaseCard({ c }) {
    const STATUS = {
        'pending-verification': { label: '사실관계 확인 중', cls: 'bg-gray-100 text-gray-700' },
        analyzing: { label: '쟁점 분석 중', cls: 'bg-blue-100 text-blue-700' },
        predicted: { label: '예측 확정', cls: 'bg-green-100 text-green-700' },
        decided: { label: '선고 완료', cls: 'bg-purple-100 text-purple-700' },
    };
    const st = STATUS[c.status] || STATUS['pending-verification'];

    return (
        <div className="bg-white rounded-xl border shadow-sm p-7 md:p-8 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900">{c.title}</h3>
                <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
            </div>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">{c.summary}</p>

            {c.scenarios ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-lg">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-3 px-3 font-semibold text-gray-700">예상 결론</th>
                                <th className="text-right py-3 px-3 font-semibold text-gray-700">확률 구간</th>
                            </tr>
                        </thead>
                        <tbody>
                            {c.scenarios.map((s) => (
                                <tr key={s.label} className="border-b border-gray-100">
                                    <td className="py-3.5 px-3 text-gray-800">{s.label}</td>
                                    <td className="py-3.5 px-3 text-right font-bold text-gray-900 text-xl">{s.range}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-gray-50 rounded-lg p-5 text-lg text-gray-600">
                    확률 구간은 기저율 확보 후 표시됩니다.
                </div>
            )}

            {c.unverified?.length > 0 && (
                <div className="mt-8">
                    <h4 className="font-bold text-gray-900 mb-4 text-xl">확인해야 할 사실</h4>
                    <div className="space-y-4">
                        {c.unverified.map((u, i) => (
                            <div key={i} className="border-l-4 border-amber-400 bg-amber-50/60 pl-5 pr-4 py-4 rounded-r">
                                <p className="font-bold text-gray-900 text-lg md:text-xl mb-2 leading-snug">⚠️ {u.claim}</p>
                                <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-2">{u.why}</p>
                                <p className="text-gray-500 text-base">확인 방법: {u.howToVerify}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/** 방법과 근거 탭 */
function MethodTab() {
    const br = BASE_RATES.enBancCriminal;
    return (
        <div className="space-y-8">
            <section className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-5">확률 하나가 아니라 숫자 두 개에서 나옵니다</h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    두 사건의 결과를 네 칸으로 나눈 표는 사실 <strong>파기 확률 두 개와 상관계수 하나</strong>에서 전부 도출됩니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-base md:text-lg text-gray-800 overflow-x-auto">
                    <div>둘 다 확정 = (1 − p₁)(1 − p₂)</div>
                    <div>A만 파기 &nbsp;= p₁(1 − p₂)</div>
                    <div>둘 다 파기 = p₁ · p₂</div>
                    <div>B만 파기 &nbsp;= (1 − p₁)p₂</div>
                </div>
                <p className="text-gray-600 text-base mt-5 leading-relaxed">
                    같은 사태에서 갈라진 사건이라면 두 결과가 독립이 아닐 수 있어, 상관계수를 반영해 계산합니다.
                    계산의 정교함은 근거를 대신하지 못하므로, <strong>p₁·p₂를 어디서 얻는지가 전부</strong>입니다.
                </p>
            </section>

            <section className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-5">기저율 — 예측의 출발점</h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                    기저율은 아무 정보도 없을 때의 출발 확률입니다. 「이 사건은 어떻게 될까」를 묻기 전에
                    「이런 종류의 사건은 <strong>원래</strong> 어떻게 되는가」를 먼저 알아야 합니다.
                    기저율 없이 개별 사정만 보면 숫자가 허공에서 나옵니다.
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-lg">
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 pr-5 text-gray-600 whitespace-nowrap">전합 형사사건 파기율</td>
                                <td className="py-3 font-bold text-gray-900 text-xl">
                                    {br.value === null
                                        ? <span className="text-amber-700">수집 전</span>
                                        : `${(br.value * 100).toFixed(1)}%`}
                                </td>
                            </tr>
                            <tr className="border-b border-gray-100">
                                <td className="py-3 pr-5 text-gray-600">표본 수</td>
                                <td className="py-3 text-gray-900">{br.sampleSize ?? '—'}</td>
                            </tr>
                            <tr>
                                <td className="py-3 pr-5 text-gray-600 align-top">출처</td>
                                <td className="py-3 text-gray-900">{br.source}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-gray-500 text-base mt-5 leading-relaxed border-t pt-5">
                    <strong>표본의 성격:</strong> {br.note}
                </p>
            </section>

            <section className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">전원합의체 회부가 뜻하는 것</h3>
                <p className="text-base text-gray-500 mb-4">
                    확률은 몰라도 방향은 법 조문으로 말할 수 있습니다.
                </p>
                <blockquote className="border-l-4 border-blue-400 bg-blue-50/60 pl-4 py-3 rounded-r mb-4">
                    <p className="text-lg font-semibold text-gray-900 mb-2">{EN_BANC_GROUNDS.article}</p>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed">{EN_BANC_GROUNDS.principle}</p>
                    <ol className="list-decimal list-inside text-base md:text-lg text-gray-700 mt-4 space-y-2">
                        {EN_BANC_GROUNDS.grounds.map((g, i) => <li key={i}>{g}</li>)}
                    </ol>
                </blockquote>
                <p className="text-lg text-gray-800 leading-relaxed">{EN_BANC_GROUNDS.implication}</p>
                <a
                    href={EN_BANC_GROUNDS.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-5 text-blue-600 hover:underline text-lg"
                >
                    조문 원문 보기 →
                </a>
            </section>

            <section className="bg-gray-900 text-white rounded-xl p-6">
                <h3 className="text-2xl font-bold mb-5">이 페이지가 지키는 것</h3>
                <ul className="space-y-3 text-base md:text-lg text-gray-200">
                    <li>1. <strong className="text-white">확률을 팔지 않고 근거를 판다.</strong> 숫자가 없으면 숫자를 내지 않는다.</li>
                    <li>2. <strong className="text-white">모르는 것은 모른다고 쓴다.</strong> 미확인 사항을 화면에 남긴다.</li>
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
                    <strong className="text-gray-900"> 맞은 것도 틀린 것도 지우지 않습니다.</strong> 적중률을 공개하는 예측만이 예측이기 때문입니다.
                </p>
            </div>
        );
    }
    const hit = SCORECARD.filter((s) => s.hit).length;
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
                <p className="text-lg text-gray-600 mb-1">전체 적중률</p>
                <p className="text-3xl font-bold text-gray-900">
                    {Math.round((hit / SCORECARD.length) * 100)}%
                    <span className="text-base font-normal text-gray-500 ml-2">({hit}/{SCORECARD.length})</span>
                </p>
            </div>
            {SCORECARD.map((s) => (
                <div key={s.caseId} className="bg-white rounded-xl border shadow-sm p-5">
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
    const showProb = canShowProbabilities();

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title="재판 결과 예측 — 근거를 공개하는 분석 | 시민법정"
                description="대법원 사건의 결론을 확률로 제시하기 전에, 그 확률이 어디서 나왔는지를 먼저 공개합니다. 기저율과 조문 근거를 밝히고, 예측 적중률을 검증해 남깁니다."
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

                {!showProb && <PendingDataBanner />}

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

                {tab === 'cases' && (
                    <div>
                        {PREDICTION_CASES.map((c) => <CaseCard key={c.id} c={c} />)}
                    </div>
                )}
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
