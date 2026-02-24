import { useState } from 'react';
import { Link } from 'react-router-dom';

// v2.0 - 카드뉴스 메뉴 추가
export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
    const [introDropdownOpen, setIntroDropdownOpen] = useState(false);
    const [casesDropdownOpen, setCasesDropdownOpen] = useState(false);

    const scrollToSection = (sectionId) => {
        // 메인 페이지로 이동 후 해당 섹션으로 스크롤
        window.location.href = `/#${sectionId}`;
    };

    return (
        <header className="bg-white shadow-md fixed top-0 w-full z-[9999] overflow-visible">
            <div className="container mx-auto px-4 overflow-visible">
                <nav className="flex items-center justify-between py-4 overflow-visible">
                    <Link to="/" className="text-2xl font-bold text-blue-600">
                        ⚖️ 사법개혁
                    </Link>

                    {/* 데스크톱 메뉴 */}
                    <div className="hidden lg:flex space-x-6 text-sm items-center overflow-visible">
                        {/* 소개 */}
                        <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>

                        {/* 소통방 드롭다운 */}
                        <div
                            className="relative overflow-visible"
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
                            <div className={`absolute top-full left-0 mt-0 pt-2 z-[9999] ${introDropdownOpen ? 'block' : 'hidden'}`}>
                                <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[140px]">
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

                        {/* 해외사례 드롭다운 */}
                        <div
                            className="relative overflow-visible"
                            onMouseEnter={() => setCasesDropdownOpen(true)}
                            onMouseLeave={() => setCasesDropdownOpen(false)}
                        >
                            <button
                                className="hover:text-blue-600 transition font-medium flex items-center gap-1"
                            >
                                해외사례
                                <svg className={`w-4 h-4 transition-transform ${casesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className={`absolute top-full left-0 mt-0 pt-2 z-[9999] ${casesDropdownOpen ? 'block' : 'hidden'}`}>
                                <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[160px]">
                                    <button
                                        onClick={() => scrollToSection('cases')}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        해외사례
                                    </button>
                                    <Link
                                        to="/europe-jury"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        유럽
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => scrollToSection('constitution')} className="hover:text-blue-600 transition font-medium">헌법적 근거</button>
                        <button onClick={() => scrollToSection('bill')} className="hover:text-blue-600 transition font-medium">법안 제안</button>

                        {/* 미디어 드롭다운 */}
                        <div
                            className="relative overflow-visible"
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
                            <div className={`absolute top-full left-0 mt-0 pt-2 z-[9999] ${mediaDropdownOpen ? 'block' : 'hidden'}`}>
                                <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[140px] max-h-[70vh] overflow-y-auto">
                                    <Link
                                        to="/news"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        사법뉴스
                                    </Link>
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
                                    <Link
                                        to="/sentencing-analysis"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        내란재판분석
                                    </Link>
                                    <Link
                                        to="/reform-analysis"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        개혁안 비교
                                    </Link>
                                    <Link
                                        to="/judge-evaluation"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        AI의 판사평
                                    </Link>
                                    <Link
                                        to="/law-database"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        법령DB
                                    </Link>
                                    <Link
                                        to="/judicial-network"
                                        className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600"
                                    >
                                        관계도
                                    </Link>
                                </div>
                            </div>
                        </div>

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
                <div className={`lg:hidden absolute top-full left-0 w-full bg-white shadow-lg max-h-[80vh] overflow-y-auto z-40 transition-[opacity,visibility] duration-200 ease-out ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                    <div className="pb-4 border-t pt-4">
                        <div className="flex flex-col space-y-3">
                            <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>
                            <div className="pl-4 border-l-2 border-gray-200">
                                <p className="text-gray-500 text-sm mb-2">소통방</p>
                                <Link to="/governance" className="block hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>의사결정</Link>
                            </div>
                            <button onClick={() => { scrollToSection('necessity'); setMobileMenuOpen(false); }} className="text-left hover:text-blue-600 transition font-medium">도입 필요성</button>
                            {/* 모바일 해외사례 서브메뉴 */}
                            <div className="pl-4 border-l-2 border-gray-200">
                                <p className="text-gray-500 text-sm mb-2">해외사례</p>
                                <button onClick={() => { scrollToSection('cases'); setMobileMenuOpen(false); }} className="block text-left hover:text-blue-600 transition font-medium mb-2">해외사례</button>
                                <Link to="/europe-jury" className="block hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>유럽</Link>
                            </div>
                            <button onClick={() => { scrollToSection('constitution'); setMobileMenuOpen(false); }} className="text-left hover:text-blue-600 transition font-medium">헌법적 근거</button>
                            <button onClick={() => { scrollToSection('bill'); setMobileMenuOpen(false); }} className="text-left hover:text-blue-600 transition font-medium">법안 제안</button>
                            {/* 모바일 미디어 서브메뉴 */}
                            <div className="pl-4 border-l-2 border-gray-200">
                                <p className="text-gray-500 text-sm mb-2">미디어</p>
                                <Link to="/news" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>사법뉴스</Link>
                                <Link to="/blog" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>블로그</Link>
                                <Link to="/videos" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>동영상</Link>
                                <Link to="/sentencing-analysis" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>내란재판분석</Link>
                                <Link to="/reform-analysis" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>개혁안 비교</Link>
                                <Link to="/judge-evaluation" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>AI의 판사평</Link>
                                <Link to="/law-database" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>법령DB</Link>
                                <Link to="/judicial-network" className="block hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>관계도</Link>
                            </div>
                            <button onClick={() => { scrollToSection('signature'); setMobileMenuOpen(false); }} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg text-center">
                                참여하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
