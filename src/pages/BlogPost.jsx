import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// SNS 아이콘들
const KakaoIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
    </svg>
);

const FacebookIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const XIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const TelegramIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
);

export default function BlogPost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 수정 관련 상태
    const [showEditModal, setShowEditModal] = useState(false);
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        summary: '',
        content: '',
        category: ''
    });
    const categories = ['참심제 소개', '해외 사례', '사법개혁', '공지사항', '인터뷰', '뉴스'];

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Firestore에서 글 가져오기
                const docRef = doc(db, 'posts', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const postData = {
                        id: docSnap.id,
                        ...docSnap.data(),
                        date: docSnap.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    };
                    setPost(postData);

                    // 이전/다음 글을 위해 전체 글 목록 가져오기
                    const postsRef = collection(db, 'posts');
                    const q = query(postsRef, orderBy('createdAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    const firestorePosts = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    }));
                    setAllPosts(firestorePosts);
                } else {
                    setPost(null);
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                setPost(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500">글을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">글을 찾을 수 없습니다</h1>
                    <Link to="/blog" className="text-blue-600 hover:underline">
                        블로그 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    // SNS 공유 시 #을 %23으로 인코딩해야 텔레그램 등에서 URL이 잘리지 않음
    const postUrl = `https://시민법정.kr/%23/blog/${post.id}`;
    const postText = `${post.title} - 시민법정`;

    const shareToKakao = () => {
        window.open(
            `https://story.kakao.com/share?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToTelegram = () => {
        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToInstagram = () => {
        navigator.clipboard.writeText(`${postText} ${postUrl}`);
        alert('텍스트가 복사되었습니다! 인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    // 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        // 글의 작성자 코드와 일치하는지 확인
        if (post.writerCode === writerCode) {
            setIsVerified(true);
        } else {
            alert('작성자 코드가 일치하지 않습니다.');
        }
    };

    // 글 수정 제출
    const handleEditSubmit = async () => {
        if (!editForm.title || !editForm.content) {
            alert('제목과 본문을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const postRef = doc(db, 'posts', post.id);
            await updateDoc(postRef, {
                title: editForm.title,
                summary: editForm.summary,
                content: editForm.content,
                category: editForm.category,
                updatedAt: serverTimestamp()
            });

            // 로컬 상태 업데이트
            setPost({
                ...post,
                title: editForm.title,
                summary: editForm.summary,
                content: editForm.content,
                category: editForm.category
            });

            setShowEditModal(false);
            setIsVerified(false);
            setWriterCode('');
            alert('글이 수정되었습니다!');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('수정에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 모달 닫기
    const closeEditModal = () => {
        setShowEditModal(false);
        setIsVerified(false);
        setWriterCode('');
    };

    // 이전/다음 글
    const currentIndex = allPosts.findIndex(p => p.id === post.id);
    const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

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
                <article className="container mx-auto max-w-3xl">
                    {/* 뒤로가기 */}
                    <button
                        onClick={() => navigate('/blog')}
                        className="flex items-center text-gray-500 hover:text-blue-600 mb-6"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        목록으로
                    </button>

                    {/* 글 헤더 */}
                    <header className="mb-8">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
                            {post.category}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {post.title}
                        </h1>
                        <div className="flex items-center text-gray-500 text-sm">
                            <span>{post.author}</span>
                            <span className="mx-2">·</span>
                            <span>{post.date}</span>
                        </div>
                    </header>

                    {/* 본문 */}
                    <div className="bg-white rounded-xl shadow-md p-6 md:p-10 mb-8">
                        <div className="prose prose-lg max-w-none">
                            {post.content.split('\n').map((line, index) => {
                                // 링크 변환 함수: [텍스트](URL) 또는 URL 자체를 링크로 변환
                                const renderWithLinks = (text) => {
                                    // 마크다운 링크 [텍스트](URL) 패턴 - 괄호 안의 URL을 더 정확하게 매칭
                                    const markdownLinkRegex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
                                    // URL 패턴 (마크다운 링크가 아닌 경우)
                                    const urlRegex = /(https?:\/\/[^\s<]+)/g;

                                    // 먼저 마크다운 링크를 처리
                                    let parts = [];
                                    let lastIndex = 0;

                                    // 마크다운 링크 찾기
                                    const mdMatches = [...text.matchAll(markdownLinkRegex)];

                                    if (mdMatches.length > 0) {
                                        mdMatches.forEach((m, i) => {
                                            // 링크 이전 텍스트
                                            if (m.index > lastIndex) {
                                                parts.push(text.slice(lastIndex, m.index));
                                            }
                                            // 링크
                                            parts.push(
                                                <a key={`md-${i}`} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                    {m[1]}
                                                </a>
                                            );
                                            lastIndex = m.index + m[0].length;
                                        });
                                        // 나머지 텍스트
                                        if (lastIndex < text.length) {
                                            parts.push(text.slice(lastIndex));
                                        }
                                        return parts;
                                    }

                                    // 마크다운 링크가 없으면 일반 URL 처리
                                    lastIndex = 0;
                                    const urlMatches = [...text.matchAll(urlRegex)];

                                    if (urlMatches.length > 0) {
                                        urlMatches.forEach((m, i) => {
                                            if (m.index > lastIndex) {
                                                parts.push(text.slice(lastIndex, m.index));
                                            }
                                            parts.push(
                                                <a key={`url-${i}`} href={m[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                    {m[0]}
                                                </a>
                                            );
                                            lastIndex = m.index + m[0].length;
                                        });
                                        if (lastIndex < text.length) {
                                            parts.push(text.slice(lastIndex));
                                        }
                                        return parts;
                                    }

                                    return text;
                                };

                                if (line.startsWith('## ')) {
                                    return <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">{renderWithLinks(line.replace('## ', ''))}</h2>;
                                }
                                if (line.startsWith('- ')) {
                                    return <li key={index} className="text-gray-700 ml-4">{renderWithLinks(line.replace('- ', ''))}</li>;
                                }
                                if (line.match(/^\d+\./)) {
                                    return <li key={index} className="text-gray-700 ml-4 list-disc">{renderWithLinks(line.replace(/^\d+\.\s*/, ''))}</li>;
                                }
                                if (line.trim() === '') {
                                    return <br key={index} />;
                                }
                                return <p key={index} className="text-gray-700 mb-4 leading-relaxed">{renderWithLinks(line)}</p>;
                            })}
                        </div>
                    </div>

                    {/* SNS 공유 */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 mb-4">
                        <p className="text-white text-center mb-4 font-medium">이 글을 공유해주세요</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={shareToKakao}
                                className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform"
                                title="카카오톡"
                            >
                                <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                            </button>
                            <button
                                onClick={shareToFacebook}
                                className="w-12 h-12 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform"
                                title="페이스북"
                            >
                                <FacebookIcon className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={shareToTwitter}
                                className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform"
                                title="X"
                            >
                                <XIcon className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={shareToInstagram}
                                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform"
                                title="인스타그램"
                            >
                                <InstagramIcon className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={shareToTelegram}
                                className="w-12 h-12 flex items-center justify-center bg-[#0088cc] rounded-full hover:scale-110 transition-transform"
                                title="텔레그램"
                            >
                                <TelegramIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* 이전/다음 글 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prevPost ? (
                            <Link
                                to={`/blog/${prevPost.id}`}
                                className="bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow"
                            >
                                <span className="text-sm text-gray-400">← 이전 글</span>
                                <p className="font-medium text-gray-900 mt-1 line-clamp-1">{prevPost.title}</p>
                            </Link>
                        ) : <div />}
                        {nextPost && (
                            <Link
                                to={`/blog/${nextPost.id}`}
                                className="bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow text-right"
                            >
                                <span className="text-sm text-gray-400">다음 글 →</span>
                                <p className="font-medium text-gray-900 mt-1 line-clamp-1">{nextPost.title}</p>
                            </Link>
                        )}
                    </div>
                </article>
            </main>

            {/* 수정 모달 */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">글 수정</h2>
                                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {!isVerified ? (
                                <div>
                                    <p className="text-gray-600 mb-4">글을 수정하려면 작성 시 사용한 작성자 코드를 입력해주세요.</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={writerCode}
                                            onChange={(e) => setWriterCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                                            placeholder="작성자 코드"
                                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={verifyWriterCode}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            인증
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                                        인증되었습니다. 글을 수정할 수 있습니다.
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                        <select
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
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
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                            placeholder="글 제목"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
                                        <input
                                            type="text"
                                            value={editForm.summary}
                                            onChange={(e) => setEditForm({...editForm, summary: e.target.value})}
                                            placeholder="글 요약 (1-2문장)"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
                                        <textarea
                                            value={editForm.content}
                                            onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                            placeholder="글 내용을 입력하세요"
                                            rows={10}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={closeEditModal}
                                            className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                                        >
                                            취소
                                        </button>
                                        <button
                                            onClick={handleEditSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                        >
                                            {isSubmitting ? '수정 중...' : '수정 완료'}
                                        </button>
                                    </div>
                                </div>
                            )}
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
