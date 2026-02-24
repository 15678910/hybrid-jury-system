import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// 유럽 27개국 + 주요국 참심제/배심제 정보
const EUROPE_JURY_DATA = [
    // 참심제 국가
    {
        country: '독일',
        flag: '🇩🇪',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Schöffengericht',
        description: '일반 시민이 참심원(Schöffen)으로 직업법관과 함께 재판에 참여. 형사재판에서 2명의 참심원이 1명의 직업법관과 합의체 구성.',
        features: ['참심원 임기 5년', '형사사건 중심', '유무죄와 양형 모두 결정'],
        established: '1877년',
        website: 'https://www.bundesgerichtshof.de/EN/Home/homeBGH_node.html'
    },
    {
        country: '프랑스',
        flag: '🇫🇷',
        system: '배심제/참심제 병용',
        systemType: 'mixed',
        localName: 'Cour d\'assises',
        description: '중죄법원(Cour d\'assises)에서 시민배심원 6명이 3명의 직업법관과 함께 재판. 2심에서는 배심원 9명.',
        features: ['중죄사건 전담', '배심원과 법관 합의체', '2000년 항소심 도입'],
        established: '1791년 (대혁명 이후)',
        website: 'https://www.justice.gouv.fr/'
    },
    {
        country: '이탈리아',
        flag: '🇮🇹',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Corte d\'Assise',
        description: '중죄재판소에서 6명의 시민참심원이 2명의 직업법관과 함께 재판. 항소심도 동일 구조.',
        features: ['중죄사건 전담', '참심원 6명 + 법관 2명', '만장일치 불요'],
        established: '1931년',
        website: 'https://www.giustizia.it/'
    },
    {
        country: '스웨덴',
        flag: '🇸🇪',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Nämndemän',
        description: '지방법원에서 3명의 참심원(Nämndemän)이 1명의 직업법관과 함께 재판. 정당 추천으로 선출.',
        features: ['정당 추천제', '형사·민사 모두 적용', '참심원 다수결 가능'],
        established: '중세시대부터',
        website: 'https://www.domstol.se/en/'
    },
    {
        country: '노르웨이',
        flag: '🇳🇴',
        system: '참심제/배심제 병용',
        systemType: 'mixed',
        localName: 'Lagmannsrett',
        description: '지방법원은 참심제, 항소법원은 배심제(10명) 운영. 2018년 배심제 폐지 후 참심제로 통일.',
        features: ['2018년 배심제 폐지', '참심원 2명 + 법관 1명', '형사사건 중심'],
        established: '1887년 배심제 도입, 2018년 폐지',
        website: 'https://www.domstol.no/en/'
    },
    {
        country: '덴마크',
        flag: '🇩🇰',
        system: '참심제/배심제 병용',
        systemType: 'mixed',
        localName: 'Nævningeting',
        description: '경미한 형사사건은 참심제, 중대 형사사건(4년 이상)은 배심제 적용.',
        features: ['이원화 시스템', '배심원 6명 + 법관 3명', '참심원 2명 + 법관 1명'],
        established: '1919년',
        website: 'https://www.domstol.dk/om-os/english/'
    },
    {
        country: '핀란드',
        flag: '🇫🇮',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Lautamiehet',
        description: '지방법원에서 3명의 참심원이 1명의 직업법관과 함께 재판. 지방의회에서 선출.',
        features: ['지방의회 선출', '형사·민사 적용', '참심원 개별 투표권'],
        established: '1734년',
        website: 'https://tuomioistuimet.fi/en/'
    },
    {
        country: '오스트리아',
        flag: '🇦🇹',
        system: '참심제/배심제 병용',
        systemType: 'mixed',
        localName: 'Geschworenengerichte',
        description: '중죄(5년 이상)는 배심제(8명), 경죄는 참심제(2명) 적용.',
        features: ['이원화 시스템', '배심원 8명 (중죄)', '참심원 2명 (경죄)'],
        established: '1873년',
        website: 'https://www.justiz.gv.at/'
    },
    {
        country: '벨기에',
        flag: '🇧🇪',
        system: '배심제',
        systemType: 'jury',
        localName: 'Cour d\'assises',
        description: '중죄법원에서 12명의 배심원이 유무죄 판단. 양형은 배심원과 법관이 함께 결정.',
        features: ['중죄사건 전담', '배심원 12명', '2016년 개혁'],
        established: '1831년',
        website: 'https://www.belgium.be/en/justice/organisation'
    },
    {
        country: '스페인',
        flag: '🇪🇸',
        system: '배심제',
        systemType: 'jury',
        localName: 'Tribunal del Jurado',
        description: '특정 범죄(살인, 뇌물 등)에 대해 9명의 배심원이 유무죄 판단.',
        features: ['1995년 재도입', '배심원 9명', '특정 범죄 한정'],
        established: '1995년 (재도입)',
        website: 'https://www.poderjudicial.es/'
    },
    {
        country: '포르투갈',
        flag: '🇵🇹',
        system: '배심제',
        systemType: 'jury',
        localName: 'Tribunal de Júri',
        description: '중대 범죄에 대해 배심재판 가능. 피고인 또는 검찰의 청구로 구성.',
        features: ['청구에 의한 구성', '배심원 4명 + 법관 3명', '헌법상 보장'],
        established: '1976년 (민주화 이후)',
        website: 'https://dgaj.justica.gov.pt/English'
    },
    {
        country: '그리스',
        flag: '🇬🇷',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Μικτό Ορκωτό Δικαστήριο',
        description: '중죄재판소에서 4명의 시민참심원이 3명의 직업법관과 함께 재판.',
        features: ['중죄사건 전담', '참심원 4명 + 법관 3명', '2022년 개혁'],
        established: '1834년',
        website: 'https://www.areiospagos.gr/en/'
    },
    {
        country: '폴란드',
        flag: '🇵🇱',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Ławnicy',
        description: '지방법원 형사부에서 2명의 참심원이 1명의 직업법관과 함께 재판.',
        features: ['형사 1심 적용', '참심원 2명', '지방의회 선출'],
        established: '1950년대',
        website: 'https://www.gov.pl/web/justice'
    },
    {
        country: '체코',
        flag: '🇨🇿',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Přísedící',
        description: '지방법원에서 2명의 참심원이 1명의 직업법관과 함께 재판.',
        features: ['형사사건 중심', '참심원 2명', '지방의회 선출'],
        established: '1948년',
        website: 'https://www.nsoud.cz/en/'
    },
    {
        country: '헝가리',
        flag: '🇭🇺',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Ülnök',
        description: '1심 형사재판에서 2명의 참심원이 1명의 직업법관과 함께 재판.',
        features: ['형사 1심 적용', '참심원 2명', '지방의회 선출'],
        established: '1949년',
        website: 'https://birosag.hu/en'
    },
    {
        country: '슬로바키아',
        flag: '🇸🇰',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Prísediaci',
        description: '지방법원 형사부에서 2명의 참심원이 1명의 직업법관과 함께 재판.',
        features: ['형사사건 중심', '참심원 2명', '2005년 축소'],
        established: '1948년',
        website: 'https://www.justice.gov.sk/'
    },
    {
        country: '슬로베니아',
        flag: '🇸🇮',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Sodniki porotniki',
        description: '지방법원에서 2명의 참심원이 1명의 직업법관과 함께 형사재판.',
        features: ['형사사건 중심', '참심원 2명', '헌법상 보장'],
        established: '1991년',
        website: 'https://nasodiscu.si/en'
    },
    {
        country: '크로아티아',
        flag: '🇭🇷',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Suci porotnici',
        description: '지방법원에서 2명의 참심원이 1명의 직업법관과 함께 재판.',
        features: ['형사·민사 적용', '참심원 2명', '헌법상 보장'],
        established: '1991년',
        website: 'https://www.vsrh.hr/en/'
    },
    {
        country: '불가리아',
        flag: '🇧🇬',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Съдебни заседатели',
        description: '형사재판에서 2명의 참심원이 1명의 직업법관과 함께 재판.',
        features: ['형사사건 중심', '참심원 2명', '지방의회 선출'],
        established: '1991년',
        website: 'https://vss.justice.bg/en/'
    },
    {
        country: '루마니아',
        flag: '🇷🇴',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Judecători neprofesioniști',
        description: '과거 참심제 운영, 현재는 직업법관 중심 체제로 전환.',
        features: ['2003년 폐지', '현재 직업법관제', '노동법원에 일부 잔존'],
        established: '폐지됨 (2003년)',
        website: 'https://www.iccj.ro/en/home/'
    },
    {
        country: '아일랜드',
        flag: '🇮🇪',
        system: '배심제',
        systemType: 'jury',
        localName: 'Jury Trial',
        description: '형사재판에서 12명의 배심원이 유무죄 판단. 영미법 전통 계승.',
        features: ['배심원 12명', '만장일치 원칙', '형사사건 중심'],
        established: '영국 통치시대부터',
        website: 'https://www.courts.ie/'
    },
    {
        country: '몰타',
        flag: '🇲🇹',
        system: '배심제',
        systemType: 'jury',
        localName: 'Ġuri',
        description: '형사법원에서 9명의 배심원이 유무죄 판단.',
        features: ['배심원 9명', '중죄사건 전담', '영국법 영향'],
        established: '영국 통치시대부터',
        website: 'https://judiciary.mt/en/'
    },
    {
        country: '키프로스',
        flag: '🇨🇾',
        system: '배심제 (폐지)',
        systemType: 'abolished',
        localName: '-',
        description: '1960년 독립 후 배심제 폐지. 현재 직업법관 단독재판.',
        features: ['1960년 폐지', '직업법관제', '영국법 영향 잔존'],
        established: '폐지됨 (1960년)',
        website: 'https://www.supremecourt.gov.cy/'
    },
    {
        country: '에스토니아',
        flag: '🇪🇪',
        system: '참심제',
        systemType: 'lay_judge',
        localName: 'Rahvakohtunikud',
        description: '지방법원에서 2명의 참심원이 1명의 직업법관과 함께 재판.',
        features: ['형사·민사 적용', '참심원 2명', '지방의회 선출'],
        established: '1992년',
        website: 'https://www.riigikohus.ee/en'
    },
    {
        country: '라트비아',
        flag: '🇱🇻',
        system: '참심제 (폐지)',
        systemType: 'abolished',
        localName: '-',
        description: '2009년 참심제 폐지. 현재 직업법관 단독재판.',
        features: ['2009년 폐지', '직업법관제', '예산 문제로 폐지'],
        established: '폐지됨 (2009년)',
        website: 'https://www.tiesas.lv/en'
    },
    {
        country: '리투아니아',
        flag: '🇱🇹',
        system: '참심제 (폐지)',
        systemType: 'abolished',
        localName: '-',
        description: '2002년 참심제 폐지. 현재 직업법관 단독재판.',
        features: ['2002년 폐지', '직업법관제', '효율성 문제로 폐지'],
        established: '폐지됨 (2002년)',
        website: 'https://www.teismai.lt/en'
    },
    {
        country: '룩셈부르크',
        flag: '🇱🇺',
        system: '배심제',
        systemType: 'jury',
        localName: 'Cour d\'assises',
        description: '중죄법원에서 배심원이 유무죄 판단.',
        features: ['중죄사건 전담', '프랑스법 영향', '드물게 사용'],
        established: '19세기',
        website: 'https://mj.gouvernement.lu/en.html'
    },
];

