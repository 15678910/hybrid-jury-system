import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
    collection,
    query,
    orderBy,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    where,
    limit,
    startAfter
} from 'firebase/firestore';

import { db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Header from '../components/Header';

// 세션 캐시 (인증 후 빠른 로딩)
const adminPostsCache = {
    data: null,
    timestamp: null,
    CACHE_DURATION: 3 * 60 * 1000 // 3분
};

export default function AdminBlog() {
    // 작성자 코드 인증
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [writerName, setWriterName] = useState('');
    const [verifying, setVerifying] = useState(false);

    // 글 관리
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', content: '', author: '', summary: '' });

    // 페이지네이션
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const POSTS_PER_PAGE = 15;

    // 새 글 작성
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', summary: '' });
    const [saving, setSaving] = useState(false);

    // 이미지 업로드
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // 이미지 선택 핸들러
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('이미지 크기는 5MB 이하여야 합니다.');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // 이미지 압축 함수 (Blob 반환)
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // 고해상도: 1200x630 (SNS 최적화)
                    const maxWidth = 1200;
                    const maxHeight = 630;

                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Blob으로 변환 (품질 70%)
                    canvas.toBlob((blob) => {
                        console.log('압축 후 크기:', Math.round(blob.size / 1024), 'KB');
                        resolve(blob);
                    }, 'image/jpeg', 0.7);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    // 이미지를 Firebase Storage에 업로드하고 공개 URL 반환
    const uploadImage = async (file) => {
        const compressedBlob = await compressImage(file);
        const fileName = `blog_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const storageRef = ref(storage, `blog-images/${fileName}`);

        await uploadBytes(storageRef, compressedBlob, {
            contentType: 'image/jpeg'
        });

        const downloadURL = await getDownloadURL(storageRef);
        console.log('이미지 업로드 완료:', downloadURL);
        return downloadURL;
    };

    // 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        setVerifying(true);

        // 환경변수에서 관리자 코드 확인
        const adminCode = import.meta.env.VITE_ADMIN_CODE;
        const writerCodeEnv = import.meta.env.VITE_WRITER_CODE;

        if (writerCode === adminCode) {
            setIsVerified(true);
            setWriterName('관리자');
            setVerifying(false);
            return;
        }
        if (writerCode === writerCodeEnv) {
            setIsVerified(true);
            setWriterName('시민법정');
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

    // 글 목록 불러오기 (캐싱 + 페이지네이션)
    useEffect(() => {
        if (!isVerified) return;

        const fetchPosts = async () => {
            // 캐시 확인
            if (adminPostsCache.data && adminPostsCache.timestamp &&
                (Date.now() - adminPostsCache.timestamp) < adminPostsCache.CACHE_DURATION) {
                setPosts(adminPostsCache.data);
                setLoadingPosts(false);
                setHasMore(adminPostsCache.data.length >= POSTS_PER_PAGE);
                return;
            }

            try {
                const postsRef = collection(db, 'posts');
                const q = query(postsRef, orderBy('createdAt', 'desc'), limit(POSTS_PER_PAGE));
                const querySnapshot = await getDocs(q);

                const postsData = querySnapshot.docs
                    .filter(doc => doc.data().category !== '사법뉴스')
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    }));

                // 캐시 저장
                adminPostsCache.data = postsData;
                adminPostsCache.timestamp = Date.now();

                setPosts(postsData);
                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
                setHasMore(querySnapshot.docs.length >= POSTS_PER_PAGE);
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [isVerified]);

    // 더 불러오기
    const loadMore = async () => {
        if (loadingMore || !hasMore || !lastDoc) return;

        setLoadingMore(true);
        try {
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(POSTS_PER_PAGE));
            const querySnapshot = await getDocs(q);

            const morePosts = querySnapshot.docs
                .filter(doc => doc.data().category !== '사법뉴스')
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                }));

            const newPosts = [...posts, ...morePosts];
            setPosts(newPosts);
            adminPostsCache.data = newPosts;
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length >= POSTS_PER_PAGE);
        } catch (error) {
            console.error('Error loading more posts:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // 글 삭제
    const handleDeletePost = async (postId) => {
        if (!confirm('정말 이 글을 삭제하시겠습니까?')) return;

        try {
            await deleteDoc(doc(db, 'posts', postId));
            setPosts(posts.filter(p => p.id !== postId));
            alert('글이 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 수정용 이미지 상태
    const [editImageFile, setEditImageFile] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState(null);

    // 수정용 이미지 선택 핸들러
    const handleEditImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('이미지 크기는 5MB 이하여야 합니다.');
                return;
            }
            setEditImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // 글 수정 시작 (토글 기능 포함)
    const handleEditPost = (post) => {
        // 같은 글을 다시 클릭하면 수정 취소
        if (editingPost === post.id) {
            handleCancelEdit();
            return;
        }
        setEditingPost(post.id);
        // placeholder 텍스트는 빈 값으로 처리
        const placeholderTexts = ['내용을 입력해주세요.', '요약을 입력해주세요.'];
        const summaryValue = placeholderTexts.includes(post.summary) ? '' : (post.summary || '');

        setEditForm({
            title: post.title,
            content: post.content,
            author: post.author,
            summary: summaryValue,
            imageUrl: post.imageUrl || ''
        });
        setEditImagePreview(post.imageUrl || null);
        setEditImageFile(null);
        // 수정 폼으로 스크롤
        setTimeout(() => {
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }, 100);
    };

    // 글 수정 취소
    const handleCancelEdit = () => {
        setEditingPost(null);
        setEditForm({ title: '', content: '', author: '', summary: '', imageUrl: '' });
        setEditImageFile(null);
        setEditImagePreview(null);
    };

    // 새 글 저장
    const handleSaveNewPost = async () => {
        if (!newPost.title.trim() || !newPost.content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setSaving(true);
        try {
            // 이미지 업로드
            let imageUrl = 'https://siminbupjung-blog.web.app/og-image.jpg';
            if (imageFile) {
                setUploadingImage(true);
                imageUrl = await uploadImage(imageFile);
                setUploadingImage(false);
            }

            const docRef = await addDoc(collection(db, 'posts'), {
                title: newPost.title,
                content: newPost.content,
                summary: newPost.summary || newPost.content.substring(0, 100),
                author: writerName,
                imageUrl: imageUrl,
                createdAt: serverTimestamp()
            });

            // 목록에 추가
            setPosts([{
                id: docRef.id,
                title: newPost.title,
                content: newPost.content,
                summary: newPost.summary,
                author: writerName,
                imageUrl: imageUrl,
                date: new Date().toLocaleDateString('ko-KR')
            }, ...posts]);

            setNewPost({ title: '', content: '', summary: '' });
            setImageFile(null);
            setImagePreview(null);
            setShowNewPost(false);
            alert('글이 등록되었습니다.');
        } catch (error) {
            console.error('Error saving post:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
            setUploadingImage(false);
        }
    };

    // 글 수정 저장
    const handleSaveEdit = async (postId) => {
        if (!editForm.title || !editForm.content) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        try {
            // 새 이미지가 있으면 업로드
            let imageUrl = editForm.imageUrl;
            if (editImageFile) {
                setUploadingImage(true);
                imageUrl = await uploadImage(editImageFile);
                setUploadingImage(false);
            }

            await updateDoc(doc(db, 'posts', postId), {
                title: editForm.title,
                content: editForm.content,
                author: editForm.author,
                summary: editForm.summary,
                imageUrl: imageUrl,
                updatedAt: serverTimestamp()
            });
            setPosts(posts.map(p =>
                p.id === postId ? { ...p, ...editForm, imageUrl } : p
            ));
            setEditingPost(null);
            setEditForm({ title: '', content: '', author: '', summary: '', imageUrl: '' });
            setEditImageFile(null);
            setEditImagePreview(null);
            alert('글이 수정되었습니다.');
        } catch (error) {
            console.error('Error updating post:', error);
            alert('수정에 실패했습니다.');
            setUploadingImage(false);
        }
    };

    // 로그인 화면
    if (!isVerified) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center px-4 pt-32">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            작성자 관리
                        </h1>
                        <p className="text-gray-600 text-center mb-6">
                            작성자 코드를 입력하여 인증해주세요.
                        </p>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={writerCode}
                                onChange={(e) => setWriterCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                                placeholder="작성자 코드 입력"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={verifyWriterCode}
                                disabled={verifying}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {verifying ? '인증 중...' : '인증하기'}
                            </button>
                        </div>
                        <div className="mt-6 text-center">
                            <Link to="/blog" className="text-blue-600 hover:underline text-sm">
                                ← 블로그로 돌아가기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">작성자 관리</h1>
                            <p className="text-gray-600 mt-1">
                                {writerName}님으로 로그인됨
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setIsVerified(false);
                                setWriterCode('');
                                setWriterName('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            로그아웃
                        </button>
                    </div>

                    {/* 글 관리 */}
                    <div>
                        <div className="mb-4">
                            <button
                                onClick={() => setShowNewPost(!showNewPost)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {showNewPost ? '취소' : '+ 새 글 작성'}
                            </button>
                        </div>

                        {/* 새 글 작성 폼 */}
                        {showNewPost && (
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">새 글 작성</h2>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={newPost.title}
                                        onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                                        placeholder="제목"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={newPost.summary}
                                        onChange={(e) => setNewPost({ ...newPost, summary: e.target.value })}
                                        placeholder="요약 (선택사항 - 목록에 표시됨)"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <div className="quill-wrapper">
                                        <ReactQuill
                                            theme="snow"
                                            value={newPost.content}
                                            onChange={(value) => setNewPost({ ...newPost, content: value })}
                                            placeholder="내용을 입력하세요..."
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, false] }],
                                                    ['bold', 'italic', 'underline'],
                                                    [{ 'background': ['yellow', '#90EE90', '#98FB98', '#FFDAB9', 'cyan', 'white'] }],
                                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                    ['link'],
                                                    ['clean']
                                                ]
                                            }}
                                            style={{ minHeight: '300px' }}
                                        />
                                    </div>
                                    <style>{`
                                        .quill-wrapper .ql-container { min-height: 250px; font-size: 16px; }
                                        .quill-wrapper .ql-editor { min-height: 250px; }
                                    `}</style>

                                    {/* 대표 이미지 업로드 */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            대표 이미지 (SNS 공유 시 표시)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        {imagePreview && (
                                            <div className="mt-3 relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="미리보기"
                                                    className="w-full max-w-md h-48 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreview(null);
                                                    }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                        <p className="mt-2 text-xs text-gray-500">
                                            권장 크기: 1200x630px (SNS 최적화), 최대 5MB
                                        </p>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveNewPost}
                                            disabled={saving || uploadingImage}
                                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                        >
                                            {uploadingImage ? '이미지 업로드 중...' : saving ? '저장 중...' : '글 등록'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {loadingPosts ? (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                등록된 글이 없습니다.
                            </div>
                        ) : (
                            <>
                                {/* 글 수정 폼 - 테이블 위에 별도 카드로 표시 */}
                                {editingPost && (
                                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">글 수정</h2>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="제목"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={editForm.author}
                                                onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                                                placeholder="작성자"
                                                className="w-1/3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <input
                                                type="text"
                                                value={editForm.summary}
                                                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                                                placeholder="요약 글 올려주세요."
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                            <div className="quill-wrapper">
                                                <ReactQuill
                                                    theme="snow"
                                                    value={editForm.content}
                                                    onChange={(value) => setEditForm({ ...editForm, content: value })}
                                                    placeholder="내용을 입력하세요..."
                                                    modules={{
                                                        toolbar: [
                                                            [{ 'header': [1, 2, false] }],
                                                            ['bold', 'italic', 'underline'],
                                                            [{ 'background': ['yellow', '#90EE90', '#98FB98', '#FFDAB9', 'cyan', 'white'] }],
                                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                            ['link'],
                                                            ['clean']
                                                        ]
                                                    }}
                                                    style={{ minHeight: '300px' }}
                                                />
                                            </div>

                                            {/* 대표 이미지 수정 */}
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    대표 이미지 (SNS 공유 시 표시)
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleEditImageSelect}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                                {editImagePreview && (
                                                    <div className="mt-3 relative">
                                                        <img
                                                            src={editImagePreview}
                                                            alt="미리보기"
                                                            className="w-full max-w-md h-48 object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditImageFile(null);
                                                                setEditImagePreview(null);
                                                                setEditForm({ ...editForm, imageUrl: '' });
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}
                                                <p className="mt-2 text-xs text-gray-500">
                                                    권장 크기: 1200x630px (SNS 최적화), 최대 5MB
                                                </p>
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    onClick={() => handleSaveEdit(editingPost)}
                                                    disabled={uploadingImage}
                                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                                >
                                                    {uploadingImage ? '이미지 업로드 중...' : '저장'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-xl shadow overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">제목</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">작성자</th>
                                                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">날짜</th>
                                                <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">관리</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {posts.map(post => (
                                                <tr key={post.id} className={`hover:bg-gray-50 ${editingPost === post.id ? 'bg-blue-50' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <Link
                                                            to={`/blog/${post.id}`}
                                                            className="text-gray-900 hover:text-blue-600 font-medium"
                                                        >
                                                            {post.title}
                                                        </Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{post.author}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">{post.date}</td>
                                                    <td className="px-6 py-4 text-right space-x-3">
                                                        <button
                                                            onClick={() => handleEditPost(post)}
                                                            className={`text-sm font-medium ${editingPost === post.id ? 'text-green-600' : 'text-blue-600 hover:text-blue-800'}`}
                                                        >
                                                            {editingPost === post.id ? '수정 중' : '수정'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                        >
                                                            삭제
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 더 불러오기 버튼 */}
                                {hasMore && posts.length > 0 && (
                                    <div className="text-center mt-6">
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
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
                </div>
            </main>
        </div>
    );
}
