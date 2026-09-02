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
    CASE_FACTS,
    SAMPLE_BIAS,
    OUTCOME_LABELS,
    OUTCOME_SCENARIO_LABELS,
    SCOPE_MEANING,
    APPEAL_STRUCTURE,
    INSTANCE_COMPARISON,
    APPEAL_SCOPE_LIMIT,
    COURT_COMPOSITION,
    VACANCY_EFFECT,
    DELAY_ANALYSIS,
    TIMING,
    NOMINATION_STANDOFF,
} from '../data/predictions';
import {
    jointProbabilities, pct, pctRange,
    jointOutcomes, outcomeMarginal, OUTCOME_ORDER,
} from '../lib/predictionMath';

/**
 * 파기를 「전부」와 「일부」로 나눌 수 있는가.
 *
 * 판례 집계로 partialShare 를 재기 전에는 나눌 수 없다. 그때는 기존 2분류
 * (파기/확정) 표를 그대로 쓰고, 화면에 「아직 나누지 못했다」고 밝힌다.
 * 재지 못한 값을 그럴듯한 숫자로 채워 넣으면 표가 정교해 보일 뿐 근거는 없다.
 */
const partialShare = () => BASE_RATES.partialShareAmongReversals?.value ?? null;

// =============================================================================
// 대법원 재판 결과 예측 — 우리 예측을 낸다
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

/**
 * 파기의 범위 — 전부인가 일부인가.
 *
 * 왜 넣었는가: 결론을 「파기/확정」 둘로만 나눈 표에서는 「원심 중 일부를 파기하고
 * 나머지 상고는 기각」이라는 결론이 아예 보이지 않는다. 여러 공소사실이 병합된
 * 사건에서는 그것이 오히려 흔하고, 이 두 사건은 항소심에서 이미 유죄·무죄로 갈렸다.
 */
function ScopeSection() {
    const share = partialShare();
    const meta = BASE_RATES.partialShareAmongReversals;

    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">「파기」는 한 가지가 아닙니다</h3>
            <p className="text-base text-gray-500 mb-5">
                전부 파기와 일부 파기는 결론의 무게가 다릅니다. 한 칸에 넣으면 구분이 사라집니다.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {SCOPE_MEANING.map((s) => (
                    <div key={s.key} className="bg-gray-50 rounded-lg p-5">
                        <p className="text-xl font-bold text-gray-900 mb-2">{s.title}</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">{s.text}</p>
                        <p className="text-base text-gray-500 leading-relaxed">{s.note}</p>
                    </div>
                ))}
            </div>

            {share === null ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                    <p className="text-lg font-bold text-amber-900 mb-2">아직 나누지 못했습니다</p>
                    <p className="text-base md:text-lg text-amber-900/85 leading-relaxed">
                        파기된 사건 중 일부 파기가 몇 %인지를 재야 표를 나눌 수 있습니다.
                        그 값을 재기 전에는 <strong>파기/확정 2분류 표</strong>를 그대로 씁니다.
                        재지 못한 값을 그럴듯한 숫자로 채우면 표만 정교해 보이고 근거는 없기 때문입니다.
                    </p>
                    <p className="text-base text-amber-800 mt-3">재는 방법: {meta.source}</p>
                </div>
            ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <div className="flex flex-wrap items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-blue-900">{meta.display}</span>
                        <TierBadge tier={meta.tier} />
                    </div>
                    <p className="text-base md:text-lg text-gray-800 leading-relaxed">{meta.detail}</p>
                    <p className="text-base text-gray-500 mt-2">출처: {meta.source}</p>
                    {meta.enBancObservation && (
                        <div className="bg-white/70 border border-blue-200 rounded p-4 mt-4">
                            <p className="text-lg font-bold text-gray-900 mb-2">
                                전원합의체 표본에서는 일부 파기가 0건이었다
                                <span className="ml-2 text-base font-normal text-gray-500">
                                    (파기 {meta.enBancObservation.reversals}건 중 {meta.enBancObservation.partial}건)
                                </span>
                            </p>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                                {meta.enBancObservation.note}
                            </p>
                        </div>
                    )}
                    {meta.caveat && (
                        <p className="text-base text-amber-800 bg-amber-50 rounded p-3 mt-3 leading-relaxed">
                            ⚠️ {meta.caveat}
                        </p>
                    )}
                </div>
            )}
        </section>
    );
}

/**
 * 심급 비교 — 1심과 2심이 쟁점별로 어떻게 갈렸는가.
 *
 * 파기율이라는 하나의 숫자로는 「무엇이 파기될 수 있는가」가 보이지 않는다.
 * 쟁점별로 갈라 놓으면 두 심급이 일치한 쟁점과 갈린 쟁점이 드러나고,
 * 그것이 전부 파기와 일부 파기를 가르는 실마리가 된다.
 */
