import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Blog() {
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kakaoReady, setKakaoReady] = useState(false);

    const categories = ['전체', '참심제 소개', '해외 사례', '사법개혁', '공지사항'];

    // Kakao SDK 초기화
    useEffect(() => {
        const initKakao = () => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                try {
                    window.Kakao.init('83e843186c1251b9b5a8013fd5f29798');
                    setKakaoReady(true);
                } catch (e) {
                    console.error('Kakao init error:', e);
                }
            } else if (window.Kakao?.isInitialized()) {
                setKakaoReady(true);
            }
        };

        if (window.Kakao) {
            initKakao();
        } else {
            const checkKakao = setInterval(() => {
                if (window.Kakao) {
                    clearInterval(checkKakao);
                    initKakao();
                }
            }, 100);
            setTimeout(() => clearInterval(checkKakao), 5000);
        }
    }, []);

    // Firestore에서 글 불러오기
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const firestorePosts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                }));

                setPosts(firestorePosts);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const filteredPosts = selectedCategory === '전체'
        ? posts
        : posts.filter(post => post.category === selectedCategory);

    // 공유 함수 - Web Share API 우선, 카카오/복사 폴백
    const handleShare = async (post) => {
        const postUrl = `https://siminbupjung-blog.web.app/blog/${post.id}`;

        // 방법 1: Web Share API (모바일에서 모든 앱으로 공유 가능)
        if (navigator.share) {
            try {
                const shareText = `📝 ${post.title}\n\n⚖️ #시민법정 #참심제`;
                await navigator.share({
                    title: post.title,
                    text: shareText,
                    url: postUrl
                });
                return;
            } catch (err) {
                // 사용자가 취소한 경우 에러 무시
                if (err.name === 'AbortError') return;
                console.log('Web Share failed, trying Kakao:', err);
            }
        }

        // 방법 2: Kakao Share (폴백)
        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendScrap({
                    requestUrl: postUrl
                });
                return;
            } catch (e) {
                console.error('Kakao share error:', e);
            }
        }

        // 방법 3: URL 복사 (최종 폴백)
        try {
            await navigator.clipboard.writeText(postUrl);
            alert('링크가 복사되었습니다!\n원하는 곳에 붙여넣기 하세요.');
        } catch (err) {
            alert('공유에 실패했습니다. 링크: ' + postUrl);
        }
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
                        <div className="flex gap-6 items-center">
                            <Link to="/" className="text-gray-600 hover:text-blue-600">홈</Link>
                            <Link to="/blog" className="text-blue-600 font-semibold">블로그</Link>
                            <Link to="/videos" className="text-gray-600 hover:text-blue-600">동영상</Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    {/* 페이지 타이틀 */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">블로그</h1>
                        <p className="text-gray-600">참심제와 사법개혁에 관한 소식을 전합니다</p>
                    </div>

                    {/* 카테고리 필터 */}
                    <div className="flex justify-center gap-3 mb-10 flex-wrap">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* 로딩 상태 */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">글을 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* 블로그 목록 */}
                            <div className="space-y-6">
                                {filteredPosts.map(post => (
                                    <article
                                        key={post.id}
                                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-3">
                                                    {post.category}
                                                </span>
                                                <Link to={`/blog/${post.id}`}>
                                                    <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 mb-2">
                                                        {post.title}
                                                    </h2>
                                                </Link>
                                                <p className="text-gray-600 mb-4 line-clamp-2">
                                                    {post.summary}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">
                                                        {post.date} · {post.author}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        {/* 카카오톡 공유 버튼 */}
                                                        <button
                                                            onClick={() => handleShare(post)}
                                                            className="p-2 hover:bg-yellow-50 rounded-full transition-colors"
                                                            title="공유하기"
                                                        >
                                                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857 0h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.03h.172l-1.03-2.9c-.093-.261-.44-.197-.44.093l-.001 3.807c0 .26.21.472.471.472h.943a.472.472 0 0 0 0-.944h-.472c.001-.01 0-.018 0-.028v-.5h.028zm7.858-3.754h-1.932a.472.472 0 0 0-.471.472v4.208a.472.472 0 0 0 .943 0v-1.364h1.46a.472.472 0 1 0 0-.944h-1.46v-.928h1.46a.472.472 0 1 0 0-.944z" />
                                                            </svg>
                                                        </button>

                                                        <Link
                                                            to={`/blog/${post.id}`}
                                                            className="text-blue-600 text-sm font-medium hover:underline"
                                                        >
                                                            자세히 보기 →
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {filteredPosts.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    {posts.length === 0 ? '등록된 글이 없습니다.' : '해당 카테고리의 글이 없습니다.'}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
