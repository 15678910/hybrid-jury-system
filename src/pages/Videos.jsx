import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

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

    // Firestore에서 동영상 목록 불러오기
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const videosRef = collection(db, 'videos');
                const querySnapshot = await getDocs(videosRef);

                const firestoreVideos = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // 클라이언트에서 정렬
                firestoreVideos.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });

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
            <Header />

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
