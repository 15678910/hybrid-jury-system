import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
    const [introDropdownOpen, setIntroDropdownOpen] = useState(false);

    const scrollToSection = (sectionId) => {
        // 메인 페이지로 이동 후 해당 섹션으로 스크롤
        window.location.href = `/#${sectionId}`;
    };

    return (
        <header className="bg-white shadow-md fixed top-0 w-full z-50">
            <div className="container mx-auto px-4">
                <nav className="flex items-center justify-between py-4">
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        ⚖️ 사법개혁
                    </Link>

                    {/* 데스크톱 메뉴 */}
                    <div className="hidden lg:flex space-x-6 text-sm items-center">
                        {/* 소개 */}
                        <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>

                        {/* 소통방 드롭다운 */}
                        <div
                            className="relative"
                            onMouseEnter={() => setIntroDropdownOpen(true)}
                            onMouseLeave={() => setIntroDropdownOpen(false)}
                        >
                            <button
                                className="hover:text-blue-600 transition font-medium flex items-center gap-1"
                            >
                                소통방
                                <svg className={`w-4 h-4 transition-transform ${introDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className={`absolute top-full left-0 mt-0 pt-2 ${introDropdownOpen ? 'block' : 'hidden'}`}>
                                <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[140px] z-50">
                                    <a
                                        href="/community.html"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        지역별 소통방
                                    </a>
                                    <Link
                                        to="/governance"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        의사결정
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => scrollToSection('necessity')} className="hover:text-blue-600 transition font-medium">도입 필요성</button>
                        <button onClick={() => scrollToSection('cases')} className="hover:text-blue-600 transition font-medium">해외 사례</button>
                        <button onClick={() => scrollToSection('constitution')} className="hover:text-blue-600 transition font-medium">헌법적 근거</button>
                        <button onClick={() => scrollToSection('bill')} className="hover:text-blue-600 transition font-medium">법안 제안</button>

                        {/* 미디어 드롭다운 */}
                        <div
                            className="relative"
                            onMouseEnter={() => setMediaDropdownOpen(true)}
                            onMouseLeave={() => setMediaDropdownOpen(false)}
                        >
                            <button
                                className="hover:text-blue-600 transition font-medium flex items-center gap-1"
                            >
                                미디어
                                <svg className={`w-4 h-4 transition-transform ${mediaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className={`absolute top-full left-0 mt-0 pt-2 ${mediaDropdownOpen ? 'block' : 'hidden'}`}>
                                <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[120px] z-50">
                                    <Link
                                        to="/blog"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        블로그
                                    </Link>
                                    <Link
                                        to="/videos"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        동영상
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <a href="/?poster=true" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition">
                            포스터 보기
                        </a>
                        <button onClick={() => scrollToSection('signature')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg">
                            참여하기
                        </button>
                    </div>

                    {/* 모바일 햄버거 버튼 */}
                    <button
                        className="lg:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </nav>

                {/* 모바일 메뉴 */}
                {mobileMenuOpen && (
                    <div className="lg:hidden pb-4 border-t pt-4">
                        <div className="flex flex-col space-y-3">
                            <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>
                            <div className="pl-4 border-l-2 border-gray-200">
                                <p className="text-gray-500 text-sm mb-2">소통방</p>
                                <a href="/community.html" className="block hover:text-blue-600 transition font-medium mb-1">지역별 소통방</a>
                                <Link to="/governance" className="block hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>의사결정</Link>
                            </div>
                            <button onClick={() => { scrollToSection('necessity'); setMobileMenuOpen(false); }} className="text-left hover:text-blue-600 transition font-medium">도입 필요성</button>
                            <button onClick={() => { scrollToSection('cases'); setMobileMenuOpen(false); }} className="text-left hover:text-blue-600 transition font-medium">해외 사례</button>
                            <button onClick={() => { scrollToSection('constitution'); setMobileMenuOpen(false); }} className="text-left hover:text-blue-600 transition font-medium">헌법적 근거</button>
                            <button onClick={() => { scrollToSection('bill'); setMobileMenuOpen(false); }} className="text-left hover:text-blue-600 transition font-medium">법안 제안</button>
                            <Link to="/blog" className="hover:text-blue-600 transition font-medium">블로그</Link>
                            <Link to="/videos" className="hover:text-blue-600 transition font-medium">동영상</Link>
                            <a href="/?poster=true" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition text-center">
                                포스터 보기
                            </a>
                            <button onClick={() => { scrollToSection('signature'); setMobileMenuOpen(false); }} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg text-center">
                                참여하기
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
