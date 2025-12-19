import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// YouTube URL에서 비디오 ID 추출
const extractYouTubeId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// 초기 샘플 데이터 (localStorage에 없을 때 사용)
const initialSamplePosts = [
    {
        id: 'sample-1',
        title: '참심제란 무엇인가?',
        summary: '시민이 직업법관과 함께 재판에 참여하는 참심제의 개념과 역사를 알아봅니다.',
        content: `참심제(參審制)는 일반 시민이 직업법관과 함께 재판부를 구성하여 사실인정과 양형에 참여하는 제도입니다.

배심제와 달리 참심원은 법관과 동등한 권한을 가지며, 유무죄 판단뿐 아니라 형량 결정에도 참여합니다.

## 참심제의 특징
- 시민법관이 직업법관과 동등한 표결권 보유
- 사실인정 + 법률적용 + 양형 모두 참여
- 헌법 개정 없이 도입 가능`,
        author: '시민법정',
        category: '참심제 소개',
        createdAt: '2024-12-19',
        isSample: true
    },
    {
        id: 'sample-2',
        title: '독일 참심제의 성공 사례',
        summary: '100년 넘게 운영된 독일 참심제의 역사와 성과를 분석합니다.',
        content: `독일의 참심제(Schöffengericht)는 1877년부터 시작되어 현재까지 성공적으로 운영되고 있습니다.

## 독일 참심제 구조
- 참심법원: 직업법관 1명 + 참심원 2명
- 참심원 임기: 5년
- 선정 방식: 지방자치단체 추천 → 선정위원회 최종 선발`,
        author: '시민법정',
        category: '해외 사례',
        createdAt: '2024-12-18',
        isSample: true
    },
    {
        id: 'sample-3',
        title: '왜 지금 사법개혁이 필요한가',
        summary: '한국 사법부의 현실과 시민 참여 확대의 필요성을 살펴봅니다.',
        content: `최근 여론조사에 따르면 국민의 60% 이상이 법원 판결을 신뢰하지 않는다고 답했습니다.

## 현행 국민참여재판의 한계
- 권고적 효력만 있음 (법관이 무시 가능)
- 적용 대상 제한적
- 참여율 저조`,
        author: '시민법정',
        category: '사법개혁',
        createdAt: '2024-12-17',
        isSample: true
    }
];

const initialSampleVideos = [
    {
        id: 'sample-video-1',
        title: 'Why Finland And Denmark Are Happier Than The U.S.',
        url: 'https://www.youtube.com/watch?v=6Pm0Mn0-jYU',
        videoId: '6Pm0Mn0-jYU',
        category: '해외 사례',
        isSample: true
    }
];

// localStorage에서 샘플 데이터 가져오기 (삭제된 것 제외)
const getSamplePosts = () => {
    const deleted = JSON.parse(localStorage.getItem('deletedSamplePosts') || '[]');
    return initialSamplePosts.filter(p => !deleted.includes(p.id));
};

const getSampleVideos = () => {
    const deleted = JSON.parse(localStorage.getItem('deletedSampleVideos') || '[]');
    return initialSampleVideos.filter(v => !deleted.includes(v.id));
};

