import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { KakaoIcon, FacebookIcon, XIcon, InstagramIcon, TelegramIcon } from '../components/icons';
import { searchLaws, searchPrecedents, searchConstitutionalDecisions, searchLegalTerms } from '../lib/lawApi';

// ============================================
// 정적 데이터 (API 실패 시 폴백)
// ============================================

const CRIMINAL_LAW_ARTICLES = [
    {
        number: '제87조',
        title: '내란',
        text: '국토를 참절하거나 국헌을 문란할 목적으로 폭동한 자는 다음의 구별에 의하여 처단한다.\n1. 수괴는 사형, 무기징역 또는 무기금고에 처한다.\n2. 모의에 참여하거나 지휘하거나 기타 중요한 임무에 종사한 자는 사형, 무기 또는 5년 이상의 징역이나 금고에 처한다. 죄를 실행을 위하여 병기를 반포하거나 폭발물 기타 위험한 물건을 사용한 자도 같다.\n3. 부화수행하거나 단순히 폭동에만 관여한 자는 5년 이하의 징역 또는 금고에 처한다.',
        appliedTo: ['윤석열 (내란수괴)', '한덕수 (내란중요임무종사)', '김용현', '곽종근', '여인형', '이진우', '이상민', '박성재'],
        highlight: true
    },
    {
        number: '제88조',
        title: '내란목적의 살인',
        text: '국토를 참절하거나 국헌을 문란할 목적으로 사람을 살해한 자는 사형, 무기징역 또는 무기금고에 처한다.',
        appliedTo: [],
        highlight: false
    },
    {
        number: '제89조',
        title: '미수범',
        text: '전2조의 미수범은 처벌한다.',
        appliedTo: [],
        highlight: false
    },
    {
        number: '제90조',
        title: '예비, 음모, 선동, 선전',
        text: '①제87조 또는 제88조의 죄를 범할 목적으로 예비 또는 음모한 자는 3년 이상의 유기징역이나 유기금고에 처한다. 단, 그 목적한 죄의 실행에 이르기 전에 자수한 때에는 그 형을 감경 또는 면제한다.\n②제87조 또는 제88조의 죄를 범할 것을 선동 또는 선전한 자도 전항의 형과 같다.',
        appliedTo: [],
        highlight: false
    },
    {
        number: '제91조',
        title: '국헌문란의 정의',
        text: '본장에서 국헌을 문란할 목적이라 함은 다음 각호의 1에 해당함을 말한다.\n1. 헌법 또는 법률에 정한 절차에 의하지 아니하고 헌법 또는 법률의 기능을 소멸시키는 것\n2. 헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것',
        appliedTo: [],
        highlight: true
    },
    {
        number: '제93조',
        title: '일반이적',
        text: '적국을 위하여 간첩하거나 적국의 군사상의 이익을 도모한 자는 사형 또는 무기징역에 처한다.',
        appliedTo: ['윤석열', '김용현', '여인형'],
        highlight: false
    }
];

