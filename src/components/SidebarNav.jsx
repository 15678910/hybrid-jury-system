import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 좌측 다크 사이드바 네비게이션 (proposal.html 스타일)
 * - IntersectionObserver 기반 스크롤 스파이
 * - smooth scroll + 800ms 스파이 억제
 * - 모바일: 숨김 + 토글 버튼 + 오버레이
 */
export default function SidebarNav({ items = [], onActiveChange, headerOffset = 96 }) {
    const [activeSection, setActiveSection] = useState(items[0]?.id || '');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isScrollingRef = useRef(false);
    const scrollTimerRef = useRef(null);
    const observerRef = useRef(null);
    const sidebarRef = useRef(null);

    // IntersectionObserver로 스크롤 스파이
    useEffect(() => {
        if (!items.length) return;

        // 기존 observer 정리
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        const handleIntersect = (entries) => {
            if (isScrollingRef.current) return;

            // 현재 뷰포트에 보이는 섹션들 중 가장 위에 있는 것 선택
            const visibleEntries = entries.filter(e => e.isIntersecting);
            if (visibleEntries.length > 0) {
                // boundingClientRect.top이 가장 작은 (가장 위에 있는) 항목
                const topEntry = visibleEntries.reduce((prev, curr) =>
                    prev.boundingClientRect.top < curr.boundingClientRect.top ? prev : curr
                );
                const id = topEntry.target.id;
                setActiveSection(id);
                onActiveChange?.(id);
            }
        };

        observerRef.current = new IntersectionObserver(handleIntersect, {
            rootMargin: `-${headerOffset}px 0px -75% 0px`,
            threshold: 0,
        });

        // 약간의 지연 후 관찰 시작 (DOM 렌더링 대기)
        const timer = setTimeout(() => {
            items.forEach(item => {
                const el = document.getElementById(item.id);
                if (el) observerRef.current?.observe(el);
            });
        }, 300);

        return () => {
            clearTimeout(timer);
            observerRef.current?.disconnect();
        };
    }, [items, headerOffset, onActiveChange]);

    // 클릭 시 smooth scroll
    const handleClick = useCallback((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        // 스파이 억제
        isScrollingRef.current = true;
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => {
            isScrollingRef.current = false;
        }, 800);

        // 즉시 활성 표시
        setActiveSection(id);
        onActiveChange?.(id);

        // 스크롤
        const targetY = el.getBoundingClientRect().top + window.scrollY - headerOffset - 8;
        window.scrollTo({ top: targetY, behavior: 'smooth' });

        // 모바일: 사이드바 닫기
        setSidebarOpen(false);
    }, [headerOffset, onActiveChange]);

    // 활성 링크가 사이드바 뷰포트 밖이면 자동 스크롤
    useEffect(() => {
        if (!sidebarRef.current) return;
        const activeLink = sidebarRef.current.querySelector('[data-active="true"]');
        if (activeLink) {
            const sidebarRect = sidebarRef.current.getBoundingClientRect();
            const linkRect = activeLink.getBoundingClientRect();
            if (linkRect.top < sidebarRect.top + 40 || linkRect.bottom > sidebarRect.bottom - 40) {
                activeLink.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }
        }
    }, [activeSection]);

    if (!items.length) return null;

    return (
        <>
            {/* 모바일 토글 버튼 */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed bottom-5 left-5 z-[300] w-12 h-12 rounded-full bg-[#d97706] text-white text-xl shadow-lg hover:bg-[#b45309] transition-colors flex items-center justify-center"
                aria-label="메뉴 토글"
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>

            {/* 모바일 오버레이 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[249] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 사이드바 */}
            <aside
                ref={sidebarRef}
                className={`
                    w-[272px] min-w-[272px] bg-[#1a1b2e] py-5 text-sm
                    overflow-y-auto

                    lg:sticky lg:top-[96px] lg:h-[calc(100vh-96px)]

                    fixed top-0 left-0 h-screen z-[250]
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                    lg:translate-x-0 lg:relative lg:shadow-none
                `}
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#334155 transparent',
                }}
            >
                {/* 모바일 헤더 */}
                <div className="lg:hidden px-5 pb-3 mb-2 border-b border-white/10">
                    <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">목차</span>
                </div>

                <nav>
                    {items.map(item => (
                        <button
                            key={item.id}
                            data-active={activeSection === item.id ? 'true' : 'false'}
                            onClick={() => handleClick(item.id)}
                            className={`
                                block w-full text-left py-2 px-5 pl-6
                                border-l-2 transition-all duration-150 text-[0.83rem] leading-relaxed
                                ${activeSection === item.id
                                    ? 'text-[#d97706] bg-[rgba(217,119,6,0.08)] border-l-[#d97706] font-semibold'
                                    : 'text-[#94a3b8] border-transparent hover:text-[#e2e8f0] hover:bg-white/[0.04]'
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
}
