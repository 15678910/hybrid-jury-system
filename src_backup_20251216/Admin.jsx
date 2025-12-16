import { useState, useEffect } from 'react';

export default function Admin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [signatures, setSignatures] = useState([]);
    const [stats, setStats] = useState({ total: 0, individual: 0, organization: 0 });

    // 로그인 확인
    useEffect(() => {
        const adminSession = sessionStorage.getItem('adminLoggedIn');
        if (adminSession === 'true') {
            setIsLoggedIn(true);
            loadSignatures();
        }
    }, []);

    // 서명 데이터 로드
    const loadSignatures = () => {
        const savedSignatures = JSON.parse(localStorage.getItem('signatures') || '[]');
        setSignatures(savedSignatures);
        
        const total = savedSignatures.length;
        const individual = savedSignatures.filter(s => s.type === 'individual').length;
        const organization = savedSignatures.filter(s => s.type === 'organization').length;
        
        setStats({ total, individual, organization });
    };

    // 로그인 처리
    const handleLogin = (e) => {
        e.preventDefault();
        // 환경변수에서 비밀번호 가져오기
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2024';
        
        if (password === adminPassword) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            setIsLoggedIn(true);
            loadSignatures();
            alert('로그인 성공!');
        } else {
            alert('비밀번호가 틀렸습니다.');
        }
        setPassword('');
    };

    // 로그아웃
    const handleLogout = () => {
        sessionStorage.removeItem('adminLoggedIn');
        setIsLoggedIn(false);
        setSignatures([]);
    };

    // 서명 삭제
    const deleteSignature = (id) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            const updated = signatures.filter(s => s.id !== id);
            setSignatures(updated);
            localStorage.setItem('signatures', JSON.stringify(updated));
            loadSignatures();
            alert('삭제되었습니다.');
        }
    };

    // 엑셀 다운로드
    const downloadExcel = () => {
        let csv = '이름,유형,연락처,SNS,참여시간\n';
        signatures.forEach(sig => {
            csv += `${sig.name},${sig.type === 'individual' ? '개인' : '단체'},${sig.phone},${sig.sns.join('/')},${new Date(sig.timestamp).toLocaleString('ko-KR')}\n`;
        });
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `서명목록_${new Date().toLocaleDateString('ko-KR')}.csv`;
        link.click();
    };

    // 로그인 화면
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🔐</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
                        <p className="text-gray-600">혼합형 참심제 관리자 페이지</p>
                    </div>
                    
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요"
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            autoFocus
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition"
                        >
                            로그인
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <a 
                            href="/"
                            className="text-sm text-gray-600 hover:text-gray-900 transition"
                        >
                            ← 메인 페이지로 돌아가기
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // 관리자 대시보드
    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">⚖️ 관리자 대시보드</h1>
                        <p className="text-sm text-gray-600">혼합형 참심제 서명 관리</p>
                    </div>
                    <div className="flex gap-3">
                        <a 
                            href="/"
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                        >
                            메인으로
                        </a>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* 통계 카드 */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="text-5xl font-bold mb-2">{stats.total}</div>
                        <div className="text-xl">총 서명</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="text-5xl font-bold mb-2">{stats.individual}</div>
                        <div className="text-xl">개인</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="text-5xl font-bold mb-2">{stats.organization}</div>
                        <div className="text-xl">단체</div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="mb-6 flex gap-3">
                    <button
                        onClick={downloadExcel}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                        📥 엑셀 다운로드
                    </button>
                    <button
                        onClick={loadSignatures}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        🔄 새로고침
                    </button>
                </div>

                {/* 서명 목록 테이블 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">번호</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">이름</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">유형</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">연락처</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">SNS</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">참여시간</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signatures.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            아직 서명이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    signatures.map((sig, index) => (
                                        <tr key={sig.id} className="border-t border-gray-200 hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{sig.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    sig.type === 'individual' 
                                                        ? 'bg-purple-100 text-purple-700' 
                                                        : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {sig.type === 'individual' ? '개인' : '단체'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{sig.phone}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {sig.sns.map(s => (
                                                    <span key={s} className="inline-block mr-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                        {s === 'kakao' ? '카톡' : '텔레'}
                                                    </span>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {new Date(sig.timestamp).toLocaleString('ko-KR')}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => deleteSignature(sig.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
