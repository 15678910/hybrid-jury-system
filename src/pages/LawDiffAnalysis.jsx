import { useState } from 'react';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import { LAWS, ARTICLE_DIFFS, SCIA_DIFFS, CHANGE_LABELS, TIER_LABELS } from '../data/lawDiffs';
import { ISSUES, IRREVERSIBILITY, IRREVERSIBILITY_EXCLUDED, VERDICT_LABELS } from '../data/lawIssues';

/**
 * 수사·기소 분리 — 조문 대비와 쟁점 검증
 *
 * 설계: docs/analysis/수사기소분리_쟁점분석_설계.md
 *
 * 화면 규칙 두 가지가 데이터의 규칙에서 나온다.
 *  ① 근거의 층을 테두리로 구분한다. 색만으로 가르지 않는다 —
 *     색약과 흑백 인쇄에서 무너지기 때문이다.
 *  ② 「우리 안」은 라벨과 테두리 둘로 표시한다. 사실과 판단이 섞여 보이면 안 된다.
 */

const CHANGE_STYLE = {
    new: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    deleted: 'bg-rose-50 text-rose-800 border-rose-300',
    moved: 'bg-sky-50 text-sky-800 border-sky-300',
    modified: 'bg-amber-50 text-amber-800 border-amber-300',
    unchanged: 'bg-gray-100 text-gray-700 border-gray-300',
};

const VERDICT_STYLE = {
    red: 'bg-rose-50 text-rose-800 border-rose-400',
    amber: 'bg-amber-50 text-amber-800 border-amber-400',
    blue: 'bg-sky-50 text-sky-800 border-sky-400',
    gray: 'bg-gray-100 text-gray-700 border-gray-400',
};

/**
 * 데이터의 서술문에 쓰인 **강조**를 굵은 글씨로 바꾼다.
 * 그냥 출력하면 별표가 화면에 그대로 보인다.
 * 인용부호(>)로 시작하는 줄은 들여쓴 인용으로 표시한다.
 */
function RichText({ text, className = '' }) {
    if (!text) return null;
    return (
        <div className={className}>
            {text.split('\n').map((line, li) => {
                const quote = line.startsWith('> ');
                const body = quote ? line.slice(2) : line;
                if (!body.trim()) return <div key={li} className="h-2" />;
                return (
                    <p
                        key={li}
                        className={quote ? 'border-l-4 border-gray-300 pl-3 my-2 text-gray-700' : 'mb-2 last:mb-0'}
                    >
                        {body.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
                            part.startsWith('**') && part.endsWith('**') ? (
                                <strong key={pi} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
                            ) : (
                                <span key={pi}>{part}</span>
                            )
                        )}
                    </p>
                );
            })}
        </div>
    );
}

/** 근거 층 — 테두리 굵기·형태로 구분한다 (색 의존 금지) */
const TIER_STYLE = {
    1: 'border-l-4 border-gray-800',
    2: 'border-l-4 border-dashed border-gray-500',
    3: 'border-l-2 border-dotted border-gray-400',
};

