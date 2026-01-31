import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

const CACHE_KEY = 'judiciary_news_cache';
const CACHE_DURATION = 30 * 60 * 1000;

const getLocalCache = () => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const isStale = Date.now() - timestamp >= CACHE_DURATION;
            return { data, isStale };
        }
    } catch (e) {
        console.log('Cache read error:', e);
    }
    return null;
};

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

export default function JudiciaryNews() {
    const cacheResult = getLocalCache();
    const cachedData = cacheResult?.data || null;
    const [posts, setPosts] = useState(cachedData || []);
    const [loading, setLoading] = useState(!cachedData);
    const [kakaoReady, setKakaoReady] = useState(false);

    // Kakao SDK 초기화
    useEffect(() => {
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

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const firestorePosts = querySnapshot.docs
                    .filter(doc => doc.data().category === '사법뉴스')
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        }).replace(/\. /g, '-').replace('.', '') || ''
                    }));

                setLocalCache(firestorePosts);
                setPosts(firestorePosts);
            } catch (error) {
                console.error('Error fetching news:', error);
                if (!cachedData) setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // ⚠️ 수정금지: SNS 공유 URL - 영문 도메인 사용 (한글 도메인 인코딩 문제 방지)
    const handleCopyLink = async (post) => {
        const postUrl = `https://xn--lg3b0kt4n41f.kr/blog/${post.id}`;
        try {
            await navigator.clipboard.writeText(postUrl);
            alert('링크가 복사되었습니다!');
        } catch (err) {
            alert('링크: ' + postUrl);
        }
    };

    const handleShare = async (post) => {
        const postUrl = `https://xn--lg3b0kt4n41f.kr/blog/${post.id}`;

        // Web Share API (모바일)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: post.title,
                    text: `${post.title}\n\n#시민법정 #사법뉴스`,
                    url: postUrl
                });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }

        // Kakao Share (폴백)
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
                    buttons: [{
                        title: '자세히 보기',
                        link: {
                            mobileWebUrl: postUrl,
                            webUrl: postUrl,
                        },
                    }],
                });
                return;
            } catch (e) {
                console.error('Kakao share error:', e);
            }
        }

        // URL 복사 (최종 폴백)
        handleCopyLink(post);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-3xl">
                    {/* 페이지 타이틀 */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">사법뉴스</h1>
                        <p className="text-gray-500 text-sm">매일 자동 수집되는 사법 관련 주요 뉴스</p>
                    </div>

                    {/* 로딩 상태 */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">뉴스를 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* 뉴스 목록 - 날짜 + AI 요약 스타일 */}
                            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                                {posts.map(post => (
                                    <article
                                        key={post.id}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <Link to={`/blog/${post.id}`} className="block">
                                            {/* 날짜 배지 */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    📰 {post.date}
                                                </span>
                                            </div>

                                            {/* AI 요약 (메인 텍스트) */}
                                            <p className="text-gray-800 text-sm md:text-base leading-relaxed line-clamp-3">
                                                {post.summary || '오늘의 사법 관련 주요 뉴스입니다.'}
                                            </p>
                                        </Link>

                                        {/* 공유 버튼 */}
                                        <div className="flex items-center justify-end mt-3 pt-2 border-t border-gray-100">
                                            <div className="flex items-center gap-1">
                                                {/* 링크 복사 */}
                                                <button
                                                    onClick={() => handleCopyLink(post)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                                                    title="링크 복사"
                                                >
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>

                                                {/* 카카오톡 공유 */}
                                                <button
                                                    onClick={() => handleShare(post)}
                                                    className="p-1.5 hover:bg-yellow-50 rounded-full transition-colors"
                                                    title="카카오톡 공유"
                                                >
                                                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {posts.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    아직 수집된 뉴스가 없습니다.
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>&copy; 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
