import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getCountFromServer
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { getTodayStats, getWeekStats, getMonthStats } from '../lib/analyticsQueries';

// 상대 시간 포맷 (한국어)
const formatRelativeTime = (date) => {
    if (!date) return '날짜 없음';
    const now = Date.now();
    const target = date instanceof Date ? date.getTime() : date.toMillis ? date.toMillis() : new Date(date).getTime();
    const diffMs = now - target;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${diffDay}일 전`;
};

const LOCKOUT_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export default function AdminDashboard() {
    const context = useOutletContext();
    const embedded = context?.embedded || false;

    // 인증 상태
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // 대시보드 데이터
    const [stats, setStats] = useState({
        signatures: 0,
        signaturesIndividual: 0,
        signaturesOrg: 0,
        posts: 0,
        videos: 0,
        users: 0,
        proposals: 0,
        news: 0
    });
    const [visitorStats, setVisitorStats] = useState({
        today: { totalViews: 0, uniqueVisitors: 0 },
        week: { totalViews: 0, uniqueVisitors: 0 },
        month: { totalViews: 0, uniqueVisitors: 0 },
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [dataError, setDataError] = useState('');

    // 24시간 세션 + Firebase Auth 확인
    useEffect(() => {
        if (embedded) {
            setIsLoggedIn(true);
            setAuthLoading(false);
            return;
        }

        // Firebase Auth 상태 확인
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setIsLoggedIn(true);
                setAuthLoading(false);
                return;
            }

            // sessionStorage 세션 확인 (24시간)
            const adminSession = sessionStorage.getItem('adminLoggedIn');
            const loginTimestamp = sessionStorage.getItem('adminLoginTimestamp');

            if (adminSession === 'true' && loginTimestamp) {
                const now = Date.now();
                const loginTime = parseInt(loginTimestamp, 10);
                const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

                if (hoursSinceLogin < 24) {
                    setIsLoggedIn(true);
                } else {
                    sessionStorage.removeItem('adminLoggedIn');
                    sessionStorage.removeItem('adminLoginTimestamp');
                    setIsLoggedIn(false);
                }
            } else {
                setIsLoggedIn(false);
            }

            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 로그인 후 데이터 로드
    useEffect(() => {
        if (isLoggedIn) {
            loadDashboardData();
        }
    }, [isLoggedIn]);

    // 잠금 상태 확인
    const isLockedOut = () => {
        if (!lockoutUntil) return false;
        if (Date.now() < lockoutUntil) return true;
        setLockoutUntil(null);
        setLoginAttempts(0);
        return false;
    };

    const getRemainingLockoutMinutes = () => {
        if (!lockoutUntil) return 0;
        return Math.ceil((lockoutUntil - Date.now()) / (1000 * 60));
    };

    // 로그인 처리
    const handleLogin = (e) => {
        e.preventDefault();
        setLoginError('');

        if (isLockedOut()) {
            setLoginError(`너무 많은 시도가 있었습니다. ${getRemainingLockoutMinutes()}분 후 다시 시도해주세요.`);
            return;
        }

        const validPasswords = [
            import.meta.env.VITE_ADMIN_PASSWORD,
            import.meta.env.VITE_ADMIN_CODE,
            import.meta.env.VITE_WRITER_CODE
        ].filter(Boolean);

        if (validPasswords.length === 0) {
            setLoginError('관리자 비밀번호가 설정되지 않았습니다. 환경 변수를 확인해주세요.');
            return;
        }

        if (validPasswords.includes(password)) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminLoginTimestamp', Date.now().toString());
            setIsLoggedIn(true);
            setLoginAttempts(0);
            setLockoutUntil(null);
            setPassword('');
        } else {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);
            setPassword('');

            if (newAttempts >= MAX_ATTEMPTS) {
                const lockUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
                setLockoutUntil(lockUntil);
                setLoginError(`비밀번호 ${MAX_ATTEMPTS}회 오류. ${LOCKOUT_MINUTES}분간 잠깁니다.`);
            } else {
                setLoginError(`비밀번호가 틀렸습니다. (${newAttempts}/${MAX_ATTEMPTS}회)`);
            }
        }
    };

    // 로그아웃
    const handleLogout = () => {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminLoginTimestamp');
        setIsLoggedIn(false);
    };

    // 대시보드 데이터 로드 (병렬)
    const loadDashboardData = async () => {
        setDataLoading(true);
        setDataError('');

        try {
            const signaturesCol = collection(db, 'signatures');
            const postsCol = collection(db, 'posts');
            const videosCol = collection(db, 'videos');
            const usersCol = collection(db, 'users');
            const proposalsCol = collection(db, 'proposals');

            // Safe count helper - one failure won't break others
            const safeCount = async (q) => {
                try {
                    const snap = await getCountFromServer(q);
                    return snap.data().count;
                } catch {
                    return 0;
                }
            };

            // All counts in parallel (each individually safe)
            const [
                sigAll, sigIndividual, sigOrg,
                postsTotal, newsCount,
                videosCount, usersCount, proposalsCount
            ] = await Promise.all([
                safeCount(query(signaturesCol)),
                safeCount(query(signaturesCol, where('type', '==', 'individual'))),
                safeCount(query(signaturesCol, where('type', '==', 'organization'))),
                safeCount(query(postsCol)),
                safeCount(query(postsCol, where('category', '==', '사법뉴스'))),
                safeCount(query(videosCol)),
                safeCount(query(usersCol)),
                safeCount(query(proposalsCol))
            ]);

            // Blog count = total posts - news (avoids != composite index requirement)
            const blogCount = Math.max(0, postsTotal - newsCount);

            setStats({
                signatures: sigAll,
                signaturesIndividual: sigIndividual,
                signaturesOrg: sigOrg,
                posts: blogCount,
                videos: videosCount,
                users: usersCount,
                proposals: proposalsCount,
                news: newsCount
            });

            // 방문자 분석 데이터 로드 (병렬, 개별 안전)
            try {
                const [todayData, weekData, monthData] = await Promise.all([
                    getTodayStats(),
                    getWeekStats(),
                    getMonthStats(),
                ]);
                setVisitorStats({ today: todayData, week: weekData, month: monthData });
            } catch (err) {
                console.warn('Visitor stats load error:', err.message);
            }

            // Recent activity - each individually safe
            const recentItems = [];

            try {
                const recentSigsSnap = await getDocs(query(signaturesCol, orderBy('createdAt', 'desc'), limit(5)));
                recentSigsSnap.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    recentItems.push({
                        id: docSnap.id,
                        type: 'signature',
                        label: '서명',
                        title: data.name || '익명',
                        createdAt: data.createdAt
                    });
                });
            } catch {}

            try {
                const recentPostsSnap = await getDocs(query(postsCol, orderBy('createdAt', 'desc'), limit(5)));
                recentPostsSnap.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    recentItems.push({
                        id: docSnap.id,
                        type: data.category === '사법뉴스' ? 'news' : 'post',
                        label: data.category === '사법뉴스' ? '사법뉴스' : '블로그',
                        title: data.title || '제목 없음',
                        createdAt: data.createdAt
                    });
                });
            } catch {}

            try {
                const recentVideosSnap = await getDocs(query(videosCol, orderBy('createdAt', 'desc'), limit(5)));
                recentVideosSnap.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    recentItems.push({
                        id: docSnap.id,
                        type: 'video',
                        label: '동영상',
                        title: data.title || '제목 없음',
                        createdAt: data.createdAt
                    });
                });
            } catch {}

            // createdAt 기준 내림차순 정렬
            recentItems.sort((a, b) => {
                const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
                const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
                return bTime - aTime;
            });

            setRecentActivity(recentItems.slice(0, 10));
        } catch (err) {
            console.error('Dashboard data error:', err);
            setDataError('데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setDataLoading(false);
        }
    };

    // 로딩 중
    if (authLoading && !embedded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">인증 확인 중...</p>
                </div>
            </div>
        );
    }

    // 로그인 폼
    if (!isLoggedIn && !embedded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-3">📊</div>
                        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
                        <p className="text-gray-500 mt-1 text-sm">시민법정 관리자 전용</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                관리자 비밀번호
                            </label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                disabled={isLockedOut()}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        {loginError && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-red-700 text-sm">{loginError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLockedOut() || !password}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                        >
                            {isLockedOut() ? `잠금 (${getRemainingLockoutMinutes()}분 후 해제)` : '로그인'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            메인으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 통계 카드 데이터
    const statCards = [
        {
            title: '서명 참여',
            value: stats.signatures.toLocaleString(),
            sub: `개인 ${stats.signaturesIndividual.toLocaleString()} / 단체 ${stats.signaturesOrg.toLocaleString()}`,
            bg: 'from-red-500 to-rose-600'
        },
        {
            title: '블로그',
            value: stats.posts.toLocaleString(),
            sub: '게시물',
            bg: 'from-blue-500 to-blue-600'
        },
        {
            title: '동영상',
            value: stats.videos.toLocaleString(),
            sub: '등록 영상',
            bg: 'from-purple-500 to-purple-600'
        },
        {
            title: '사용자',
            value: stats.users.toLocaleString(),
            sub: '가입 회원',
            bg: 'from-green-500 to-emerald-600'
        },
        {
            title: '시민제안',
            value: stats.proposals.toLocaleString(),
            sub: '등록 제안',
            bg: 'from-orange-500 to-amber-600'
        },
        {
            title: '사법뉴스',
            value: stats.news.toLocaleString(),
            sub: '뉴스 기사',
            bg: 'from-indigo-500 to-indigo-600'
        },
        {
            title: '오늘 방문자',
            value: (visitorStats.today.uniqueVisitors || 0).toLocaleString(),
            sub: `페이지뷰 ${(visitorStats.today.totalViews || 0).toLocaleString()}`,
            bg: 'from-cyan-500 to-teal-600'
        },
        {
            title: '이번 주 방문자',
            value: (visitorStats.week.uniqueVisitors || 0).toLocaleString(),
            sub: `페이지뷰 ${(visitorStats.week.totalViews || 0).toLocaleString()}`,
            bg: 'from-sky-500 to-blue-600'
        },
        {
            title: '이번 달 방문자',
            value: (visitorStats.month.uniqueVisitors || 0).toLocaleString(),
            sub: `페이지뷰 ${(visitorStats.month.totalViews || 0).toLocaleString()}`,
            bg: 'from-violet-500 to-purple-600'
        }
    ];

    // 빠른 탐색 카드 데이터
    const navCards = [
        {
            to: '/admin',
            icon: '✍️',
            title: '서명·사용자 관리',
            desc: '서명 현황 및 회원 관리'
        },
        {
            to: '/blog/admin',
            icon: '📝',
            title: '블로그 관리',
            desc: '게시물 작성·수정·삭제'
        },
        {
            to: '/videos/admin',
            icon: '🎬',
            title: '동영상 관리',
            desc: '영상 등록 및 관리'
        },
        {
            to: '/news/admin',
            icon: '📰',
            title: '사법뉴스 관리',
            desc: '뉴스 콘텐츠 관리'
        },
        {
            to: '/governance/admin',
            icon: '🏛️',
            title: '거버넌스 관리',
            desc: '시민 제안 및 거버넌스'
        }
    ];

    // 활동 타입별 배지 색상
    const typeBadgeColor = {
        signature: 'bg-red-100 text-red-700',
        post: 'bg-blue-100 text-blue-700',
        news: 'bg-indigo-100 text-indigo-700',
        video: 'bg-purple-100 text-purple-700'
    };

    return (
        <div className={embedded ? 'bg-gray-50' : 'min-h-screen bg-gray-50'}>
            {/* 헤더 */}
            {!embedded && (
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/admin"
                                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
                            >
                                관리자 페이지
                            </Link>
                            <Link
                                to="/"
                                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
                            >
                                메인으로
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 에러 배너 */}
                {dataError && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                        <p className="text-red-700 text-sm">{dataError}</p>
                        <button
                            onClick={loadDashboardData}
                            className="text-red-600 hover:text-red-800 text-sm font-medium underline ml-4"
                        >
                            다시 시도
                        </button>
                    </div>
                )}

                {/* 통계 카드 그리드 */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">전체 현황</h2>
                    {dataLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="rounded-xl h-28 bg-gray-200 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                            {statCards.map((card) => (
                                <div
                                    key={card.title}
                                    className={`bg-gradient-to-br ${card.bg} rounded-xl shadow-lg p-5 text-white`}
                                >
                                    <p className="text-sm font-medium opacity-90 mb-1">{card.title}</p>
                                    <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                                    <p className="text-xs opacity-75 mt-1">{card.sub}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 빠른 탐색 */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">빠른 탐색</h2>
                    <div className="flex flex-wrap gap-4">
                        {navCards.map((card) => (
                            <Link
                                key={card.to}
                                to={card.to}
                                className="flex-1 min-w-[160px] bg-white rounded-xl shadow-lg p-5 hover:shadow-xl hover:scale-105 transition-all duration-200 group"
                            >
                                <div className="text-3xl mb-2">{card.icon}</div>
                                <p className="font-semibold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">
                                    {card.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 최근 활동 타임라인 */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">최근 활동</h2>
                        <button
                            onClick={loadDashboardData}
                            disabled={dataLoading}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:text-gray-400"
                        >
                            {dataLoading ? '불러오는 중...' : '새로고침'}
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {dataLoading ? (
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-16 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                                        <div className="flex-1 h-5 bg-gray-100 rounded animate-pulse"></div>
                                        <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <p className="text-4xl mb-3">📭</p>
                                <p className="text-sm">최근 활동이 없습니다.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {recentActivity.map((item, idx) => (
                                    <li key={`${item.type}-${item.id}-${idx}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${typeBadgeColor[item.type] || 'bg-gray-100 text-gray-600'}`}>
                                            {item.label}
                                        </span>
                                        <span className="flex-1 text-sm text-gray-800 truncate">
                                            {item.title}
                                        </span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatRelativeTime(item.createdAt)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
