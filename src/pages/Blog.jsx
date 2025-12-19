import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 샘플 블로그 데이터 (Firestore 데이터가 없을 때 폴백용)
const defaultPosts = [
    {
        id: 1,
        title: '참심제란 무엇인가?',
        summary: '시민이 직업법관과 함께 재판에 참여하는 참심제의 개념과 역사를 알아봅니다.',
        content: `참심제(參審制)는 일반 시민이 직업법관과 함께 재판부를 구성하여 사실인정과 양형에 참여하는 제도입니다.

배심제와 달리 참심원은 법관과 동등한 권한을 가지며, 유무죄 판단뿐 아니라 형량 결정에도 참여합니다.

## 참심제의 특징
- 시민법관이 직업법관과 동등한 표결권 보유
- 사실인정 + 법률적용 + 양형 모두 참여
- 헌법 개정 없이 도입 가능

## 세계 각국의 참심제
독일, 프랑스, 핀란드, 스웨덴 등 많은 민주주의 국가에서 참심제를 운영하고 있습니다.`,
        author: '시민법정',
        date: '2024-12-19',
        category: '참심제 소개',
        image: null
    },
    {
        id: 2,
        title: '독일 참심제의 성공 사례',
        summary: '100년 넘게 운영된 독일 참심제의 역사와 성과를 분석합니다.',
        content: `독일의 참심제(Schöffengericht)는 1877년부터 시작되어 현재까지 성공적으로 운영되고 있습니다.

## 독일 참심제 구조
- 참심법원: 직업법관 1명 + 참심원 2명
- 참심원 임기: 5년
- 선정 방식: 지방자치단체 추천 → 선정위원회 최종 선발

## 성과
- 시민의 사법 참여로 재판 신뢰도 향상
- 법관의 독단적 판단 방지
- 사회 통합 기능`,
        author: '시민법정',
        date: '2024-12-18',
        category: '해외 사례',
        image: null
    },
    {
        id: 3,
        title: '왜 지금 사법개혁이 필요한가',
        summary: '한국 사법부의 현실과 시민 참여 확대의 필요성을 살펴봅니다.',
        content: `최근 여론조사에 따르면 국민의 60% 이상이 법원 판결을 신뢰하지 않는다고 답했습니다.

## 현행 국민참여재판의 한계
- 권고적 효력만 있음 (법관이 무시 가능)
- 적용 대상 제한적
- 참여율 저조

## 참심제 도입의 기대효과
1. 시민 법관의 실질적 결정권 보장
2. 재판의 민주적 정당성 강화
3. 사법부에 대한 국민 신뢰 회복`,
        author: '시민법정',
        date: '2024-12-17',
        category: '사법개혁',
        image: null
    }
];

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

                // Firestore 데이터가 있으면 사용, 없으면 기본 데이터 사용
                if (firestorePosts.length > 0) {
                    setPosts(firestorePosts);
                } else {
                    setPosts(defaultPosts);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
                // 에러 시 기본 데이터 사용
                setPosts(defaultPosts);
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
                                    해당 카테고리의 글이 없습니다.
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

// 블로그 데이터 내보내기 (상세 페이지에서 사용)
export { defaultPosts as blogPosts };
