import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

export default function AdminNews() {
    const [isVerified, setIsVerified] = useState(false);
    const [writerCode, setWriterCode] = useState('');
    const [writerName, setWriterName] = useState('');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    // 작성자 코드 확인
    const handleVerify = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        // 환경변수에서 관리자 코드 확인
        const adminCode = import.meta.env.VITE_ADMIN_CODE;
        const writerCodeEnv = import.meta.env.VITE_WRITER_CODE;

        if (writerCode === adminCode) {
            setIsVerified(true);
            setWriterName('관리자');
            localStorage.setItem('writerCode', writerCode);
            return;
        }
        if (writerCode === writerCodeEnv) {
            setIsVerified(true);
            setWriterName('시민법정');
            localStorage.setItem('writerCode', writerCode);
            return;
        }

        try {
            const codesRef = collection(db, 'writerCodes');
            const q = query(codesRef, where('code', '==', writerCode), where('active', '==', true));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const codeData = querySnapshot.docs[0].data();
                setIsVerified(true);
                setWriterName(codeData.name);
                localStorage.setItem('writerCode', writerCode);
            } else {
                alert('유효하지 않은 작성자 코드입니다.');
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            alert('인증 중 오류가 발생했습니다.');
        }
    };

    // 저장된 코드로 자동 로그인
    useEffect(() => {
        const savedCode = localStorage.getItem('writerCode');
        if (savedCode) {
            setWriterCode(savedCode);

            // 환경변수 확인
            const adminCode = import.meta.env.VITE_ADMIN_CODE;
            const writerCodeEnv = import.meta.env.VITE_WRITER_CODE;

            if (savedCode === adminCode) {
                setIsVerified(true);
                setWriterName('관리자');
                return;
            }
            if (savedCode === writerCodeEnv) {
                setIsVerified(true);
                setWriterName('시민법정');
                return;
            }

            (async () => {
                try {
                    const codesRef = collection(db, 'writerCodes');
                    const q = query(codesRef, where('code', '==', savedCode), where('active', '==', true));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        setIsVerified(true);
                        setWriterName(querySnapshot.docs[0].data().name);
                    }
                } catch (e) {
                    console.error('Auto login error:', e);
                }
            })();
        }
    }, []);

    // 뉴스 목록 불러오기
    useEffect(() => {
        if (!isVerified) return;

        const fetchNews = async () => {
            setLoading(true);
            try {
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const newsData = querySnapshot.docs
                    .filter(doc => doc.data().category === '사법뉴스')
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    }));

                setPosts(newsData);
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [isVerified]);

    // 삭제
    const handleDelete = async (postId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPosts(posts.filter(p => p.id !== postId));
            alert('삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    // 로그아웃
    const handleLogout = () => {
        localStorage.removeItem('writerCode');
        setIsVerified(false);
        setWriterCode('');
        setWriterName('');
    };

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="pt-24 pb-16 px-4">
                    <div className="container mx-auto max-w-md">
                        <div className="bg-white rounded-xl shadow-md p-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">사법뉴스 관리</h1>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={writerCode}
                                    onChange={(e) => setWriterCode(e.target.value)}
                                    placeholder="작성자 코드 입력"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                />
                                <button
                                    onClick={handleVerify}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    확인
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">사법뉴스 관리</h1>
                            <p className="text-gray-500">{writerName}님으로 로그인됨</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700">
                            로그아웃
                        </button>
                    </div>

                    {/* 뉴스 목록 */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">불러오는 중...</div>
                        ) : posts.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">수집된 사법뉴스가 없습니다.</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">제목</th>
                                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">날짜</th>
                                        <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {posts.map(post => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <a
                                                    href={`/blog/${post.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-900 hover:text-blue-600"
                                                >
                                                    {post.title}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{post.date}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    삭제
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
