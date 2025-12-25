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

export default function Videos() {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [introDropdownOpen, setIntroDropdownOpen] = useState(false);
    const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);

    // Firestore에서 동영상 목록 불러오기
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const videosRef = collection(db, 'videos');
                const q = query(videosRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const firestoreVideos = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setVideos(firestoreVideos);
            } catch (error) {
                console.error('Error fetching videos:', error);
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            ⚖️ 사법개혁
                        </Link>

                        {/* 데스크톱 메뉴 */}
                        <div className="hidden lg:flex space-x-6 text-sm items-center">
                            {/* 소개 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setIntroDropdownOpen(true)}
                                onMouseLeave={() => setIntroDropdownOpen(false)}
                            >
                                <button className="hover:text-blue-600 transition font-medium flex items-center gap-1">
                                    소개
                                    <svg className={`w-4 h-4 transition-transform ${introDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${introDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[140px]">
                                        <a href="/intro.html" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">소개</a>
                                        <a href="/community.html" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">소통방</a>
                                    </div>
                                </div>
                            </div>
                            <Link to="/#necessity" className="hover:text-blue-600 transition font-medium">도입 필요성</Link>
                            <Link to="/#cases" className="hover:text-blue-600 transition font-medium">해외 사례</Link>
                            <Link to="/#constitution" className="hover:text-blue-600 transition font-medium">헌법적 근거</Link>
                            <Link to="/#bill" className="hover:text-blue-600 transition font-medium">법안 제안</Link>

                            {/* 미디어 드롭다운 */}
                            <div
                                className="relative"
                                onMouseEnter={() => setMediaDropdownOpen(true)}
                                onMouseLeave={() => setMediaDropdownOpen(false)}
                            >
                                <button className="hover:text-blue-600 transition font-medium flex items-center gap-1">
                                    미디어
                                    <svg className={`w-4 h-4 transition-transform ${mediaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                <div className={`absolute top-full left-0 mt-0 pt-2 ${mediaDropdownOpen ? 'block' : 'hidden'}`}>
                                    <div className="bg-white rounded-lg shadow-lg border py-2 min-w-[120px]">
                                        <Link to="/blog" className="block px-4 py-2 hover:bg-gray-100 text-gray-700 hover:text-blue-600">블로그</Link>
                                        <Link to="/videos" className="block px-4 py-2 hover:bg-gray-100 text-blue-600 font-semibold">동영상</Link>
                                    </div>
                                </div>
                            </div>

                            <a href="/?poster=true" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-bold">
                                포스터 보기
                            </a>
                            <a href="/#signature" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-bold">
                                참여하기
                            </a>
                        </div>

                        {/* 모바일 햄버거 버튼 */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden text-gray-600 hover:text-blue-600 transition p-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </nav>

                    {/* 모바일 메뉴 */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden bg-white border-t border-gray-200 py-4 space-y-2">
                            <div className="border-b border-gray-200 pb-2 mb-2">
                                <div className="px-4 py-2 text-gray-500 text-sm font-medium">소개</div>
                                <a href="/intro.html" className="block w-full text-left px-6 py-2 hover:bg-gray-100 transition">소개</a>
                                <a href="/community.html" className="block w-full text-left px-6 py-2 hover:bg-gray-100 transition">소통방</a>
                            </div>
                            <Link to="/" className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition">홈</Link>
                            <div className="border-b border-gray-200 pb-2 mb-2">
                                <div className="px-4 py-2 text-gray-500 text-sm font-medium">미디어</div>
                                <Link to="/blog" className="block w-full text-left px-6 py-2 hover:bg-gray-100 transition">블로그</Link>
                                <Link to="/videos" className="block w-full text-left px-6 py-2 hover:bg-gray-100 transition text-blue-600 font-semibold">동영상</Link>
                            </div>
                            <a href="/#signature" className="block w-full text-center mx-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-bold">
                                참여하기
                            </a>
                        </div>
                    )}
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* 페이지 타이틀 */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">동영상</h1>
                        <p className="text-gray-600">참심제와 사법개혁 관련 영상을 시청하세요</p>
                    </div>

                    {/* 로딩 */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">동영상을 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* 동영상 그리드 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {videos.map(video => {
                                    const videoId = video.videoId || extractYouTubeId(video.url);
                                    return (
                                        <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                            {/* 썸네일/영상 */}
                                            <div className="aspect-video">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${videoId}`}
                                                    title={video.title}
                                                    className="w-full h-full"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                            {/* 정보 */}
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                                                    {video.title}
                                                </h3>
                                                {video.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {video.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {videos.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    등록된 동영상이 없습니다.
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
