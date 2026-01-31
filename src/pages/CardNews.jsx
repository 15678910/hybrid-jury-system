import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import { KakaoIcon, FacebookIcon, XIcon, TelegramIcon, InstagramIcon, LinkIcon, ShareIcon } from '../components/icons';

// 로컬 스토리지 캐시 키
const CACHE_KEY = 'cardnews_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30분

// 로컬 스토리지에서 캐시 가져오기
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

export default function CardNews() {
    const cacheResult = getLocalCache();
    const cachedData = cacheResult?.data || null;
    const [cardNews, setCardNews] = useState(cachedData || []);
    const [loading, setLoading] = useState(!cachedData);
    const [kakaoReady, setKakaoReady] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [openShareMenu, setOpenShareMenu] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const ITEMS_PER_PAGE = 12;

    // 카카오 SDK 초기화
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

    // 공유 함수들
    const shareToKakao = (card) => {
        const cardUrl = `https://xn--lg3b0kt4n41f.kr/cardnews?id=${card.id}`;
        const imageUrl = card.images?.[0] || '';

        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: card.title,
                        description: card.description || '시민법정 - 참심제와 사법개혁',
                        imageUrl: imageUrl,
                        link: {
                            mobileWebUrl: cardUrl,
                            webUrl: cardUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '더 보기',
                            link: {
                                mobileWebUrl: cardUrl,
                                webUrl: cardUrl,
                            },
                        },
                    ],
                });
            } catch (e) {
                console.error('Kakao share error:', e);
                fallbackShare(card.title, cardUrl);
            }
        } else {
            fallbackShare(card.title, cardUrl);
        }
    };

    const fallbackShare = (title, url) => {
        navigator.clipboard.writeText(`${title}\n${url}`);
        alert('링크가 복사되었습니다!\n카카오톡에 붙여넣기 해주세요.');
    };

    const shareToFacebook = (card) => {
        const cardUrl = `https://xn--lg3b0kt4n41f.kr/cardnews?id=${card.id}`;
        const shareText = `${card.title}\n${cardUrl}`;
        navigator.clipboard.writeText(shareText);
        alert('링크가 복사되었습니다!\n페이스북에 붙여넣기 해주세요.');
        window.open('https://www.facebook.com/', '_blank');
    };

    const shareToTwitter = (card) => {
        const cardUrl = `https://xn--lg3b0kt4n41f.kr/cardnews?id=${card.id}`;
        const tweetText = `${card.title}\n\n${cardUrl}\n\n#시민법정 #참심제 #사법개혁`;
        navigator.clipboard.writeText(tweetText);
        alert('텍스트가 복사되었습니다!\nX에서 붙여넣기 해주세요.');
        window.open('https://x.com/', '_blank');
    };

    const shareToInstagram = (card) => {
        const cardUrl = `https://xn--lg3b0kt4n41f.kr/cardnews?id=${card.id}`;
        navigator.clipboard.writeText(`${card.title}\n${cardUrl}`);
        alert('텍스트가 복사되었습니다!\n인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
        window.open('https://www.instagram.com/', '_blank');
    };

    const shareToTelegram = (card) => {
        const cardUrl = `https://xn--lg3b0kt4n41f.kr/cardnews?id=${card.id}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(card.title)}`, '_blank');
    };

    const copyLink = (card) => {
        const cardUrl = `https://xn--lg3b0kt4n41f.kr/cardnews?id=${card.id}`;
        navigator.clipboard.writeText(cardUrl);
        setCopiedId(card.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Firestore에서 카드뉴스 목록 불러오기
    useEffect(() => {
        const fetchCardNews = async () => {
            try {
                const cardNewsRef = collection(db, 'cardnews');
                const q = query(cardNewsRef, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
                const querySnapshot = await getDocs(q);

                const firestoreCardNews = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setLocalCache(firestoreCardNews);
                setCardNews(firestoreCardNews);
                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
                setHasMore(querySnapshot.docs.length >= ITEMS_PER_PAGE);
            } catch (error) {
                console.error('Error fetching card news:', error);
                if (!cachedData) setCardNews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCardNews();
    }, []);

    // 더 불러오기
    const loadMore = async () => {
        if (loadingMore || !hasMore || !lastDoc) return;

        setLoadingMore(true);
        try {
            const cardNewsRef = collection(db, 'cardnews');
            const q = query(cardNewsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(ITEMS_PER_PAGE));
            const querySnapshot = await getDocs(q);

            const moreCardNews = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const newCardNews = [...cardNews, ...moreCardNews];
            setCardNews(newCardNews);
            setLocalCache(newCardNews);
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length >= ITEMS_PER_PAGE);
        } catch (error) {
            console.error('Error loading more card news:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // 이미지 뷰어 열기
    const openImageViewer = (card) => {
        setSelectedCard(card);
        setCurrentImageIndex(0);
    };

    // 이미지 뷰어 닫기
    const closeImageViewer = () => {
        setSelectedCard(null);
        setCurrentImageIndex(0);
    };

    // 이전/다음 이미지
    const prevImage = () => {
        if (selectedCard && currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    const nextImage = () => {
        if (selectedCard && currentImageIndex < selectedCard.images.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* 이미지 뷰어 모달 */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={closeImageViewer}>
                    <div className="relative w-full max-w-4xl mx-4" onClick={e => e.stopPropagation()}>
                        {/* 닫기 버튼 */}
                        <button
                            onClick={closeImageViewer}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* 제목 */}
                        <h3 className="text-white text-lg font-bold mb-3">{selectedCard.title}</h3>

                        {/* 이미지 */}
                        <div className="relative">
                            <img
                                src={selectedCard.images[currentImageIndex]}
                                alt={`${selectedCard.title} - ${currentImageIndex + 1}`}
                                className="w-full max-h-[70vh] object-contain rounded-lg"
                            />

                            {/* 이전 버튼 */}
                            {currentImageIndex > 0 && (
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}

                            {/* 다음 버튼 */}
                            {currentImageIndex < selectedCard.images.length - 1 && (
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* 페이지 표시 */}
                        <div className="text-center text-white mt-4">
                            {currentImageIndex + 1} / {selectedCard.images.length}
                        </div>

                        {/* 하단 썸네일 */}
                        {selectedCard.images.length > 1 && (
                            <div className="flex justify-center gap-2 mt-4 overflow-x-auto pb-2">
                                {selectedCard.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                            idx === currentImageIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt={`썸네일 ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* 페이지 타이틀 */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">📰 카드뉴스</h1>
                        <p className="text-gray-600">참심제와 사법개혁 관련 카드뉴스를 확인하세요</p>
                    </div>

                    {/* 로딩 */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-500">카드뉴스를 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            {/* 카드뉴스 그리드 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cardNews.map(card => (
                                    <div
                                        key={card.id}
                                        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
                                    >
                                        {/* 썸네일 (첫 번째 이미지) */}
                                        <div
                                            className="aspect-square overflow-hidden cursor-pointer relative group"
                                            onClick={() => openImageViewer(card)}
                                        >
                                            {card.images?.[0] ? (
                                                <>
                                                    <img
                                                        src={card.images[0]}
                                                        alt={card.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    {/* 이미지 개수 표시 */}
                                                    {card.images.length > 1 && (
                                                        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                                                            +{card.images.length - 1}장
                                                        </div>
                                                    )}
                                                    {/* 호버 시 오버레이 */}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                                            클릭하여 보기
                                                        </span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <span className="text-gray-400">이미지 없음</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* 정보 */}
                                        <div className="p-4">
                                            {/* 카테고리 태그 */}
                                            {card.category && (
                                                <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mb-2">
                                                    {card.category}
                                                </span>
                                            )}

                                            {/* 제목 + 공유 버튼 */}
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-gray-900 line-clamp-2 flex-1">
                                                    {card.title}
                                                </h3>
                                                {/* 공유 버튼 */}
                                                <div className="relative flex-shrink-0">
                                                    <button
                                                        onClick={() => setOpenShareMenu(openShareMenu === card.id ? null : card.id)}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                                                        title="공유"
                                                    >
                                                        <ShareIcon className="w-5 h-5" />
                                                    </button>

                                                    {/* 공유 메뉴 팝업 */}
                                                    {openShareMenu === card.id && (
                                                        <>
                                                            <div
                                                                className="fixed inset-0 z-40"
                                                                onClick={() => setOpenShareMenu(null)}
                                                            />
                                                            <div className="absolute right-0 top-10 bg-white rounded-xl shadow-2xl border p-4 z-50 w-[280px] max-w-[calc(100vw-2rem)]">
                                                                <p className="text-sm text-gray-700 mb-3 font-medium">공유하기</p>
                                                                <div className="grid grid-cols-6 gap-2">
                                                                    <button
                                                                        onClick={() => { shareToKakao(card); setOpenShareMenu(null); }}
                                                                        className="w-11 h-11 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform shadow-md"
                                                                        title="카카오톡"
                                                                    >
                                                                        <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { shareToFacebook(card); setOpenShareMenu(null); }}
                                                                        className="w-11 h-11 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform shadow-md"
                                                                        title="페이스북"
                                                                    >
                                                                        <FacebookIcon className="w-6 h-6 text-white" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { shareToTwitter(card); setOpenShareMenu(null); }}
                                                                        className="w-11 h-11 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform shadow-md"
                                                                        title="X"
                                                                    >
                                                                        <XIcon className="w-5 h-5 text-white" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { shareToInstagram(card); setOpenShareMenu(null); }}
                                                                        className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform shadow-md"
                                                                        title="인스타그램"
                                                                    >
                                                                        <InstagramIcon className="w-6 h-6 text-white" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { shareToTelegram(card); setOpenShareMenu(null); }}
                                                                        className="w-11 h-11 flex items-center justify-center bg-[#0088cc] rounded-full hover:scale-110 transition-transform shadow-md"
                                                                        title="텔레그램"
                                                                    >
                                                                        <TelegramIcon className="w-6 h-6 text-white" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { copyLink(card); setOpenShareMenu(null); }}
                                                                        className={`w-11 h-11 flex items-center justify-center rounded-full hover:scale-110 transition-all shadow-md ${
                                                                            copiedId === card.id
                                                                                ? 'bg-green-500'
                                                                                : 'bg-gray-600'
                                                                        }`}
                                                                        title={copiedId === card.id ? "복사됨!" : "링크 복사"}
                                                                    >
                                                                        {copiedId === card.id ? (
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

                                            {card.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                                                    {card.description}
                                                </p>
                                            )}

                                            {/* 날짜 */}
                                            {card.createdAt && (
                                                <p className="text-xs text-gray-400 mt-3">
                                                    {new Date(card.createdAt.seconds * 1000).toLocaleDateString('ko-KR')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {cardNews.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    등록된 카드뉴스가 없습니다.
                                </div>
                            )}

                            {/* 더 불러오기 버튼 */}
                            {hasMore && cardNews.length > 0 && (
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
