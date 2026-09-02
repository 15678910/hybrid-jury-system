import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import { CARD_NEWS_SERIES, getCardNewsSeries, cardImageUrl } from '../data/cardNews';

// 카드뉴스 — 정적 시리즈 갤러리.
// 이전의 Firestore 기반 CardNews.jsx(2026-01 비활성화)와 달리, 카드는 저장소의
// public/cardnews/ 에 두고 목록은 src/data/cardNews.js 에서 읽는다. 카드는 생성기로
// 만들어 커밋하므로 관리자 업로드 화면이 필요 없고, 배포만으로 반영된다.

const formatDate = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${y}. ${Number(m)}. ${Number(d)}.`;
};

function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-6 px-4">
            <div className="container mx-auto text-center">
                <p>© 주권자사법개혁추진준비위원회</p>
                <p className="mt-2 text-sm">문의: siminbupjung@gmail.com</p>
            </div>
        </footer>
    );
}

// ── 시리즈 목록 (/cardnews)
function SeriesList() {
    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title="카드뉴스"
                description="시민법정 카드뉴스 — 법령 원문을 조문으로 대조해 단계별로 정리한 카드. 수사·기소 분리, 판결서 공개, 수사준칙 입법예고."
                path="/cardnews"
                image={cardImageUrl(CARD_NEWS_SERIES[0].slug, 1)}
            />
            <Header />
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 mb-3">카드뉴스</h1>
                        <p className="text-gray-600 max-w-2xl">
                            법령 원문을 조문으로 대조해 단계별로 정리한 카드입니다. 조문 확인·평가·제안을 카드마다 구분해 표시합니다.
                            각 시리즈를 열면 카드를 한 장씩 저장하거나 SNS 로 바로 공유할 수 있습니다.
                        </p>
                    </div>
                    <div className="grid gap-8 md:grid-cols-2">
                        {CARD_NEWS_SERIES.map((s) => (
                            <Link
                                key={s.slug}
                                to={`/cardnews/${s.slug}`}
                                className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition"
                            >
                                <img
                                    src={cardImageUrl(s.slug, 1)}
                                    alt={`${s.title} 1단계`}
                                    className="w-full block"
                                    loading="lazy"
                                />
                                <div className="p-5">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                        <span className="font-bold text-blue-700">{s.count}장</span>
                                        <span>·</span>
                                        <span>{formatDate(s.date)}</span>
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-700">{s.title}</h2>
                                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">{s.description}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
            <SNSShareBar />
            <Footer />
        </div>
    );
}

// ── 시리즈 상세 (/cardnews/:slug)
function SeriesView({ series }) {
    const [open, setOpen] = useState(null); // 확대 중인 카드 번호(1-based)
    const total = series.count;

    const go = useCallback((delta) => {
        setOpen((n) => (n == null ? null : ((n - 1 + delta + total) % total) + 1));
    }, [total]);

    useEffect(() => {
        if (open == null) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(null);
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [open, go]);

    const others = CARD_NEWS_SERIES.filter((s) => s.slug !== series.slug);

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title={series.title}
                description={series.description}
                path={`/cardnews/${series.slug}`}
                image={cardImageUrl(series.slug, 1)}
                type="article"
            />
            <Header />
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <nav className="text-sm text-gray-500 mb-4">
                        <Link to="/cardnews" className="hover:text-blue-600">카드뉴스</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-700">{series.short}</span>
                    </nav>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">{series.title}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{formatDate(series.date)}</span>
                        <span>·</span>
                        <span>{total}장</span>
                        {series.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">#{t}</span>
                        ))}
                    </div>
                    <p className="mt-4 text-gray-700 leading-relaxed">{series.description}</p>
                    <p className="mt-2 text-sm text-gray-500">카드를 누르면 크게 볼 수 있고, 각 카드 아래의 「이미지 저장」으로 한 장씩 내려받아 SNS 에 올릴 수 있습니다.</p>

                    <ol className="mt-8 space-y-8">
                        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
                            <li key={n} id={`card-${n}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setOpen(n)}
                                    className="block w-full text-left cursor-zoom-in focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                                    aria-label={`${n}단계 카드 크게 보기`}
                                >
                                    <img
                                        src={cardImageUrl(series.slug, n)}
                                        alt={`${n}단계 — ${series.steps[n - 1] || ''}`}
                                        className="w-full block"
                                        loading={n <= 2 ? 'eager' : 'lazy'}
                                    />
                                </button>
                                <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-blue-700 mr-2">{n} / {total}</span>
                                        <span className="text-sm font-medium text-gray-800 truncate">{series.steps[n - 1]}</span>
                                    </div>
                                    <a
                                        href={cardImageUrl(series.slug, n)}
                                        download={`${series.short}_${n}단계.png`}
                                        className="shrink-0 text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700"
                                    >
                                        이미지 저장
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ol>

                    {series.related && (
                        <div className="mt-10 p-5 rounded-2xl bg-blue-50 border border-blue-100">
                            <p className="text-sm text-blue-900">
                                카드의 근거 조문은 <Link to={series.related.to} className="font-bold underline">{series.related.label}</Link> 페이지에서 원문으로 확인할 수 있습니다.
                            </p>
                        </div>
                    )}

                    {others.length > 0 && (
                        <section className="mt-12">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">다른 카드뉴스</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {others.map((s) => (
                                    <Link key={s.slug} to={`/cardnews/${s.slug}`} className="flex gap-3 bg-white rounded-xl border border-gray-200 p-3 hover:border-blue-300 hover:shadow transition">
                                        <img src={cardImageUrl(s.slug, 1)} alt="" className="w-28 rounded-md border border-gray-100 self-start" loading="lazy" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{s.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">{s.count}장 · {formatDate(s.date)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>
            <SNSShareBar />
            <Footer />

            {open != null && (
                <div
                    className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-3"
                    onClick={() => setOpen(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${open}단계 카드`}
                >
                    <img
                        src={cardImageUrl(series.slug, open)}
                        alt={`${open}단계 — ${series.steps[open - 1] || ''}`}
                        className="max-w-full max-h-[88vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-gray-900 text-2xl font-bold shadow" aria-label="이전 카드">‹</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 text-gray-900 text-2xl font-bold shadow" aria-label="다음 카드">›</button>
                    <button type="button" onClick={() => setOpen(null)} className="absolute top-3 right-3 w-11 h-11 rounded-full bg-white/90 text-gray-900 text-2xl font-bold shadow" aria-label="닫기">×</button>
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                        {open} / {total} — {series.steps[open - 1]}
                    </div>
                </div>
            )}
        </div>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead title="카드뉴스" path="/cardnews" />
            <Header />
            <main className="pt-32 pb-16 px-4 text-center">
                <p className="text-gray-700">해당 카드뉴스를 찾을 수 없습니다.</p>
                <Link to="/cardnews" className="inline-block mt-4 text-blue-600 underline">카드뉴스 목록으로</Link>
            </main>
            <Footer />
        </div>
    );
}

export default function CardNewsGallery() {
    const { slug } = useParams();
    useEffect(() => { window.scrollTo(0, 0); }, [slug]);
    if (!slug) return <SeriesList />;
    const series = getCardNewsSeries(slug);
    return series ? <SeriesView series={series} /> : <NotFound />;
}
