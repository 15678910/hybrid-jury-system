import { useState } from 'react';
import Header from '../components/Header';

const SEARCH_SITES = [
    {
        id: 'scourt',
        name: '대법원 판례검색',
        description: '대법원 및 하급심 판례',
        url: 'https://glaw.scourt.go.kr/wsjo/panre/sjo060.do',
        searchUrl: 'https://glaw.scourt.go.kr/wsjo/panre/sjo060.do#1730000000000',
        icon: '⚖️',
        color: 'from-blue-500 to-blue-700',
        features: ['대법원 판결문', '고등법원 판결문', '지방법원 판결문', '특허법원 판결문']
    },
    {
        id: 'ccourt',
        name: '헌법재판소',
        description: '헌재 결정문 검색',
        url: 'https://search.ccourt.go.kr/',
        searchUrl: 'https://search.ccourt.go.kr/',
        icon: '🏛️',
        color: 'from-purple-500 to-purple-700',
        features: ['위헌법률심판', '헌법소원심판', '권한쟁의심판', '탄핵심판']
    },
    {
        id: 'law',
        name: '국가법령정보센터',
        description: '법령 + 판례 통합검색',
        url: 'https://www.law.go.kr/',
        searchUrl: 'https://www.law.go.kr/LSW/main.html',
        icon: '📜',
        color: 'from-green-500 to-green-700',
        features: ['현행법령', '자치법규', '행정규칙', '판례/해석례']
    },
    {
        id: 'casenote',
        name: '케이스노트',
        description: '민간 판례 검색 서비스',
        url: 'https://casenote.kr/',
        searchUrl: 'https://casenote.kr/',
        icon: '📋',
        color: 'from-orange-500 to-orange-700',
        features: ['AI 판례 분석', '판례 요약', '관련 판례 추천', '법률 뉴스']
    }
];

const QUICK_LINKS = [
    { name: '내란죄 판례', keyword: '내란', site: 'scourt' },
    { name: '탄핵심판 결정', keyword: '탄핵', site: 'ccourt' },
    { name: '국가보안법 판례', keyword: '국가보안법', site: 'scourt' },
    { name: '형법', keyword: '형법', site: 'law' },
];

export default function LegalSearch() {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (siteId) => {
        const site = SEARCH_SITES.find(s => s.id === siteId);
        if (site) {
            window.open(site.searchUrl, '_blank');
        }
    };

    const handleQuickLink = (link) => {
        const site = SEARCH_SITES.find(s => s.id === link.site);
        if (site) {
            window.open(site.searchUrl, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <Header />

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* 헤더 */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                        판례 검색 허브
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        대한민국 주요 법률 데이터베이스에서 판례와 법령을 검색하세요
                    </p>
                </div>

                {/* 빠른 검색 */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        빠른 검색
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_LINKS.map((link, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuickLink(link)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium text-gray-700 transition"
                            >
                                {link.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 검색 사이트 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {SEARCH_SITES.map((site) => (
                        <div
                            key={site.id}
                            className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                        >
                            <div className={`bg-gradient-to-r ${site.color} p-6 text-white`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{site.icon}</span>
                                    <div>
                                        <h3 className="text-xl font-bold">{site.name}</h3>
                                        <p className="text-white/80 text-sm">{site.description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500 mb-2">제공 서비스</p>
                                    <div className="flex flex-wrap gap-2">
                                        {site.features.map((feature, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSearch(site.id)}
                                    className={`w-full py-3 bg-gradient-to-r ${site.color} text-white font-semibold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    검색하러 가기
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 안내 사항 */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                    <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        이용 안내
                    </h3>
                    <ul className="text-sm text-amber-700 space-y-2">
                        <li>• 대법원 판례검색: 1998년 이후 판결문 전문 제공 (일부 비공개)</li>
                        <li>• 헌법재판소: 1988년 설립 이후 모든 결정문 검색 가능</li>
                        <li>• 국가법령정보센터: 현행 법령 및 판례 통합 검색</li>
                        <li>• 케이스노트: AI 기반 판례 분석 및 요약 서비스 (일부 유료)</li>
                    </ul>
                </div>

                {/* 관련 페이지 링크 */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-sm mb-3">시민법정 관련 페이지</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        <a href="/sentencing-analysis" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                            내란 재판 분석
                        </a>
                        <a href="/reform-analysis" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                            개혁안 비교
                        </a>
                        <a href="/law-database" className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                            법률 데이터베이스
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
