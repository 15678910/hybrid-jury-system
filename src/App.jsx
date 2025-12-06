import { useState, useEffect } from 'react';
import Poster from './Poster';
import Resources from './resources';

export default function App() {
    const [activeSection, setActiveSection] = useState('home');
    const [selectedCountry, setSelectedCountry] = useState('독일');

    const [formData, setFormData] = useState({
        name: '',
        type: 'individual',
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
    const [stats, setStats] = useState({
        individual: 0,
        organization: 0,
        total: 0,
        telegram: 0,
        kakao: 0
    });
    const [showNotification, setShowNotification] = useState(false);
    const [latestSignature, setLatestSignature] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showPosterModal, setShowPosterModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2025';

    // 페이지 첫 로드 시 포스터/관리자 모달 처리
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const adminParam = params.get('key');

        if (adminParam === 'admin999') {
            setShowAdminLogin(true);
        } else {
            setShowPosterModal(true);
        }
    }, []);

    // 통계 업데이트
    useEffect(() => {
        updateStats(signatures);
    }, [signatures]);

    const updateStats = (sigs) => {
        const individual = sigs.filter((s) => s.type === 'individual').length;
        const organization = sigs.filter((s) => s.type === 'organization').length;
        const telegram = sigs.filter((s) => s.sns && s.sns.includes('telegram')).length;
        const kakao = sigs.filter((s) => s.sns && s.sns.includes('kakao')).length;

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

    // 엑셀 다운로드
    const downloadExcel = async () => {
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

        const excelData = signatures.map((sig, index) => ({
            번호: signatures.length - index,
            '이름/단체명': sig.name,
            구분: sig.type === 'individual' ? '개인' : '단체',
            전화번호: sig.phone || '-',
            텔레그램: sig.sns.includes('telegram') ? 'O' : 'X',
            카카오톡: sig.sns.includes('kakao') ? 'O' : 'X',
            서명일시: new Date(sig.timestamp).toLocaleString('ko-KR')
        }));

        const statsData = [
            { 구분: '총 지지자', 수: stats.total },
            { 구분: '개인 지지', 수: stats.individual },
            { 구분: '단체 지지', 수: stats.organization },
            { 구분: '텔레그램 가입', 수: stats.telegram },
            { 구분: '카카오톡 가입', 수: stats.kakao }
        ];

        const wb = XLSX.utils.book_new();
        const ws1 = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws1, '지지서명목록');

        const ws2 = XLSX.utils.json_to_sheet(statsData);
        XLSX.utils.book_append_sheet(wb, ws2, '통계');

        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `혼합형참심제_지지서명_${timestamp}.xlsx`);
    };

    // SNS 토글
    const toggleSNS = (platform) => {
        setFormData((prev) => ({
            ...prev,
            sns: prev.sns.includes(platform)
                ? prev.sns.filter((s) => s !== platform)
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

        setLatestSignature(newSignature);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);

        if (formData.sns.length > 0) {
            formData.sns.forEach((platform) => {
                if (platform === 'telegram') {
                    window.open('https://t.me/judicialreform', '_blank');
                } else if (platform === 'kakao') {
                    window.open('https://open.kakao.com/o/judicialreform', '_blank');
                }
            });
        }

        setFormData({
            name: '',
            type: 'individual',
            phone: '',
            sns: []
        });

        alert('✅ 지지 서명이 등록되었습니다!');
    };

    const scrollToSection = (sectionId) => {
        setActiveSection(sectionId);
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <div
                            className="text-2xl font-bold text-blue-600 cursor-pointer"
                            onClick={() => scrollToSection('necessity')}
                        >
                            ⚖️ 사법개혁
                        </div>

                        {/* 데스크톱 메뉴 */}
                        <div className="hidden lg:flex space-x-6 text-sm items-center">
                            <button
                                onClick={() => scrollToSection('necessity')}
                                className="hover:text-blue-600 transition font-medium"
                            >
                                도입 필요성
                            </button>
                            <button
                                onClick={() => scrollToSection('cases')}
                                className="hover:text-blue-600 transition font-medium"
                            >
                                해외 사례
                            </button>
                            <button
                                onClick={() => scrollToSection('constitution')}
                                className="hover:text-blue-600 transition font-medium"
                            >
                                헌법적 근거
                            </button>
                            <button
                                onClick={() => scrollToSection('bill')}
                                className="hover:text-blue-600 transition font-medium"
                            >
                                법안 제안
                            </button>
                            <button
                                onClick={() => scrollToSection('resources')}
                                className="hover:text-blue-600 transition font-medium"
                            >
                                자료실
                            </button>
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
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>
                    </nav>

                    {/* 모바일 메뉴 드롭다운 */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden bg-white border-t border-gray-200 py-4 space-y-2">
                            <button
                                onClick={() => {
                                    scrollToSection('necessity');
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                도입 필요성
                            </button>
                            <button
                                onClick={() => {
                                    scrollToSection('cases');
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                해외 사례
                            </button>
                            <button
                                onClick={() => {
                                    scrollToSection('constitution');
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                헌법적 근거
                            </button>
                            <button
                                onClick={() => {
                                    scrollToSection('bill');
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                법안 제안
                            </button>
                            <button
                                onClick={() => {
                                    scrollToSection('resources');
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                            >
                                자료실
                            </button>
                            <button
                                onClick={() => {
                                    setShowPosterModal(true);
                                    setMobileMenuOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition font-bold"
                            >
                                🎵 포스터 보기
                            </button>
                            <button
                                onClick={() => {
                                    scrollToSection('signature');
                                    setMobileMenuOpen(false);
                                }}
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
                    <div className="font-bold">새로운 지지 서명</div>
                    <div className="text-sm">
                        {latestSignature.name}님 (
                        {latestSignature.type === 'individual' ? '개인' : '단체'})
                    </div>
                </div>
            )}

            {/* 메인 히어로 */}
            <section
                id="necessity"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white pt-32 pb-20 px-4 mt-16"
            >
                <div className="container mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">헌법 개정 없이 가능한</h1>
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
                            onClick={() => window.open('/proposal', '_blank')}
                            className="bg-orange-500 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-orange-600 transition transform hover:scale-105"
                        >
                            제안서 및 법률안
                        </button>
                    </div>
                </div>
            </section>

            {/* 국민 동의 섹션, 제안 모델, 해외 사례, 헌법적 근거, 법안 제안, 지지 서명, 통계 섹션은
                지금 사용하시던 코드와 동일하게 그대로 두시면 됩니다.
                (위에 붙여주신 내용 기준으로 이미 정상 동작하도록 작성되어 있습니다.) */}

            {/* ... 중간 섹션들 그대로 ... */}
            {/* 여기서는 질문하신 부분이 아니라서 생략합니다. 실제 파일에는 그대로 두세요. */}

            {/* 실시간 현황 섹션, 푸터도 그대로 유지 */}

            {/* 포스터 모달 */}
            {showPosterModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 overflow-auto">
                    <Poster onClose={() => setShowPosterModal(false)} />
                </div>
            )}

            {/* 자료실 섹션 */}
            <section id="resources" className="py-20 px-4">
                <Resources />
            </section>
        </div>
    );
}
