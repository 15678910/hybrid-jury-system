import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

export default function AdminBlog() {
    // 작성자 코드 인증
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [writerName, setWriterName] = useState('');
    const [verifying, setVerifying] = useState(false);

    // 글 관리
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '', author: '' });

    // 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        setVerifying(true);

        // 하드코딩된 테스트 코드
        const hardcodedCodes = {
            'admin1234': '관리자',
            'writer000': '시민법정'
        };

        if (hardcodedCodes[writerCode]) {
            setIsVerified(true);
            setWriterName(hardcodedCodes[writerCode]);
            setVerifying(false);
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
            } else {
                alert('유효하지 않거나 비활성화된 작성자 코드입니다.');
            }
        } catch (error) {
            console.error('Error verifying writer code:', error);
            alert('인증에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setVerifying(false);
        }
    };

    // 글 목록 불러오기
    useEffect(() => {
        if (!isVerified) return;

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
    }, [isVerified]);

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

    // 글 수정 시작
    const handleEditPost = (post) => {
        setEditingPost(post.id);
        setEditForm({
            title: post.title,
            content: post.content,
            author: post.author
        });
    };

    // 글 수정 취소
    const handleCancelEdit = () => {
        setEditingPost(null);
        setEditForm({ title: '', content: '', author: '' });
    };

    // 글 수정 저장
    const handleSaveEdit = async (postId) => {
        if (!editForm.title || !editForm.content) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        try {
            await updateDoc(doc(db, 'posts', postId), {
                title: editForm.title,
                content: editForm.content,
                author: editForm.author,
                updatedAt: serverTimestamp()
            });
            setPosts(posts.map(p =>
                p.id === postId ? { ...p, ...editForm } : p
            ));
            setEditingPost(null);
            setEditForm({ title: '', content: '', author: '' });
            alert('글이 수정되었습니다.');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('수정에 실패했습니다.');
        }
    };

    // 로그인 화면
    if (!isVerified) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center px-4 pt-32">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            작성자 관리
                        </h1>
                        <p className="text-gray-600 text-center mb-6">
                            작성자 코드를 입력하여 인증해주세요.
                        </p>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={writerCode}
                                onChange={(e) => setWriterCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                                placeholder="작성자 코드 입력"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={verifyWriterCode}
                                disabled={verifying}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {verifying ? '인증 중...' : '인증하기'}
                            </button>
                        </div>
                        <div className="mt-6 text-center">
                            <Link to="/blog" className="text-blue-600 hover:underline text-sm">
                                ← 블로그로 돌아가기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">작성자 관리</h1>
                            <p className="text-gray-600 mt-1">
                                {writerName}님으로 로그인됨
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsVerified(false);
                                setWriterCode('');
                                setWriterName('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            로그아웃
                        </button>
                    </div>

                    {/* 글 관리 */}
                    <div>
                        <div className="mb-4">
                            <Link
                                to="/blog/write"
                                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                + 새 글 작성
                            </Link>
                        </div>
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
                                            <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">날짜</th>
                                            <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">관리</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {posts.map(post => (
                                            <tr key={post.id} className="hover:bg-gray-50">
                                                {editingPost === post.id ? (
                                                    <td className="px-6 py-4" colSpan="4">
                                                        <div className="space-y-4">
                                                            <input
                                                                type="text"
                                                                value={editForm.title}
                                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                                placeholder="제목"
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={editForm.author}
                                                                onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                                                                placeholder="작성자"
                                                                className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <textarea
                                                                value={editForm.content}
                                                                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                                                                placeholder="내용"
                                                                rows={10}
                                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                                                >
                                                                    취소
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSaveEdit(post.id)}
                                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                                                >
                                                                    저장
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <>
                                                        <td className="px-6 py-4">
                                                            <Link
                                                                to={`/blog/${post.id}`}
                                                                className="text-gray-900 hover:text-blue-600 font-medium"
                                                            >
                                                                {post.title}
                                                            </Link>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{post.author}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">{post.date}</td>
                                                        <td className="px-6 py-4 text-right space-x-3">
                                                            <button
                                                                onClick={() => handleEditPost(post)}
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                            >
                                                                수정
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePost(post.id)}
                                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                            >
                                                                삭제
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