const LEGAL_TERMS = [
    {
        term: '내란',
        definition: '국토를 참절(僭竊)하거나 국헌을 문란할 목적으로 폭동하는 것. 국가의 존립이나 헌법의 기본적 질서를 위태롭게 하는 중대한 범죄.',
        relatedLaw: '형법 제87조',
        caseRelevance: '2024.12.3 비상계엄 선포가 "국헌문란 목적의 폭동"에 해당하는지가 핵심 쟁점'
    },
    {
        term: '내란수괴',
        definition: '내란의 주모자로서 내란을 기획·지휘하는 우두머리. 법정형은 사형, 무기징역 또는 무기금고.',
        relatedLaw: '형법 제87조 제1호',
        caseRelevance: '윤석열 전 대통령이 내란수괴 혐의로 기소됨'
    },
    {
        term: '내란중요임무종사',
        definition: '내란의 모의에 참여하거나 지휘하거나 기타 중요한 임무에 종사하는 것. 법정형은 사형, 무기 또는 5년 이상의 징역이나 금고.',
        relatedLaw: '형법 제87조 제2호',
        caseRelevance: '한덕수, 김용현, 곽종근, 여인형 등이 이 혐의로 기소됨. 한덕수는 징역 23년 선고'
    },
    {
        term: '국헌문란',
        definition: '①헌법 또는 법률에 정한 절차에 의하지 아니하고 헌법 또는 법률의 기능을 소멸시키는 것 ②헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것',
        relatedLaw: '형법 제91조',
        caseRelevance: '재판부는 12.3 비상계엄이 "국회의 권능행사를 불가능하게 하려는 시도"로 국헌문란에 해당한다고 판단'
    },
    {
        term: '필요적 공동정범',
        definition: '범죄의 성질상 2인 이상의 행위자가 있어야만 성립하는 범죄. 내란죄는 다수인의 폭동을 전제하므로 필요적 공동정범에 해당.',
        relatedLaw: '형법 총칙 제30조',
        caseRelevance: '한덕수 재판에서 "내란죄는 필요적 공동정범이므로 방조범이 성립할 수 없다"고 판단 (내란우두머리방조 무죄 근거)'
    },
    {
        term: '공모공동정범',
        definition: '2인 이상이 범죄의 실행을 공모하고 그 공모에 기하여 범죄를 실행한 경우, 실행행위를 직접 분담하지 않은 자도 공동정범으로 처벌하는 법리.',
        relatedLaw: '형법 제30조',
        caseRelevance: '내란 참여자들의 공모 범위와 역할 분담이 각 피고인별 핵심 쟁점'
    },
    {
        term: '비상계엄',
        definition: '전시·사변 또는 이에 준하는 국가비상사태에 있어서 병력으로써 군사상의 필요에 응하거나 공공의 안녕질서를 유지할 필요가 있을 때 대통령이 선포하는 계엄.',
        relatedLaw: '헌법 제77조, 계엄법',
        caseRelevance: '2024.12.3 비상계엄이 헌법상 요건을 충족하지 못한 위법한 계엄인지가 쟁점'
    },
    {
        term: '내란목적살인',
        definition: '국토를 참절하거나 국헌을 문란할 목적으로 사람을 살해하는 것. 법정형은 사형, 무기징역 또는 무기금고.',
        relatedLaw: '형법 제88조',
        caseRelevance: '현재 12.3 사건에서는 내란목적살인 혐의로 기소된 사람은 없음'
    },
    {
        term: '내란불고지',
        definition: '내란의 예비·음모·선동·선전을 알면서도 이를 수사기관 등에 고지하지 않는 것.',
        relatedLaw: '형법 제90조, 제101조',
        caseRelevance: '비상계엄을 사전에 알고도 고지하지 않은 인사들에 대한 수사 가능성'
    },
    {
        term: '일반이적',
        definition: '적국을 위하여 간첩하거나 적국의 군사상의 이익을 도모하는 것. 법정형은 사형 또는 무기징역.',
        relatedLaw: '형법 제93조',
        caseRelevance: '윤석열, 김용현, 여인형이 일반이적 혐의로 추가 기소됨 (2025.11.10)'
    }
];

