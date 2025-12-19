import { useState, useEffect } from 'react';
import Poster from './Poster'
import CozeFloatingChat from "./CozeFloatingChat";
import { Link } from 'react-router-dom'

// 카카오톡 아이콘
const KakaoIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
    </svg>
);

// 페이스북 아이콘
const FacebookIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

// X (트위터) 아이콘
const XIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

// 인스타그램 아이콘
const InstagramIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
);

// 텔레그램 아이콘
const TelegramIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

export default function App() {
    const [activeSection, setActiveSection] = useState('home');
    const [selectedCountry, setSelectedCountry] = useState('독일');
    
    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
        talent: '',
        phone: '',
        sns: []
    });
    
    // 초기 테스트 데이터
    const initialSignatures = [
        {
            id: 1,
            name: '김민수',
            type: 'individual',
            phone: '010-1234-5678',
            sns: ['telegram'],
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
            id: 2,
            name: '민주시민연대',
            type: 'organization',
            phone: '02-1234-5678',
            sns: ['kakao', 'telegram'],
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
            id: 3,
            name: '박지영',
            type: 'individual',
            phone: '010-9876-5432',
            sns: ['kakao'],
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        }
    ];
    
    const [signatures, setSignatures] = useState(initialSignatures);
    const [stats, setStats] = useState({ individual: 0, organization: 0, total: 0, telegram: 0, kakao: 0 });
    const [showNotification, setShowNotification] = useState(false);
    const [latestSignature, setLatestSignature] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showPosterModal, setShowPosterModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2025'; // 환경변수 사용

    // 페이지 첫 로드 시 자동으로 포스터 모달 열기
    useEffect(() => {
        // URL 파라미터로 관리자 접근 확인 (먼저)
        const params = new URLSearchParams(window.location.search);
        const adminParam = params.get('key');
        
        console.log('Admin key:', adminParam); // 디버깅용
        
        if (adminParam === 'admin999') {
            console.log('Opening admin login modal'); // 디버깅용
            setShowAdminLogin(true);
        } else {
            // 관리자가 아닐 때만 포스터 팝업
            setShowPosterModal(true);
        }
    }, []);

    // 초기 데이터 로드 및 통계 업데이트
    useEffect(() => {
        updateStats(signatures);
    }, [signatures]);

    // 통계 업데이트
    const updateStats = (sigs) => {
        const individual = sigs.filter(s => s.type === 'individual').length;
        const organization = sigs.filter(s => s.type === 'organization').length;
        const telegram = sigs.filter(s => s.sns && s.sns.includes('telegram')).length;
        const kakao = sigs.filter(s => s.sns && s.sns.includes('kakao')).length;
        setStats({
            individual,
            organization,
            total: individual + organization,
            telegram,
            kakao
        });
    };

    // 관리자 로그인
    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (adminPassword === ADMIN_PASSWORD) {
            setIsAdmin(true);
            setShowAdminLogin(false);
            setAdminPassword('');
            alert('관리자 모드로 로그인되었습니다.');
        } else {
            alert('비밀번호가 올바르지 않습니다.');
            setAdminPassword('');
        }
    };

    // 관리자 로그아웃
    const handleAdminLogout = () => {
        setIsAdmin(false);
        alert('로그아웃되었습니다.');
    };

    // 엑셀 다운로드 함수 (관리자 전용)
    const downloadExcel = async () => {
        // SheetJS 동적 로드
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
        
        // 데이터 준비
        const excelData = signatures.map((sig, index) => ({
            '번호': signatures.length - index,
            '이름/단체명': sig.name,
            '구분': sig.type === 'individual' ? '개인' : '단체',
            '재능나눔': sig.talent || '-',
            '전화번호': sig.phone || '-',
            '텔레그램': sig.sns.includes('telegram') ? 'O' : 'X',
            '카카오톡': sig.sns.includes('kakao') ? 'O' : 'X',
            '서명일시': new Date(sig.timestamp).toLocaleString('ko-KR')
        }));

        // 통계 시트 데이터
        const statsData = [
            { '구분': '총 지지자', '수': stats.total },
            { '구분': '개인 지지', '수': stats.individual },
            { '구분': '단체 지지', '수': stats.organization },
            { '구분': '텔레그램 가입', '수': stats.telegram },
            { '구분': '카카오톡 가입', '수': stats.kakao }
        ];

        // 워크북 생성
        const wb = XLSX.utils.book_new();
        
        // 서명 데이터 시트
        const ws1 = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws1, '지지서명목록');
        
        // 통계 시트
        const ws2 = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, ws2, '통계');

        // 파일 다운로드
        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `혼합형참심제_지지서명_${timestamp}.xlsx`);
    };

    // SNS 토글
    const toggleSNS = (platform) => {
        setFormData(prev => ({
            ...prev,
            sns: prev.sns.includes(platform)
                ? prev.sns.filter(s => s !== platform)
                : [...prev.sns, platform]
        }));
    };

    // 서명 제출
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.phone) {
            alert('이름과 전화번호를 입력해주세요.');
            return;
        }

        const newSignature = {
            ...formData,
            timestamp: new Date().toISOString(),
            id: Date.now()
        };

        const updatedSignatures = [newSignature, ...signatures];
        setSignatures(updatedSignatures);

        // 알림 표시
        setLatestSignature(newSignature);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);

        // SNS 자동 가입 처리
        if (formData.sns.length > 0) {
            formData.sns.forEach(platform => {
                if (platform === 'telegram') {
                    window.open('https://t.me/judicialreform', '_blank');
                } else if (platform === 'kakao') {
                    window.open('https://open.kakao.com/o/judicialreform', '_blank');
                }
            });
        }

        // 폼 초기화
        setFormData({
            name: '',
            type: 'individual',
            talent: '',
            phone: '',
            sns: []
        });
        
        alert('✅ 지지 서명이 등록되었습니다!');
    };

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    // SNS 공유 함수들
    const shareToKakao = () => {
        const url = 'https://시민법정.kr';
        const text = '주권자에 의한 시민법관 참심제! 함께해주세요.';
        window.open('https://story.kakao.com/share?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), '_blank', 'width=600,height=400');
    };

    const shareToFacebook = () => {
        const url = 'https://시민법정.kr';
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'width=600,height=400');
    };

    const shareToTwitter = () => {
        const url = 'https://시민법정.kr';
        const text = '주권자에 의한 시민법관 참심제! 함께해주세요.';
        window.open('https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text), '_blank', 'width=600,height=400');
    };

    const shareToInstagram = () => {
        navigator.clipboard.writeText('주권자에 의한 시민법관 참심제! https://시민법정.kr');
        alert('텍스트가 복사되었습니다! 인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    return (
    <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <div className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => scrollToSection('necessity')}>
                            ⚖️ 사법개혁
                        </div>
                        
                        {/* 데스크톱 메뉴 */}
                        <div className="hidden lg:flex space-x-6 text-sm items-center">
                            <button onClick={() => scrollToSection('necessity')} className="hover:text-blue-600 transition font-medium">도입 필요성</button>
                            <button onClick={() => scrollToSection('cases')} className="hover:text-blue-600 transition font-medium">해외 사례</button>
                            <button onClick={() => scrollToSection('constitution')} className="hover:text-blue-600 transition font-medium">헌법적 근거</button>
                            <button onClick={() => scrollToSection('bill')} className="hover:text-blue-600 transition font-medium">법안 제안</button>
                            <Link to="/media" className="hover:text-blue-600 transition font-medium">미디어</Link>

                            <button
                                onClick={() => setShowPosterModal(true)}
                                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-bold"
                            >
                                🎵 포스터 보기
                            </button>
                            <button
                                onClick={() => scrollToSection('signature')}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-bold"
                            >
                                참여하기
                            </button>
                        </div>
                        
                        {/* 모바일 햄버거 버튼 */}
                        <button 
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-gray-600 hover:text-blue-600 transition p-2"
                            aria-label="메뉴"
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
                    
                    {/* 모바일 메뉴 드롭다운 */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden bg-white border-t border-gray-200 py-4 space-y-2">
                            <button 
                                onClick={() => { scrollToSection('necessity'); setMobileMenuOpen(false); }} 
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                도입 필요성
                            </button>
                            <button 
                                onClick={() => { scrollToSection('cases'); setMobileMenuOpen(false); }} 
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                해외 사례
                            </button>
                            <button 
                                onClick={() => { scrollToSection('constitution'); setMobileMenuOpen(false); }} 
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                헌법적 근거
                            </button>
                            <button
                                onClick={() => { scrollToSection('bill'); setMobileMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                법안 제안
                            </button>
                            <Link
                                to="/media"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                미디어
                            </Link>

                            <button
                                onClick={() => { setShowPosterModal(true); setMobileMenuOpen(false); }}
                                className="block w-full text-left px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition font-bold"
                            >
                                🎵 포스터 보기
                            </button>
                            <button 
                                onClick={() => { scrollToSection('signature'); setMobileMenuOpen(false); }} 
                                className="block w-full text-left px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition font-bold"
                            >
                                참여하기
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* 관리자 로그인 모달 */}
            {showAdminLogin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                        <h3 className="text-2xl font-bold mb-4">관리자 로그인</h3>
                        <form onSubmit={handleAdminLogin}>
                            <input
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    로그인
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdminLogin(false);
                                        setAdminPassword('');
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition"
                                >
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 알림 */}
            {showNotification && latestSignature && (
                <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-pulse">
                    <div className="font-bold">🎉 새로운 지지 서명!</div>
                    <div className="text-sm">{latestSignature.name}님 ({latestSignature.type === 'individual' ? '개인' : '단체'})</div>
                </div>
            )}

            {/* 메인 히어로 */}
            <section id="necessity" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-32 pb-20 px-4 mt-16">
                <div className="container mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        헌법 개정 없이 가능한
                    </h1>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-orange-400">시민참여 사법개혁, 혼합형 참심제!</span>
                    </h1>
                    <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
                        '모든 권력은 국민으로부터 나온다'는 헌법 제1조 2항의 정신을 사법에서 실현합니다.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button 
                            onClick={() => scrollToSection('signature')}
                            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105"
                        >
                            준비위원으로 참여하기
                        </button>
                        <button 
                            onClick={() => window.location.href = '/proposal.html'}
                            className="bg-orange-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-600 transition transform hover:scale-105"
                        >
                            제안서 및 법률안
                        </button>
                    </div>
                </div>
            </section>

            {/* 국민 동의 */}
            <section className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">국민의 77.8%가 동의한 사법개혁</h2>
                    
                    <p className="text-center text-gray-700 text-lg mb-12 max-w-4xl mx-auto leading-relaxed">
                        2005년 사법제도개혁추진위원회(사개추위)의 여론조사 결과, 국민 대다수가 사법 절차에 시민의 참여가 필요하다고 응답했습니다. 이는 사법부에 대한 국민적 신뢰가 낮으며, 재판 과정에 국민의 상식이 반영되기를 강력히 원한다는 것을 보여줍니다.
                    </p>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-12 max-w-5xl mx-auto">
                        {/* 도넛 차트 */}
                        <div className="relative w-64 h-64">
                            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20"
                                    strokeDasharray="195.6 251.2" strokeLinecap="round"/>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-sm text-gray-500">시민참여 필요</div>
                                <div className="text-4xl font-bold text-blue-600">77.8%</div>
                            </div>
                        </div>

                        <div className="max-w-md space-y-4">
                            <div className="bg-blue-50 p-6 rounded-lg">
                                <h3 className="font-bold text-lg mb-2">국민참여배심제의 한계</h3>
                                <p className="text-gray-700 text-sm">
                                    2007년 도입된 '국민참여재판'은 배심원의 평결이 법관을 기속하지 않아 유명무실합니다.
                                </p>
                            </div>

                            <div className="bg-green-50 p-6 rounded-lg">
                                <h3 className="font-bold text-lg mb-2">이제는 '혼합형 참심제'</h3>
                                <p className="text-gray-700 text-sm">
                                    직업 법관과 시민 참심원이 '함께' 평의하고 '동등하게' 판결하는 진정한 시민 참여를 실현합니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 제안 모델 */}
            <section id="model" className="py-20 px-4 bg-gray-50">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">제안 모델: 혼합형 참심 재판부</h2>
                    <p className="text-center text-gray-600 mb-12">
                        독일, 프랑스 등 유럽을 참고하여 3:6 구성을 제안합니다.
                    </p>

                    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
                        <h3 className="text-2xl font-bold text-center mb-8">재판부 구성(예시: 법률안 제5조)</h3>
                        
                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                            {/* 직업법관 */}
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-700 mb-4">직업법관</div>
                                <div className="flex gap-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-20 h-20 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-sm">
                                            법관
                                        </div>
                                    ))}
                                </div>
                                <div className="text-2xl font-bold mt-4">3인</div>
                            </div>

                            <div className="text-3xl text-gray-400">+</div>

                            {/* 시민 참심원 */}
                            <div className="text-center">
                                <div className="text-xl font-bold text-gray-700 mb-4">시민법관</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                                            시민
                                        </div>
                                    ))}
                                </div>
                                <div className="text-2xl font-bold mt-4">6인</div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h4 className="font-bold mb-3">핵심 원칙</h4>
                            <ul className="space-y-2 text-gray-700 text-sm">
                                <li>• <strong>동등한 권한:</strong> 직업법관과 참심법관 전원이 동등한 1표씩 행사.</li>
                                <li>• <strong>함께 심리:</strong> 사실인정(유/무죄)과 양형(형량) 모두를 함께 평의.</li>
                                <li>• <strong>기속력 있는 평결:</strong> 유죄 판결 시, 과반수 외 '직업법관 1명 이상+참심법관 1명 이상'의 찬성을 동시 요구. (특별다수결)</li>
                                <li>• <strong>무작위 선발:</strong> 대표성 담보</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 해외 사례 */}
            <section id="cases" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">시민참여 사법제도 해외 사례</h2>
                    <p className="text-center text-gray-600 mb-12">
                        독일, 스웨덴, 핀란드, 노르웨이, 프랑스 등 다수의 대륙법계 국가가 혼합형 참심제도를 안정적으로 운영하고 있습니다.
                    </p>

                    {/* 국가 탭 */}
                    <div className="max-w-5xl mx-auto mb-8">
                        <div className="flex flex-wrap gap-2 justify-center border-b border-gray-300">
                            {['독일', '스웨덴', '핀란드', '노르웨이', '프랑스', '덴마크', '일본', 'EU'].map(country => (
                                <button
                                    key={country}
                                    onClick={() => setSelectedCountry(country)}
                                    className={`px-6 py-3 font-medium transition ${
                                        selectedCountry === country
                                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {country}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 국가별 상세 정보 */}
                    <div className="max-w-5xl mx-auto">
                        {selectedCountry === '독일' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">독일: 참심제(Schöffengericht)</h3>
                                <p className="text-gray-700 mb-6">
                                    독일은 1924년 배심제를 폐지하고 참심제로 전환하여 가장 성공적으로 운영 중인 국가입니다. 직업법관과 참심법관이 모든 권한을 동등하게 행사합니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">지방법원(Landgericht) 1심 기준 직업법관 3인 + 참심법관 2인. (사안에 따라 직업법관 1인 + 참심법관 2인 구성도 있음)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">지방의회 추천 목록을 기반으로 법원의 선발위원회에서 선출 (임기 5년).</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">유/무죄 및 양형 결정에 대해 직업법관과 참심법관이 동등한 1표를 행사.</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">재판부 구성원 3분의 2 이상의 다수결로 결정. 직업법관만으로는 유죄 판결이 불가능한 구조.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '스웨덴' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">스웨덴: 참심제(Nämnddemän)</h3>
                                <p className="text-gray-700 mb-6">
                                    스웨덴은 오랜 참심제 전통을 가진 국가입니다. 다만 정당 추천 방식의 한계가 지적되고 있습니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">1심: 직업법관 1인 + 참심원 3인, 항소심: 직업법관 3인 + 참심원 2인</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">정당 추천 방식 (편향성 논란 존재)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">1심: 단순 다수결, 참심원 우위 가능</div>
                                    </div>
                                    
                                </div>
                            </div>
                        )}

                        {selectedCountry === '핀란드' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">핀란드: 참심제(Lautamiehet)</h3>
                                <p className="text-gray-700 mb-6">
                                    핀란드는 지방 의회 선출 방식의 참심제를 운영하고 있습니다. 시민 참심원의 영향력이 상대적으로 강한 편입니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">직업법관 1인 + 참심원 2인 (중대 형사 1심)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">지방 의회 선출</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">단순 다수결 (참심원이 다수를 이루어 시민 우위 가능)</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '노르웨이' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">노르웨이: 병용제 (배심제 + 참심제)</h3>
                                <p className="text-gray-700 mb-6">
                                    노르웨이는 사건의 중대성에 따라 배심제와 참심제를 선택적으로 적용하는 유연한 시스템을 운영합니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">참심(1심): 1인 + 2인, 참심(항소심): 3인 + 4인, 배심(항소심): 3인 + 10인</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">위원회 선정 (정당 영향 존재)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">참심: 전 과정 참여, 배심: 사실인정만</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">사건 유형에 따라 다수결 또는 특별다수결</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '프랑스' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">프랑스: 중죄법원 (Cour d'Assises)</h3>
                                <p className="text-gray-700 mb-6">
                                    프랑스는 중대 형사사건에 대해 직업법관 3인과 시민 배심원 9인이 함께 재판하는 강력한 혼합형 시스템을 운영합니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">직업법관 3인 + 시민 배심원 9인 (총 12인)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">무작위 추첨 + 심사 (기피 제도 활용)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정 (배심원이 실질적 참심원 역할)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">특별다수결 (유죄 판결에 높은 합의 요구)</div>
                                    </div>
                                    
                                </div>
                            </div>
                        )}

                        {selectedCountry === '덴마크' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">덴마크: 병용제 (배심제 + 참심제)</h3>
                                <p className="text-gray-700 mb-6">
                                    덴마크는 사건의 중대성과 피고인의 선택에 따라 배심제와 참심제를 병용하는 시스템입니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">배심: 3인 + 12인, 참심(1심): 1인 + 2인, 참심(항소심): 3인 + 3인</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">정당 추천 기반</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">배심: 사실인정만, 참심: 전 과정 참여</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">배심: 특별다수결(8+), 참심: 다수결</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedCountry === '일본' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">일본: 재판원제도 (Saiban-in)</h3>
                                <p className="text-gray-700 mb-6">
                                    일본은 2009년 도입한 현대적 혼합형 참심제로, 한국 모델의 주요 참고 사례입니다.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">구성:</div>
                                        <div className="text-gray-700">직업법관 3인 + 재판원 6인 (표준 모델)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">선발:</div>
                                        <div className="text-gray-700">무작위 추첨 + 심사 (기피 제도)</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">권한:</div>
                                        <div className="text-gray-700">사실인정 + 법률 적용 + 양형 결정</div>
                                    </div>
                                    <div className="flex">
                                        <div className="font-bold text-gray-800 w-24 flex-shrink-0">평결:</div>
                                        <div className="text-gray-700">다수결 (단, 각 그룹에서 최소 1인 이상 찬성 필요)</div>
                                    </div>
                                    
                                </div>
                            </div>
                        )}

                        {selectedCountry === 'EU' && (
                            <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                                <h3 className="text-2xl font-bold mb-4 text-blue-600">EU: 유럽연합의 시민 참여 사법제도</h3>
                                <p className="text-gray-700 mb-6">
                                    유럽연합 회원국 대다수가 다양한 형태의 시민 참여 사법제도를 운영하고 있으며, 이는 유럽 사법 전통의 핵심입니다.
                                </p>
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-6 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3 text-blue-700">📊 현황</h4>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• EU 27개 회원국 중 다수가 참심제 또는 배심제 운영</li>
                                            <li>• 독일, 프랑스, 스웨덴, 핀란드, 덴마크, 노르웨이 등 전통적 참심제 국가</li>
                                            <li>• 오스트리아, 벨기에, 이탈리아, 스페인 등도 유사 제도 보유</li>
                                        </ul>
                                    </div>

                                    <div className="bg-green-50 p-6 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3 text-green-700">🎯 공통 특징</h4>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• <strong>민주적 정당성:</strong> 시민 참여를 통한 사법의 민주화</li>
                                            <li>• <strong>혼합 재판부:</strong> 직업법관과 시민이 함께 판단</li>
                                            <li>• <strong>형사사건 중심:</strong> 주로 중대 형사사건에 적용</li>
                                            <li>• <strong>동등한 권한:</strong> 사실인정, 법률적용, 양형에 모두 참여</li>
                                        </ul>
                                    </div>

                                    <div className="bg-purple-50 p-6 rounded-lg">
                                        <h4 className="font-bold text-lg mb-3 text-purple-700">✅ 성공 요인</h4>
                                        <ul className="space-y-2 text-gray-700">
                                            <li>• 오랜 역사와 전통 (일부 국가는 100년 이상)</li>
                                            <li>• 체계적인 교육 및 지원 시스템</li>
                                            <li>• 명확한 법적 근거와 절차</li>
                                            <li>• 높은 국민적 신뢰와 참여율</li>
                                        </ul>
                                    </div>
                                   
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 헌법적 근거 */}
            <section id="constitution" className="py-20 px-4 bg-gray-50">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">도입의 핵심 근거</h2>
                    
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 text-blue-600">사법 신뢰 회복 및 투명성</h3>
                            <p className="text-gray-700">
                                사법이 직업 법관 과료만 운영되는 폐쇄적 구조에서 시민이 참여하는 개방적 구조로 전환하여 
                                사법에 대한 국민의 신뢰를 높이고 투명성을 강화합니다.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold mb-4 text-blue-600">국민의 건전한 상식 반영</h3>
                            <p className="text-gray-700">
                                직업 법관의 전문성과 시민의 상식이 결합하여 더 균형잡힌 판결을 내릴 수 있습니다.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-lg shadow-lg md:col-span-2">
                            <h3 className="text-xl font-bold mb-4 text-blue-600">헌법적 근거: "헌법 개정 없이 가능"</h3>
                            <p className="text-gray-700 mb-4">
                                혼합형 참심제 도입의 가장 큰 우려는 헌법 제27조 1항("모든 국민은... 법관에 의하여 법률에 의한 재판을 받을 권리를 가진다")과의 충돌입니다.
                            </p>
                            <p className="text-gray-700 mb-4">
                                그러나 헌법 제101조 3항은 "법관의 자격은 법률로 정한다"고 명시하고 있습니다. 이는 '법관'의 범위를 정하는 권한이 입법부인 국회에 있음을 의미합니다.
                            </p>
                            <p className="text-gray-700 font-semibold">
                                따라서 국회가 '법원조직법' 또는 '신규 특별법'을 개정·제정하여 '참심법관'의 자격, 선임 절차, 권한과 의무를 명확히 규정한다면, 시민 참심법관 역시 헌법이 정한 '법관'의 범주에 포함시킬 수 있습니다. <strong>이는 헌법 개정 없이 법률 개정만으로도 도입이 가능함을 의미합니다.</strong>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 법안 제안 */}
            <section id="bill" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">혼합형 참심제도 제안 법률안(요지)</h2>
                    <p className="text-center text-gray-600 mb-6">
                        새로 제안된 '제안 법률안'은 혼합형 참심제 도입을 위한 구체적인 내용을 담고 있습니다.
                    </p>
                    
                    <div className="text-center mb-8">
                        <button 
                            onClick={() => window.location.href = '/proposal.html'}
                            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition transform hover:scale-105 shadow-lg"
                        >
                            제안서 및 법률안 원문(PDF)
                        </button>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-50 p-8 rounded-lg">
                            <h3 className="text-xl font-bold mb-6 text-blue-600">혼합형 참심제 운용에 관한 법률안 (가칭)</h3>
                            
                            <div className="space-y-4">
                                {[
                                    { num: 1, title: '목적 (제1조)', desc: '국민이 참심법관으로 참여, 직업법관과 함께 재판권을 행사. 사법의 민주적 정당성, 투명성, 신뢰 증진을 목적으로 함.' },
                                    { num: 2, title: '적용 범위 (제3조)', desc: '1심 중대 형사사건 (예: 법정합의부 사건, 사형, 무기 또는 단기 1년 이상 징역 사건). 피고인 자백 여부와 무관.' },
                                    { num: 3, title: '재판부 구성 (제5조)', desc: '직업법관 3인 + 참심법관 6인 (필요시 9인까지 증가 가능). 참심원이 다수를 구성.' },
                                    { num: 4, title: '참심법관 권한 (제6조)', desc: '직업법관과 동등한 권한 (질문권, 평의, 표결권). 사실인정, 법령 적용, 유/무죄 및 양형에 모두 참여.' },
                                    { num: 5, title: '선발 (제8조~제12조)', desc: '무작위 추출 + 심사 + 기피 절차. 만 25세 이상 국민 명부에서 선정. 스웨덴식 정당 추천 배제.' },
                                    { num: 6, title: '임기 (제14조)', desc: '사건별 선임. (독일/스웨덴식 장기 임기 아님). 국민 참여 기회를 극대화하고 부담 감소.' },
                                    { num: 7, title: '평결 (제25조)', desc: '특별다수결. 과반수 찬성 + 유죄 판결 시 \'직업법관 1명 이상\' 및 \'참심법관 1명 이상\' 찬성 모두 요구.' },
                                    { num: 8, title: '절차 (제23조)', desc: '집중심리 및 연일 개정 권장. 재판장의 이해돕기 설명. 재판절차 이해 가능하게 국민 참여 보장.' }
                                ].map((item) => (
                                    <div key={item.num} className="flex gap-4 items-start">
                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                            {item.num}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold mb-1">{item.title}</h4>
                                            <p className="text-gray-700 text-sm">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 지지 서명 */}
            <section id="signature" className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="container mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">주권자에 의한 시민법정!</h2>
                    <p className="text-center mb-12 text-lg">
                        혼합형 참심제도 도입을 위한 준비위원으로 참여해주세요. 여러분의 목소리가 주권자 세상을 만듭니다.
                    </p>

                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-8 text-gray-800">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 이름 */}
                            <div>
                                <label className="block font-bold mb-2">이름 또는 단체명 *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="예: 홍길동, OOOO시민단체"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* 구분 */}
                            <div>
                                <label className="block font-bold mb-2">구분 *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="individual">개인</option>
                                    <option value="organization">단체</option>
                                </select>
                            </div>

                            {/* 재능 응원봉 */}
                            <div>
                                <label className="block font-bold mb-2">재능 응원봉</label>
                                <select
                                    value={['IT', '미디어', '마케팅', '재정', ''].includes(formData.talent) ? formData.talent : '기타'}
                                    onChange={(e) => setFormData({...formData, talent: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">선택 안함</option>
                                    <option value="IT">IT</option>
                                    <option value="미디어">미디어</option>
                                    <option value="마케팅">마케팅</option>
                                    <option value="재정">재정</option>
                                    <option value="기타">기타 (직접 입력)</option>
                                </select>
                                {/* 기타 선택 시 직접 입력 */}
                                {(formData.talent === '기타' || (formData.talent && !['IT', '미디어', '마케팅', '재정', ''].includes(formData.talent))) && (
                                    <input
                                        type="text"
                                        value={formData.talent === '기타' ? '' : formData.talent}
                                        onChange={(e) => setFormData({...formData, talent: e.target.value || '기타'})}
                                        placeholder="재능 분야를 직접 입력해주세요"
                                        className="w-full mt-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                )}
                            </div>

                            {/* 전화번호 */}
                            <div>
                                <label className="block font-bold mb-2">전화번호 *</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="예: 010-1234-5678"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            {/* 제출 버튼 */}
                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition transform hover:scale-105"
                            >
                                참여하기
                            </button>
                        </form>

                        {/* 카카오톡 오픈채팅 */}
                        
                    </div>
                </div>
            </section>

            {/* 실시간 현황 */}
            <section id="stats" className="py-20 px-4 bg-white">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold">실시간 참가 현황</h2>
                        {isAdmin && (
                            <button
                                onClick={downloadExcel}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
                            >
                                📊 엑셀 다운로드
                            </button>
                        )}
                    </div>
                    
                    {/* 통계 */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-8 rounded-xl shadow-lg">
                            <div className="text-5xl font-bold mb-2 text-center">{stats.individual}</div>
                            <div className="text-xl text-center mb-4">개인</div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4 max-h-32 overflow-y-auto">
                                <div className="text-sm text-center">
                                    {signatures
                                        .filter(s => s.type === 'individual')
                                        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                                        .map(sig => sig.name)
                                        .join(', ')}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-8 rounded-xl shadow-lg">
                            <div className="text-5xl font-bold mb-2 text-center">{stats.organization}</div>
                            <div className="text-xl text-center mb-4">단체</div>
                            <div className="bg-white bg-opacity-20 rounded-lg p-4 max-h-32 overflow-y-auto">
                                <div className="text-sm text-center">
                                    {signatures
                                        .filter(s => s.type === 'organization')
                                        .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                                        .map(sig => sig.name)
                                        .join(', ')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* === 플로팅 챗봇 === */}
            <CozeFloatingChat />

            {/* SNS 공유 섹션 */}
            <section className="py-12 px-4 bg-gradient-to-r from-slate-800 to-slate-900">
                <div className="container mx-auto text-center">
                    <h3 className="text-xl font-bold text-white mb-6">함께 알려주세요</h3>

                    <div className="flex justify-center gap-6">
                        {/* 카카오톡 */}
                        <button
                            onClick={shareToKakao}
                            className="group w-14 h-14 flex items-center justify-center bg-[#FEE500] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                            title="카카오톡"
                        >
                            <KakaoIcon className="w-7 h-7 text-[#391B1B]" />
                        </button>

                        {/* 페이스북 */}
                        <button
                            onClick={shareToFacebook}
                            className="group w-14 h-14 flex items-center justify-center bg-[#1877F2] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                            title="페이스북"
                        >
                            <FacebookIcon className="w-7 h-7 text-white" />
                        </button>

                        {/* X (트위터) */}
                        <button
                            onClick={shareToTwitter}
                            className="group w-14 h-14 flex items-center justify-center bg-black rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                            title="X"
                        >
                            <XIcon className="w-6 h-6 text-white" />
                        </button>

                        {/* 인스타그램 */}
                        <button
                            onClick={shareToInstagram}
                            className="group w-14 h-14 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                            title="인스타그램"
                        >
                            <InstagramIcon className="w-7 h-7 text-white" />
                        </button>

                        {/* 텔레그램 */}
                        <button
                            onClick={() => window.open('https://t.me/siminbupjung', '_blank')}
                            className="group w-14 h-14 flex items-center justify-center bg-[#0088cc] rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                            title="텔레그램"
                        >
                            <TelegramIcon className="w-7 h-7 text-white" />
                        </button>
                    </div>
                </div>
            </section>

            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>

            {/* 포스터 모달 */}
            {showPosterModal && (
            <div className="fixed inset-0 bg-black bg-opacity-0 z-50 overflow-auto">
                <Poster key={Date.now()} onClose={() => setShowPosterModal(false)} />
            </div>
        )}

        </div>
    );
}