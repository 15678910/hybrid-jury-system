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
    serverTimestamp,
    where
} from 'firebase/firestore';
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

export default function AdminVideos() {
    // 인증 관련 상태
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [writerName, setWriterName] = useState('');
    const [verifying, setVerifying] = useState(false);

    // 동영상 관리
    const [videos, setVideos] = useState([]);
    const [loadingVideos, setLoadingVideos] = useState(false);

    // 동영상 추가/수정 모달
    const [showModal, setShowModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [videoForm, setVideoForm] = useState({
        title: '',
        url: '',
        description: '',
        category: '해외 사례'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['해외 사례', '사법개혁', '인터뷰', '뉴스'];

    // Firestore에서 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        setVerifying(true);

        // 하드코딩된 테스트 코드
        const hardcodedCodes = {
            'admin1234': '관리자',
            'writer000': '시민법정'
        };

        if (hardcodedCodes[writerCode]) {
            setIsVerified(true);
            setWriterName(hardcodedCodes[writerCode]);
            setVerifying(false);
            return;
        }

        try {
            const codesRef = collection(db, 'writerCodes');
            const q = query(codesRef, where('code', '==', writerCode), where('active', '==', true));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const codeData = querySnapshot.docs[0].data();
                setIsVerified(true);
                setWriterName(codeData.name);
            } else {
                alert('유효하지 않거나 비활성화된 작성자 코드입니다.');
            }
        } catch (error) {
            console.error('Error verifying writer code:', error);
            alert('인증에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setVerifying(false);
        }
    };

    // 인증 후 동영상 목록 불러오기
    useEffect(() => {
        if (isVerified) {
            fetchVideos();
        }
    }, [isVerified]);

    const fetchVideos = async () => {
        setLoadingVideos(true);
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
                author: writerName,
                writerCode: writerCode,
                createdAt: serverTimestamp()
            });

            setVideos([{
                id: docRef.id,
                ...videoForm,
                videoId,
                author: writerName
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
            category: video.category || '해외 사례'
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
            category: '해외 사례'
        });
    };

    // 로그아웃
    const handleLogout = () => {
        setIsVerified(false);
        setWriterCode('');
        setWriterName('');
        setVideos([]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-4xl">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        작성자 관리
                    </h1>

                    {/* 작성자 코드 입력 (미인증 시) */}
                    {!isVerified ? (
                        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">작성자 인증</h2>
                            <p className="text-gray-600 mb-6">
                                작성자 코드를 입력하여 인증해주세요.
                            </p>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={writerCode}
                                    onChange={(e) => setWriterCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                                    placeholder="작성자 코드 입력"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                                <button
                                    onClick={verifyWriterCode}
                                    disabled={verifying}
                                    className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:bg-red-400"
                                >
                                    {verifying ? '확인 중...' : '인증하기'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 인증 완료 표시 */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-green-600 text-xl">✓</span>
                                    <span className="text-green-800">
                                        <strong>{writerName}</strong>님으로 인증되었습니다.
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    로그아웃
                                </button>
                            </div>

                            {/* 새 동영상 추가 버튼 */}
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => {
                                        resetForm();
                                        setShowModal(true);
                                    }}
                                    className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    동영상 추가
                                </button>
                            </div>

                            {/* 동영상 목록 */}
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="px-6 py-4 bg-gray-50 border-b">
                                    <h2 className="text-lg font-bold text-gray-900">전체 동영상 ({videos.length})</h2>
                                </div>

                                {loadingVideos ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="mt-4 text-gray-500">동영상을 불러오는 중...</p>
                                    </div>
                                ) : videos.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        등록된 동영상이 없습니다. 새 동영상을 추가해보세요!
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {videos.map(video => {
                                            const videoId = video.videoId || extractYouTubeId(video.url);
                                            return (
                                                <div key={video.id} className="p-4 hover:bg-gray-50">
                                                    <div className="flex items-center gap-4">
                                                        {/* 썸네일 */}
                                                        <div className="flex-shrink-0 w-24 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                                            <img
                                                                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                                alt={video.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* 정보 */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                                                    {video.category}
                                                                </span>
                                                            </div>
                                                            <h3 className="font-medium text-gray-900 truncate">
                                                                {video.title}
                                                            </h3>
                                                            {video.description && (
                                                                <p className="text-sm text-gray-500 line-clamp-1 mt-1">{video.description}</p>
                                                            )}
                                                        </div>

                                                        {/* 관리 버튼 */}
                                                        <div className="flex gap-2 shrink-0">
                                                            <button
                                                                onClick={() => openEditModal(video)}
                                                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                                                            >
                                                                수정
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteVideo(video.id)}
                                                                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
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
                        </>
                    )}

                    {/* 뒤로가기 */}
                    <div className="mt-8 text-center">
                        <Link to="/videos" className="text-red-600 hover:underline">
                            ← 동영상 목록으로 돌아가기
                        </Link>
                    </div>
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

            {/* 푸터 */}
            <footer className="bg-gray-900 text-gray-400 py-6 px-4">
                <div className="container mx-auto text-center">
                    <p>© 주권자사법개혁추진준비위원회</p>
                </div>
            </footer>
        </div>
    );
}
