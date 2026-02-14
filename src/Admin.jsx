import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function Admin() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [signatures, setSignatures] = useState([]);
    const [stats, setStats] = useState({ total: 0, individual: 0, organization: 0 });

    // 작성자 코드 관리
    const [writerCodes, setWriterCodes] = useState([]);
    const [newCode, setNewCode] = useState('');
    const [newName, setNewName] = useState('');
    const [loadingCodes, setLoadingCodes] = useState(false);

    // 글/동영상 관리
    const [posts, setPosts] = useState([]);
    const [videos, setVideos] = useState([]);
    const [samplePosts, setSamplePosts] = useState([]);
    const [sampleVideos, setSampleVideos] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingVideos, setLoadingVideos] = useState(false);

    // 사용자 관리
    const [users, setUsers] = useState([]);
    const [userStats, setUserStats] = useState({ total: 0, google: 0, kakao: 0 });
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // 샘플 데이터 정의
    const initialSamplePosts = [
        { id: 'sample-1', title: '참심제란 무엇인가?', author: '시민법정', category: '참심제 소개' },
        { id: 'sample-2', title: '독일 참심제의 성공 사례', author: '시민법정', category: '해외 사례' },
        { id: 'sample-3', title: '왜 지금 사법개혁이 필요한가', author: '시민법정', category: '사법개혁' }
    ];

    const initialSampleVideos = [
        { id: 'sample-video-1', title: 'Why Finland And Denmark Are Happier Than The U.S.', category: '해외 사례' }
    ];

    // 로그인 확인 (24시간 세션 유효성 검증)
    useEffect(() => {
        const adminSession = sessionStorage.getItem('adminLoggedIn');
        const loginTimestamp = sessionStorage.getItem('adminLoginTimestamp');

        if (adminSession === 'true' && loginTimestamp) {
            const now = Date.now();
            const loginTime = parseInt(loginTimestamp, 10);
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

            // 24시간 이내 로그인만 유효
            if (hoursSinceLogin < 24) {
                setIsLoggedIn(true);
                loadSignatures();
                loadWriterCodes();
                loadPosts();
                loadVideos();
                loadUsers();
                loadSampleData();
            } else {
                // 세션 만료 - 로그아웃 처리
                sessionStorage.removeItem('adminLoggedIn');
                sessionStorage.removeItem('adminLoginTimestamp');
                setIsLoggedIn(false);
            }
        }
    }, []);

    // 샘플 데이터 로드 (삭제되지 않은 것만)
    const loadSampleData = () => {
        const deletedPosts = JSON.parse(localStorage.getItem('deletedSamplePosts') || '[]');
        const deletedVideos = JSON.parse(localStorage.getItem('deletedSampleVideos') || '[]');

        setSamplePosts(initialSamplePosts.filter(p => !deletedPosts.includes(p.id)));
        setSampleVideos(initialSampleVideos.filter(v => !deletedVideos.includes(v.id)));
    };

    // 샘플 글 삭제
    const deleteSamplePost = (id) => {
        if (!confirm('정말 이 샘플 글을 삭제하시겠습니까?')) return;
        const deleted = JSON.parse(localStorage.getItem('deletedSamplePosts') || '[]');
        deleted.push(id);
        localStorage.setItem('deletedSamplePosts', JSON.stringify(deleted));
        loadSampleData();
        alert('샘플 글이 삭제되었습니다.');
    };

    // 샘플 동영상 삭제
    const deleteSampleVideo = (id) => {
        if (!confirm('정말 이 샘플 동영상을 삭제하시겠습니까?')) return;
        const deleted = JSON.parse(localStorage.getItem('deletedSampleVideos') || '[]');
        deleted.push(id);
        localStorage.setItem('deletedSampleVideos', JSON.stringify(deleted));
        loadSampleData();
        alert('샘플 동영상이 삭제되었습니다.');
    };

    // 샘플 데이터 복원
    const restoreSampleData = () => {
        if (!confirm('모든 샘플 데이터를 복원하시겠습니까?')) return;
        localStorage.removeItem('deletedSamplePosts');
        localStorage.removeItem('deletedSampleVideos');
        loadSampleData();
        alert('샘플 데이터가 복원되었습니다.');
    };

    // 글 불러오기
    const loadPosts = async () => {
        setLoadingPosts(true);
        try {
            const postsRef = collection(db, 'posts');
            const snapshot = await getDocs(postsRef);
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // timestamp를 밀리초로 변환하는 헬퍼 함수
            const getTimestamp = (ts) => {
                if (!ts) return 0;
                if (ts.toMillis) return ts.toMillis();
                if (ts.getTime) return ts.getTime();
                if (typeof ts === 'string') return new Date(ts).getTime();
                if (typeof ts === 'number') return ts;
                return 0;
            };

            // 사법뉴스 제외
            const filteredPosts = postsData.filter(post => post.category !== '사법뉴스');

            // 정렬 (오래된 것 먼저 = 오름차순)
            filteredPosts.sort((a, b) => {
                const timeA = getTimestamp(a.createdAt);
                const timeB = getTimestamp(b.createdAt);
                return timeA - timeB;
            });

            setPosts(filteredPosts);
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setLoadingPosts(false);
        }
    };

    // 동영상 불러오기
    const loadVideos = async () => {
        setLoadingVideos(true);
        try {
            const videosRef = collection(db, 'videos');
            const snapshot = await getDocs(videosRef);
            const videosData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // timestamp를 밀리초로 변환하는 헬퍼 함수
            const getTimestamp = (ts) => {
                if (!ts) return 0;
                if (ts.toMillis) return ts.toMillis();
                if (ts.getTime) return ts.getTime();
                if (typeof ts === 'string') return new Date(ts).getTime();
                if (typeof ts === 'number') return ts;
                return 0;
            };

            // 정렬 (오래된 것 먼저 = 오름차순)
            videosData.sort((a, b) => {
                const timeA = getTimestamp(a.createdAt);
                const timeB = getTimestamp(b.createdAt);
                return timeA - timeB;
            });

            setVideos(videosData);
        } catch (error) {
            console.error('Error loading videos:', error);
        } finally {
            setLoadingVideos(false);
        }
    };

    // 사용자 불러오기
    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);

            // 통계 계산
            const total = usersData.length;
            const google = usersData.filter(u => u.provider === 'google').length;
            const kakao = usersData.filter(u => u.provider === 'kakao').length;
            setUserStats({ total, google, kakao });
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    // 사용자 삭제
    const deleteUser = async (id) => {
        if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'users', id));
            loadUsers();
            alert('사용자가 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 글 삭제
    const deletePost = async (id) => {
        if (!confirm('정말 이 글을 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'posts', id));
            loadPosts();
            alert('글이 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 동영상 삭제
    const deleteVideo = async (id) => {
        if (!confirm('정말 이 동영상을 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'videos', id));
            loadVideos();
            alert('동영상이 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 작성자 코드 불러오기
    const loadWriterCodes = async () => {
        setLoadingCodes(true);
        try {
            const codesRef = collection(db, 'writerCodes');
            const snapshot = await getDocs(codesRef);
            const codes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setWriterCodes(codes);
        } catch (error) {
            console.error('Error loading writer codes:', error);
        } finally {
            setLoadingCodes(false);
        }
    };

    // 작성자 코드 추가
    const addWriterCode = async () => {
        if (!newCode.trim() || !newName.trim()) {
            alert('코드와 이름을 모두 입력해주세요.');
            return;
        }

        try {
            await addDoc(collection(db, 'writerCodes'), {
                code: newCode.trim(),
                name: newName.trim(),
                active: true,
                createdAt: new Date()
            });
            setNewCode('');
            setNewName('');
            loadWriterCodes();
            alert('작성자 코드가 추가되었습니다!');
        } catch (error) {
            console.error('Error adding writer code:', error);
            alert('추가에 실패했습니다.');
        }
    };

    // 작성자 코드 삭제
    const deleteWriterCode = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            await deleteDoc(doc(db, 'writerCodes', id));
            loadWriterCodes();
            alert('삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting writer code:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 작성자 코드 활성화/비활성화
    const toggleWriterCode = async (id, currentActive) => {
        try {
            await updateDoc(doc(db, 'writerCodes', id), {
                active: !currentActive
            });
            loadWriterCodes();
        } catch (error) {
            console.error('Error toggling writer code:', error);
        }
    };

    // 서명 데이터 로드 (Firestore에서)
    const loadSignatures = async () => {
        try {
            const signaturesRef = collection(db, 'signatures');
            const snapshot = await getDocs(signaturesRef);
            const signaturesData = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data()
            }));

            // timestamp를 밀리초로 변환하는 헬퍼 함수
            const getTimestamp = (ts) => {
                if (!ts) return 0;
                if (ts.toMillis) return ts.toMillis(); // Firestore Timestamp
                if (ts.getTime) return ts.getTime(); // Date 객체
                if (typeof ts === 'string') return new Date(ts).getTime(); // ISO 문자열
                if (typeof ts === 'number') return ts; // 이미 밀리초
                return 0;
            };

            // 클라이언트에서 정렬 (오래된 것 먼저 = 오름차순)
            signaturesData.sort((a, b) => {
                const timeA = getTimestamp(a.timestamp);
                const timeB = getTimestamp(b.timestamp);
                return timeA - timeB;
            });
            setSignatures(signaturesData);

            const total = signaturesData.length;
            const individual = signaturesData.filter(s => s.type === 'individual').length;
            const organization = signaturesData.filter(s => s.type === 'organization').length;

            setStats({ total, individual, organization });
        } catch (error) {
            console.error('Error loading signatures:', error);
        }
    };

    // 로그인 처리
    const handleLogin = (e) => {
        e.preventDefault();
        // 환경변수에서 비밀번호 가져오기
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2024';

        if (password === adminPassword) {
            const loginTime = Date.now().toString();
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminLoginTimestamp', loginTime);
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
        sessionStorage.removeItem('adminLoginTimestamp');
        setIsLoggedIn(false);
        setSignatures([]);
    };

    // 서명 삭제 (Firestore에서)
    const deleteSignature = async (id) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deleteDoc(doc(db, 'signatures', id));
            loadSignatures();
            alert('삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting signature:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 엑셀 다운로드
    const downloadExcel = () => {
        let csv = '이름,유형,재능나눔,연락처,SNS,참여시간\n';
        signatures.forEach(sig => {
            const timestamp = sig.timestamp?.toDate ? sig.timestamp.toDate().toLocaleString('ko-KR') : (sig.timestamp ? new Date(sig.timestamp).toLocaleString('ko-KR') : '-');
            csv += `${sig.name},${sig.type === 'individual' ? '개인' : '단체'},${sig.talent || '-'},${sig.phone},${sig.sns?.join('/') || '-'},${timestamp}\n`;
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `서명목록_${new Date().toLocaleDateString('ko-KR')}.csv`;
        link.click();
    };

    // 검색 필터링된 사용자
    const filteredUsers = users.filter(user => {
        const searchQuery = userSearchQuery.toLowerCase();
        return (
            (user.displayName || '').toLowerCase().includes(searchQuery) ||
            (user.email || '').toLowerCase().includes(searchQuery)
        );
    });

    // 로그인 화면
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🔐</div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">작성자 로그인</h1>
                        <p className="text-gray-600">혼합형 참심제 작성자 페이지</p>
                    </div>
                    
                    <form onSubmit={handleLogin}>
                        <input
                            type="text"
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

                {/* 사용자 통계 카드 */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="text-5xl font-bold mb-2">{userStats.total}</div>
                        <div className="text-xl">총 사용자</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="text-5xl font-bold mb-2">{userStats.google}</div>
                        <div className="text-xl">Google</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
                        <div className="text-5xl font-bold mb-2">{userStats.kakao}</div>
                        <div className="text-xl">Kakao</div>
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

                {/* 작성자 코드 관리 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">✍️ 작성자 코드 관리</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        미디어 페이지에서 글쓰기/동영상 추가 시 사용할 인증 코드를 관리합니다.
                    </p>

                    {/* 새 코드 추가 */}
                    <div className="flex gap-3 mb-6">
                        <input
                            type="text"
                            value={newCode}
                            onChange={(e) => setNewCode(e.target.value)}
                            placeholder="인증 코드 (예: writer001)"
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="작성자 이름"
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={addWriterCode}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            추가
                        </button>
                    </div>

                    {/* 코드 목록 */}
                    {loadingCodes ? (
                        <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : writerCodes.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            등록된 작성자 코드가 없습니다.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">코드</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">이름</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">상태</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {writerCodes.map(code => (
                                        <tr key={code.id} className="border-t border-gray-200">
                                            <td className="px-4 py-3 font-mono text-sm">{code.code}</td>
                                            <td className="px-4 py-3 text-sm">{code.name}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    code.active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {code.active ? '활성' : '비활성'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => toggleWriterCode(code.id, code.active)}
                                                    className={`px-3 py-1 rounded text-sm mr-2 ${
                                                        code.active
                                                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                                            : 'bg-green-500 text-white hover:bg-green-600'
                                                    }`}
                                                >
                                                    {code.active ? '비활성화' : '활성화'}
                                                </button>
                                                <button
                                                    onClick={() => deleteWriterCode(code.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 사용자 관리 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">👥 사용자 관리</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Firestore에 저장된 사용자를 관리합니다.
                    </p>

                    {/* 검색 및 새로고침 */}
                    <div className="flex gap-3 mb-6">
                        <input
                            type="text"
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            placeholder="이름 또는 이메일 검색..."
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            onClick={loadUsers}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                        >
                            🔄 새로고침
                        </button>
                    </div>

                    {/* 사용자 목록 */}
                    {loadingUsers ? (
                        <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            {userSearchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">프로필</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">이름</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">이메일</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">제공자</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">가입일</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">마지막 로그인</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="border-t border-gray-200">
                                            <td className="px-4 py-3">
                                                {user.photoURL ? (
                                                    <img
                                                        src={user.photoURL}
                                                        alt={user.displayName || '사용자'}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                                                        👤
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">{user.displayName || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{user.email || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    user.provider === 'google'
                                                        ? 'bg-red-100 text-red-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {user.provider === 'google' ? 'Google' : 'Kakao'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('ko-KR') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {user.lastLoginAt?.toDate ? user.lastLoginAt.toDate().toLocaleDateString('ko-KR') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 블로그 글 관리 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">📝 블로그 글 관리</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Firestore에 저장된 블로그 글을 관리합니다.
                    </p>

                    {loadingPosts ? (
                        <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            Firestore에 저장된 글이 없습니다.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">번호</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">제목</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">작성자</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">카테고리</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">등록일</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...posts].reverse().map((post, index) => (
                                        <tr key={post.id} className="border-t border-gray-200">
                                            <td className="px-4 py-3 text-sm text-gray-900">{posts.length - index}</td>
                                            <td className="px-4 py-3 text-sm">{post.title}</td>
                                            <td className="px-4 py-3 text-sm">{post.author}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                    {post.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString('ko-KR') : (post.createdAt ? new Date(post.createdAt).toLocaleString('ko-KR') : '-')}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => deletePost(post.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 동영상 관리 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">🎬 동영상 관리</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Firestore에 저장된 동영상을 관리합니다.
                    </p>

                    {loadingVideos ? (
                        <div className="text-center py-4">
                            <div className="inline-block w-6 h-6 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">
                            Firestore에 저장된 동영상이 없습니다.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">번호</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">제목</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">작성자</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">카테고리</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">등록일</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...videos].reverse().map((video, index) => (
                                        <tr key={video.id} className="border-t border-gray-200">
                                            <td className="px-4 py-3 text-sm text-gray-900">{videos.length - index}</td>
                                            <td className="px-4 py-3 text-sm">{video.title}</td>
                                            <td className="px-4 py-3 text-sm">{video.author || '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                    {video.category || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {video.createdAt?.toDate ? video.createdAt.toDate().toLocaleString('ko-KR') : (video.createdAt ? new Date(video.createdAt).toLocaleString('ko-KR') : '-')}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => deleteVideo(video.id)}
                                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 샘플 데이터 관리 */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">📦 샘플 데이터 관리</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                기본 샘플 글/동영상을 관리합니다. 삭제된 샘플은 브라우저 저장소에 기록됩니다.
                            </p>
                        </div>
                        <button
                            onClick={restoreSampleData}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                        >
                            모든 샘플 복원
                        </button>
                    </div>

                    {/* 샘플 글 */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">샘플 글</h3>
                        {samplePosts.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                모든 샘플 글이 삭제되었습니다.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-orange-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">ID</th>
                                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">제목</th>
                                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">작성자</th>
                                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">카테고리</th>
                                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {samplePosts.map(post => (
                                            <tr key={post.id} className="border-t border-gray-200">
                                                <td className="px-4 py-3 text-sm font-mono text-orange-600">{post.id}</td>
                                                <td className="px-4 py-3 text-sm">{post.title}</td>
                                                <td className="px-4 py-3 text-sm">{post.author}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                                        {post.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => deleteSamplePost(post.id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                    >
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* 샘플 동영상 */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">샘플 동영상</h3>
                        {sampleVideos.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                모든 샘플 동영상이 삭제되었습니다.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-orange-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">ID</th>
                                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">제목</th>
                                            <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">카테고리</th>
                                            <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sampleVideos.map(video => (
                                            <tr key={video.id} className="border-t border-gray-200">
                                                <td className="px-4 py-3 text-sm font-mono text-orange-600">{video.id}</td>
                                                <td className="px-4 py-3 text-sm">{video.title}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                                        {video.category}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => deleteSampleVideo(video.id)}
                                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                    >
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* 서명 목록 테이블 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <h2 className="text-xl font-bold text-gray-900 p-6 pb-0">📋 서명 목록</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">번호</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">이름</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">유형</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">재능나눔</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">연락처</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">SNS</th>
                                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">참여시간</th>
                                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {signatures.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                            아직 서명이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    [...signatures].reverse().map((sig, index) => (
                                        <tr key={sig.id} className="border-t border-gray-200 hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{signatures.length - index}</td>
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
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {sig.talent ? (
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                        {sig.talent}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{sig.phone}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {sig.sns && sig.sns.length > 0 ? sig.sns.map(s => (
                                                    <span key={s} className="inline-block mr-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                                        {s === 'kakao' ? '카톡' : '텔레'}
                                                    </span>
                                                )) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {sig.timestamp?.toDate ? sig.timestamp.toDate().toLocaleString('ko-KR') : (sig.timestamp ? new Date(sig.timestamp).toLocaleString('ko-KR') : '-')}
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
