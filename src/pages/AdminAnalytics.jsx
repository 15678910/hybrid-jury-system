import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getTodayStats, getWeekStats, getMonthStats, getLastNDays, getPageBreakdown } from '../lib/analyticsQueries';

// 커스텀 툴팁
const CustomLineTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color }}>
                    {entry.name}: {entry.value.toLocaleString()}
                </p>
            ))}
        </div>
    );
};

const CustomBarTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0]?.payload;
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
            <p className="font-semibold text-gray-700 mb-1">{data?.name || data?.page}</p>
            <p className="text-blue-600">조회수: {data?.views?.toLocaleString()}</p>
        </div>
    );
};

export default function AdminAnalytics() {
    const context = useOutletContext();
    const embedded = context?.embedded || false;

    const [loading, setLoading] = useState(true);
    const [summaryStats, setSummaryStats] = useState({
        today: { totalViews: 0, uniqueVisitors: 0 },
        week: { totalViews: 0, uniqueVisitors: 0 },
        month: { totalViews: 0, uniqueVisitors: 0 },
    });
    const [dailyTrend, setDailyTrend] = useState([]);
    const [pageBreakdown, setPageBreakdown] = useState([]);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const [today, week, month, trend, pages] = await Promise.all([
                getTodayStats(),
                getWeekStats(),
                getMonthStats(),
                getLastNDays(30),
                getPageBreakdown(30),
            ]);
            setSummaryStats({ today, week, month });
            setDailyTrend(trend);
            setPageBreakdown(pages);
        } catch (err) {
            console.error('Analytics load error:', err);
        } finally {
            setLoading(false);
        }
    };

    // 요약 카드 데이터
    const summaryCards = [
        {
            title: '오늘 방문자',
            visitors: summaryStats.today.uniqueVisitors || 0,
            views: summaryStats.today.totalViews || 0,
            bg: 'from-cyan-500 to-teal-600',
        },
        {
            title: '이번 주 방문자',
            visitors: summaryStats.week.uniqueVisitors || 0,
            views: summaryStats.week.totalViews || 0,
            bg: 'from-sky-500 to-blue-600',
        },
        {
            title: '이번 달 방문자',
            visitors: summaryStats.month.uniqueVisitors || 0,
            views: summaryStats.month.totalViews || 0,
            bg: 'from-violet-500 to-purple-600',
        },
    ];

    if (loading) {
        return (
            <div className={embedded ? 'bg-gray-50 p-6' : 'min-h-screen bg-gray-50 p-6'}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">방문자 분석</h1>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 rounded-xl bg-gray-200 animate-pulse" />
                        ))}
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={embedded ? 'bg-gray-50' : 'min-h-screen bg-gray-50'}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">방문자 분석</h1>
                    <button
                        onClick={loadAnalytics}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        🔄 새로고침
                    </button>
                </div>

                {/* 요약 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {summaryCards.map(card => (
                        <div
                            key={card.title}
                            className={`bg-gradient-to-br ${card.bg} rounded-xl shadow-lg p-5 text-white`}
                        >
                            <p className="text-sm font-medium opacity-90 mb-1">{card.title}</p>
                            <p className="text-3xl font-bold tracking-tight">{card.visitors.toLocaleString()}<span className="text-base font-normal opacity-80 ml-1">명</span></p>
                            <p className="text-xs opacity-75 mt-1">페이지뷰 {card.views.toLocaleString()}</p>
                        </div>
                    ))}
                </div>

                {/* 일별 방문자 추이 차트 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">일별 방문자 추이 (최근 30일)</h2>
                    {dailyTrend.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <p className="text-4xl mb-2">📊</p>
                                <p>아직 방문자 데이터가 없습니다.</p>
                                <p className="text-sm mt-1">공개 페이지 방문 시 자동으로 수집됩니다.</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={dailyTrend} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12, fill: '#666' }}
                                    interval={Math.floor(dailyTrend.length / 8)}
                                />
                                <YAxis tick={{ fontSize: 12, fill: '#666' }} />
                                <Tooltip content={<CustomLineTooltip />} />
                                <Legend
                                    wrapperStyle={{ fontSize: 13 }}
                                    formatter={(value) => <span className="text-gray-700">{value}</span>}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="uniqueVisitors"
                                    name="방문자"
                                    stroke="#0ea5e9"
                                    strokeWidth={2.5}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 6 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="totalViews"
                                    name="페이지뷰"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    dot={{ r: 2 }}
                                    activeDot={{ r: 5 }}
                                    strokeDasharray="5 5"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* 페이지별 조회수 차트 */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">페이지별 조회수 (최근 30일, 상위 15개)</h2>
                    {pageBreakdown.length === 0 ? (
                        <div className="h-80 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <p className="text-4xl mb-2">📈</p>
                                <p>페이지별 데이터가 없습니다.</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={Math.max(300, pageBreakdown.length * 40)}>
                            <BarChart
                                data={pageBreakdown}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" tick={{ fontSize: 12, fill: '#666' }} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#444' }}
                                    width={110}
                                />
                                <Tooltip content={<CustomBarTooltip />} />
                                <Bar
                                    dataKey="views"
                                    name="조회수"
                                    fill="#6366f1"
                                    radius={[0, 4, 4, 0]}
                                    barSize={24}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* 안내 문구 */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-700">
                        <span className="font-semibold">안내:</span> 방문자 추적은 Firestore 기반으로 동작하며, 관리자 페이지(/admin/*)는 추적에서 제외됩니다.
                        세션당 고유 방문자 1회만 카운트됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
