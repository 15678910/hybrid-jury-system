import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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
    const [selectedCategory, setSelectedCategory] = useState('전체');

    // 동영상 추가 모달
    const [showAddModal, setShowAddModal] = useState(false);
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [writerName, setWriterName] = useState('');
    const [newVideo, setNewVideo] = useState({ title: '', url: '', description: '', category: '참심제 소개' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['전체', '참심제 소개', '해외 사례', '사법개혁', '인터뷰', '뉴스'];

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

    // 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        try {
            const codesRef = collection(db, 'writerCodes');
            const q = query(codesRef);
            const querySnapshot = await getDocs(q);

            const validCode = querySnapshot.docs.find(doc =>
                doc.data().code === writerCode && doc.data().active === true
            );

            if (validCode) {
                setIsVerified(true);
                setWriterName(validCode.data().name);
            } else {
                alert('유효하지 않거나 비활성화된 작성자 코드입니다.');
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            alert('인증에 실패했습니다.');
        }
    };

    // 동영상 추가
    const handleAddVideo = async () => {
        if (!newVideo.title || !newVideo.url) {
            alert('제목과 URL을 입력해주세요.');
            return;
        }

        const videoId = extractYouTubeId(newVideo.url);
        if (!videoId) {
            alert('유효한 YouTube URL을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const docRef = await addDoc(collection(db, 'videos'), {
                ...newVideo,
                videoId,
                author: writerName,
                writerCode,
                createdAt: serverTimestamp()
            });

            setVideos([{
                id: docRef.id,
                ...newVideo,
                videoId,
                author: writerName
            }, ...videos]);

            setNewVideo({ title: '', url: '', description: '', category: '참심제 소개' });
            setShowAddModal(false);
            alert('동영상이 추가되었습니다!');
        } catch (error) {
            console.error('Error adding video:', error);
            alert('추가에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredVideos = selectedCategory === '전체'
        ? videos
        : videos.filter(v => v.category === selectedCategory);

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
                            <Link to="/blog" className="text-gray-600 hover:text-blue-600">블로그</Link>
                            <Link to="/videos" className="text-blue-600 font-semibold">동영상</Link>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                            >
                                동영상 추가
                            </button>
                        </div>
                    </nav>
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

                    {/* 카테고리 필터 */}
                    <div className="flex justify-center gap-3 mb-10 flex-wrap">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    selectedCategory === category
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
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
                                {filteredVideos.map(video => {
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
                                                <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full mb-2">
                                                    {video.category}
                                                </span>
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

                            {filteredVideos.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    {videos.length === 0 ? '등록된 동영상이 없습니다.' : '해당 카테고리의 동영상이 없습니다.'}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* 동영상 추가 모달 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">동영상 추가</h2>
                                <button
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setIsVerified(false);
                                        setWriterCode('');
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {!isVerified ? (
                                <div>
                                    <p className="text-gray-600 mb-4">동영상을 추가하려면 작성자 코드를 입력해주세요.</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={writerCode}
                                            onChange={(e) => setWriterCode(e.target.value)}
                                            placeholder="작성자 코드"
                                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                        />
                                        <button
                                            onClick={verifyWriterCode}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            인증
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                                        ✓ {writerName}님으로 인증되었습니다.
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
                                        <input
                                            type="text"
                                            value={newVideo.url}
                                            onChange={(e) => setNewVideo({...newVideo, url: e.target.value})}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">YouTube 영상 URL을 붙여넣으세요</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                                        <input
                                            type="text"
                                            value={newVideo.title}
                                            onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                                            placeholder="동영상 제목"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                        <select
                                            value={newVideo.category}
                                            onChange={(e) => setNewVideo({...newVideo, category: e.target.value})}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                        >
                                            {categories.filter(c => c !== '전체').map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
                                        <textarea
                                            value={newVideo.description}
                                            onChange={(e) => setNewVideo({...newVideo, description: e.target.value})}
                                            placeholder="동영상에 대한 간단한 설명"
                                            rows={3}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                        />
                                    </div>

                                    {/* 미리보기 */}
                                    {newVideo.url && extractYouTubeId(newVideo.url) && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">미리보기</label>
                                            <div className="aspect-video rounded-lg overflow-hidden">
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${extractYouTubeId(newVideo.url)}`}
                                                    className="w-full h-full"
                                                    frameBorder="0"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAddVideo}
                                        disabled={isSubmitting}
                                        className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400"
                                    >
                                        {isSubmitting ? '추가 중...' : '동영상 추가'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
