import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
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

// 초기 샘플 데이터
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

export default function MediaAdmin() {
    // 인증 상태
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [writerCode, setWriterCode] = useState('');
    const [writerName, setWriterName] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(true);

    // 데이터 상태
    const [posts, setPosts] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    // 탭 상태
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'videos'

    // 글 작성/수정 상태
    const [showPostForm, setShowPostForm] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [postForm, setPostForm] = useState({
        title: '', summary: '', content: '', category: '참심제 소개'
    });

    // 동영상 추가/수정 상태
    const [showVideoForm, setShowVideoForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [videoForm, setVideoForm] = useState({
        title: '', url: '', description: '', category: '참심제 소개'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['참심제 소개', '해외 사례', '사법개혁', '공지사항', '인터뷰', '뉴스'];

    // 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        try {
            const codesRef = collection(db, 'writerCodes');
            const querySnapshot = await getDocs(codesRef);

            const validCode = querySnapshot.docs.find(doc =>
                doc.data().code === writerCode && doc.data().active === true
            );

            if (validCode) {
                setIsAuthenticated(true);
                setWriterName(validCode.data().name);
                setShowAuthModal(false);
            } else {
                alert('유효하지 않거나 비활성화된 작성자 코드입니다.');
            }
        } catch (error) {
            console.error('Error verifying code:', error);
            alert('인증에 실패했습니다.');
        }
    };

    // 데이터 불러오기
    useEffect(() => {
        if (!isAuthenticated) return;

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
                setVideos([...firestoreVideos, ...sampleVideos]);
            } catch (error) {
                console.error('Error fetching data:', error);
                // 에러 시 샘플 데이터만 표시
                setPosts(getSamplePosts());
                setVideos(getSampleVideos());
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated]);

    // 글 작성/수정 제출
    const handlePostSubmit = async () => {
        if (!postForm.title || !postForm.content) {
            alert('제목과 본문을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingPost) {
                if (editingPost.isSample) {
                    // 샘플 수정 → Firestore에 새로 저장하고 샘플은 삭제 처리
                    const docRef = await addDoc(collection(db, 'posts'), {
                        ...postForm,
                        author: writerName,
                        writerCode: writerCode,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        published: true
                    });

                    // 샘플을 삭제된 것으로 표시
                    const deleted = JSON.parse(localStorage.getItem('deletedSamplePosts') || '[]');
                    deleted.push(editingPost.id);
                    localStorage.setItem('deletedSamplePosts', JSON.stringify(deleted));

                    // 새 글을 맨 앞에 추가하고 샘플은 목록에서 제거
                    const newPost = {
                        id: docRef.id,
                        ...postForm,
                        author: writerName,
                        writerCode: writerCode,
                        createdAt: new Date()
                    };
                    setPosts([newPost, ...posts.filter(p => p.id !== editingPost.id)]);
                    alert('샘플 글이 새 글로 저장되었습니다!');
                } else {
                    // 일반 글 수정
                    const postRef = doc(db, 'posts', editingPost.id);
                    await updateDoc(postRef, {
                        ...postForm,
                        updatedAt: serverTimestamp()
                    });

                    setPosts(posts.map(p =>
                        p.id === editingPost.id ? { ...p, ...postForm } : p
                    ));
                    alert('글이 수정되었습니다!');
                }
            } else {
                // 새 글 작성
                const docRef = await addDoc(collection(db, 'posts'), {
                    ...postForm,
                    author: writerName,
                    writerCode: writerCode,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    published: true
                });

                const newPost = {
                    id: docRef.id,
                    ...postForm,
                    author: writerName,
                    writerCode: writerCode,
                    createdAt: new Date()
                };
                setPosts([newPost, ...posts]);
                alert('글이 등록되었습니다!');
                            }

            resetPostForm();
        } catch (error) {
            console.error('Error saving post:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 동영상 추가/수정 제출
    const handleVideoSubmit = async () => {
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
            if (editingVideo) {
                if (editingVideo.isSample) {
                    // 샘플 수정 → Firestore에 새로 저장하고 샘플은 삭제 처리
                    const docRef = await addDoc(collection(db, 'videos'), {
                        ...videoForm,
                        videoId,
                        author: writerName,
                        writerCode: writerCode,
                        createdAt: serverTimestamp()
                    });

                    // 샘플을 삭제된 것으로 표시
                    const deleted = JSON.parse(localStorage.getItem('deletedSampleVideos') || '[]');
                    deleted.push(editingVideo.id);
                    localStorage.setItem('deletedSampleVideos', JSON.stringify(deleted));

                    // 새 동영상을 맨 앞에 추가하고 샘플은 목록에서 제거
                    const newVideo = {
                        id: docRef.id,
                        ...videoForm,
                        videoId,
                        author: writerName,
                        writerCode: writerCode,
                        createdAt: new Date()
                    };
                    setVideos([newVideo, ...videos.filter(v => v.id !== editingVideo.id)]);
                    alert('샘플 동영상이 새 동영상으로 저장되었습니다!');
                } else {
                    // 일반 동영상 수정
                    const videoRef = doc(db, 'videos', editingVideo.id);
                    await updateDoc(videoRef, {
                        ...videoForm,
                        videoId,
                        updatedAt: serverTimestamp()
                    });

                    setVideos(videos.map(v =>
                        v.id === editingVideo.id ? { ...v, ...videoForm, videoId } : v
                    ));
                    alert('동영상이 수정되었습니다!');
                }
            } else {
                // 새 동영상 추가
                const docRef = await addDoc(collection(db, 'videos'), {
                    ...videoForm,
                    videoId,
                    author: writerName,
                    writerCode: writerCode,
                    createdAt: serverTimestamp()
                });

                const newVideo = {
                    id: docRef.id,
                    ...videoForm,
                    videoId,
                    author: writerName,
                    writerCode: writerCode,
                    createdAt: new Date()
                };
                setVideos([newVideo, ...videos]);
                alert('동영상이 추가되었습니다!');
                            }

            resetVideoForm();
        } catch (error) {
            console.error('Error saving video:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 글 삭제
    const handleDeletePost = async (post) => {
        if (!confirm('정말 이 글을 삭제하시겠습니까?')) return;

        try {
            if (post.isSample) {
                // 샘플 삭제 → localStorage에 삭제 표시
                const deleted = JSON.parse(localStorage.getItem('deletedSamplePosts') || '[]');
                deleted.push(post.id);
                localStorage.setItem('deletedSamplePosts', JSON.stringify(deleted));
            } else {
                // Firestore에서 삭제
                await deleteDoc(doc(db, 'posts', post.id));
            }
            setPosts(posts.filter(p => p.id !== post.id));
            alert('글이 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 동영상 삭제
    const handleDeleteVideo = async (video) => {
        if (!confirm('정말 이 동영상을 삭제하시겠습니까?')) return;

        try {
            if (video.isSample) {
                // 샘플 삭제 → localStorage에 삭제 표시
                const deleted = JSON.parse(localStorage.getItem('deletedSampleVideos') || '[]');
                deleted.push(video.id);
                localStorage.setItem('deletedSampleVideos', JSON.stringify(deleted));
            } else {
                // Firestore에서 삭제
                await deleteDoc(doc(db, 'videos', video.id));
            }
            setVideos(videos.filter(v => v.id !== video.id));
            alert('동영상이 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting video:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 글 수정 시작 (인증된 사용자는 모든 글 수정 가능)
    const startEditPost = (post) => {
        setEditingPost(post);
        setPostForm({
            title: post.title,
            summary: post.summary || '',
            content: post.content || '',
            category: post.category || '참심제 소개'
        });
        setShowPostForm(true);
    };

    // 동영상 수정 시작 (인증된 사용자는 모든 동영상 수정 가능)
    const startEditVideo = (video) => {
        setEditingVideo(video);
        setVideoForm({
            title: video.title,
            url: video.url || '',
            description: video.description || '',
            category: video.category || '참심제 소개'
        });
        setShowVideoForm(true);
    };

    // 폼 초기화
    const resetPostForm = () => {
        setShowPostForm(false);
        setEditingPost(null);
        setPostForm({ title: '', summary: '', content: '', category: '참심제 소개' });
    };

    const resetVideoForm = () => {
        setShowVideoForm(false);
        setEditingVideo(null);
        setVideoForm({ title: '', url: '', description: '', category: '참심제 소개' });
    };

    // 날짜 포맷팅
    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        if (timestamp.toDate) return timestamp.toDate().toLocaleDateString('ko-KR');
        if (timestamp instanceof Date) return timestamp.toLocaleDateString('ko-KR');
        return '';
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* 인증 모달 */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">🔐</div>
                            <h2 className="text-xl font-bold text-gray-900">관리자 인증</h2>
                            <p className="text-gray-600 text-sm mt-2">
                                글 작성 및 동영상 관리를 위해<br />작성자 코드를 입력해주세요.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={writerCode}
                                onChange={(e) => setWriterCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                                placeholder="작성자 코드 입력"
                                className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg"
                                autoFocus
                            />
                            <button
                                onClick={verifyWriterCode}
                                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                            >
                                인증하기
                            </button>
                            <Link
                                to="/media"
                                className="block text-center text-gray-500 hover:text-gray-700 text-sm"
                            >
                                ← 미디어 페이지로 돌아가기
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* 인증 후 메인 UI */}
            {isAuthenticated && (
                <>
                    {/* 헤더 */}
                    <header className="bg-white shadow-md sticky top-0 z-40">
                        <div className="container mx-auto px-4">
                            <nav className="flex items-center justify-between py-4">
                                <div className="flex items-center gap-4">
                                    <Link to="/" className="text-2xl font-bold text-blue-600">
                                        ⚖️ 사법개혁
                                    </Link>
                                    <span className="text-sm text-gray-500">/ 미디어 관리</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-green-600 font-medium">
                                        ✓ {writerName}님
                                    </span>
                                    <a
                                        href="#/media"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-gray-600 hover:text-blue-600"
                                    >
                                        미디어 페이지 보기 ↗
                                    </a>
                                </div>
                            </nav>
                        </div>
                    </header>

                    {/* 메인 콘텐츠 */}
                    <main className="container mx-auto px-4 py-8 max-w-5xl">
                        {/* 탭 네비게이션 */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`px-6 py-3 rounded-lg font-medium transition ${
                                    activeTab === 'posts'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                블로그 글 ({posts.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('videos')}
                                className={`px-6 py-3 rounded-lg font-medium transition ${
                                    activeTab === 'videos'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                동영상 ({videos.length})
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-gray-500">데이터를 불러오는 중...</p>
                            </div>
                        ) : (
                            <>
                                {/* 블로그 글 탭 */}
                                {activeTab === 'posts' && (
                                    <div>
                                        {/* 글 작성 폼 */}
                                        {showPostForm ? (
                                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                                    {editingPost ? '글 수정' : '새 글 작성'}
                                                </h3>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                                                        <select
                                                            value={postForm.category}
                                                            onChange={(e) => setPostForm({...postForm, category: e.target.value})}
                                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            {categories.map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
                                                        <input
                                                            type="text"
                                                            value={postForm.title}
                                                            onChange={(e) => setPostForm({...postForm, title: e.target.value})}
                                                            placeholder="글 제목"
                                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
                                                        <input
                                                            type="text"
                                                            value={postForm.summary}
                                                            onChange={(e) => setPostForm({...postForm, summary: e.target.value})}
                                                            placeholder="글 요약 (1-2문장)"
                                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
                                                        <textarea
                                                            value={postForm.content}
                                                            onChange={(e) => setPostForm({...postForm, content: e.target.value})}
                                                            placeholder="글 내용을 입력하세요"
                                                            rows={10}
                                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={resetPostForm}
                                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                        >
                                                            취소
                                                        </button>
                                                        <button
                                                            onClick={handlePostSubmit}
                                                            disabled={isSubmitting}
                                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                                                        >
                                                            {isSubmitting ? '저장 중...' : (editingPost ? '수정 완료' : '글 등록')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowPostForm(true)}
                                                className="w-full py-4 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition mb-6 flex items-center justify-center gap-2"
                                            >
                                                <span className="text-xl">+</span>
                                                새 글 작성
                                            </button>
                                        )}

                                        {/* 글 목록 */}
                                        <div className="space-y-3">
                                            {posts.length === 0 ? (
                                                <div className="text-center py-12 bg-white rounded-xl">
                                                    <p className="text-gray-500">아직 작성된 글이 없습니다.</p>
                                                </div>
                                            ) : (
                                                posts.map(post => (
                                                    <div
                                                        key={post.id}
                                                        className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                                                    {post.category}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {formatDate(post.createdAt)}
                                                                </span>
                                                            </div>
                                                            <h4 className="font-medium text-gray-900 truncate">{post.title}</h4>
                                                            <p className="text-sm text-gray-500 truncate">{post.summary}</p>
                                                        </div>
                                                        <div className="flex gap-2 ml-4">
                                                            {post.isSample && (
                                                                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                                                                    샘플
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => startEditPost(post)}
                                                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                            >
                                                                수정
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeletePost(post)}
                                                                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                            >
                                                                삭제
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 동영상 탭 */}
                                {activeTab === 'videos' && (
                                    <div>
                                        {/* 동영상 추가 폼 */}
                                        {showVideoForm ? (
                                            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 mb-4">
                                                    {editingVideo ? '동영상 수정' : '새 동영상 추가'}
                                                </h3>
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
                                                            placeholder="동영상 설명"
                                                            rows={3}
                                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                                                        />
                                                    </div>

                                                    {/* 미리보기 */}
                                                    {videoForm.url && extractYouTubeId(videoForm.url) && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">미리보기</label>
                                                            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                                                <iframe
                                                                    src={`https://www.youtube.com/embed/${extractYouTubeId(videoForm.url)}`}
                                                                    className="w-full h-full"
                                                                    allowFullScreen
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={resetVideoForm}
                                                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                                        >
                                                            취소
                                                        </button>
                                                        <button
                                                            onClick={handleVideoSubmit}
                                                            disabled={isSubmitting}
                                                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
                                                        >
                                                            {isSubmitting ? '저장 중...' : (editingVideo ? '수정 완료' : '동영상 추가')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShowVideoForm(true)}
                                                className="w-full py-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition mb-6 flex items-center justify-center gap-2"
                                            >
                                                <span className="text-xl">+</span>
                                                새 동영상 추가
                                            </button>
                                        )}

                                        {/* 동영상 목록 */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {videos.length === 0 ? (
                                                <div className="col-span-2 text-center py-12 bg-white rounded-xl">
                                                    <p className="text-gray-500">아직 등록된 동영상이 없습니다.</p>
                                                </div>
                                            ) : (
                                                videos.map(video => {
                                                    const videoId = video.videoId || extractYouTubeId(video.url);
                                                    return (
                                                        <div
                                                            key={video.id}
                                                            className="bg-white rounded-xl shadow-sm overflow-hidden"
                                                        >
                                                            <div className="aspect-video bg-gray-100">
                                                                <img
                                                                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                                                    alt={video.title}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="p-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                                                        {video.category}
                                                                    </span>
                                                                </div>
                                                                <h4 className="font-medium text-gray-900 line-clamp-2">{video.title}</h4>
                                                                <div className="flex gap-2 mt-3">
                                                                    {video.isSample && (
                                                                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                                                                            샘플
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        onClick={() => startEditVideo(video)}
                                                                        className="flex-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                                    >
                                                                        수정
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteVideo(video)}
                                                                        className="flex-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                                                                    >
                                                                        삭제
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </>
            )}
        </div>
    );
}
