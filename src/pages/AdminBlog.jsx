import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// 관리자 비밀번호 (실제 운영 시 환경 변수나 더 안전한 방법 사용)
const ADMIN_PASSWORD = 'admin1234';

export default function AdminBlog() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('posts');

    // 글 관리
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // 작성자 코드 관리
    const [writerCodes, setWriterCodes] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(true);
    const [newCode, setNewCode] = useState({ code: '', name: '' });

    // 관리자 인증
    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            alert('비밀번호가 틀립니다.');
        }
    };

    // 글 목록 불러오기
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchPosts = async () => {
            try {
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const postsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                }));
                setPosts(postsData);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [isAuthenticated]);

    // 작성자 코드 목록 불러오기
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchWriterCodes = async () => {
            try {
                const codesRef = collection(db, 'writerCodes');
                const querySnapshot = await getDocs(codesRef);

                const codesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setWriterCodes(codesData);
            } catch (error) {
                console.error('Error fetching writer codes:', error);
            } finally {
                setLoadingCodes(false);
            }
        };

        fetchWriterCodes();
    }, [isAuthenticated]);

    // 글 삭제
    const handleDeletePost = async (postId) => {
        if (!confirm('정말 이 글을 삭제하시겠습니까?')) return;

        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPosts(posts.filter(p => p.id !== postId));
            alert('글이 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 작성자 코드 추가
    const handleAddWriterCode = async () => {
        if (!newCode.code || !newCode.name) {
            alert('코드와 이름을 모두 입력해주세요.');
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'writerCodes'), {
                code: newCode.code,
                name: newCode.name,
                createdAt: serverTimestamp(),
                active: true
            });

            setWriterCodes([...writerCodes, {
                id: docRef.id,
                code: newCode.code,
                name: newCode.name,
                active: true
            }]);
            setNewCode({ code: '', name: '' });
            alert('작성자 코드가 추가되었습니다.');
        } catch (error) {
            console.error('Error adding writer code:', error);
            alert('추가에 실패했습니다.');
        }
    };

    // 작성자 코드 삭제
    const handleDeleteWriterCode = async (codeId) => {
        if (!confirm('정말 이 작성자 코드를 삭제하시겠습니까?')) return;

        try {
            await deleteDoc(doc(db, 'writerCodes', codeId));
            setWriterCodes(writerCodes.filter(c => c.id !== codeId));
            alert('작성자 코드가 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting writer code:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 작성자 코드 활성화/비활성화
    const handleToggleWriterCode = async (codeId, currentActive) => {
        try {
            await updateDoc(doc(db, 'writerCodes', codeId), {
                active: !currentActive
            });
            setWriterCodes(writerCodes.map(c =>
                c.id === codeId ? { ...c, active: !currentActive } : c
            ));
        } catch (error) {
            console.error('Error toggling writer code:', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    // 로그인 화면
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        관리자 로그인
                    </h1>
                    <div className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="관리자 비밀번호"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleLogin}
                            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                        >
                            로그인
                        </button>
                    </div>
                    <div className="mt-6 text-center">
                        <Link to="/blog" className="text-blue-600 hover:underline text-sm">
                            ← 블로그로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            ⚖️ 사법개혁
                        </Link>
                        <div className="flex gap-4 items-center">
                            <Link to="/blog" className="text-gray-600 hover:text-blue-600">블로그</Link>
                            <button
                                onClick={() => setIsAuthenticated(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                로그아웃
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="py-8 px-4">
                <div className="container mx-auto max-w-5xl">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">블로그 관리</h1>

                    {/* 탭 */}
                    <div className="flex gap-4 mb-8 border-b">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`pb-4 px-2 font-medium transition ${
                                activeTab === 'posts'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            글 관리
                        </button>
                        <button
                            onClick={() => setActiveTab('writers')}
                            className={`pb-4 px-2 font-medium transition ${
                                activeTab === 'writers'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            작성자 코드 관리
                        </button>
                    </div>

                    {/* 글 관리 탭 */}
                    {activeTab === 'posts' && (
                        <div>
                            {loadingPosts ? (
                                <div className="text-center py-12">
                                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    등록된 글이 없습니다.
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">제목</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">작성자</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">카테고리</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">날짜</th>
                                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {posts.map(post => (
                                                <tr key={post.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            to={`/blog/${post.id}`}
                                                            className="text-gray-900 hover:text-blue-600 font-medium"
                                                        >
                                                            {post.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{post.author}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                            {post.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{post.date}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
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
                    )}

                    {/* 작성자 코드 관리 탭 */}
                    {activeTab === 'writers' && (
                        <div>
                            {/* 새 코드 추가 */}
                            <div className="bg-white rounded-xl shadow p-6 mb-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">새 작성자 코드 추가</h2>
                                <div className="flex gap-4 flex-wrap">
                                    <input
                                        type="text"
                                        value={newCode.code}
                                        onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                                        placeholder="코드 (예: writer001)"
                                        className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={newCode.name}
                                        onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                                        placeholder="작성자 이름 (예: 시민법정)"
                                        className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={handleAddWriterCode}
                                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>

                            {/* 코드 목록 */}
                            {loadingCodes ? (
                                <div className="text-center py-12">
                                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : writerCodes.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
                                    등록된 작성자 코드가 없습니다.
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">코드</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">작성자 이름</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">상태</th>
                                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {writerCodes.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-mono text-gray-900">{item.code}</td>
                                                    <td className="px-6 py-4 text-gray-700">{item.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            item.active
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {item.active ? '활성' : '비활성'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-3">
                                                        <button
                                                            onClick={() => handleToggleWriterCode(item.id, item.active)}
                                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                        >
                                                            {item.active ? '비활성화' : '활성화'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteWriterCode(item.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
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

                            {/* 안내 */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>사용 방법:</strong> 작성자 코드를 추가한 후, 해당 코드를 글을 작성할 분에게 전달해주세요.
                                    작성자는 <Link to="/blog/write" className="underline">글쓰기 페이지</Link>에서 코드를 입력하여 인증 후 글을 작성할 수 있습니다.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
