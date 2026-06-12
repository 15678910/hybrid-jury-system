import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';
import SNSShareBar from '../components/SNSShareBar';
import { TRIAL_EVENTS, EVENT_CATEGORIES, CASE_GROUPS } from '../data/trialSchedule';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 'YYYY-MM-DD' → Date (로컬 자정)
const parseDate = (ds) => (ds ? new Date(ds + 'T00:00:00') : null);

// 날짜 표시 'M.D(요일)'. ds는 'YYYY-MM-DD' (순수 함수).
const fmt = (ds) => {
    const dt = parseDate(ds);
    return `${dt.getMonth() + 1}.${dt.getDate()}(${WEEKDAYS[dt.getDay()]})`;
};

// D-day 계산. today는 로컬 자정 Date.
const dday = (ds, today) => {
    const diff = Math.round((parseDate(ds) - today) / 86400000);
    if (diff === 0) return '오늘';
    if (diff === 1) return '내일';
    return `D-${diff}`;
};

// 이벤트 카드 — 모듈 최상위 정의(부모 리렌더 시 리마운트 방지). today는 D-day 계산용.
function EventCard({ e, upcoming: isUp, today }) {
    const cat = EVENT_CATEGORIES[e.category];
    const grp = CASE_GROUPS[e.group];
    return (
        <div className={`bg-white rounded-lg border p-4 shadow-sm ${isUp ? 'border-l-4 border-l-blue-500' : 'opacity-95'}`}>
            <div className="flex items-center gap-2 flex-wrap mb-2">
                {grp && <span className={`text-xs font-bold px-2 py-0.5 rounded ${grp.badge}`}>{grp.label}</span>}
                {cat && <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cat.badge}`}>{cat.label}</span>}
                <span className="text-sm font-bold text-gray-900 ml-auto">
                    {e.date ? fmt(e.date) : e.approxLabel}
                </span>
                {isUp && e.date && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${dday(e.date, today) === '오늘' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {dday(e.date, today)}
                    </span>
                )}
            </div>
            <h3 className="font-bold text-gray-900">{e.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
                {e.court} · {e.judge}
            </p>
            {e.note && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{e.note}</p>}
            {e.source && (
                <a href={e.source.url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-blue-600 hover:underline mt-2">
                    출처: {e.source.name} ↗
                </a>
            )}
        </div>
    );
}

function TrialSchedule() {
    // 오늘(자정 기준) — 과거/미래 구분용
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const [activeGroups, setActiveGroups] = useState(() => new Set()); // 비어있으면 전체
    const [activeCats, setActiveCats] = useState(() => new Set());
    const [selectedDate, setSelectedDate] = useState(null); // 'YYYY-MM-DD'
    const [cal, setCal] = useState(() => {
        const d = new Date();
        return { y: d.getFullYear(), m: d.getMonth() };
    });

    const toggle = (setFn, set, key) => {
        const next = new Set(set);
        next.has(key) ? next.delete(key) : next.add(key);
        setFn(next);
    };

    const passFilter = (e) =>
        (activeGroups.size === 0 || activeGroups.has(e.group)) &&
        (activeCats.size === 0 || activeCats.has(e.category));

    const filtered = useMemo(() => TRIAL_EVENTS.filter(passFilter), [activeGroups, activeCats]);

    const dated = filtered.filter((e) => e.date);
    const upcoming = dated
        .filter((e) => parseDate(e.date) >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
    const past = dated
        .filter((e) => parseDate(e.date) < today)
        .sort((a, b) => b.date.localeCompare(a.date));
    const tbd = filtered.filter((e) => !e.date);

    // 선택 날짜 필터 적용 목록
    const visibleUpcoming = selectedDate ? upcoming.filter((e) => e.date === selectedDate) : upcoming;
    const visiblePast = selectedDate ? past.filter((e) => e.date === selectedDate) : past;

    // ── 캘린더 셀 계산 ──
    const firstDay = new Date(cal.y, cal.m, 1).getDay();
    const daysInMonth = new Date(cal.y, cal.m + 1, 0).getDate();
    const eventsByDate = useMemo(() => {
        const map = {};
        filtered.forEach((e) => {
            if (!e.date) return;
            (map[e.date] = map[e.date] || []).push(e);
        });
        return map;
    }, [filtered]);

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const ds = `${cal.y}-${String(cal.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ d, ds, events: eventsByDate[ds] || [] });
    }

    const moveMonth = (delta) => {
        setSelectedDate(null);
        setCal((c) => {
            const m = c.m + delta;
            return { y: c.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
        });
    };

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // (날짜 포맷 fmt·D-day·EventCard는 모듈 최상위로 이동 — 부모 리렌더 시 EventCard 리마운트 방지)

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead
                title="재판 일정 — 시민법정"
                description="12·3 내란 및 주요 정치·사법 재판의 공판기일·선고기일을 한눈에. 공개 보도·법원 기록 기반의 재판 일정 캘린더."
            />
            <Header />

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
                        <span>📅</span> 재판 일정
                    </h1>
                    <p className="text-gray-600 mt-2">
                        12·3 내란 사건과 오세훈·대장동 등 주요 정치·사법 재판의 공판·선고 기일을 모았습니다.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        ※ 모든 일정은 공개 보도·법원 기록 기반이며, 재판 기일은 변경·연기될 수 있습니다.
                    </p>
                </div>

                {/* 필터 */}
                <div className="bg-white rounded-lg border p-4 mb-6 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 mr-1">사건</span>
                        {Object.entries(CASE_GROUPS).map(([key, g]) => (
                            <button
                                key={key}
                                onClick={() => toggle(setActiveGroups, activeGroups, key)}
                                className={`text-xs font-bold px-3 py-1 rounded-full transition ${activeGroups.has(key) ? g.badge : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                {g.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 mr-1">종류</span>
                        {Object.entries(EVENT_CATEGORIES).map(([key, c]) => (
                            <button
                                key={key}
                                onClick={() => toggle(setActiveCats, activeCats, key)}
                                className={`text-xs font-semibold px-3 py-1 rounded-full border transition ${activeCats.has(key) ? c.badge : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}
                            >
                                {c.label}
                            </button>
                        ))}
                        {(activeGroups.size > 0 || activeCats.size > 0 || selectedDate) && (
                            <button
                                onClick={() => { setActiveGroups(new Set()); setActiveCats(new Set()); setSelectedDate(null); }}
                                className="text-xs text-gray-400 hover:text-gray-700 underline ml-1"
                            >
                                필터 초기화
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* 캘린더 */}
                    <div className="bg-white rounded-lg border p-4 self-start">
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={() => moveMonth(-1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded" aria-label="이전 달">‹</button>
                            <span className="font-bold text-gray-900">{cal.y}년 {cal.m + 1}월</span>
                            <button onClick={() => moveMonth(1)} className="px-2 py-1 text-gray-500 hover:bg-gray-100 rounded" aria-label="다음 달">›</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {WEEKDAYS.map((w, i) => (
                                <div key={w} className={`text-xs font-semibold py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-400'}`}>{w}</div>
                            ))}
                            {cells.map((cell, idx) => {
                                if (!cell) return <div key={idx} />;
                                const isToday = cell.ds === todayStr;
                                const isSel = cell.ds === selectedDate;
                                const has = cell.events.length > 0;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => has && setSelectedDate(isSel ? null : cell.ds)}
                                        disabled={!has}
                                        className={`aspect-square rounded flex flex-col items-center justify-center text-sm relative transition
                                            ${isSel ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-700'}
                                            ${has ? 'hover:bg-blue-100 cursor-pointer font-semibold' : 'text-gray-300 cursor-default'}`}
                                    >
                                        {cell.d}
                                        {has && (
                                            <span className="flex gap-0.5 mt-0.5">
                                                {[...new Set(cell.events.map((e) => e.category))].filter((c) => EVENT_CATEGORIES[c]).slice(0, 3).map((c) => (
                                                    <span key={c} className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white' : EVENT_CATEGORIES[c].dot}`} />
                                                ))}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedDate && (
                            <p className="text-xs text-center text-blue-600 mt-3">
                                {fmt(selectedDate)} 선택됨 · <button onClick={() => setSelectedDate(null)} className="underline">전체 보기</button>
                            </p>
                        )}
                    </div>

                    {/* 타임라인 */}
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> 다가오는 일정
                                <span className="text-sm font-normal text-gray-400">({visibleUpcoming.length})</span>
                            </h2>
                            <div className="space-y-3">
                                {visibleUpcoming.length > 0
                                    ? visibleUpcoming.map((e) => <EventCard key={e.id} e={e} upcoming today={today} />)
                                    : <p className="text-sm text-gray-400 py-4 text-center bg-white rounded-lg border">표시할 다가오는 일정이 없습니다.</p>}
                                {!selectedDate && tbd.map((e) => <EventCard key={e.id} e={e} upcoming today={today} />)}
                            </div>
                        </section>
                    </div>
                </div>

                {/* 지난 일정 (전체 폭) */}
                <section className="mt-8">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" /> 지난 일정
                        <span className="text-sm font-normal text-gray-400">({visiblePast.length})</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {visiblePast.length > 0
                            ? visiblePast.map((e) => <EventCard key={e.id} e={e} today={today} />)
                            : <p className="text-sm text-gray-400 py-4 text-center bg-white rounded-lg border md:col-span-2">표시할 지난 일정이 없습니다.</p>}
                    </div>
                </section>

                {/* 관련 페이지 링크 */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    더 자세한 분석:{' '}
                    <Link to="/trial-analysis" className="text-blue-600 hover:underline">내란재판 종합분석</Link>
                    {' · '}
                    <Link to="/judge-evaluation" className="text-blue-600 hover:underline">AI의 판사평가</Link>
                </div>

                <div className="mt-6">
                    <SNSShareBar />
                </div>
            </div>
        </div>
    );
}

export default TrialSchedule;
