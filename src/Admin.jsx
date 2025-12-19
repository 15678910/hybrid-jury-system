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

    // 샘플 데이터 정의
    const initialSamplePosts = [
        { id: 'sample-1', title: '참심제란 무엇인가?', author: '시민법정', category: '참심제 소개' },
        { id: 'sample-2', title: '독일 참심제의 성공 사례', author: '시민법정', category: '해외 사례' },
        { id: 'sample-3', title: '왜 지금 사법개혁이 필요한가', author: '시민법정', category: '사법개혁' }
    ];

    const initialSampleVideos = [
        { id: 'sample-video-1', title: 'Why Finland And Denmark Are Happier Than The U.S.', category: '해외 사례' }
    ];

    // 로그인 확인
    useEffect(() => {
        const adminSession = sessionStorage.getItem('adminLoggedIn');
        if (adminSession === 'true') {
            setIsLoggedIn(true);
            loadSignatures();
            loadWriterCodes();
            loadPosts();
            loadVideos();
            loadSampleData();
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
            setPosts(postsData);
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
            setVideos(videosData);
        } catch (error) {
            console.error('Error loading videos:', error);
        } finally {
            setLoadingVideos(false);
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
        let csv = '이름,유형,재능나눔,연락처,SNS,참여시간\n';
        signatures.forEach(sig => {
            csv += `${sig.name},${sig.type === 'individual' ? '개인' : '단체'},${sig.talent || '-'},${sig.phone},${sig.sns.join('/')},${new Date(sig.timestamp).toLocaleString('ko-KR')}\n`;
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
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">제목</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">작성자</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">카테고리</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {posts.map(post => (
                                        <tr key={post.id} className="border-t border-gray-200">
                                            <td className="px-4 py-3 text-sm">{post.title}</td>
                                            <td className="px-4 py-3 text-sm">{post.author}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                    {post.category}
                                                </span>
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
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">제목</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">작성자</th>
                                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">카테고리</th>
                                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {videos.map(video => (
                                        <tr key={video.id} className="border-t border-gray-200">
                                            <td className="px-4 py-3 text-sm">{video.title}</td>
                                            <td className="px-4 py-3 text-sm">{video.author || '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                                    {video.category || '-'}
                                                </span>
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
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {sig.talent ? (
                                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                        {sig.talent}
                                                    </span>
                                                ) : '-'}
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
