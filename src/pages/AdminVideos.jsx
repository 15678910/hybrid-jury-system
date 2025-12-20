import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    collection,
    query,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// 관리자 비밀번호
const ADMIN_PASSWORD = 'admin1234';

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

export default function AdminVideos() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');

    // 동영상 관리
    const [videos, setVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(true);

    // 동영상 추가/수정 모달
    const [showModal, setShowModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [videoForm, setVideoForm] = useState({
        title: '',
        url: '',
        description: '',
        category: '참심제 소개'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['참심제 소개', '해외 사례', '사법개혁', '인터뷰', '뉴스'];

    // 관리자 인증
    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            alert('비밀번호가 틀립니다.');
        }
    };

    // 동영상 목록 불러오기
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchVideos = async () => {
            try {
                const videosRef = collection(db, 'videos');
                const q = query(videosRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const videosData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setVideos(videosData);
            } catch (error) {
                console.error('Error fetching videos:', error);
            } finally {
                setLoadingVideos(false);
            }
        };

        fetchVideos();
    }, [isAuthenticated]);

    // 동영상 추가
    const handleAddVideo = async () => {
        if (!videoForm.title || !videoForm.url) {
            alert('제목과 URL을 입력해주세요.');
            return;
        }

        const videoId = extractYouTubeId(videoForm.url);
        if (!videoId) {
            alert('유효한 YouTube URL을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const docRef = await addDoc(collection(db, 'videos'), {
                ...videoForm,
                videoId,
                author: '관리자',
                createdAt: serverTimestamp()
            });

            setVideos([{
                id: docRef.id,
                ...videoForm,
                videoId,
                author: '관리자'
            }, ...videos]);

            resetForm();
            alert('동영상이 추가되었습니다.');
        } catch (error) {
            console.error('Error adding video:', error);
            alert('추가에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 동영상 수정
    const handleUpdateVideo = async () => {
        if (!videoForm.title || !videoForm.url) {
            alert('제목과 URL을 입력해주세요.');
            return;
        }

        const videoId = extractYouTubeId(videoForm.url);
        if (!videoId) {
            alert('유효한 YouTube URL을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            await updateDoc(doc(db, 'videos', editingVideo.id), {
                ...videoForm,
                videoId,
                updatedAt: serverTimestamp()
            });

            setVideos(videos.map(v =>
                v.id === editingVideo.id
                    ? { ...v, ...videoForm, videoId }
                    : v
            ));

            resetForm();
            alert('동영상이 수정되었습니다.');
        } catch (error) {
            console.error('Error updating video:', error);
            alert('수정에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 동영상 삭제
    const handleDeleteVideo = async (videoId) => {
        if (!confirm('정말 이 동영상을 삭제하시겠습니까?')) return;

        try {
            await deleteDoc(doc(db, 'videos', videoId));
            setVideos(videos.filter(v => v.id !== videoId));
            alert('동영상이 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 수정 모달 열기
    const openEditModal = (video) => {
        setEditingVideo(video);
        setVideoForm({
            title: video.title,
            url: video.url,
            description: video.description || '',
            category: video.category || '참심제 소개'
        });
        setShowModal(true);
    };

    // 폼 초기화
    const resetForm = () => {
        setShowModal(false);
        setEditingVideo(null);
        setVideoForm({
            title: '',
            url: '',
            description: '',
            category: '참심제 소개'
        });
    };

    // 로그인 화면
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        동영상 관리자 로그인
                    </h1>
                    <div className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="관리자 비밀번호"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleLogin}
                            className="w-full px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                        >
                            로그인
                        </button>
                    </div>
                    <div className="mt-6 text-center">
                        <Link to="/videos" className="text-red-600 hover:underline text-sm">
                            ← 동영상 목록으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            ⚖️ 사법개혁
                        </Link>
                        <div className="flex gap-4 items-center">
                            <Link to="/videos" className="text-gray-600 hover:text-red-600">동영상</Link>
                            <button
                                onClick={() => setIsAuthenticated(false)}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                로그아웃
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="py-8 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">동영상 관리</h1>
                        <button
                            onClick={() => setShowModal(true)}
                            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                        >
                            + 동영상 추가
                        </button>
                    </div>

                    {/* 동영상 목록 */}
                    {loadingVideos ? (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow">
                            등록된 동영상이 없습니다.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map(video => {
                                const videoId = video.videoId || extractYouTubeId(video.url);
                                return (
                                    <div key={video.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                                        {/* 썸네일 */}
                                        <div className="aspect-video bg-gray-100">
                                            <img
                                                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                alt={video.title}
                                                className="w-full h-full object-cover"
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
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                    {video.description}
                                                </p>
                                            )}
                                            {/* 관리 버튼 */}
                                            <div className="flex gap-2 pt-3 border-t">
                                                <button
                                                    onClick={() => openEditModal(video)}
                                                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteVideo(video.id)}
                                                    className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* 동영상 추가/수정 모달 */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingVideo ? '동영상 수정' : '동영상 추가'}
                                </h2>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL *</label>
                                    <input
                                        type="text"
                                        value={videoForm.url}
                                        onChange={(e) => setVideoForm({...videoForm, url: e.target.value})}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                                    <input
                                        type="text"
                                        value={videoForm.title}
                                        onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                                        placeholder="동영상 제목"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                    <select
                                        value={videoForm.category}
                                        onChange={(e) => setVideoForm({...videoForm, category: e.target.value})}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
                                    <textarea
                                        value={videoForm.description}
                                        onChange={(e) => setVideoForm({...videoForm, description: e.target.value})}
                                        placeholder="동영상에 대한 간단한 설명"
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                    />
                                </div>

                                {/* 미리보기 */}
                                {videoForm.url && extractYouTubeId(videoForm.url) && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">미리보기</label>
                                        <div className="aspect-video rounded-lg overflow-hidden">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${extractYouTubeId(videoForm.url)}`}
                                                className="w-full h-full"
                                                frameBorder="0"
                                                allowFullScreen
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={resetForm}
                                        className="flex-1 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={editingVideo ? handleUpdateVideo : handleAddVideo}
                                        disabled={isSubmitting}
                                        className="flex-1 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-red-400"
                                    >
                                        {isSubmitting ? '처리 중...' : (editingVideo ? '수정 완료' : '동영상 추가')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
