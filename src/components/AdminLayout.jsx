import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

const LOCKOUT_MINUTES = 15;
const MAX_ATTEMPTS = 5;

const MENU_ITEMS = [
    { path: '/admin/dashboard',  label: '대시보드',    icon: '📊' },
    { path: '/admin/signatures', label: '서명 관리',   icon: '✍️' },
    { path: '/admin/verdicts',   label: '판결 관리',   icon: '⚖️' },
    { path: '/admin/blog',       label: '블로그 관리', icon: '📝' },
    { path: '/admin/news',       label: '사법뉴스',    icon: '📰' },
    { path: '/admin/videos',     label: '동영상 관리', icon: '🎬' },
    { path: '/admin/governance', label: '거버넌스',    icon: '🗳️' },
    { path: '/admin/analytics', label: '방문자 분석', icon: '📈' },
];

export default function AdminLayout() {
    const location = useLocation();

    // ── 인증 상태 ──────────────────────────────────────────
    const [isLoggedIn, setIsLoggedIn]     = useState(false);
    const [authLoading, setAuthLoading]   = useState(true);
    const [password, setPassword]         = useState('');
    const [loginError, setLoginError]     = useState('');
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState(null);

    // ── UI 상태 ────────────────────────────────────────────
    const [sidebarOpen, setSidebarOpen]   = useState(false);

    // ── 1차: Firebase Auth / 2차: sessionStorage (24h) ────
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setIsLoggedIn(true);
                setAuthLoading(false);
                return;
            }

            const adminSession   = sessionStorage.getItem('adminLoggedIn');
            const loginTimestamp = sessionStorage.getItem('adminLoginTimestamp');

            if (adminSession === 'true' && loginTimestamp) {
                const hoursSinceLogin =
                    (Date.now() - parseInt(loginTimestamp, 10)) / (1000 * 60 * 60);
                if (hoursSinceLogin < 24) {
                    setIsLoggedIn(true);
                } else {
                    sessionStorage.removeItem('adminLoggedIn');
                    sessionStorage.removeItem('adminLoginTimestamp');
                }
            }

            setAuthLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ── 잠금 헬퍼 ─────────────────────────────────────────
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

    // ── 로그인 처리 ────────────────────────────────────────
    const handleLogin = (e) => {
        e.preventDefault();
        setLoginError('');

        if (isLockedOut()) {
            setLoginError(
                `너무 많은 시도입니다. ${getRemainingLockoutMinutes()}분 후 다시 시도해주세요.`
            );
            return;
        }

        const validPasswords = [
            import.meta.env.VITE_ADMIN_PASSWORD,
            import.meta.env.VITE_ADMIN_CODE,
            import.meta.env.VITE_WRITER_CODE,
        ].filter(Boolean);

        if (validPasswords.includes(password)) {
            const loginTime = Date.now().toString();
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminLoginTimestamp', loginTime);

            // 하위 페이지 자동 인증 지원
            const adminCode = import.meta.env.VITE_ADMIN_CODE;
            if (adminCode) localStorage.setItem('writerCode', adminCode);

            setIsLoggedIn(true);
            setLoginAttempts(0);
            setLockoutUntil(null);
            setLoginError('');
            setPassword('');
        } else {
            const newAttempts = loginAttempts + 1;
            setLoginAttempts(newAttempts);

            if (newAttempts >= MAX_ATTEMPTS) {
                setLockoutUntil(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
                setLoginError(
                    `${MAX_ATTEMPTS}회 실패. ${LOCKOUT_MINUTES}분간 잠금됩니다.`
                );
            } else {
                setLoginError(`비밀번호가 틀렸습니다. (${newAttempts}/${MAX_ATTEMPTS})`);
            }
        }
    };

    // ── 로그아웃 ───────────────────────────────────────────
    const handleLogout = () => {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminLoginTimestamp');
        setIsLoggedIn(false);
        setPassword('');
    };

    // ── 현재 메뉴 라벨 (빵크럼용) ─────────────────────────
    const activeMenuItem = MENU_ITEMS.find((item) =>
        location.pathname.startsWith(item.path)
    );
    const currentLabel = activeMenuItem?.label ?? '관리자';

    // ── 오늘 날짜 ─────────────────────────────────────────
    const todayString = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
    });

    // ══════════════════════════════════════════════════════
    // 로딩 화면
    // ══════════════════════════════════════════════════════
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1b2e]">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    // ══════════════════════════════════════════════════════
    // 로그인 화면
    // ══════════════════════════════════════════════════════
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1b2e] px-4">
                {/* 배경 노이즈 패턴 */}
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
                    style={{
                        backgroundImage:
                            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                        backgroundSize: '200px 200px',
                    }}
                />

                <div className="relative w-full max-w-sm">
                    {/* 카드 */}
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* 카드 상단 컬러 바 */}
                        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

                        <div className="px-8 py-10">
                            {/* 로고 */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1a1b2e] text-2xl mb-4 shadow-lg">
                                    ⚖️
                                </div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                    시민법정 관리자
                                </h1>
                                <p className="text-xs text-gray-400 mt-1">
                                    관리자 전용 영역입니다
                                </p>
                            </div>

                            {/* 폼 */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                        비밀번호
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="관리자 비밀번호"
                                        disabled={isLockedOut()}
                                        autoComplete="current-password"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-shadow"
                                    />
                                </div>

                                {loginError && (
                                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                                        <p className="text-red-600 text-xs leading-relaxed">
                                            {loginError}
                                        </p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLockedOut() || !password}
                                    className="w-full bg-[#1a1b2e] hover:bg-[#252640] disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors"
                                >
                                    {isLockedOut()
                                        ? `잠금 — ${getRemainingLockoutMinutes()}분 후 해제`
                                        : '로그인'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    to="/"
                                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    메인으로 돌아가기
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════
    // 인증 완료 — 레이아웃
    // ══════════════════════════════════════════════════════
    return (
        <div className="min-h-screen flex">

            {/* ── 모바일 토글 버튼 ── */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed bottom-5 left-5 z-[300] w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xl shadow-lg transition-colors flex items-center justify-center"
                aria-label="메뉴 토글"
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>

            {/* ── 모바일 오버레이 ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[249] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ════════════════════════════════════════════
                사이드바
            ════════════════════════════════════════════ */}
            <aside
                className={[
                    'w-64 min-w-[16rem] bg-[#1a1b2e] flex flex-col',
                    'fixed top-0 left-0 h-screen z-[250]',
                    'transition-transform duration-300 ease-in-out',
                    sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
                    'lg:translate-x-0 lg:relative lg:shadow-none lg:sticky lg:top-0 lg:h-screen',
                ].join(' ')}
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
            >
                {/* 로고 영역 */}
                <div className="px-6 py-5 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xl">⚖️</span>
                        <div>
                            <p className="text-white font-bold text-sm leading-tight tracking-tight">
                                시민법정
                            </p>
                            <p className="text-amber-400 text-[10px] font-medium tracking-widest uppercase">
                                관리자
                            </p>
                        </div>
                    </div>
                </div>

                {/* 메뉴 네비게이션 */}
                <nav className="flex-1 overflow-y-auto py-3">
                    {MENU_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                [
                                    'flex items-center gap-3 px-6 py-3 text-sm',
                                    'border-l-2 transition-all duration-150',
                                    isActive
                                        ? 'text-white bg-white/10 border-amber-500 font-semibold'
                                        : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/5',
                                ].join(' ')
                            }
                        >
                            <span className="text-base leading-none">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* 로그아웃 — 사이드바 하단 */}
                <div className="flex-shrink-0 px-6 py-5 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 text-gray-400 hover:text-red-400 text-sm transition-colors group"
                    >
                        <span className="text-base leading-none group-hover:scale-110 transition-transform">
                            🚪
                        </span>
                        <span>로그아웃</span>
                    </button>
                </div>
            </aside>

            {/* ════════════════════════════════════════════
                메인 영역
            ════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

                {/* 상단바 */}
                <header className="bg-white shadow-sm sticky top-0 z-10 flex-shrink-0">
                    <div className="flex items-center justify-between px-6 py-4 gap-4">

                        {/* 빵크럼 */}
                        <nav className="flex items-center gap-1.5 text-sm min-w-0">
                            <span className="text-gray-400 truncate hidden sm:inline">관리자</span>
                            <span className="text-gray-300 hidden sm:inline">/</span>
                            <span className="font-semibold text-gray-800 truncate">
                                {currentLabel}
                            </span>
                        </nav>

                        {/* 우측: 날짜 + 로그아웃 */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <span className="text-xs text-gray-400 hidden md:block whitespace-nowrap">
                                {todayString}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors whitespace-nowrap px-2.5 py-1.5 rounded-lg hover:bg-red-50"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </header>

                {/* 콘텐츠 */}
                <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                    <Outlet context={{ embedded: true }} />
                </main>
            </div>
        </div>
    );
}
