import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 텔레그램 그룹에 알림 전송 (백엔드 API를 통해)
const sendTelegramNotification = async (post, postId, isEdit = false) => {
    try {
        const response = await fetch('https://us-central1-siminbupjung-blog.cloudfunctions.net/sendBlogNotification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                post: {
                    title: post.title,
                    summary: post.summary,
                    category: post.category,
                    author: post.author
                },
                postId,
                isEdit
            })
        });

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
        return false;
    }
};

export default function BlogWrite() {
    // 인증 관련 상태
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [writerName, setWriterName] = useState('');
    const [verifying, setVerifying] = useState(false);

    // 글 목록 관련 상태
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    // 모달 관련 상태
    const [showWriteModal, setShowWriteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        category: '사법개혁'
    });

    const categories = ['해외 사례', '사법개혁', '공지사항', '인터뷰', '뉴스'];

    // 인증 후 해당 작성자의 글 목록 불러오기
    useEffect(() => {
        if (isVerified && writerCode) {
            fetchMyPosts();
        }
    }, [isVerified, writerCode]);

    const fetchMyPosts = async () => {
        setLoading(true);
        try {
            const postsRef = collection(db, 'posts');
            // 전체 글 목록을 가져옴 (인증된 작성자가 모든 글 관리 가능)
            const q = query(postsRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            const allPosts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
            }));

            setPosts(allPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    // Firestore에서 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        setVerifying(true);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 새 글 등록
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.summary || !formData.content) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const docRef = await addDoc(collection(db, 'posts'), {
                ...formData,
                author: writerName,
                writerCode: writerCode,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                published: true
            });

            // 텔레그램 그룹에 알림 전송
            const postData = {
                ...formData,
                author: writerName
            };
            const telegramSent = await sendTelegramNotification(postData, docRef.id);

            if (telegramSent) {
                alert('글이 등록되고 텔레그램 그룹에 알림이 전송되었습니다!');
            } else {
                alert('글이 등록되었습니다! (텔레그램 알림 전송 실패)');
            }

            setShowWriteModal(false);
            setFormData({ title: '', summary: '', content: '', category: '사법개혁' });
            fetchMyPosts(); // 목록 새로고침
        } catch (error) {
            console.error('Error adding document: ', error);
            alert('글 등록에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 글 수정
    const handleEdit = (post) => {
        setEditingPost(post);
        setFormData({
            title: post.title,
            summary: post.summary || '',
            content: post.content,
            category: post.category
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            alert('제목과 본문을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const postRef = doc(db, 'posts', editingPost.id);
            await updateDoc(postRef, {
                title: formData.title,
                summary: formData.summary,
                content: formData.content,
                category: formData.category,
                updatedAt: serverTimestamp()
            });

            // 텔레그램 그룹에 수정 알림 전송
            const postData = {
                ...formData,
                author: editingPost.author || writerName
            };
            const telegramSent = await sendTelegramNotification(postData, editingPost.id, true);

            if (telegramSent) {
                alert('글이 수정되고 텔레그램 그룹에 알림이 전송되었습니다!');
            } else {
                alert('글이 수정되었습니다! (텔레그램 알림 전송 실패)');
            }

            setShowEditModal(false);
            setEditingPost(null);
            setFormData({ title: '', summary: '', content: '', category: '사법개혁' });
            fetchMyPosts(); // 목록 새로고침
        } catch (error) {
            console.error('Error updating post:', error);
            alert('수정에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 글 삭제
    const handleDelete = async (post) => {
        if (!confirm(`"${post.title}" 글을 삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.`)) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'posts', post.id));
            alert('글이 삭제되었습니다.');
            fetchMyPosts(); // 목록 새로고침
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 로그아웃
    const handleLogout = () => {
        setIsVerified(false);
        setWriterCode('');
        setWriterName('');
        setPosts([]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            ⚖️ 사법개혁
                        </Link>
                        <div className="flex gap-6">
                            <Link to="/" className="text-gray-600 hover:text-blue-600">홈</Link>
                            <Link to="/blog" className="text-blue-600 font-semibold">블로그</Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        블로그 글 관리
                    </h1>

                    {/* 작성자 코드 입력 (미인증 시) */}
                    {!isVerified ? (
                        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">작성자 인증</h2>
                            <p className="text-gray-600 mb-6">
                                글을 관리하려면 발급받은 작성자 코드를 입력해주세요.
                            </p>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={writerCode}
                                    onChange={(e) => setWriterCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                                    placeholder="작성자 코드 입력"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={verifyWriterCode}
                                    disabled={verifying}
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                                >
                                    {verifying ? '확인 중...' : '인증하기'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 인증 완료 표시 */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-green-600 text-xl">✓</span>
                                    <span className="text-green-800">
                                        <strong>{writerName}</strong>님으로 인증되었습니다.
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    로그아웃
                                </button>
                            </div>

                            {/* 새 글 등록 버튼 */}
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => {
                                        setFormData({ title: '', summary: '', content: '', category: '사법개혁' });
                                        setShowWriteModal(true);
                                    }}
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    새 글 등록
                                </button>
                            </div>

                            {/* 글 목록 */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b">
                                    <h2 className="text-lg font-bold text-gray-900">전체 글 목록 ({posts.length})</h2>
                                </div>

                                {loading ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="mt-4 text-gray-500">글을 불러오는 중...</p>
                                    </div>
                                ) : posts.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        작성한 글이 없습니다. 새 글을 등록해보세요!
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {posts.map(post => (
                                            <div key={post.id} className="p-4 hover:bg-gray-50">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                                {post.category}
                                                            </span>
                                                            <span className="text-xs text-gray-400">{post.date}</span>
                                                        </div>
                                                        <Link
                                                            to={`/blog/${post.id}`}
                                                            className="text-lg font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                                                        >
                                                            {post.title}
                                                        </Link>
                                                        {post.summary && (
                                                            <p className="text-sm text-gray-500 line-clamp-1 mt-1">{post.summary}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleEdit(post)}
                                                            className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                        >
                                                            수정
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(post)}
                                                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            삭제
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* 뒤로가기 */}
                    <div className="mt-8 text-center">
                        <Link to="/blog" className="text-blue-600 hover:underline">
                            ← 블로그 목록으로 돌아가기
                        </Link>
                    </div>
                </div>
            </main>

            {/* 새 글 등록 모달 */}
            {showWriteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">새 글 등록</h2>
                                <button
                                    onClick={() => setShowWriteModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="글 제목을 입력하세요"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">요약 *</label>
                                    <input
                                        type="text"
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        placeholder="글의 요약 (1-2문장, 텔레그램 알림에 표시됨)"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="글 내용을 입력하세요. 마크다운 형식을 사용할 수 있습니다.

## 소제목
- 목록 항목
1. 번호 목록"
                                        rows={12}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        팁: ## 로 소제목, - 로 목록, 숫자. 로 번호 목록을 만들 수 있습니다.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowWriteModal(false)}
                                        className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                    >
                                        {isSubmitting ? '등록 중...' : '글 등록하기'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 글 수정 모달 */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">글 수정</h2>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingPost(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="글 제목"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
                                    <input
                                        type="text"
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        placeholder="글 요약 (1-2문장)"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="글 내용을 입력하세요"
                                        rows={12}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setEditingPost(null);
                                        }}
                                        className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                    >
                                        {isSubmitting ? '수정 중...' : '수정 완료'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