function InstanceComparisonSection() {
    const d = INSTANCE_COMPARISON;

    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">1심과 2심의 판결 차이</h3>
                <TierBadge tier={d.tier} />
            </div>
            <p className="text-base text-gray-500 mb-6">
                상고심은 사실심이 아니라 법률심입니다. 두 하급심이 다르게 판단한 쟁점이
                대법원이 실질적으로 다시 볼 자리입니다.
            </p>

            {d.cases.map((c) => (
                <div key={c.name} className="mb-8 last:mb-0">
                    <div className="flex flex-wrap items-baseline gap-3 mb-3">
                        <h4 className="text-xl font-bold text-gray-900">{c.name}</h4>
                        <span className={`text-base font-semibold px-3 py-1 rounded-full ${
                            c.sentenceDirection === 'down'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {c.first.sentence} → {c.second.sentence} ({c.sentenceChange})
                        </span>
                    </div>
                    <p className="text-base text-gray-500 mb-4">
                        1심 {c.first.court} {c.first.date} · 2심 {c.second.court} {c.second.date}
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-base">
                            <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="text-left py-2.5 pr-3 font-semibold text-gray-700">죄목</th>
                                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">1심</th>
                                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">2심</th>
                                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">일치</th>
                                    <th className="text-left py-2.5 pl-3 font-semibold text-gray-700 whitespace-nowrap">특검 상고</th>
                                </tr>
                            </thead>
                            {/* 표에는 죄목과 판단만 둔다. 설명은 표 아래로 뺐다 —
                                칸 안에 긴 문장이 들어가면 죄목별 비교가 한눈에 들어오지 않는다. */}
                            <tbody>
                                {c.issues.map((it) => (
                                    <tr key={it.issue} className="border-b border-gray-200">
                                        <td className="py-3 pr-3 font-medium text-gray-900">{it.issue}</td>
                                        <td className="py-3 px-3 text-gray-800 whitespace-nowrap">{it.first}</td>
                                        <td className="py-3 px-3 text-gray-800 whitespace-nowrap">{it.second}</td>
                                        <td className="py-3 px-3 whitespace-nowrap">
                                            {it.agree
                                                ? <span className="text-blue-700 font-semibold">일치</span>
                                                : <span className="text-red-700 font-semibold">갈림</span>}
                                        </td>
                                        {/* 상고 주체는 심급 일치 여부와 별개다. 한 칸에 섞으면
                                            표시가 없는 행이 「상고가 없다」로 읽힌다. */}
                                        <td className="py-3 pl-3 whitespace-nowrap">
                                            {it.prosecutionAppealed
                                                ? <span className="text-gray-900 font-semibold">○</span>
                                                : <span className="text-gray-300">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 죄목별 설명 — 표 아래 따로 */}
                    {c.issues.some((it) => it.note) && (
                        <div className="mt-5 bg-gray-50 rounded-lg p-5">
                            <p className="text-base font-semibold text-gray-700 mb-3">죄목별 설명</p>
                            <div className="space-y-3">
                                {c.issues.filter((it) => it.note).map((it) => (
                                    <div key={it.issue}>
                                        <p className="text-base md:text-lg font-bold text-gray-900">{it.issue}</p>
                                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">{it.note}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-3">
                        {c.sources.map((s) => (
                            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                               className="text-base text-blue-600 hover:underline">{s.name} →</a>
                        ))}
                    </div>
                </div>
            ))}

            <div className="border-t pt-6 mt-2">
                <p className="text-lg font-semibold text-gray-800 mb-4">이 표에서 읽히는 것</p>
                <div className="space-y-5">
                    {d.readings.map((r, i) => (
                        <div key={i} className="border-l-4 border-gray-300 pl-4 py-1">
                            <p className="text-lg md:text-xl font-bold text-gray-900 mb-1">{r.title}</p>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">{r.detail}</p>
                            <p className="text-base md:text-lg text-blue-800 leading-relaxed">→ {r.effect}</p>
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-base md:text-lg text-gray-700 bg-blue-50 border border-blue-200 rounded p-4 mt-5 leading-relaxed">
                {d.appealNote.split('**').map((t, i) =>
                    i % 2 ? <strong key={i} className="text-gray-900">{t}</strong> : t)}
            </p>
            <p className="text-base text-amber-800 bg-amber-50 rounded p-3 mt-3 leading-relaxed">
                ⚠️ {d.caveat}
            </p>
        </section>
    );
}

/** 형사소송법 제383조 제4호 — 두 사건에 다르게 걸리는 확정적 제약 */
function AppealScopeLimitCard() {
    const a = APPEAL_SCOPE_LIMIT;
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">두 사건은 다툴 수 있는 범위가 다릅니다</h3>
                <TierBadge tier={a.tier} />
            </div>
            <p className="text-base text-gray-500 mb-5">
                추정이 아니라 조문입니다. 선고형 10년이 경계이고, 두 사건이 그 양쪽에 있습니다.
            </p>

            <blockquote className="border-l-4 border-blue-400 bg-blue-50/60 pl-5 py-4 rounded-r mb-5">
                <p className="text-lg font-semibold text-gray-900 mb-2">{a.article}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">{a.text}</p>
            </blockquote>

            <div className="grid md:grid-cols-2 gap-4 mb-5">
                {a.rows.map((r) => (
                    <div key={r.name} className={`rounded-lg p-5 ${r.over10 ? 'bg-gray-50' : 'bg-amber-50'}`}>
                        <div className="flex items-baseline gap-3 mb-2">
                            <p className="text-xl font-bold text-gray-900">{r.name}</p>
                            <p className="text-lg font-semibold text-gray-700">{r.sentence}</p>
                        </div>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">{r.effect}</p>
                    </div>
                ))}
            </div>

            <p className="text-base md:text-lg text-gray-800 leading-relaxed">{a.implication}</p>
        </section>
    );
}

/**
 * 재판부 성향을 어떻게 다루는가 — 평판이 아니라 판결 기록으로.
 *
 * 「어느 대법원장 아래 재판부는 어느 쪽에 기운다」는 관측에는 쓸 만한 알맹이가
 * 있지만, 그 알맹이는 평판이 아니라 세어 볼 수 있는 인용률이다. 왜 그렇게 다루는지를
 * 화면에 밝혀 둔다. 감추면 「왜 이건 안 넣었나」라는 물음에 답할 수 없다.
 */
function CourtCompositionCard() {
    const c = COURT_COMPOSITION;
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">재판부 성향은 이렇게 다룹니다</h3>
            <p className="text-base text-gray-500 mb-5">
                평판을 계수로 바꾸지 않고, 판결 기록을 세어 확인합니다.
            </p>

            <div className="bg-gray-50 rounded-lg p-5 mb-5">
                <p className="text-lg font-bold text-gray-900 mb-1">{c.chiefJustice.name}</p>
                <p className="text-base text-gray-700">{c.chiefJustice.inaugurated}</p>
                <a href={c.chiefJustice.url} target="_blank" rel="noopener noreferrer"
                   className="text-base text-blue-600 hover:underline">대법원 공식 자료 →</a>
            </div>

            <div className="space-y-4 mb-6">
                {c.structuralFacts.map((f, i) => (
                    <div key={i} className="border-l-4 border-gray-300 pl-4 py-1">
                        <p className="text-lg font-bold text-gray-900 mb-1">{f.fact}</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">{f.detail}</p>
                    </div>
                ))}
            </div>

            {/* 명단을 실제로 대조한 결과 */}
            {c.roster && (
                <div className="border border-gray-200 rounded-lg p-5 mb-5">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                        <p className="text-lg font-bold text-gray-900">
                            현직 대법관을 제청한 대법원장은 누구인가
                        </p>
                        <TierBadge tier={c.roster.tier} />
                    </div>
                    <p className="text-base text-gray-500 mb-4">
                        {c.roster.asOf} 기준 · {c.roster.chiefJusticeSince}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {c.roster.byNominator.map((g) => (
                            <div key={g.nominator} className="bg-gray-50 rounded-lg p-5">
                                <div className="flex items-baseline gap-3 mb-3">
                                    <span className="text-3xl font-bold text-gray-900">{g.count}명</span>
                                    <span className="text-base font-semibold text-gray-700">{g.nominator}</span>
                                </div>
                                <ul className="space-y-1.5">
                                    {g.members.map((m) => (
                                        <li key={m.name} className="text-base text-gray-700">
                                            <span className="font-medium text-gray-900">{m.name}</span>
                                            <span className="text-gray-500"> · {m.took}</span>
                                            {m.note && (
                                                <span className="block text-sm text-amber-800">{m.note}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <p className="text-base text-gray-600 mb-4">{c.roster.vacancy}</p>

                    <p className="text-base md:text-lg text-gray-900 font-medium leading-relaxed mb-3">
                        {c.roster.finding}
                    </p>
                    <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">{c.roster.trend}</p>
                    <p className="text-base text-gray-600 leading-relaxed mb-3">{c.roster.nuance}</p>

                    <div className="flex flex-wrap gap-3">
                        {c.roster.sources.map((s) => (
                            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                               className="text-base text-blue-600 hover:underline">{s.name} →</a>
                        ))}
                    </div>
                </div>
            )}

        </section>
    );
}

/**
 * 제청이 없는 상태 — 왜 예측에 걸리는가.
 *
 * 「누가 왜 안 하는가」는 답할 수 없지만, 「비어 있으면 무엇이 달라지는가」와
 * 「왜 이 상태가 지속될 수 있는가」는 조문과 기록으로 답할 수 있다.
 */
function NominationStandoffCard() {
    const n = NOMINATION_STANDOFF;
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{n.title}</h3>
                <TierBadge tier={n.tier} />
            </div>
            <p className="text-base text-gray-500 mb-5">{n.asOf}</p>

            {/* 기간 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
                <div className="flex flex-wrap gap-6 mb-3">
                    <div>
                        <p className="text-base text-amber-800">현재 공백</p>
                        <p className="text-4xl font-bold text-amber-900">{n.duration.days}일</p>
                        <p className="text-base text-amber-800 mt-1">{n.duration.since}</p>
                    </div>
                    <div className="self-center text-2xl text-amber-700">vs</div>
                    <div>
                        <p className="text-base text-amber-800">역대 최장</p>
                        <p className="text-4xl font-bold text-amber-900">{n.duration.record}일</p>
                        <p className="text-base text-amber-800 mt-1">{n.duration.recordCase}</p>
                    </div>
                    <div className="self-center">
                        <p className="text-base text-amber-800">초과</p>
                        <p className="text-2xl font-bold text-amber-900">+{n.duration.exceeded}일</p>
                    </div>
                </div>
                <p className="text-base md:text-lg text-amber-900 leading-relaxed">{n.duration.reading}</p>
                <a href={n.duration.source.url} target="_blank" rel="noopener noreferrer"
                   className="text-base text-blue-700 hover:underline">{n.duration.source.name} →</a>
            </div>

            {/* 경과 */}
            <p className="text-lg font-semibold text-gray-800 mb-3">경과</p>
            <div className="space-y-3 mb-3">
                {n.timeline.map((t) => (
                    <div key={t.when} className="flex gap-4">
                        <span className="text-base font-bold text-gray-500 whitespace-nowrap w-24 shrink-0">
                            {t.when}
                        </span>
                        <span className="text-base md:text-lg text-gray-800 leading-relaxed">{t.what}</span>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-3 mb-6">
                {n.timelineSources.map((s) => (
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                       className="text-base text-blue-600 hover:underline">{s.name} →</a>
                ))}
            </div>

            {/* 구조 */}
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
                <p className="text-lg font-bold text-gray-900 mb-3">{n.structure.title}</p>
                <div className="space-y-4">
                    {n.structure.points.map((p, i) => (
                        <div key={i} className="border-l-4 border-gray-300 pl-4 py-1">
                            <p className="text-lg font-bold text-gray-900 mb-1">{p.point}</p>
                            <p className="text-base md:text-lg text-gray-700 leading-relaxed">{p.detail}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 사실의 병치 */}
            <div className="border border-gray-200 rounded-lg p-5 mb-6">
                <p className="text-lg font-bold text-gray-900 mb-3">{n.tension.title}</p>
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div className="bg-gray-50 rounded p-4">
                        <p className="text-base md:text-lg text-gray-800 leading-relaxed">{n.tension.a}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-4">
                        <p className="text-base md:text-lg text-gray-800 leading-relaxed">{n.tension.b}</p>
                    </div>
                </div>
                <p className="text-base md:text-lg text-amber-900 bg-amber-50 rounded p-4 leading-relaxed">
                    ⚠️ {n.tension.caution}
                </p>
            </div>

            {/* 「거부」인가 */}
            <div className="border border-gray-200 rounded-lg p-5 mb-6">
                <p className="text-lg font-bold text-gray-900 mb-2">{n.characterization.title}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">
                    {n.characterization.detail}
                </p>
                <p className="text-base md:text-lg text-gray-600 leading-relaxed">{n.characterization.why}</p>
            </div>

            {/* 이 사건에 걸리는 효과 */}
            <p className="text-lg font-semibold text-gray-800 mb-3">{n.effect.title}</p>
            <ul className="space-y-3 mb-6">
                {n.effect.items.map((it, i) => (
                    <li key={i} className="text-base md:text-lg text-gray-700 leading-relaxed border-l-4 border-blue-400 pl-4 py-1">
                        {it}
                    </li>
                ))}
            </ul>

            <p className="text-base md:text-lg text-gray-600 bg-gray-50 rounded p-4 leading-relaxed">
                <strong className="text-gray-900">판정하지 않는 것 — </strong>{n.notJudged}
            </p>
        </section>
    );
}

/**
 * 언제 선고되는가 — 예측의 조건이 전부 여기에 걸린다.
 *
 * 재판부 구성도 정족수의 홀짝도 모두 시점에 따라 달라지므로, 시점을 모르면
 * 나머지 계산이 어느 경우의 것인지도 모르게 된다. 기일은 미확정이지만
 * 위아래 한계와 갈림길, 그리고 무엇을 보면 좁혀지는지는 적을 수 있다.
 */
function TimingCard() {
    const t = TIMING;
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{t.title}</h3>
                <TierBadge tier={t.tier} />
                <span className="text-sm px-2.5 py-1 rounded-full font-medium bg-amber-100 text-amber-800">
                    {t.status}
                </span>
            </div>
            <p className="text-base text-gray-500 mb-6">{t.statusNote}</p>

            {/* 위아래 한계 */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {t.bounds.map((b) => (
                    <div key={b.side} className="bg-gray-50 rounded-lg p-5">
                        <p className="text-base text-gray-500 mb-1">{b.side} 한계</p>
                        <p className="text-xl font-bold text-gray-900 mb-2">{b.label}</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">{b.detail}</p>
                        {b.effect && (
                            <p className="text-base md:text-lg text-blue-800 leading-relaxed mb-2">→ {b.effect}</p>
                        )}
                        {b.caveat && (
                            <p className="text-base text-amber-800 bg-amber-50 rounded p-3 leading-relaxed">
                                ⚠️ {b.caveat}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* 갈림길 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                    <span className="text-3xl font-bold text-blue-900">{t.fork.date}</span>
                    <span className="text-lg font-semibold text-gray-800">{t.fork.what}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div className="bg-white/70 rounded p-4">
                        <p className="text-base font-bold text-red-700 mb-1">이전에 선고되면</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">{t.fork.before}</p>
                    </div>
                    <div className="bg-white/70 rounded p-4">
                        <p className="text-base font-bold text-blue-700 mb-1">이후에 선고되면</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">{t.fork.after}</p>
                    </div>
                </div>
                <p className="text-base md:text-lg text-gray-900 font-medium leading-relaxed">{t.fork.why}</p>
            </div>

            {/* 비교 사례 */}
            <div className="border border-gray-200 rounded-lg p-5 mb-6">
                <p className="text-xl font-bold text-gray-900 mb-1">{t.precedent.title}</p>
                <p className="text-base text-gray-500 mb-4">{t.precedent.case}</p>

                <div className="space-y-2 mb-3">
                    {t.precedent.timeline.map((row) => (
                        <div key={row.date} className="flex gap-4">
                            <span className="text-base font-bold text-gray-500 whitespace-nowrap w-24 shrink-0">
                                {row.date}
                            </span>
                            <span className="text-base md:text-lg text-gray-800 leading-relaxed">{row.what}</span>
                        </div>
                    ))}
                </div>
                <p className="text-2xl font-bold text-gray-900 mb-3">{t.precedent.elapsed}</p>
                <p className="text-base md:text-lg text-gray-900 leading-relaxed mb-3">{t.precedent.reading}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">{t.precedent.counterweight}</p>
                <a href={t.precedent.source.url} target="_blank" rel="noopener noreferrer"
                   className="text-base text-blue-600 hover:underline">{t.precedent.source.name} →</a>
            </div>

            {/* 관측 계획 */}
            <p className="text-lg font-semibold text-gray-800 mb-3">{t.watch.title}</p>
            <div className="space-y-4 mb-5">
                {t.watch.items.map((w, i) => (
                    <div key={i} className="border-l-4 border-blue-400 bg-blue-50/50 pl-4 pr-3 py-3 rounded-r">
                        <p className="text-lg font-bold text-gray-900 mb-1">{w.signal}</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">{w.meaning}</p>
                    </div>
                ))}
            </div>

            <p className="text-base md:text-lg text-gray-600 bg-gray-50 rounded p-4 leading-relaxed">
                {t.notPredicted}
            </p>
        </section>
    );
}

/**
 * 선고가 미뤄진 일 — 목적과 효과를 갈라 놓는다.
 *
 * 둘을 섞으면 효과가 곧 의도의 증거처럼 읽힌다. 그래서 확인되는 사실(조문·날짜·
 * 비교 사건)과 달라지는 것(재판부 구성·정족수)을 먼저 놓고, 목적은 왜 판정하지
 * 않는지를 마지막에 밝힌다.
 */
function DelayAnalysisCard() {
    const d = DELAY_ANALYSIS;
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{d.title}</h3>
                <TierBadge tier={d.tier} />
            </div>
            <p className="text-base text-gray-500 mb-5">
                왜 미뤘는지는 알 수 없지만, 무엇이 미뤄졌고 그래서 무엇이 달라지는지는 말할 수 있습니다.
            </p>

            {/* 조문 */}
            <blockquote className="border-l-4 border-blue-400 bg-blue-50/60 pl-5 py-4 rounded-r mb-5">
                <p className="text-lg font-semibold text-gray-900 mb-2">{d.rule.article}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">{d.rule.text}</p>
                <a href={d.rule.source.url} target="_blank" rel="noopener noreferrer"
                   className="text-base text-blue-600 hover:underline">{d.rule.source.name} →</a>
            </blockquote>

            {/* 시한 계산 */}
            <div className="overflow-x-auto mb-4">
                <table className="w-full text-base">
                    <thead>
                        <tr className="border-b-2 border-gray-300">
                            <th className="text-left py-2.5 pr-3 font-semibold text-gray-700">사건</th>
                            <th className="text-left py-2.5 px-3 font-semibold text-gray-700">항소심 선고</th>
                            <th className="text-left py-2.5 pl-3 font-semibold text-gray-700">상고심 선고 시한</th>
                        </tr>
                    </thead>
                    <tbody>
                        {d.deadlines.map((r) => (
                            <tr key={r.name} className="border-b border-gray-200">
                                <td className="py-3 pr-3 font-medium text-gray-900">{r.name}</td>
                                <td className="py-3 px-3 text-gray-800">{r.second}</td>
                                <td className="py-3 pl-3 font-bold text-red-700">{r.due}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-base md:text-lg text-gray-800 leading-relaxed mb-1">{d.event}</p>
            <a href={d.eventSource.url} target="_blank" rel="noopener noreferrer"
               className="text-base text-blue-600 hover:underline">{d.eventSource.name} →</a>

            {/* 효력 — 저촉되는가 */}
            <div className="bg-gray-50 rounded-lg p-5 my-6">
                <p className="text-lg font-bold text-gray-900 mb-1">{d.effect.question}</p>
                <p className="text-base md:text-lg text-gray-900 font-medium leading-relaxed bg-white rounded p-4 mb-3">
                    {d.effect.answer}
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-5">{d.effect.legal}</p>

                {/* 조문 대비 */}
                <p className="text-lg font-bold text-gray-900 mb-3">{d.effect.comparison.title}</p>
                <div className="overflow-x-auto mb-3">
                    <table className="w-full text-base bg-white rounded">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700">법</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700">조문 제목</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700">본문 문언</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">성격</th>
                            </tr>
                        </thead>
                        <tbody>
                            {d.effect.comparison.rows.map((r) => (
                                <tr key={r.law} className="border-b border-gray-200 align-top">
                                    <td className="py-3 px-3 font-medium text-gray-900">{r.law}</td>
                                    <td className="py-3 px-3 text-gray-700">{r.heading}</td>
                                    <td className="py-3 px-3 text-gray-700">{r.wording}</td>
                                    <td className={`py-3 px-3 font-semibold whitespace-nowrap ${
                                        r.nature === '강행규정' ? 'text-red-700' : 'text-gray-600'
                                    }`}>
                                        {r.nature}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-base md:text-lg text-gray-900 leading-relaxed mb-4">
                    {d.effect.comparison.reading}
                </p>

                <p className="text-base md:text-lg text-gray-900 leading-relaxed">{d.effect.tension}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                    {d.effect.sources.map((s) => (
                        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                           className="text-base text-blue-600 hover:underline">{s.name} →</a>
                    ))}
                </div>
            </div>

            {/* 회부 시점 */}
            <div className="border border-gray-200 rounded-lg p-5 mb-6">
                <p className="text-lg font-bold text-gray-900 mb-3">{d.referralTiming.title}</p>
                <p className="text-base md:text-lg text-gray-800 leading-relaxed mb-3">{d.referralTiming.fact}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">{d.referralTiming.path}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">{d.referralTiming.contrast}</p>
                <p className="text-base md:text-lg text-amber-900 bg-amber-50 rounded p-4 leading-relaxed">
                    ⚠️ {d.referralTiming.cannotSettle}
                </p>
            </div>

            {/* 비교 사실 */}
            <div className="border border-gray-200 rounded-lg p-5 mb-6">
                <p className="text-lg font-bold text-gray-900 mb-3">{d.context.title}</p>
                <ul className="space-y-3 mb-3">
                    {d.context.items.map((it, i) => (
                        <li key={i} className="text-base md:text-lg text-gray-700 leading-relaxed">
                            · {it.fact}{' '}
                            <a href={it.source.url} target="_blank" rel="noopener noreferrer"
                               className="text-blue-600 hover:underline whitespace-nowrap">{it.source.name} →</a>
                        </li>
                    ))}
                </ul>
                <p className="text-base md:text-lg text-gray-900 leading-relaxed">{d.context.reading}</p>
            </div>

            {/* 달라지는 것 */}
            <p className="text-lg font-semibold text-gray-800 mb-4">미뤄짐으로써 실제로 달라지는 것</p>
            <div className="space-y-5 mb-6">
                {d.consequences.map((c, i) => (
                    <div key={i} className="border-l-4 border-gray-300 pl-4 py-1">
                        <p className="text-lg md:text-xl font-bold text-gray-900 mb-1">{c.title}</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">{c.detail}</p>
                        <p className="text-base md:text-lg text-blue-800 leading-relaxed">→ {c.effect}</p>
                    </div>
                ))}
            </div>

            {/* 판정하지 않는 것 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                <p className="text-lg font-bold text-amber-900 mb-3">{d.notJudged.title}</p>
                <p className="text-base md:text-lg text-amber-900/90 leading-relaxed mb-3">{d.notJudged.why}</p>
                <p className="text-base md:text-lg text-amber-900/90 leading-relaxed mb-3">{d.notJudged.risk}</p>
                <p className="text-base md:text-lg text-amber-900 font-medium leading-relaxed">{d.notJudged.instead}</p>
            </div>
        </section>
    );
}

/**
 * 대법관 공석의 효과 — 동기가 아니라 표 계산.
 *
 * 「왜 공석을 안 채우나」는 동기의 물음이라 답할 수 없지만, 「공석이 결론에 어떤
 * 영향을 주나」는 조문으로 답할 수 있다. 그리고 답이 흔한 짐작과 반대여서
 * 화면에 놓을 가치가 있다.
 */
function VacancyEffectCard() {
    const v = VACANCY_EFFECT;
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">{v.title}</h3>
                <TierBadge tier={v.tier} />
            </div>
            <p className="text-base text-gray-500 mb-6">
                공석을 두는 쪽이 피고인에게 유리하리라 짐작하기 쉽지만, 정족수 구조는 반대로 작동합니다.
            </p>

            {/* 사실관계 */}
            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <p className="text-lg font-semibold text-gray-800">지금까지의 경과</p>
                    <TierBadge tier={v.factsTier} />
                </div>
                <div className="space-y-3">
                    {v.facts.map((f, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-base font-bold text-gray-500 whitespace-nowrap pt-0.5 w-24 shrink-0">
                                {f.when}
                            </span>
                            <div>
                                <p className="text-base md:text-lg text-gray-800 leading-relaxed">{f.what}</p>
                                <a href={f.source.url} target="_blank" rel="noopener noreferrer"
                                   className="text-base text-blue-600 hover:underline">{f.source.name} →</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 정족수 — 성립 여부와 홀짝을 갈라 본다 */}
            <div className="bg-gray-50 rounded-lg p-5 mb-5">
                <p className="text-lg font-bold text-gray-900 mb-2">몇 명이 참여하고, 그 인원으로 열리는가</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">{v.quorum.normal}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">{v.quorum.threshold}</p>

                <div className="overflow-x-auto mb-4">
                    <table className="w-full text-base bg-white rounded">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700">시점</th>
                                <th className="text-right py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">참여 인원</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">홀짝</th>
                                <th className="text-left py-2.5 px-3 font-semibold text-gray-700 whitespace-nowrap">전합 성립</th>
                            </tr>
                        </thead>
                        <tbody>
                            {v.quorum.timeline.map((t) => (
                                <tr key={t.when} className="border-b border-gray-200">
                                    <td className="py-3 px-3">
                                        <span className="font-medium text-gray-900">{t.when}</span>
                                        <span className="block text-sm text-gray-500">{t.seats}</span>
                                    </td>
                                    <td className="py-3 px-3 text-right font-bold text-gray-900 text-lg whitespace-nowrap">
                                        {t.participants}명
                                    </td>
                                    <td className={`py-3 px-3 font-semibold whitespace-nowrap ${
                                        t.parity === '짝수' ? 'text-red-700' : 'text-blue-700'
                                    }`}>
                                        {t.parity}
                                    </td>
                                    <td className="py-3 px-3 font-semibold text-blue-700 whitespace-nowrap">
                                        {t.valid ? '성립' : '불가'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-2 mb-4">
                    {v.quorum.timeline.map((t) => (
                        <p key={t.when} className="text-base md:text-lg text-gray-700 leading-relaxed">
                            <span className="font-semibold text-gray-900">{t.when} · </span>{t.note}
                        </p>
                    ))}
                </div>

                <p className="text-base md:text-lg text-gray-900 font-medium leading-relaxed bg-blue-50 border border-blue-200 rounded p-4 mb-3">
                    {v.quorum.answer}
                </p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">{v.quorum.cliff}</p>
                <p className="text-base text-amber-800 bg-amber-50 rounded p-3 leading-relaxed">
                    ⚠️ {v.quorum.caveat}
                </p>
            </div>

            {/* 조문 */}
            <blockquote className="border-l-4 border-blue-400 bg-blue-50/60 pl-5 py-4 rounded-r mb-5">
                <p className="text-lg font-semibold text-gray-900 mb-2">{v.rule.article}</p>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">{v.rule.text}</p>
            </blockquote>

            <p className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed mb-3">
                {v.conclusion}
            </p>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-3">{v.counterIntuitive}</p>
            <p className="text-base text-gray-600 bg-gray-50 rounded p-4 leading-relaxed">
                {v.notModeled}
            </p>
        </section>
    );
}

/** 상고 구조 — 누가 무엇에 불복했는가. 「파기」의 방향이 여기서 갈린다. */
function AppealStructureCard() {
    return (
        <section className="bg-white rounded-xl border shadow-sm p-7 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">누가 무엇에 불복했는가</h3>
                <TierBadge tier={APPEAL_STRUCTURE.tier} />
            </div>
            <p className="text-base text-gray-500 mb-5">
                「파기」에는 방향이 있습니다. 어느 쪽 상고가 받아들여지느냐에 따라 뜻이 정반대가 됩니다.
            </p>

            {/* 사건별로 양측 상고를 나란히 — 한쪽만 보이면 다른 쪽은 상고가 없는 것처럼 읽힌다 */}
            <div className="space-y-5 mb-6">
                {APPEAL_STRUCTURE.items.map((it) => (
                    <div key={it.case} className="border border-gray-200 rounded-lg p-5">
                        <div className="flex flex-wrap items-baseline gap-3 mb-4">
                            <p className="text-xl font-bold text-gray-900">{it.case}</p>
                            <p className="text-base text-gray-500">{it.sentence}</p>
                            <span className="text-sm px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                                쌍방 상고
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {[
                                { who: '피고인 측', side: it.defense, tone: 'blue' },
                                { who: '특검 측', side: it.prosecution, tone: 'red' },
                            ].map(({ who, side, tone }) => (
                                <div key={who} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <p className={`text-lg font-bold ${tone === 'blue' ? 'text-blue-800' : 'text-red-800'}`}>
                                            {who}
                                        </p>
                                        {!side.known && (
                                            <span className="text-sm px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                이유 미확인
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-base text-gray-500 mb-2">{side.filed}</p>
                                    <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-2">
                                        {side.reason}
                                    </p>
                                    <p className="text-base text-gray-600">
                                        <span className="font-semibold text-gray-800">다투는 대상 · </span>{side.target}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-3">
                            {it.sources.map((s) => (
                                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                                   className="text-base text-blue-600 hover:underline">{s.name} →</a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {APPEAL_STRUCTURE.implications.map((im, i) => (
                    <div key={i} className="border-l-4 border-gray-300 pl-4 py-1">
                        <p className="text-lg font-bold text-gray-900 mb-1">{im.point}</p>
                        <p className="text-base md:text-lg text-gray-700 leading-relaxed">{im.detail}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

/** 3분류(확정/일부파기/전부파기) 결합 표. partialShare 가 측정된 뒤에만 그린다. */
function OutcomeTable({ multiplier, rho, share }) {
    const m = outcomeMarginal(BASE_RATES.criminalAppeal.value, multiplier, share);
    const j = jointOutcomes(m, rho);

    return (
        <div className="mt-6">
            <p className="text-lg font-semibold text-gray-800 mb-3">파기의 범위까지 나눈 결과</p>
            <ScenarioTable
                rows={Object.keys(OUTCOME_SCENARIO_LABELS).map((k) => ({ key: k, value: j.groups[k] }))}
                labelFor={(k) => OUTCOME_SCENARIO_LABELS[k]}
            />

            <details className="mt-5">
                <summary className="cursor-pointer text-lg text-blue-700 hover:underline font-medium">
                    두 사건을 교차한 9칸 전체 보기
                </summary>
                <div className="mt-4 bg-gray-50 rounded-lg p-5 overflow-x-auto">
                    <table className="w-full text-base">
                        <thead>
                            <tr className="border-b-2 border-gray-300">
                                <th className="text-left py-2.5 pr-4 font-semibold text-gray-700 whitespace-nowrap">
                                    한덕수 \ 이상민
                                </th>
                                {OUTCOME_ORDER.map((o) => (
                                    <th key={o} className="text-right py-2.5 px-2 font-semibold text-gray-700 whitespace-nowrap">
                                        {OUTCOME_LABELS[o]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {OUTCOME_ORDER.map((i) => (
                                <tr key={i} className="border-b border-gray-200">
                                    <td className="py-2.5 pr-4 font-medium text-gray-900 whitespace-nowrap">
                                        {OUTCOME_LABELS[i]}
                                    </td>
                                    {OUTCOME_ORDER.map((k) => (
                                        <td key={k} className={`py-2.5 px-2 text-right ${i === k ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                            {pct(j.cells[`${i}|${k}`])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="text-base text-gray-600 mt-4 leading-relaxed">
                        굵게 표시된 대각선이 두 사건이 같은 결론을 받는 경우입니다.
                        대법원이 두 사건을 <strong>공범 관계로 함께 심리</strong>한다고 밝혔으므로
                        확률이 대각선에 몰립니다.
                    </p>
                </div>
            </details>
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

    // 파기의 범위(전부/일부)까지 나눈 표 — partialShare 가 측정된 뒤에만 그린다
    const share = partialShare();
    const scopeRows = share === null ? null : ks.map((k) =>
        jointOutcomes(outcomeMarginal(base, k, share), c.rho).groups);
    const scopeSummary = scopeRows && Object.keys(OUTCOME_SCENARIO_LABELS).map((key) => {
        const v = scopeRows.map((g) => g[key]);
        return { key, value: pctRange(Math.min(...v), Math.max(...v)) };
    });

    return (
        <div>
            <ScenarioTable rows={summary} labelFor={(k) => SCENARIO_LABELS[k]} />

            {scopeSummary && (
                <div className="mt-8">
                    <p className="text-lg font-semibold text-gray-800 mb-3">파기의 범위까지 나눈 결과</p>
                    <ScenarioTable rows={scopeSummary} labelFor={(k) => OUTCOME_SCENARIO_LABELS[k]} />
                </div>
            )}

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
    const share = partialShare();

    return (
        <div>
            <ScenarioTable rows={rows} labelFor={(k) => SCENARIO_LABELS[k]} />
            <p className="text-base text-gray-600 mt-4">
                각 사건의 파기 확률 {pct(p)} (기저율 {BASE_RATES.criminalAppeal.display} × {branch.symmetric}배) 적용.
            </p>
            {share !== null && <OutcomeTable multiplier={branch.symmetric} rho={c.rho} share={share} />}
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
                <div className="flex flex-wrap gap-3 mt-2">
                    {COURT_STATEMENT.sources.map((s) => (
                        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                           className="text-base text-blue-600 hover:underline">{s.name} →</a>
                    ))}
                </div>
            </blockquote>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {CASE_FACTS.defendants.map((d) => (
                    <div key={d.name} className="bg-gray-50 rounded-lg p-5">
                        <p className="text-lg font-bold text-gray-900 mb-1">{d.name}</p>
                        <p className="text-lg text-blue-700 font-semibold mb-2">{d.sentence}</p>
                        <p className="text-base text-gray-600 leading-relaxed">{d.charge}</p>
                        {d.split && (
                            <>
                                <p className="text-base text-gray-700 leading-relaxed mt-3 pt-3 border-t border-gray-200">
                                    <span className="font-semibold text-gray-900">항소심에서 갈린 부분 · </span>
                                    {d.split}
                                </p>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    {d.splitSources?.map((s) => (
                                        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                                           className="text-base text-blue-600 hover:underline">{s.name} →</a>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
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

        </div>
    );
}

/**
 * 수집으로 드러난 것 — 표본 편향.
 *
 * 예전에는 이 자리에 「보정계수를 재지 못했다」는 안내가 있었다. 이제 재었으므로
 * 그 자리를 대신할 것은 「잰 숫자를 어떻게 읽어야 하는가」다. 58.8% 라는 숫자가
 * 눈앞에 있으면 그걸 기저율로 쓰고 싶어지고, 그러면 예측이 열 배 어긋난다.
 */
function SampleBiasCard() {
    const b = SAMPLE_BIAS;
    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mb-10">
            <div className="flex items-start gap-3">
                <span className="text-3xl leading-none">⚖️</span>
                <div>
                    <h3 className="font-bold text-amber-900 mb-3 text-xl">{b.title}</h3>

                    <div className="flex flex-wrap gap-6 mb-4">
                        <div>
                            <p className="text-base text-amber-800">일반 집계(소부)</p>
                            <p className="text-3xl font-bold text-amber-900">{b.collected}</p>
                        </div>
                        <div className="self-center text-2xl text-amber-700">vs</div>
                        <div>
                            <p className="text-base text-amber-800">사법연감</p>
                            <p className="text-3xl font-bold text-amber-900">{b.official}</p>
                        </div>
                        <div className="self-center">
                            <p className="text-base text-amber-800">차이</p>
                            <p className="text-xl font-bold text-amber-900">{b.gap}</p>
                        </div>
                    </div>

                    <p className="text-amber-900 text-lg leading-relaxed mb-3">{b.detail}</p>
                    <p className="text-amber-800 text-base md:text-lg leading-relaxed">
                        <strong>그래서 이렇게 씁니다 — </strong>{b.conclusion}
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
                title="대법원 재판 결과 예측 — 근거를 공개하는 분석 | 시민법정"
                description="대법원 사건의 결론을 확률로 제시하되, 그 확률이 어디서 나왔는지를 함께 공개합니다. 기저율과 조문 근거를 밝히고, 예측 적중률을 검증해 남깁니다."
                image="https://siminbupjung-blog.web.app/og-prediction-supreme.png"
            />
            <Header />

            {/* 헤더가 fixed top-0 이므로 상단 여백이 필요하다. 다른 페이지와 같은 pt-28. */}
            <main className="max-w-4xl mx-auto px-4 pt-28 pb-16">
                <div className="mb-10">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">대법원 재판 결과 예측</h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                        확률을 팔지 않고 근거를 팝니다. 숫자보다 <strong className="text-gray-800">그 숫자가 어디서 나왔는지</strong>를 먼저 보여주고,
                        예측한 뒤에는 <strong className="text-gray-800">맞았는지 틀렸는지를 남깁니다.</strong>
                    </p>
                </div>

                {tab === 'cases' && <SampleBiasCard />}

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
                    <>
                        <CourtStatementCard />
                        <InstanceComparisonSection />
                        <AppealStructureCard />
                        <AppealScopeLimitCard />
                        <ScopeSection />
                        <CourtCompositionCard />
                        <TimingCard />
                        <VacancyEffectCard />
                        <NominationStandoffCard />
                        <DelayAnalysisCard />
                        {PREDICTION_CASES.map((c) => <CaseCard key={c.id} c={c} />)}
                    </>
                )}
                {tab === 'method' && <MethodTab />}
                {tab === 'scorecard' && <ScorecardTab />}

                <div className="mt-10">
                    <SNSShareBar
                        title="대법원 재판 결과 예측 — 근거를 공개하는 분석"
                        url="https://xn--lg3b0kt4n41f.kr/prediction"
                    />
                </div>
            </main>
        </div>
    );
}
