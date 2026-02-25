import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import SEOHead from '../components/SEOHead';

// 로컬 스토리지 캐시 키
const CACHE_KEY = 'blog_posts_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30분으로 연장

// 로컬 스토리지에서 캐시 가져오기 (만료되어도 일단 반환, isStale 플래그로 구분)
const getLocalCache = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const isStale = Date.now() - timestamp >= CACHE_DURATION;
            // 만료되어도 데이터가 있으면 반환 (UI 즉시 표시용)
            return { data, isStale };
        }
    } catch (e) {
        console.log('Cache read error:', e);
    }
    return null;
};

// 로컬 스토리지에 캐시 저장
const setLocalCache = (data) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.log('Cache write error:', e);
    }
};

export default function Blog() {
    // 초기 데이터를 캐시에서 먼저 로드 (만료되어도 일단 표시)
    const cacheResult = getLocalCache();
    const cachedData = cacheResult?.data || null;
    const [posts, setPosts] = useState(cachedData || []);
    const [loading, setLoading] = useState(!cachedData); // 캐시 있으면 로딩 안함
    const [kakaoReady, setKakaoReady] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const POSTS_PER_PAGE = 10;

    // Kakao SDK 초기화 (지연 로드)
    useEffect(() => {
        // 페이지 로드 후 1초 뒤에 초기화 (블로그 렌더링 우선)
        const timer = setTimeout(() => {
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
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Firestore에서 글 불러오기 (로컬 스토리지 캐싱 + 백그라운드 업데이트)
    useEffect(() => {
        const fetchPosts = async () => {
            // 캐시가 있으면 이미 표시 중이므로 백그라운드에서 최신 데이터 가져오기
            try {
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const firestorePosts = querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    }))
                    .filter(post => post.category !== '사법뉴스' && !post.title?.includes('[사법뉴스]'));

                // 로컬 스토리지 캐시 저장
                setLocalCache(firestorePosts);

                setPosts(firestorePosts);
                setHasMore(false);
            } catch (error) {
                console.error('Error fetching posts:', error);
                if (!cachedData) setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // 더 불러오기
    const loadMore = async () => {
        if (loadingMore || !hasMore || !lastDoc) return;

        setLoadingMore(true);
        try {
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, where('category', '!=', '사법뉴스'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(POSTS_PER_PAGE));
            const querySnapshot = await getDocs(q);

            const morePosts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
            }));

            const newPosts = [...posts, ...morePosts];
            setPosts(newPosts);
            setLocalCache(newPosts); // 캐시 업데이트
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length >= POSTS_PER_PAGE);
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.category !== '사법뉴스' && !post.title?.includes('[사법뉴스]')
    );

    // ⚠️ 수정금지: SNS 공유 URL - 영문 도메인 사용 (한글 도메인 인코딩 문제 방지)
    // URL 복사 함수 (오픈채팅방 공유용)
    const handleCopyLink = async (post) => {
        const postUrl = `https://xn--lg3b0kt4n41f.kr/blog/${post.id}`;
        try {
            await navigator.clipboard.writeText(postUrl);
            alert('링크가 복사되었습니다!\n오픈채팅방에 붙여넣기 하세요.');
        } catch (err) {
            alert('링크: ' + postUrl);
        }
    };

    // 카카오톡 공유 함수 (개인/그룹 채팅용)
    const handleShare = async (post) => {
        const postUrl = `https://xn--lg3b0kt4n41f.kr/blog/${post.id}`;

        // 방법 1: Web Share API (모바일에서 모든 앱으로 공유 가능)
        if (navigator.share) {
            try {
                const shareText = `${post.title}\n\n#시민법정 #참심제`;
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

        // 방법 2: Kakao Share (폴백) - sendDefault 사용하여 캐시 문제 방지
        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: post.title,
                        description: post.summary || '',
                        imageUrl: 'https://xn--lg3b0kt4n41f.kr/og-image.jpg',
                        link: {
                            mobileWebUrl: postUrl,
                            webUrl: postUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '더 보기',
                            link: {
                                mobileWebUrl: postUrl,
                                webUrl: postUrl,
                            },
                        },
                    ],
                });
                return;
            } catch (e) {
                console.error('Kakao share error:', e);
            }
        }

        // 방법 3: URL 복사 (최종 폴백)
        handleCopyLink(post);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <SEOHead title="블로그" description="시민법정 블로그 - 사법개혁, 참심제 관련 최신 소식과 분석 글" path="/blog" />
            <Header />

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* 페이지 타이틀 */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">블로그</h1>

                    </div>

                    {/* 로딩 상태 */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">글을 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* 블로그 카드 그리드 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredPosts.map(post => (
                                    <article
                                        key={post.id}
                                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden flex flex-col"
                                    >
                                        {/* 이미지 영역 (이미지가 있는 경우만) */}
                                        {post.imageUrl && post.imageUrl !== 'https://siminbupjung-blog.web.app/og-image.jpg' && (
                                            <Link to={`/blog/${post.id}`} className="block">
                                                <div className="aspect-video overflow-hidden">
                                                    <img
                                                        src={post.imageUrl}
                                                        alt={post.title}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                    />
                                                </div>
                                            </Link>
                                        )}

                                        {/* 콘텐츠 영역 */}
                                        <div className="p-5 flex flex-col flex-1">
                                            <Link to={`/blog/${post.id}`}>
                                                <h2 className="text-lg font-bold text-gray-900 hover:text-blue-600 mb-2 line-clamp-2">
                                                    {post.title}
                                                </h2>
                                            </Link>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-4 flex-1">
                                                {post.summary || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 200) : '')}
                                            </p>

                                            {/* 하단 정보 */}
                                            <div className="mt-auto">
                                                <div className="text-xs text-gray-400 mb-3">
                                                    {post.date} · {post.author}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        {/* 링크 복사 버튼 */}
                                                        <button
                                                            onClick={() => handleCopyLink(post)}
                                                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                            title="링크 복사"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>

                                                        {/* 카카오톡 공유 버튼 */}
                                                        <button
                                                            onClick={() => handleShare(post)}
                                                            className="p-1.5 hover:bg-yellow-50 rounded-full transition-colors"
                                                            title="카카오톡 공유"
                                                        >
                                                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3zm5.907 8.06l1.47-1.424a.472.472 0 0 0-.656-.678l-1.928 1.866V9.282a.472.472 0 0 0-.944 0v2.557a.471.471 0 0 0 0 .222V13.5a.472.472 0 0 0 .944 0v-1.363l.427-.413 1.428 2.033a.472.472 0 1 0 .773-.543l-1.514-2.155zm-2.958 1.924h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857 0h-1.46V9.297a.472.472 0 0 0-.943 0v4.159c0 .26.21.472.471.472h1.932a.472.472 0 1 0 0-.944zm-5.857-1.03h.172l-1.03-2.9c-.093-.261-.44-.197-.44.093l-.001 3.807c0 .26.21.472.471.472h.943a.472.472 0 0 0 0-.944h-.472c.001-.01 0-.018 0-.028v-.5h.028zm7.858-3.754h-1.932a.472.472 0 0 0-.471.472v4.208a.472.472 0 0 0 .943 0v-1.364h1.46a.472.472 0 1 0 0-.944h-1.46v-.928h1.46a.472.472 0 1 0 0-.944z" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <Link
                                                        to={`/blog/${post.id}`}
                                                        className="text-blue-600 text-sm font-medium hover:underline"
                                                    >
                                                        더 보기 →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {filteredPosts.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    등록된 글이 없습니다.
                                </div>
                            )}

                            {/* 더 불러오기 버튼 */}
                            {hasMore && filteredPosts.length > 0 && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                    >
                                        {loadingMore ? (
                                            <span className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                불러오는 중...
                                            </span>
                                        ) : '더 보기'}
                                    </button>
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