const LAW_HISTORY_TIMELINE = [
    {
        year: '1953',
        title: '형법 제정',
        description: '대한민국 형법 제정과 함께 내란죄(제87조~제91조) 신설. 일본 형법의 내란죄를 참고하되 독자적 체계로 구성.',
        type: 'creation'
    },
    {
        year: '1961',
        title: '5.16 군사정변',
        description: '박정희 등 군부세력의 군사정변. 이후 "혁명"으로 정당화되어 내란죄 적용이 이루어지지 않음.',
        type: 'event'
    },
    {
        year: '1979',
        title: '12.12 군사반란',
        description: '전두환 등 신군부의 군사반란. 당시에는 처벌되지 않았으나 이후 재판으로 이어짐.',
        type: 'event'
    },
    {
        year: '1980',
        title: '5.18 광주민주화운동',
        description: '신군부의 비상계엄 확대와 무력 진압. 내란목적살인 등 혐의의 역사적 사례.',
        type: 'event'
    },
    {
        year: '1995',
        title: '5.18 특별법 제정',
        description: '"헌정질서 파괴범죄의 공소시효 등에 관한 특례법" 제정. 내란죄의 공소시효 배제 근거 마련.',
        type: 'amendment'
    },
    {
        year: '1996',
        title: '12.12/5.18 재판',
        description: '전두환·노태우 등에 대한 내란 재판. 전두환 사형(후 무기징역→특사), 노태우 징역 22년 6월(후 17년→특사). 대한민국 최초의 내란죄 유죄 판결.',
        type: 'verdict'
    },
    {
        year: '2004',
        title: '노무현 대통령 탄핵 사건',
        description: '헌법재판소 2004헌나1 결정. 탄핵 기각. 대통령의 헌법 수호 의무에 대한 헌법적 판단.',
        type: 'constitutional'
    },
    {
        year: '2014',
        title: '통합진보당 해산 결정',
        description: '헌재 2013헌다1 결정. 내란 관련 목적을 가진 정당의 해산 결정. 내란 관련 법리의 현대적 해석.',
        type: 'constitutional'
    },
    {
        year: '2016',
        title: '박근혜 대통령 탄핵 사건',
        description: '헌법재판소 2016헌나1 결정. 탄핵 인용. 대통령의 헌법 수호 의무 위반 확인.',
        type: 'constitutional'
    },
    {
        year: '2024.12.3',
        title: '비상계엄 선포',
        description: '윤석열 대통령의 비상계엄 선포. 군 병력의 국회 진입 시도. 약 6시간 만에 해제. 헌정사상 초유의 대통령 주도 내란 의혹.',
        type: 'event'
    },
    {
        year: '2025.1',
        title: '윤석열 대통령 체포·구속',
        description: '공수처에 의한 현직 대통령 체포 및 구속. 내란수괴 혐의 적용. 헌정사상 최초.',
        type: 'event'
    },
    {
        year: '2026.1.21',
        title: '한덕수 1심 판결',
        description: '12.3 내란 관련 첫 판결. 내란중요임무종사 유죄, 징역 23년 선고. 법원이 12.3 비상계엄을 "국헌문란 목적의 내란"으로 최초 인정.',
        type: 'verdict'
    },
    {
        year: '2026.1.28',
        title: '김건희 1심 판결',
        description: '도이치모터스 주가조작 무죄, 알선수재 유죄. 징역 1년 8개월 선고.',
        type: 'verdict'
    }
];

const CONSTITUTIONAL_DECISIONS = [
    {
        caseNumber: '2004헌나1',
        title: '노무현 대통령 탄핵 사건',
        date: '2004.5.14',
        result: '기각 (탄핵 기각)',
        summary: '국회의 탄핵소추를 기각. 대통령의 선거중립의무 위반은 인정하였으나, 파면을 정당화할 정도의 중대한 법 위반은 아니라고 판단.',
        significance: '대통령 탄핵의 요건으로 "법 위반의 중대성"이 필요함을 확립'
    },
    {
        caseNumber: '2013헌다1',
        title: '통합진보당 해산 사건',
        date: '2014.12.19',
        result: '인용 (정당 해산)',
        summary: '통합진보당의 목적과 활동이 민주적 기본질서에 위배된다고 판단. 내란 관련 목적을 가진 정당의 해산을 결정.',
        significance: '내란 관련 법리의 현대적 해석, 민주적 기본질서의 의미 확립'
    },
    {
        caseNumber: '2016헌나1',
        title: '박근혜 대통령 탄핵 사건',
        date: '2017.3.10',
        result: '인용 (탄핵 인용, 파면)',
        summary: '대통령의 헌법 수호 의무 위반, 국민주권주의와 법치주의 위반을 인정. 재판관 전원일치로 파면 결정.',
        significance: '대통령의 헌법 수호 의무의 구체적 내용과 위반 시 파면 사유 확립'
    },
    {
        caseNumber: '2024헌나1',
        title: '윤석열 대통령 탄핵 사건',
        date: '2025.4.4',
        result: '인용 (탄핵 인용, 파면)',
        summary: '12.3 비상계엄 선포가 헌법 위반이며, 대통령의 헌법 수호 의무를 중대하게 위반했다고 판단. 재판관 전원일치로 파면 결정.',
        significance: '비상계엄의 헌법적 한계, 대통령의 내란 행위에 대한 헌법재판소의 판단'
    }
];

// ============================================
// 메인 컴포넌트
// ============================================

