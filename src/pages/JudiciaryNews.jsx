import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

const CACHE_KEY = 'judiciary_news_cache';
const CACHE_DURATION = 30 * 60 * 1000;
const POSTS_PER_PAGE = 10;

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const postsRef = collection(db, 'posts');
                const q = query(
                    postsRef,
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);

                const firestorePosts = querySnapshot.docs
                    .filter(doc => doc.data().category === '사법뉴스')
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    }));

                setLocalCache(firestorePosts);
                setPosts(firestorePosts);
                setHasMore(false);
            } catch (error) {
                console.error('Error fetching news:', error);
                if (!cachedData) setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    const loadMore = async () => {
        if (loadingMore || !hasMore || !lastDoc) return;

        setLoadingMore(true);
        try {
            const postsRef = collection(db, 'posts');
            const q = query(
                postsRef,
                where('category', '==', '사법뉴스'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(POSTS_PER_PAGE)
            );
            const querySnapshot = await getDocs(q);

            const morePosts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
            }));

            const newPosts = [...posts, ...morePosts];
            setPosts(newPosts);
            setLocalCache(newPosts);
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length >= POSTS_PER_PAGE);
        } catch (error) {
            console.error('Error loading more news:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handleCopyLink = async (post) => {
        const postUrl = `https://xn--lg3b0kt4n41f.kr/blog/${post.id}`;
        try {
            await navigator.clipboard.writeText(postUrl);
            alert('링크가 복사되었습니다!');
        } catch (err) {
            alert('링크: ' + postUrl);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    {/* 페이지 타이틀 */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">📰 사법뉴스</h1>
                        <p className="text-gray-600">매일 자동 수집되는 사법 관련 주요 뉴스</p>
                    </div>

                    {/* 로딩 상태 */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">뉴스를 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* 뉴스 목록 */}
                            <div className="space-y-4">
                                {posts.map(post => (
                                    <article
                                        key={post.id}
                                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                                                    📰 사법뉴스
                                                </span>
                                                <span className="text-xs text-gray-400">{post.date}</span>
                                                <span className="text-xs text-gray-400">· {post.author}</span>
                                            </div>

                                            <Link to={`/blog/${post.id}`}>
                                                <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 mb-3">
                                                    {post.title}
                                                </h2>
                                            </Link>

                                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                                {post.summary || (post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 200) : '')}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => handleCopyLink(post)}
                                                    className="text-gray-400 hover:text-gray-600 text-sm flex items-center gap-1"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    링크 복사
                                                </button>
                                                <Link
                                                    to={`/blog/${post.id}`}
                                                    className="text-blue-600 text-sm font-medium hover:underline"
                                                >
                                                    전체 보기 →
                                                </Link>
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

                            {/* 더 불러오기 */}
                            {hasMore && posts.length > 0 && (
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

            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>&copy; 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