// 시스템 타입별 색상
const getSystemColor = (systemType) => {
    switch (systemType) {
        case 'lay_judge':
            return 'bg-blue-100 text-blue-800';
        case 'jury':
            return 'bg-green-100 text-green-800';
        case 'mixed':
            return 'bg-purple-100 text-purple-800';
        case 'abolished':
            return 'bg-gray-100 text-gray-600';
        case 'none':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

// 시스템 타입별 아이콘
const getSystemIcon = (systemType) => {
    switch (systemType) {
        case 'lay_judge':
            return '⚖️';
        case 'jury':
            return '🗳️';
        case 'mixed':
            return '🔄';
        case 'abolished':
            return '❌';
        case 'none':
            return '➖';
        default:
            return '❓';
    }
};

export default function EuropeJurySystem() {
    const [filter, setFilter] = useState('all');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
    const [introDropdownOpen, setIntroDropdownOpen] = useState(false);
    const [casesDropdownOpen, setCasesDropdownOpen] = useState(false);

    // 페이지 로드 시 상단으로 스크롤
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const filteredData = filter === 'all'
        ? EUROPE_JURY_DATA
        : EUROPE_JURY_DATA.filter(item => item.systemType === filter);

    const stats = {
        lay_judge: EUROPE_JURY_DATA.filter(d => d.systemType === 'lay_judge').length,
        jury: EUROPE_JURY_DATA.filter(d => d.systemType === 'jury').length,
        mixed: EUROPE_JURY_DATA.filter(d => d.systemType === 'mixed').length,
        abolished: EUROPE_JURY_DATA.filter(d => d.systemType === 'abolished').length
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 네비게이션 헤더 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            ⚖️ 사법개혁
                        </Link>

                        {/* 데스크톱 메뉴 */}
                        <div className="hidden lg:flex space-x-6 text-sm items-center">
                            <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>

                            {/* 소통방 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setIntroDropdownOpen(true)}
                                onMouseLeave={() => setIntroDropdownOpen(false)}
                            >
                                <button className="hover:text-blue-600 transition font-medium flex items-center gap-1">
                                    소통방
                                    <svg className={`w-4 h-4 transition-transform ${introDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${introDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[140px] z-50">
                                        <Link to="/governance" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            의사결정
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <a href="/#necessity" className="hover:text-blue-600 transition font-medium">도입 필요성</a>

                            {/* 해외사례 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setCasesDropdownOpen(true)}
                                onMouseLeave={() => setCasesDropdownOpen(false)}
                            >
                                <button className="text-blue-600 font-bold flex items-center gap-1">
                                    해외사례
                                    <svg className={`w-4 h-4 transition-transform ${casesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${casesDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[160px] z-50">
                                        <a href="/#cases" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            해외사례
                                        </a>
                                        <Link to="/europe-jury" className="block px-4 py-2 hover:bg-gray-100 text-blue-600 font-bold">
                                            유럽
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <a href="/#constitution" className="hover:text-blue-600 transition font-medium">헌법적 근거</a>
                            <a href="/#bill" className="hover:text-blue-600 transition font-medium">법안 제안</a>

                            {/* 미디어 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setMediaDropdownOpen(true)}
                                onMouseLeave={() => setMediaDropdownOpen(false)}
                            >
                                <button className="hover:text-blue-600 transition font-medium flex items-center gap-1">
                                    미디어
                                    <svg className={`w-4 h-4 transition-transform ${mediaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 z-[9999] ${mediaDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[120px]">
                                        <Link to="/news" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            사법뉴스
                                        </Link>
                                        <Link to="/blog" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            블로그
                                        </Link>
                                        <Link to="/videos" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            동영상
                                        </Link>
                                        <Link to="/sentencing-analysis" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            내란재판분석
                                        </Link>
                                        <Link to="/reform-analysis" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            개혁안 비교
                                        </Link>
                                        <Link to="/judge-evaluation" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            AI의 판사평
                                        </Link>
                                        <Link to="/law-database" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            법령DB
                                        </Link>
                                        <Link to="/judicial-network" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">
                                            관계도
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <a href="/#signature" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg">
                                참여하기
                            </a>
                        </div>

                        {/* 모바일 메뉴 버튼 */}
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
                        <div className="lg:hidden py-4 border-t">
                            <div className="flex flex-col space-y-3">
                                <a href="/intro.html" className="hover:text-blue-600 transition font-medium">소개</a>
                                <div className="pl-4 border-l-2 border-gray-200">
                                    <p className="text-gray-500 text-sm mb-2">소통방</p>
                                    <Link to="/governance" className="block hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>의사결정</Link>
                                </div>
                                <a href="/#necessity" className="hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>도입 필요성</a>
                                {/* 모바일 해외사례 서브메뉴 */}
                                <div className="pl-4 border-l-2 border-blue-600">
                                    <p className="text-blue-600 font-bold mb-2">해외사례</p>
                                    <a href="/#cases" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>해외사례</a>
                                    <Link to="/europe-jury" className="block text-blue-600 font-bold" onClick={() => setMobileMenuOpen(false)}>유럽</Link>
                                </div>
                                <a href="/#constitution" className="hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>헌법적 근거</a>
                                <a href="/#bill" className="hover:text-blue-600 transition font-medium" onClick={() => setMobileMenuOpen(false)}>법안 제안</a>
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
                                    <Link to="/judicial-network" className="block hover:text-blue-600 transition font-medium mb-2" onClick={() => setMobileMenuOpen(false)}>관계도</Link>
                                </div>
                                <a href="/#signature" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:from-blue-700 hover:to-purple-700 transition shadow-lg text-center">
                                    참여하기
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* 페이지 타이틀 헤더 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 pt-32">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">유럽 시민참여재판 제도</h1>
                    <p className="text-xl text-white/90">
                        유럽 27개국의 참심제, 배심제 운용 현황
                    </p>
                </div>
            </div>

            {/* 통계 */}
            <section className="py-8 bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">{stats.lay_judge}</div>
                            <div className="text-sm text-gray-600">참심제</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-3xl font-bold text-green-600">{stats.jury}</div>
                            <div className="text-sm text-gray-600">배심제</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">{stats.mixed}</div>
                            <div className="text-sm text-gray-600">병용제</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg border">
                            <div className="text-3xl font-bold text-gray-600">{stats.abolished}</div>
                            <div className="text-sm text-gray-600">폐지</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 필터 */}
            <section className="py-6 bg-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            전체 ({EUROPE_JURY_DATA.length})
                        </button>
                        <button
                            onClick={() => setFilter('lay_judge')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'lay_judge'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            ⚖️ 참심제 ({stats.lay_judge})
                        </button>
                        <button
                            onClick={() => setFilter('jury')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'jury'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            🗳️ 배심제 ({stats.jury})
                        </button>
                        <button
                            onClick={() => setFilter('mixed')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'mixed'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            🔄 병용제 ({stats.mixed})
                        </button>
                        <button
                            onClick={() => setFilter('abolished')}
                            className={`px-4 py-2 rounded-full font-medium transition ${
                                filter === 'abolished'
                                    ? 'bg-gray-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            ❌ 폐지 ({stats.abolished})
                        </button>
                    </div>
                </div>
            </section>

            {/* 국가 목록 */}
            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer"
                                onClick={() => setSelectedCountry(selectedCountry === index ? null : index)}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold">{item.country}</h3>
                                            <p className="text-sm text-gray-500">{item.localName}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSystemColor(item.systemType)}`}>
                                            {getSystemIcon(item.systemType)} {item.system}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {item.description}
                                    </p>

                                    {selectedCountry === index && (
                                        <div className="mt-4 pt-4 border-t">
                                            <p className="text-gray-700 mb-3">{item.description}</p>

                                            <div className="mb-3">
                                                <span className="text-sm font-semibold text-gray-500">도입 시기:</span>
                                                <span className="ml-2 text-sm">{item.established}</span>
                                            </div>

                                            <div>
                                                <span className="text-sm font-semibold text-gray-500">주요 특징:</span>
                                                <ul className="mt-2 space-y-1">
                                                    {item.features.map((feature, i) => (
                                                        <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {item.website && (
                                                <div className="mt-3 pt-3 border-t">
                                                    <a
                                                        href={item.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                    >
                                                        <span>🔗</span>
                                                        <span>공식 사법기관 사이트</span>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 text-center">
                                        <span className="text-blue-600 text-sm">
                                            {selectedCountry === index ? '접기 ▲' : '더 보기 ▼'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 참고 정보 */}
            <section className="py-12 bg-gray-100">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-6 text-center">📚 참심제 vs 배심제</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="text-xl font-bold text-blue-600 mb-4">⚖️ 참심제 (Lay Judge System)</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li>• 시민이 <strong>참심원</strong>으로 직업법관과 동등한 권한</li>
                                <li>• 유무죄 판단과 양형을 <strong>함께</strong> 결정</li>
                                <li>• 법관과 참심원이 <strong>합의체</strong> 구성</li>
                                <li>• 주로 유럽 대륙법 국가에서 채택</li>
                                <li>• 독일, 프랑스, 이탈리아, 북유럽 등</li>
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow">
                            <h3 className="text-xl font-bold text-green-600 mb-4">🗳️ 배심제 (Jury System)</h3>
                            <ul className="space-y-2 text-gray-600">
                                <li>• 시민이 <strong>배심원</strong>으로 유무죄만 판단</li>
                                <li>• 양형은 <strong>법관이 단독</strong>으로 결정</li>
                                <li>• 배심원단이 <strong>독립적</strong>으로 평의</li>
                                <li>• 주로 영미법 국가에서 채택</li>
                                <li>• 미국, 영국, 아일랜드 등</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 푸터 */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400">
                        시민법관 참심제 준비위원회 | 유럽 시민참여재판 제도 정보
                    </p>
                    <Link to="/" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">
                        메인으로 돌아가기
                    </Link>
                </div>
            </footer>
        </div>
    );
}