export default function LawDatabase() {
    const [activeTab, setActiveTab] = useState('laws');
    const [loading, setLoading] = useState(false);
    const [apiPrecedents, setApiPrecedents] = useState(null);
    const [apiConstitutional, setApiConstitutional] = useState(null);
    const [apiLawData, setApiLawData] = useState(null);
    const [expandedArticle, setExpandedArticle] = useState(null);
    const [expandedTerm, setExpandedTerm] = useState(null);
    const [expandedDecision, setExpandedDecision] = useState(null);
    const [kakaoReady, setKakaoReady] = useState(false);

    // Kakao SDK 초기화
    useEffect(() => {
        const initKakao = () => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                try {
                    window.Kakao.init('83e843186c1251b9b5a8013fd5f29798');
                    setKakaoReady(true);
                } catch (e) {
                    console.error('Kakao init error:', e);
                }
            } else if (window.Kakao?.isInitialized()) {
                setKakaoReady(true);
            }
        };
        if (window.Kakao) {
            initKakao();
        } else {
            const check = setInterval(() => {
                if (window.Kakao) { clearInterval(check); initKakao(); }
            }, 100);
            setTimeout(() => clearInterval(check), 5000);
        }
    }, []);

    // API 데이터 로드
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [precData, constData, lawData] = await Promise.all([
                    searchPrecedents('내란', { display: 20 }),
                    searchConstitutionalDecisions('내란', { display: 20 }),
                    searchLaws('형법', { display: 5 })
                ]);
                if (precData) setApiPrecedents(precData);
                if (constData) setApiConstitutional(constData);
                if (lawData) setApiLawData(lawData);
            } catch (error) {
                console.error('API fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // SNS 공유
    const shareUrl = 'https://xn--lg3b0kt4n41f.kr/law-database';
    const shareText = '[법령 데이터베이스] 내란 관련 법령·판례·헌재결정례 통합 분석 - 시민법정';

    const shareToKakao = () => {
        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: '내란 관련 법령 데이터베이스',
                        description: shareText,
                        imageUrl: 'https://xn--lg3b0kt4n41f.kr/og-law.png',
                        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
                    },
                    buttons: [{ title: '자세히 보기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
                });
            } catch (e) {
                fallbackShare();
            }
        } else {
            fallbackShare();
        }
    };
    const fallbackShare = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('링크가 복사되었습니다!');
    };
    const shareToFacebook = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('링크가 복사되었습니다!\n페이스북에 붙여넣기 해주세요.');
        window.open('https://www.facebook.com/', '_blank');
    };
    const shareToTwitter = () => {
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}\n\n#시민법정 #내란죄 #사법개혁`);
        alert('텍스트가 복사되었습니다!\nX에서 붙여넣기 해주세요.');
        window.open('https://x.com/', '_blank');
    };
    const shareToTelegram = () => {
        const urlWithCache = `${shareUrl}?t=${Date.now()}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(urlWithCache)}&text=${encodeURIComponent(shareText)}`, '_blank', 'width=600,height=400');
    };
    const shareToInstagram = () => {
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert('텍스트가 복사되었습니다! 인스타그램에 붙여넣기 해주세요.');
    };

    // 판례 데이터 파싱
    const getPrecedentList = () => {
        if (!apiPrecedents?.PrecSearch?.prec) return [];
        const precs = apiPrecedents.PrecSearch.prec;
        return (Array.isArray(precs) ? precs : [precs]).map(p => ({
            caseNumber: p['사건번호'] || p.사건번호 || '',
            caseName: p['사건명'] || p.사건명 || '',
            courtName: p['법원명'] || p.법원명 || '',
            verdictDate: p['선고일자'] || p.선고일자 || '',
            verdictType: p['판결유형'] || p.판결유형 || '',
            link: p['판례상세링크'] || p.판례상세링크 || ''
        }));
    };

    // 헌재 결정례 데이터 파싱
    const getConstitutionalList = () => {
        if (!apiConstitutional?.DetcSearch?.detc) return [];
        const detcs = apiConstitutional.DetcSearch.detc;
        return (Array.isArray(detcs) ? detcs : [detcs]).map(d => ({
            caseNumber: d['사건번호'] || d.사건번호 || '',
            caseName: d['사건명'] || d.사건명 || '',
            decisionDate: d['선고일'] || d['선고일자'] || d.선고일 || '',
            decisionType: d['결정유형'] || d.결정유형 || '',
            link: d['판례상세링크'] || d.결정례상세링크 || ''
        }));
    };

    const tabs = [
        { id: 'laws', label: '내란죄 법령', icon: '📜' },
        { id: 'terms', label: '법률용어 사전', icon: '📖' },
        { id: 'timeline', label: '법령 변천사', icon: '📅' },
        { id: 'constitutional', label: '헌재결정례', icon: '⚖️' },
        { id: 'precedents', label: '관련 판례', icon: '🔍' }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="pt-28 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">

                    {/* 페이지 헤더 */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            내란 관련 법령 데이터베이스
                        </h1>
                        {loading && (
                            <div className="mt-3">
                                <div className="inline-block w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-gray-500 ml-2">API 데이터 로드 중...</span>
                            </div>
                        )}
                    </div>

                    {/* 탭 네비게이션 */}
                    <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* ========== Tab 1: 내란죄 법령 ========== */}
                    {activeTab === 'laws' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                                <h2 className="font-bold text-gray-900 mb-1">형법 제2편 제1장 내란의 죄</h2>
                                <p className="text-sm text-gray-500">제87조 ~ 제91조 (내란 관련 조항) + 제93조 (일반이적)</p>
                            </div>

                            {CRIMINAL_LAW_ARTICLES.map((article, idx) => (
                                <div
                                    key={idx}
                                    className={`bg-white rounded-xl shadow-sm overflow-hidden ${article.highlight ? 'ring-2 ring-red-200' : ''}`}
                                >
                                    <button
                                        onClick={() => setExpandedArticle(expandedArticle === idx ? null : idx)}
                                        className={`w-full p-4 text-left ${article.highlight ? 'bg-red-50' : 'bg-gray-50'} border-b`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className={`text-sm font-bold ${article.highlight ? 'text-red-700' : 'text-blue-700'}`}>
                                                    {article.number}
                                                </span>
                                                <span className="ml-2 font-bold text-gray-900">{article.title}</span>
                                                {article.highlight && (
                                                    <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">핵심조항</span>
                                                )}
                                            </div>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedArticle === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>
                                    {expandedArticle === idx && (
                                        <div className="p-4 space-y-4">
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <p className="text-gray-800 whitespace-pre-line leading-relaxed text-sm">{article.text}</p>
                                            </div>
                                            {article.appliedTo.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-2">이 조항이 적용된 피고인</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {article.appliedTo.map((person, pIdx) => (
                                                            <a
                                                                key={pIdx}
                                                                href="/sentencing-analysis"
                                                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                                                            >
                                                                {person}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* API 판례 연결 */}
                            {getPrecedentList().length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                                    <div className="p-4 bg-green-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">API 연동: 내란 관련 판례</h3>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">실시간 API</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {getPrecedentList().slice(0, 5).map((prec, idx) => (
                                            <div key={idx} className="p-4">
                                                <p className="font-medium text-gray-900 text-sm">{prec.caseName || prec.caseNumber}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span>{prec.courtName}</span>
                                                    <span>{prec.verdictDate}</span>
                                                    {prec.verdictType && <span className="px-2 py-0.5 bg-gray-100 rounded">{prec.verdictType}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-gray-50 text-center">
                                        <button onClick={() => setActiveTab('precedents')} className="text-sm text-blue-600 hover:underline">
                                            전체 판례 보기 →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== Tab 2: 법률용어 사전 ========== */}
                    {activeTab === 'terms' && (
                        <div className="space-y-3">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
                                <h2 className="font-bold text-gray-900 mb-1">내란 관련 법률용어 해설</h2>
                                <p className="text-sm text-gray-500">12.3 내란 사건에서 자주 등장하는 법률용어를 쉽게 풀어드립니다</p>
                            </div>

                            {LEGAL_TERMS.map((item, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setExpandedTerm(expandedTerm === idx ? null : idx)}
                                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold text-sm">
                                                    {item.term}
                                                </span>
                                                <span className="text-xs text-gray-500">{item.relatedLaw}</span>
                                            </div>
                                            <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedTerm === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>
                                    {expandedTerm === idx && (
                                        <div className="px-4 pb-4 space-y-3">
                                            <div className="bg-purple-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-purple-700 mb-1">법률적 정의</p>
                                                <p className="text-sm text-gray-800">{item.definition}</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-blue-700 mb-1">12.3 사건 관련성</p>
                                                <p className="text-sm text-gray-800">{item.caseRelevance}</p>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                근거 법령: {item.relatedLaw}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ========== Tab 3: 법령 변천사 타임라인 ========== */}
                    {activeTab === 'timeline' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-500">
                                <h2 className="font-bold text-gray-900 mb-1">내란죄 법령 변천사</h2>
                                <p className="text-sm text-gray-500">1953년 형법 제정부터 현재까지 내란죄의 역사</p>
                            </div>

                            <div className="relative">
                                {/* 타임라인 세로선 */}
                                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                                {LAW_HISTORY_TIMELINE.map((event, idx) => {
                                    const colors = {
                                        creation: { bg: 'bg-blue-500', ring: 'ring-blue-200', badge: 'bg-blue-100 text-blue-700' },
                                        amendment: { bg: 'bg-green-500', ring: 'ring-green-200', badge: 'bg-green-100 text-green-700' },
                                        event: { bg: 'bg-amber-500', ring: 'ring-amber-200', badge: 'bg-amber-100 text-amber-700' },
                                        verdict: { bg: 'bg-red-500', ring: 'ring-red-200', badge: 'bg-red-100 text-red-700' },
                                        constitutional: { bg: 'bg-purple-500', ring: 'ring-purple-200', badge: 'bg-purple-100 text-purple-700' }
                                    };
                                    const color = colors[event.type] || colors.event;
                                    const typeLabels = {
                                        creation: '제정', amendment: '개정', event: '사건',
                                        verdict: '판결', constitutional: '헌재'
                                    };

                                    return (
                                        <div key={idx} className="relative pl-14 pb-6">
                                            {/* 타임라인 점 */}
                                            <div className={`absolute left-4 w-5 h-5 rounded-full ${color.bg} ring-4 ${color.ring}`}></div>

                                            <div className="bg-white rounded-xl shadow-sm p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-bold text-gray-900">{event.year}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color.badge}`}>
                                                        {typeLabels[event.type]}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 mb-1">{event.title}</h3>
                                                <p className="text-sm text-gray-600">{event.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========== Tab 4: 헌재결정례 ========== */}
                    {activeTab === 'constitutional' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-indigo-500">
                                <h2 className="font-bold text-gray-900 mb-1">주요 헌법재판소 결정례</h2>
                                <p className="text-sm text-gray-500">내란·탄핵 관련 헌법재판소 주요 결정</p>
                            </div>

                            {CONSTITUTIONAL_DECISIONS.map((decision, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <button
                                        onClick={() => setExpandedDecision(expandedDecision === idx ? null : idx)}
                                        className="w-full p-4 text-left bg-indigo-50 border-b"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-indigo-700">{decision.caseNumber}</span>
                                                    <span className="text-xs text-gray-500">{decision.date}</span>
                                                </div>
                                                <p className="font-bold text-gray-900">{decision.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    decision.result.includes('인용') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {decision.result}
                                                </span>
                                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedDecision === idx ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>
                                    {expandedDecision === idx && (
                                        <div className="p-4 space-y-3">
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-gray-700 mb-1">결정 요지</p>
                                                <p className="text-sm text-gray-800">{decision.summary}</p>
                                            </div>
                                            <div className="bg-indigo-50 rounded-lg p-3">
                                                <p className="text-sm font-medium text-indigo-700 mb-1">법적 의의</p>
                                                <p className="text-sm text-gray-800">{decision.significance}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* API 연동 헌재결정례 */}
                            {getConstitutionalList().length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
                                    <div className="p-4 bg-green-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">API 연동: 내란 관련 헌재결정례</h3>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">실시간 API</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {getConstitutionalList().map((detc, idx) => (
                                            <div key={idx} className="p-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-indigo-700">{detc.caseNumber}</span>
                                                    <span className="text-xs text-gray-500">{detc.decisionDate}</span>
                                                </div>
                                                <p className="text-sm text-gray-900">{detc.caseName}</p>
                                                {detc.decisionType && (
                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded mt-1 inline-block">{detc.decisionType}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========== Tab 5: 관련 판례 ========== */}
                    {activeTab === 'precedents' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                                <h2 className="font-bold text-gray-900 mb-1">내란 관련 판례</h2>
                                <p className="text-sm text-gray-500">국가법령정보 OPEN API를 통해 수집된 내란 관련 법원 판례</p>
                            </div>

                            {getPrecedentList().length > 0 ? (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="p-4 bg-green-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-900">
                                                검색 결과 ({getPrecedentList().length}건)
                                            </h3>
                                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">API 실시간</span>
                                        </div>
                                    </div>
                                    <div className="divide-y">
                                        {getPrecedentList().map((prec, idx) => (
                                            <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-bold text-green-700">{prec.caseNumber}</span>
                                                    <span className="text-xs text-gray-500">{prec.verdictDate}</span>
                                                </div>
                                                <p className="font-medium text-gray-900 text-sm">{prec.caseName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-500">{prec.courtName}</span>
                                                    {prec.verdictType && (
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{prec.verdictType}</span>
                                                    )}
                                                </div>
                                                {prec.link && (
                                                    <a
                                                        href={prec.link.startsWith('http') ? prec.link : `https://www.law.go.kr${prec.link}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                                    >
                                                        판례 상세 보기 →
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                                    {loading ? (
                                        <>
                                            <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="text-gray-500">판례를 검색하고 있습니다...</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-500 mb-2">API 데이터를 불러오지 못했습니다.</p>
                                            <p className="text-sm text-gray-400 mb-1">아래 단계를 확인해주세요:</p>
                                            <ol className="text-sm text-gray-400 text-left max-w-md mx-auto mb-4 space-y-1">
                                                <li>1. <a href="https://open.law.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">open.law.go.kr</a> 로그인</li>
                                                <li>2. [OPEN API] → [OPEN API 신청] 클릭</li>
                                                <li>3. 등록된 API 선택 → <b>법령종류 체크</b> (법령, 판례, 헌재결정례)</li>
                                            </ol>
                                            <a
                                                href="https://www.law.go.kr/precInfoP.do?mode=0&query=%EB%82%B4%EB%9E%80"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                            >
                                                국가법령정보센터에서 직접 검색 →
                                            </a>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* 주요 역사적 판례 안내 */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="p-4 bg-amber-50 border-b">
                                    <h3 className="font-bold text-gray-900">주요 내란 판례 (역사적)</h3>
                                </div>
                                <div className="divide-y">
                                    <a href="https://law.go.kr/precInfoP.do?precSeq=188579" target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-amber-700">1997</span>
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">유죄</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">전두환·노태우 12.12/5.18 내란 사건</p>
                                        <p className="text-xs text-gray-600 mt-1">대법원 96도3376 - 전두환 무기징역, 노태우 징역 17년. 대한민국 최초 내란죄 유죄 확정.</p>
                                    </a>
                                    <a href="https://www.law.go.kr/precInfoP.do?mode=0&precSeq=209161" target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-amber-700">2015</span>
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">유죄</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">이석기 내란음모 사건</p>
                                        <p className="text-xs text-gray-600 mt-1">대법원 2014도10978 - 징역 9년, 자격정지 7년. 내란음모죄 적용.</p>
                                    </a>
                                    <a href="/sentencing-analysis" className="block p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-bold text-amber-700">2026</span>
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">유죄</span>
                                        </div>
                                        <p className="font-medium text-gray-900 text-sm">한덕수 내란중요임무종사 사건</p>
                                        <p className="text-xs text-gray-600 mt-1">서울중앙지법 - 징역 23년 (구형 15년 초과). 12.3 비상계엄을 "국헌문란 목적의 내란"으로 인정한 최초 판결.</p>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SNS 공유 */}
                    <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6">
                        <p className="text-white text-center mb-4 font-medium">이 페이지를 공유해주세요</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={shareToKakao} className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform" title="카카오톡">
                                <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                            </button>
                            <button onClick={shareToFacebook} className="w-12 h-12 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform" title="페이스북">
                                <FacebookIcon className="w-6 h-6 text-white" />
                            </button>
                            <button onClick={shareToTwitter} className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform" title="X">
                                <XIcon className="w-5 h-5 text-white" />
                            </button>
                            <button onClick={shareToInstagram} className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform" title="인스타그램">
                                <InstagramIcon className="w-6 h-6 text-white" />
                            </button>
                            <button onClick={shareToTelegram} className="w-12 h-12 flex items-center justify-center bg-[#0088cc] rounded-full hover:scale-110 transition-transform" title="텔레그램">
                                <TelegramIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* 출처 안내 */}
                    <div className="mt-8 p-4 bg-gray-100 rounded-xl text-center">
                        <p className="text-gray-600 text-sm">
                            법령 데이터: <a href="https://open.law.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">국가법령정보 공동활용</a> OPEN API<br />
                            정확한 법률 자문은 전문 변호사에게 문의하세요.
                        </p>
                        <div className="mt-4 flex justify-center gap-4">
                            <a href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                국가법령정보센터 →
                            </a>
                            <a href="/sentencing-analysis" className="text-blue-600 text-sm hover:underline">
                                재판분석 페이지 →
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>&copy; 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