export default function Media() {
    const [posts, setPosts] = useState([]);
    const [videos, setVideos] = useState([]);
    const [featuredVideo, setFeaturedVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    // 더보기 상태
    const [showAllPosts, setShowAllPosts] = useState(false);
    const [showAllVideos, setShowAllVideos] = useState(false);
    const INITIAL_POSTS_COUNT = 3;
    const INITIAL_VIDEOS_COUNT = 4;

    // Firestore + 샘플 데이터 불러오기
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 샘플 데이터 가져오기 (삭제되지 않은 것만)
                const samplePosts = getSamplePosts();
                const sampleVideos = getSampleVideos();

                // 블로그 글 가져오기 (최신순)
                const postsRef = collection(db, 'posts');
                const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
                const postsSnapshot = await getDocs(postsQuery);

                const firestorePosts = postsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Firestore 글을 앞에, 샘플 글을 뒤에 배치
                setPosts([...firestorePosts, ...samplePosts]);

                // 동영상 가져오기 (최신순)
                const videosRef = collection(db, 'videos');
                const videosQuery = query(videosRef, orderBy('createdAt', 'desc'));
                const videosSnapshot = await getDocs(videosQuery);

                const firestoreVideos = videosSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Firestore 동영상을 앞에, 샘플 동영상을 뒤에 배치
                const allVideos = [...firestoreVideos, ...sampleVideos];
                setVideos(allVideos);
                if (allVideos.length > 0) {
                    setFeaturedVideo(allVideos[0]);
                }
            } catch (error) {
                console.error('Error fetching media data:', error);
                // 에러 시 샘플 데이터만 표시
                setPosts(getSamplePosts());
                const sampleVids = getSampleVideos();
                setVideos(sampleVids);
                if (sampleVids.length > 0) {
                    setFeaturedVideo(sampleVids[0]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 날짜 포맷팅 함수
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        if (timestamp.toDate) {
            return timestamp.toDate().toLocaleDateString('ko-KR');
        }
        if (timestamp instanceof Date) {
            return timestamp.toLocaleDateString('ko-KR');
        }
        return '';
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
                            <Link to="/media" className="text-blue-600 font-semibold">미디어</Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-6xl">

                    {/* 블로그 글 섹션 */}
                    <section className="mb-16">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 pb-2 inline-block">
                                블로그
                            </h2>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : posts.length > 0 ? (
                            <>
                                <div className="space-y-4">
                                    {(showAllPosts ? posts : posts.slice(0, INITIAL_POSTS_COUNT)).map(post => (
                                        <article
                                            key={post.id}
                                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                                            {post.category}
                                                        </span>
                                                    </div>
                                                    <Link to={`/blog/${post.id}`}>
                                                        <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 mb-2">
                                                            {post.title}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-gray-600 mb-4 line-clamp-2">
                                                        {post.summary}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-gray-400">
                                                            {formatDate(post.createdAt)} · {post.author}
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
                                {posts.length > INITIAL_POSTS_COUNT && (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setShowAllPosts(!showAllPosts)}
                                            className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
                                        >
                                            {showAllPosts ? '접기' : `더보기 (${posts.length - INITIAL_POSTS_COUNT}개 더)`}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg shadow-md">
                                <div className="text-4xl mb-4">📝</div>
                                <p className="text-gray-500">아직 작성된 글이 없습니다</p>
                            </div>
                        )}
                    </section>

                    {/* 동영상 섹션 */}
                    <section>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-red-500 pb-2 inline-block">
                                동영상
                            </h2>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : videos.length > 0 ? (
                            <>
                                {/* 메인 동영상 */}
                                {featuredVideo && (
                                    <div className="mb-6">
                                        <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${featuredVideo.videoId || extractYouTubeId(featuredVideo.url)}`}
                                                title={featuredVideo.title}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <div className="mt-3">
                                            <h3 className="font-bold text-lg text-gray-900">{featuredVideo.title}</h3>
                                            {featuredVideo.description && (
                                                <p className="text-gray-600 text-sm mt-1">{featuredVideo.description}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 동영상 썸네일 목록 */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {(showAllVideos ? videos : videos.slice(0, INITIAL_VIDEOS_COUNT)).map(video => {
                                        const videoId = video.videoId || extractYouTubeId(video.url);
                                        return (
                                            <button
                                                key={video.id}
                                                onClick={() => setFeaturedVideo(video)}
                                                className={`group text-left ${featuredVideo?.id === video.id ? 'ring-2 ring-red-500 rounded-lg' : ''}`}
                                            >
                                                <div className="aspect-video rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                                                    <img
                                                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                </div>
                                                <p className="mt-2 text-sm text-gray-700 line-clamp-2 group-hover:text-red-600 transition-colors">
                                                    {video.title}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                                {videos.length > INITIAL_VIDEOS_COUNT && (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={() => setShowAllVideos(!showAllVideos)}
                                            className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
                                        >
                                            {showAllVideos ? '접기' : `더보기 (${videos.length - INITIAL_VIDEOS_COUNT}개 더)`}
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg shadow-md">
                                <div className="text-4xl mb-4">🎬</div>
                                <p className="text-gray-500">아직 등록된 동영상이 없습니다</p>
                            </div>
                        )}
                    </section>

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