function ArticleCard({ diff }) {
    const [open, setOpen] = useState(false);
    const label = CHANGE_LABELS[diff.change] ?? diff.change;

    return (
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3"
            >
                <span className={`shrink-0 text-base font-bold px-2 py-0.5 rounded border ${CHANGE_STYLE[diff.change] ?? CHANGE_STYLE.unchanged}`}>
                    {label}
                </span>
                <span className="flex-1">
                    <span className="block font-semibold text-gray-900">{diff.title}</span>
                    <span className="block text-base text-gray-500 mt-0.5">{diff.after.law}</span>
                </span>
                <span className="shrink-0 text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
            </button>

            {open && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded p-3">
                            <p className="text-base font-bold text-gray-500 mb-1">현행 — {diff.before.law}</p>
                            <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-line">
                                {diff.before.text || '해당 조문 없음'}
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded p-3">
                            <p className="text-base font-bold text-blue-700 mb-1">개정 후 — {diff.after.law}</p>
                            <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-line">{diff.after.text}</p>
                        </div>
                    </div>

                    {diff.purpose?.text && (
                        <div className={`bg-white pl-3 ${TIER_STYLE[diff.purpose.tier] ?? TIER_STYLE[3]}`}>
                            <p className="text-base font-bold text-gray-600 mb-1">
                                입법 목적
                                {diff.purpose.tier && (
                                    <span className="ml-2 font-normal text-gray-500">
                                        · 근거 {diff.purpose.tier}층 {TIER_LABELS[diff.purpose.tier]}
                                    </span>
                                )}
                            </p>
                            <p className="text-lg text-gray-800 leading-relaxed">{diff.purpose.text}</p>
                            {diff.purpose.sources?.map((s, i) => (
                                <p key={i} className="text-base text-gray-500 mt-1">출처: {s.ref}</p>
                            ))}
                            {diff.purpose.appliesToFinalAct === null && diff.purpose.tier === 2 && (
                                <p className="text-base text-amber-700 mt-1 font-semibold">⚠ 대안 확인 필요</p>
                            )}
                            {diff.purpose.conflict && (
                                <p className="text-base text-rose-700 mt-1">층 사이 차이: {diff.purpose.conflict}</p>
                            )}
                        </div>
                    )}

                    {diff.note && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                            <p className="text-base font-bold text-yellow-800 mb-1">읽을 때 주의</p>
                            <RichText text={diff.note} className="text-lg text-gray-800 leading-relaxed" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function IssueCard({ issue }) {
    const tone = VERDICT_LABELS[issue.factCheck.verdict]?.tone ?? 'gray';
    const hasSource = issue.concern.raisedBy.length > 0;
    // raisedBy 가 비어 있어도 뜻이 둘로 갈린다 — 아직 못 찾은 것인지,
    // 애초에 외부 우려가 아니라 우리가 발견한 것인지. 경고는 앞쪽에만 띄운다.
    const isOwnFinding = issue.concern.isOwnFinding === true;

    return (
        <div className="border border-gray-200 rounded-lg bg-white p-5 space-y-4">
            <div className="flex items-start gap-3">
                <span className={`shrink-0 text-base font-bold px-2 py-1 rounded border ${VERDICT_STYLE[tone]}`}>
                    {issue.factCheck.verdict}
                </span>
                <h3 className="flex-1 text-xl font-bold text-gray-900">{issue.title}</h3>
            </div>

            {/* ① 제기된 우려 */}
            {issue.concern.claim && (
                <div className="bg-gray-50 rounded p-3">
                    <p className="text-base font-bold text-gray-500 mb-1">{isOwnFinding ? '대비 과정에서 발견한 것' : '제기된 우려'}</p>
                    <RichText text={issue.concern.claim} className="text-lg text-gray-800 leading-relaxed" />
                    {hasSource ? (
                        <ul className="mt-2 space-y-0.5">
                            {issue.concern.raisedBy.map((r, i) => (
                                <li key={i} className="text-base text-gray-500">
                                    · {r.who}{r.when ? ` (${r.when})` : ''} — {r.source}
                                    {r.url && (
                                        <a href={r.url} target="_blank" rel="noreferrer" className="ml-1 text-blue-600 hover:underline">원문</a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : isOwnFinding ? null : (
                        <p className="text-base text-amber-700 mt-2 font-semibold">⚠ 출처 미확인 — 공개 전 보도 확인 필요</p>
                    )}
                </div>
            )}

            {/* ② 사실 확인 */}
            <div>
                <p className="text-base font-bold text-gray-500 mb-1">조문으로 확인한 결과</p>
                <RichText text={issue.factCheck.reasoning} className="text-lg text-gray-800 leading-relaxed" />
                {issue.factCheck.basis.length > 0 && (
                    <details className="mt-2">
                        <summary className="text-base text-gray-500 cursor-pointer hover:text-gray-700">
                            근거 {issue.factCheck.basis.length}건 보기
                        </summary>
                        <ul className="mt-1 space-y-0.5 pl-3">
                            {issue.factCheck.basis.map((b, i) => (
                                <li key={i} className="text-base text-gray-500">
                                    [{b.type}] {b.ref}
                                    {b.billNo && <span className="text-gray-400"> · 의안 {b.billNo} {b.billRole}</span>}
                                    {b.url && (
                                        <a href={b.url} target="_blank" rel="noreferrer" className="ml-1 text-blue-600 hover:underline">원문</a>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </details>
                )}
            </div>

            {/* ③ 우리 안 — 라벨과 테두리 둘로 표시 */}
            {issue.ourProposal?.text && (
                <div className="border-2 border-purple-400 bg-purple-50 rounded p-3">
                    <p className="text-base font-bold text-purple-800 mb-1">
                        주권자사법개혁추진준비위원회 제안입니다 — 조문 확인 결과와 구분됩니다
                    </p>
                    <RichText text={issue.ourProposal.text} className="text-lg text-gray-900 leading-relaxed" />
                    {issue.ourProposal.rationale && (
                        // RichText 로 감싼다 — rationale 에도 **강조**와 줄바꿈이 들어 있어
                        // 그냥 출력하면 별표가 화면에 그대로 보인다 (reasoning 과 같은 처리)
                        <RichText
                            text={`**왜 그런가 —** ${issue.ourProposal.rationale}`}
                            className="text-lg text-gray-700 leading-relaxed mt-2"
                        />
                    )}
                </div>
            )}

            {/* ④ 타 안 — 출처 있는 것만. 「우리 안」과 혼동되지 않게 테두리도 색도 달리한다 */}
            {issue.otherProposals?.length > 0 && (
                <div className="border border-gray-300 bg-gray-50 rounded p-3">
                    <p className="text-base font-bold text-gray-600 mb-1">
                        다른 곳에서 나온 안 — 우리 제안이 아닙니다
                    </p>
                    <ul className="space-y-2">
                        {issue.otherProposals.map((p, i) => (
                            <li key={i}>
                                <p className="text-lg text-gray-800 leading-relaxed">
                                    <span className="font-bold text-gray-900">{p.who} — </span>{p.text}
                                </p>
                                {p.source && (
                                    <p className="text-base text-gray-500">
                                        {p.source}
                                        {p.url && (
                                            <a href={p.url} target="_blank" rel="noreferrer" className="ml-1 text-blue-600 hover:underline">원문</a>
                                        )}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {issue.note && <RichText text={issue.note} className="text-base text-gray-500 leading-relaxed" />}
        </div>
    );
}

/**
 * 인용 법령 목록
 *
 * 본문의 조문 인용은 모두 이 표의 법령을 가리킨다. 「제9조의2」처럼 조문 번호만
 * 적으면 어느 법의 조문인지 알 수 없으므로, 법종구분(법률·대통령령·부령·행정규칙)과
 * 공포번호까지 함께 둔다. 같은 조문 번호가 여러 법령에 있고, 무엇보다 **법률에 있는
 * 것과 시행령에 있는 것은 고치는 절차가 다르기 때문**이다 — 이 분석의 핵심 논점이
 * 「법률이 정하지 않아 시행령으로 내려간다」는 것이므로 층위 표시가 곧 논거가 된다.
 */
function LawRegistry() {
    return (
        <section className="bg-white border border-gray-300 rounded p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">인용 법령</h2>
            <p className="text-base text-gray-600 mb-3 leading-relaxed">
                본문의 조문 인용은 모두 아래 법령의 것이다. <strong className="font-bold text-gray-900">법률·대통령령·부령·행정규칙은 고치는 절차가 다르므로</strong> 층위를 함께 적는다 —
                법률은 국회 의결을 거치지만 대통령령은 국무회의, 부령은 장관, 행정규칙은 기관장 선에서 바뀐다.
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-base border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-gray-700">
                            <th className="text-left font-bold p-2 border border-gray-300">법령명</th>
                            <th className="text-left font-bold p-2 border border-gray-300 whitespace-nowrap">법종구분</th>
                            <th className="text-left font-bold p-2 border border-gray-300 whitespace-nowrap">공포번호</th>
                            <th className="text-left font-bold p-2 border border-gray-300 whitespace-nowrap">공포·시행</th>
                            <th className="text-left font-bold p-2 border border-gray-300 whitespace-nowrap">소관</th>
                        </tr>
                    </thead>
                    <tbody>
                        {LAWS.map((law) => (
                            <tr key={law.id} className={law.verified ? '' : 'bg-amber-50'}>
                                <td className="p-2 border border-gray-300 align-top">
                                    <span className="font-bold text-gray-900">{law.formalName || law.name}</span>
                                    {law.formalName && law.formalName !== law.name && (
                                        <span className="text-gray-500"> (약칭 {law.name})</span>
                                    )}
                                    {law.note && <p className="text-gray-600 mt-1 leading-relaxed">{law.note}</p>}
                                    {law.sourceFile && <p className="text-gray-400 mt-1 break-all">{law.sourceFile}</p>}
                                </td>
                                <td className="p-2 border border-gray-300 align-top whitespace-nowrap text-gray-800">{law.kind || '—'}</td>
                                <td className="p-2 border border-gray-300 align-top whitespace-nowrap text-gray-800">{law.lawNumber || '미확인'}</td>
                                <td className="p-2 border border-gray-300 align-top whitespace-nowrap text-gray-800">
                                    {law.promulgated || '—'}
                                    {law.effective && <><br />시행 {law.effective}</>}
                                </td>
                                <td className="p-2 border border-gray-300 align-top whitespace-nowrap text-gray-800">{law.ministry || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-base text-amber-800 mt-2 leading-relaxed">
                바탕이 옅은 노랑인 줄은 <strong className="font-bold">아직 원문을 수집하지 못한 법령</strong>이다. 다른 법령이 인용한 것을 옮겨 적었을 뿐이므로, 조문 자체는 원문으로 확인해야 한다.
            </p>
            <p className="text-base text-gray-500 mt-1 leading-relaxed">
                원문은 국가법령정보센터에서 받아 저장소에 보관한다(<span className="break-all">docs/bills/</span>). 조문 문언은 요약하지 않고 그대로 옮긴다.
            </p>
        </section>
    );
}

export default function LawDiffAnalysis() {
    const [tab, setTab] = useState('issues');

    const tabs = [
        { id: 'issues', label: '쟁점 검증' },
        { id: 'articles', label: '조문 대비' },
        { id: 'irreversibility', label: '되돌리기 방지' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title="수사·기소 분리 조문 분석 — 시민법정"
                description="공소청법·중수청법·형사소송법 개정을 조문 단위로 대비하고, 제기된 우려를 조문으로 검증했습니다."
            />
            <Header />

            {/* Header 가 fixed 라 그 높이만큼 본문을 내린다. 다른 페이지와 같은 pt-24 를 쓴다. */}
            <main className="max-w-5xl mx-auto px-4 pt-24 pb-16">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    수사·기소 분리 — 조문으로 확인한 것
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    공소청법·중수청법·형사소송법 개정을 조문 단위로 대비하고, 언론과 전문가가 제기한 우려가
                    조문상 성립하는지 확인했습니다. 조문 문언은 국가법령정보센터 원문에서 그대로 옮겼습니다.
                </p>

                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                    <p className="text-base font-bold text-gray-500 mb-2">이 분석이 지키는 것</p>
                    <ul className="text-lg text-gray-700 space-y-1 leading-relaxed">
                        <li>· <span className="font-semibold">제기된 우려</span>는 누가 언제 말했는지 출처를 함께 적습니다</li>
                        <li>· <span className="font-semibold">사실 확인</span>은 조문과 입법자료로만 합니다</li>
                        <li>· <span className="font-semibold">주권자사법개혁추진준비위원회 제안</span>은 사실 확인과 구분해 따로 표시합니다</li>
                        <li>· 확인하지 못한 것은 <span className="font-semibold">「판단 불가」</span>로 두고 채우지 않습니다</li>
                    </ul>
                </div>

                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`px-4 py-3 text-lg font-semibold border-b-2 -mb-px transition-colors ${
                                tab === t.id
                                    ? 'border-blue-600 text-blue-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'issues' && (
                    <div className="space-y-4">
                        {ISSUES.map((issue) => (
                            <IssueCard key={issue.id} issue={issue} />
                        ))}
                        <LawRegistry />
                    </div>
                )}

                {tab === 'articles' && (
                    <div className="space-y-6">
                        <LawRegistry />

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">공소청법 ↔ 검찰청법 ({ARTICLE_DIFFS.length}건)</h2>
                            <div className="space-y-2">
                                {ARTICLE_DIFFS.map((d) => (
                                    <ArticleCard key={`${d.lawId}-${d.article}`} diff={d} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">중수청법 신설 ({SCIA_DIFFS.length}건)</h2>
                            <div className="space-y-2">
                                {SCIA_DIFFS.map((d) => (
                                    <ArticleCard key={`${d.lawId}-${d.article}`} diff={d} />
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {tab === 'irreversibility' && (
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                            <p className="text-lg text-gray-800 leading-relaxed">
                                <span className="font-bold">먼저 정직하게 — 법률로는 완전히 막을 수 없습니다.</span>{' '}
                                나중 법이 앞선 법을 이기기 때문입니다. 그래서 현실적인 길은 되돌리기를 불가능하게
                                만드는 것이 아니라, <span className="font-semibold">되돌리는 비용을 감당하기 어려울 만큼 높이는 것</span>입니다.
                            </p>
                            <p className="text-base text-amber-800 mt-2 font-semibold">
                                ⚠ 아래는 전부 우리 판단이며, 헌법학 문헌으로 아직 검증하지 않았습니다.
                            </p>
                        </div>

                        {IRREVERSIBILITY.map((item) => (
                            <div key={item.id} className="border-2 border-purple-400 bg-purple-50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="shrink-0 text-base font-bold px-2 py-1 rounded border border-purple-500 bg-white text-purple-800">
                                        {item.strength === 'high' ? '강함' : item.strength === 'medium' ? '보통' : '약함'}
                                    </span>
                                    <h3 className="flex-1 text-xl font-bold text-gray-900">{item.lever}</h3>
                                </div>
                                <p className="text-lg text-gray-800 leading-relaxed mt-2">{item.mechanism}</p>
                                {item.cost && <p className="text-lg text-gray-600 leading-relaxed mt-2"><span className="font-semibold">비용 — </span>{item.cost}</p>}
                                {item.caveat && (
                                    <p className="text-lg text-rose-800 leading-relaxed mt-2 bg-white border border-rose-200 rounded p-2">
                                        <span className="font-semibold">한계 — </span>{item.caveat}
                                    </p>
                                )}
                            </div>
                        ))}

                        {IRREVERSIBILITY_EXCLUDED.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <p className="text-base font-bold text-gray-500 mb-2">넣지 않은 수단과 그 이유</p>
                                {IRREVERSIBILITY_EXCLUDED.map((x, i) => (
                                    <div key={i} className="text-lg text-gray-700 leading-relaxed">
                                        <span className="font-semibold">{x.lever}</span> — {x.reason}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <p className="text-base text-gray-400 mt-10 leading-relaxed">
                    조문 원문은 국가법령정보센터, 입법자료는 국회 의안정보시스템에서 받아 저장소에 보관하고 있습니다.
                    각 항목의 근거에 파일 경로와 의안번호를 함께 적어 두었습니다.
                </p>
            </main>
        </div>
    );
}
