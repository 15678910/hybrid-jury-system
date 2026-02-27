import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Header from '../components/Header';

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

// 국가별 판결문 공개 사이트 (공식 사법기관 사이트 하위에 표시)
const COURT_DECISION_SITES = {
    '독일': [
        { name: 'Rechtsprechung im Internet (연방 판례 데이터베이스)', url: 'https://www.rechtsprechung-im-internet.de', fee: '무료' },
        { name: 'Bundesverfassungsgericht (연방헌법재판소 판결)', url: 'https://www.bundesverfassungsgericht.de/EN/Decisions/decisions_node.html', fee: '무료' },
    ],
    '프랑스': [
        { name: 'Légifrance Jurisprudence (정부 공식 판례)', url: 'https://www.legifrance.gouv.fr/search/juri', fee: '일부무료', feeNote: '최고법원 무료 · 하급심 유료' },
    ],
    '이탈리아': [
        { name: 'Italgiure Web (대법원 판례 검색)', url: 'https://www.italgiure.giustizia.it/sncass/', fee: '일부무료', feeNote: '사법부 직원 무료 · 일반 구독 필요' },
    ],
    '스웨덴': [
        { name: 'Högsta domstolen Precedents (대법원 선례)', url: 'https://www.domstol.se/en/supreme-court/precedents/', fee: '일부무료', feeNote: '선례만 무료' },
        { name: 'Högsta förvaltningsdomstolen (최고행정법원 판결)', url: 'https://www.domstol.se/en/supreme-administrative-court/rulings/', fee: '일부무료', feeNote: '선례만 무료' },
    ],
    '노르웨이': [
        { name: 'Lovdata (법률·판례 공개 포털)', url: 'https://lovdata.no/info/information-in-english', fee: '일부무료', feeNote: '2008년 이후만 무료' },
    ],
    '덴마크': [
        { name: 'Domsdatabasen (판결 데이터베이스)', url: 'https://domsdatabasen.dk/', fee: '무료' },
    ],
    '핀란드': [
        { name: 'Finlex Oikeuskäytäntö (판례 검색)', url: 'https://finlex.fi/fi/oikeus/', fee: '무료' },
    ],
    '오스트리아': [
        { name: 'RIS Judikatur (법률정보시스템 판례)', url: 'https://www.ris.bka.gv.at/Jus/', fee: '무료' },
    ],
    '벨기에': [
        { name: 'Juportal (사법 포털 판례 검색)', url: 'https://juportal.be/', fee: '무료' },
    ],
    '스페인': [
        { name: 'CENDOJ (사법문서센터 판례 검색)', url: 'https://www.poderjudicial.es/search/indexAN.jsp', fee: '무료' },
    ],
    '포르투갈': [
        { name: 'DGSI (사법총국 판례 데이터베이스)', url: 'http://www.dgsi.pt/', fee: '무료' },
    ],
    '그리스': [
        { name: 'Areios Pagos (대법원 판결)', url: 'https://www.areiospagos.gr/', fee: '무료' },
    ],
    '폴란드': [
        { name: 'Portal Orzeczeń (법원 판결 포털)', url: 'https://orzeczenia.ms.gov.pl/', fee: '무료' },
    ],
    '체코': [
        { name: 'Nejvyšší soud Judikatura (대법원 판례)', url: 'https://nsoud.cz/Judikatura/judikatura_ns.nsf/', fee: '무료' },
    ],
    '헝가리': [
        { name: 'Bírósági Határozatok (법원 판결 모음)', url: 'https://birosag.hu/birosagi-hatarozatok-gyujtemenye', fee: '무료' },
    ],
    '슬로바키아': [
        { name: 'Otvorené Súdy (공개 법원 판결)', url: 'https://otvorenesudy.sk/', fee: '무료' },
    ],
    '슬로베니아': [
        { name: 'Sodna Praksa (판례 데이터베이스)', url: 'https://www.sodnapraksa.si/', fee: '무료' },
    ],
    '크로아티아': [
        { name: 'SuPra (대법원 판례 검색)', url: 'https://sudskapraksa.csp.vsrh.hr/', fee: '무료' },
    ],
    '불가리아': [
        { name: 'VKS Практика (대법원 판례)', url: 'https://www.vks.bg/praktikata-na-vks.html', fee: '무료' },
    ],
    '루마니아': [
        { name: 'ICCJ Jurisprudență (고등사법원 판례)', url: 'https://www.scj.ro/', fee: '무료' },
    ],
    '아일랜드': [
        { name: 'Courts.ie Judgments (법원 판결 검색)', url: 'https://www.courts.ie/judgments', fee: '무료' },
    ],
    '몰타': [
        { name: 'eCourts (전자법원 판결 검색)', url: 'https://ecourts.gov.mt/onlineservices/', fee: '무료' },
    ],
    '키프로스': [
        { name: 'CyLaw (키프로스 법률·판례)', url: 'http://www.cylaw.org/', fee: '무료' },
    ],
    '에스토니아': [
        { name: 'Riigi Teataja Kohtulahendid (판례 검색)', url: 'https://www.riigiteataja.ee/kohtulahendid/kohtulahendid.html', fee: '무료' },
    ],
    '라트비아': [
        { name: 'Tiesas.lv Nolēmumi (법원 판결)', url: 'https://www.tiesas.lv/nolemumi', fee: '무료' },
    ],
    '리투아니아': [
        { name: 'LITEKO (법원 판결 검색 시스템)', url: 'https://liteko.teismai.lt/viesasprendimupaieska/detalipaieska.aspx', fee: '무료' },
    ],
    '룩셈부르크': [
        { name: 'Legilux Jurisprudence (법률·판례 포털)', url: 'https://legilux.public.lu/', fee: '무료' },
    ],
};

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
            <SEOHead title="유럽 참심제" description="독일, 프랑스, 핀란드, 스웨덴 등 유럽 각국의 참심제 운영 사례와 비교 분석" path="/europe-jury" />
            <Header />

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
                                                <div className="mt-3 pt-3 border-t space-y-2">
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
                                                    {/* 판결문 공개 사이트 */}
                                                    {COURT_DECISION_SITES[item.country]?.map((site, si) => (
                                                        <div key={si} className="flex items-center gap-2">
                                                            <a
                                                                href={site.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                                                            >
                                                                <span>📄</span>
                                                                <span>{site.name}</span>
                                                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                                                site.fee === '무료' ? 'bg-green-100 text-green-700' :
                                                                site.fee === '일부무료' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {site.fee}
                                                            </span>
                                                            {site.feeNote && (
                                                                <span className="text-xs text-gray-400">({site.feeNote})</span>
                                                            )}
                                                        </div>
                                                    ))}
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

            {/* 판결문 공개와 시민의 알 권리 */}
            <section className="py-14 bg-white">
                <div className="container mx-auto px-4 max-w-5xl">
                    <h2 className="text-2xl font-bold mb-2 text-center">📄 판결문 공개와 시민의 알 권리</h2>
                    <p className="text-center text-gray-500 mb-10 text-sm">왜 판결문은 무료로 공개되어야 하는가?</p>

                    <div className="grid md:grid-cols-3 gap-6 mb-10">
                        {/* 카드 1: 알 권리 */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                            <div className="text-3xl mb-3">🔍</div>
                            <h3 className="text-lg font-bold text-blue-800 mb-3">시민의 알 권리</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                판결문은 <strong>국민의 이름으로</strong> 선고됩니다. 재판 결과를 시민이 자유롭게 열람할 수 있는 것은 민주주의의 기본 원칙이며,
                                <strong>사법부에 대한 민주적 통제</strong>의 전제 조건입니다.
                            </p>
                            <div className="mt-4 pt-3 border-t border-blue-100">
                                <p className="text-xs text-blue-600 font-semibold">유럽인권재판소 판례</p>
                                <p className="text-xs text-gray-500 mt-1">"사법 정의는 공개적으로 행해져야 할 뿐 아니라, 공개적으로 행해지는 것이 보여야 한다"</p>
                            </div>
                        </div>

                        {/* 카드 2: 사법 투명성 */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 shadow-sm">
                            <div className="text-3xl mb-3">⚖️</div>
                            <h3 className="text-lg font-bold text-emerald-800 mb-3">사법 투명성</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                판결문 공개는 판사의 <strong>양형 일관성</strong>을 검증하고, 유사 사건 간 <strong>형평성</strong>을 확인하는 유일한 수단입니다.
                                비공개 사법은 권력 남용과 부패의 온상이 됩니다.
                            </p>
                            <div className="mt-4 pt-3 border-t border-emerald-100">
                                <p className="text-xs text-emerald-600 font-semibold">EU 사법위원회 권고</p>
                                <p className="text-xs text-gray-500 mt-1">"판결문 전면 공개는 사법 신뢰의 핵심 인프라이며, 모든 회원국의 의무"</p>
                            </div>
                        </div>

                        {/* 카드 3: 법적 평등 */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-100 shadow-sm">
                            <div className="text-3xl mb-3">👥</div>
                            <h3 className="text-lg font-bold text-amber-800 mb-3">법적 평등과 접근성</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                판결문이 <strong>유료</strong>이면 경제력에 따라 법적 정보 접근이 달라집니다.
                                무료 공개는 <strong>법 앞의 평등</strong>을 실현하고, 시민이 자신의 권리를 스스로 확인할 수 있게 합니다.
                            </p>
                            <div className="mt-4 pt-3 border-t border-amber-100">
                                <p className="text-xs text-amber-600 font-semibold">독일 연방사법부</p>
                                <p className="text-xs text-gray-500 mt-1">"모든 연방법원 판결을 인터넷에서 무료로 제공하는 것은 법치국가의 당연한 의무"</p>
                            </div>
                        </div>
                    </div>

                    {/* 한국 vs 유럽 비교 */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                        <h3 className="text-lg font-bold text-center mb-6">🇰🇷 한국 vs 🇪🇺 유럽 — 판결문 공개 비교</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl p-5 border-l-4 border-red-400">
                                <h4 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                                    <span className="text-lg">🇰🇷</span> 대한민국 현황
                                </h4>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">✕</span>
                                        <span>대법원 판결만 선별 공개 (전체의 <strong>약 5%</strong>)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">✕</span>
                                        <span>1·2심 판결문은 <strong>당사자만</strong> 열람 가능</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">✕</span>
                                        <span>판결문 검색 시스템 <strong>미비</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-red-400 mt-0.5">✕</span>
                                        <span>양형 편차 검증 <strong>불가능</strong></span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white rounded-xl p-5 border-l-4 border-green-400">
                                <h4 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                                    <span className="text-lg">🇪🇺</span> 유럽 주요국
                                </h4>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>독일 · 핀란드 · 오스트리아 등 <strong>전면 무료 공개</strong></span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>1심부터 대법원까지 <strong>모든 심급</strong> 검색 가능</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span><strong>통합 검색 시스템</strong>으로 누구나 접근</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>판사별 양형 패턴 <strong>시민 검증</strong> 가능</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                유럽 27개국 중 <strong className="text-green-600">22개국</strong>이 판결문을 완전 무료로 공개하고 있습니다.
                                한국은 OECD 국가 중 판결문 공개율이 <strong className="text-red-500">최하위 수준</strong>입니다.
                            </p>
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
