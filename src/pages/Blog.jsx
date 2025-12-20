import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Blog() {
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const categories = ['전체', '참심제 소개', '해외 사례', '사법개혁', '공지사항'];

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
                            <Link
                                to="/blog/write"
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                                글쓰기
                            </Link>
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
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    selectedCategory === category
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
                                                    <Link
                                                        to={`/blog/${post.id}`}
                                                        className="text-blue-600 text-sm font-medium hover:underline"
                                                    >
                                                        자세히 보기 →
                                                    </Link>
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

