import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

// 로컬 스토리지 캐시 키
const CACHE_KEY = 'videos_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30분으로 연장

// 로컬 스토리지에서 캐시 가져오기 (만료되어도 일단 반환)
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

// SNS 아이콘들
const KakaoIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
);

const FacebookIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const XIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const LinkIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const ShareIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

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
    // URL 파라미터에서 동영상 ID 가져오기
    const [searchParams, setSearchParams] = useSearchParams();
    const sharedVideoId = searchParams.get('v');
    const videoRefs = useRef({});
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [modalVideoId, setModalVideoId] = useState(null);
    const [modalVideoTitle, setModalVideoTitle] = useState('');

    // 초기 데이터를 캐시에서 먼저 로드 (만료되어도 일단 표시)
    const cacheResult = getLocalCache();
    const cachedData = cacheResult?.data || null;
    const [videos, setVideos] = useState(cachedData || []);
    const [loading, setLoading] = useState(!cachedData); // 캐시 있으면 로딩 안함
    const [kakaoReady, setKakaoReady] = useState(false);
    const [copiedVideoId, setCopiedVideoId] = useState(null);
    const [openShareMenu, setOpenShareMenu] = useState(null); // 열린 공유 메뉴 videoId
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const VIDEOS_PER_PAGE = 9;

    // 공유된 동영상 모달로 표시
    useEffect(() => {
        if (sharedVideoId && !loading) {
            // 동영상 정보 찾기
            const sharedVideo = videos.find(v => {
                const vId = v.videoId || extractYouTubeId(v.url);
                return vId === sharedVideoId;
            });
            if (sharedVideo) {
                setModalVideoId(sharedVideoId);
                setModalVideoTitle(sharedVideo.title);
                setShowVideoModal(true);
            }
        }
    }, [sharedVideoId, loading, videos]);

    // 모달 닫기
    const closeVideoModal = () => {
        setShowVideoModal(false);
        setModalVideoId(null);
        setModalVideoTitle('');
        // URL에서 v 파라미터 제거
        setSearchParams({});
    };

    // 카카오 SDK 초기화 (지연 로드)
    useEffect(() => {
        // 페이지 로드 후 1초 뒤에 초기화 (동영상 렌더링 우선)
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

    // ⚠️ 수정금지: SNS 공유 URL - 영문 도메인 사용 (한글 도메인 인코딩 문제 방지)
    // 공유 함수들
    const shareToKakao = (video, videoId) => {
        const videoUrl = `https://xn--lg3b0kt4n41f.kr/videos?v=${videoId}`;

        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: video.title,
                        description: video.description || '시민법정 - 참심제와 사법개혁',
                        imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                        link: {
                            mobileWebUrl: videoUrl,
                            webUrl: videoUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '동영상 보기',
                            link: {
                                mobileWebUrl: videoUrl,
                                webUrl: videoUrl,
                            },
                        },
                    ],
                });
            } catch (e) {
                console.error('Kakao share error:', e);
                fallbackShare(video.title, videoUrl);
            }
        } else {
            fallbackShare(video.title, videoUrl);
        }
    };

    const fallbackShare = (title, url) => {
        navigator.clipboard.writeText(`${title}\n${url}`);
        alert('링크가 복사되었습니다!\n카카오톡에 붙여넣기 해주세요.');
    };

    const shareToFacebook = (videoId) => {
        const videoUrl = `https://youtu.be/${videoId}`;
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToTwitter = (video, videoId) => {
        const videoUrl = `https://youtu.be/${videoId}`;
        const tweetText = `${video.title}\n\n#시민법정 #참심제 #사법개혁`;
        window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(tweetText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const copyLink = (video, videoId) => {
        const videoUrl = `https://youtu.be/${videoId}`;
        navigator.clipboard.writeText(videoUrl);
        setCopiedVideoId(videoId);
        setTimeout(() => setCopiedVideoId(null), 2000);
    };

    const shareToInstagram = (video, videoId) => {
        const videoUrl = `https://youtu.be/${videoId}`;
        navigator.clipboard.writeText(`${video.title} ${videoUrl}`);
        alert('텍스트가 복사되었습니다!\n인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    // Firestore에서 동영상 목록 불러오기 (로컬 스토리지 캐싱 + 백그라운드 업데이트)
    useEffect(() => {
        const fetchVideos = async () => {
            // 캐시가 있으면 이미 표시 중이므로 백그라운드에서 최신 데이터 가져오기
            try {
                const videosRef = collection(db, 'videos');
                const q = query(videosRef, orderBy('createdAt', 'desc'), limit(VIDEOS_PER_PAGE));
                const querySnapshot = await getDocs(q);

                const firestoreVideos = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 로컬 스토리지 캐시 저장
                setLocalCache(firestoreVideos);

                setVideos(firestoreVideos);
                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
                setHasMore(querySnapshot.docs.length >= VIDEOS_PER_PAGE);
            } catch (error) {
                console.error('Error fetching videos:', error);
                if (!cachedData) setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    // 더 불러오기
    const loadMore = async () => {
        if (loadingMore || !hasMore || !lastDoc) return;

        setLoadingMore(true);
        try {
            const videosRef = collection(db, 'videos');
            const q = query(videosRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(VIDEOS_PER_PAGE));
            const querySnapshot = await getDocs(q);

            const moreVideos = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const newVideos = [...videos, ...moreVideos];
            setVideos(newVideos);
            videosCache.data = newVideos; // 캐시 업데이트
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length >= VIDEOS_PER_PAGE);
        } catch (error) {
            console.error('Error loading more videos:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* 공유된 동영상 모달 */}
            {showVideoModal && modalVideoId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closeVideoModal}>
                    <div className="relative w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
                        {/* 닫기 버튼 */}
                        <button
                            onClick={closeVideoModal}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {/* 제목 */}
                        <h3 className="text-white text-lg font-bold mb-3 truncate">{modalVideoTitle}</h3>
                        {/* 동영상 */}
                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                            <iframe
                                src={`https://www.youtube.com/embed/${modalVideoId}?autoplay=1`}
                                title={modalVideoTitle}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}

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
                                        <div
                                            key={video.id}
                                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all relative"
                                        >
                                            {/* 썸네일/영상 */}
                                            <div className="aspect-video overflow-hidden rounded-t-xl">
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
                                                {/* 제목 + 공유 버튼 (같은 줄) */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-bold text-gray-900 line-clamp-2 flex-1">
                                                        {video.title}
                                                    </h3>
                                                    {/* 공유 버튼 */}
                                                    <div className="relative flex-shrink-0">
                                                        <button
                                                            onClick={() => setOpenShareMenu(openShareMenu === videoId ? null : videoId)}
                                                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                                                            title="공유"
                                                        >
                                                            <ShareIcon className="w-5 h-5" />
                                                        </button>

                                                        {/* 공유 메뉴 팝업 */}
                                                        {openShareMenu === videoId && (
                                                            <>
                                                                {/* 배경 클릭 시 닫기 */}
                                                                <div
                                                                    className="fixed inset-0 z-40"
                                                                    onClick={() => setOpenShareMenu(null)}
                                                                />
                                                                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-2xl border p-4 z-50" style={{ minWidth: '220px' }}>
                                                                    <p className="text-sm text-gray-700 mb-3 font-medium">공유하기</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        <button
                                                                            onClick={() => { shareToKakao(video, videoId); setOpenShareMenu(null); }}
                                                                            className="w-11 h-11 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform shadow-md"
                                                                            title="카카오톡"
                                                                        >
                                                                            <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { shareToFacebook(videoId); setOpenShareMenu(null); }}
                                                                            className="w-11 h-11 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform shadow-md"
                                                                            title="페이스북"
                                                                        >
                                                                            <FacebookIcon className="w-6 h-6 text-white" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { shareToTwitter(video, videoId); setOpenShareMenu(null); }}
                                                                            className="w-11 h-11 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform shadow-md"
                                                                            title="X"
                                                                        >
                                                                            <XIcon className="w-5 h-5 text-white" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { shareToInstagram(video, videoId); setOpenShareMenu(null); }}
                                                                            className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform shadow-md"
                                                                            title="인스타그램"
                                                                        >
                                                                            <InstagramIcon className="w-6 h-6 text-white" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { copyLink(video, videoId); setOpenShareMenu(null); }}
                                                                            className={`w-11 h-11 flex items-center justify-center rounded-full hover:scale-110 transition-all shadow-md ${
                                                                                copiedVideoId === videoId
                                                                                    ? 'bg-green-500'
                                                                                    : 'bg-gray-600'
                                                                            }`}
                                                                            title={copiedVideoId === videoId ? "복사됨!" : "링크 복사"}
                                                                        >
                                                                            {copiedVideoId === videoId ? (
                                                                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            ) : (
                                                                                <LinkIcon className="w-6 h-6 text-white" />
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                {video.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-2 mt-2">
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

                            {/* 더 불러오기 버튼 */}
                            {hasMore && videos.length > 0 && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
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
