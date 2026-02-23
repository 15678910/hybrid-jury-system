import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

// 세션 캐시
const adminCardNewsCache = {
    data: null,
    timestamp: null,
    CACHE_DURATION: 3 * 60 * 1000 // 3분
};

// 카테고리 목록
const CATEGORIES = [
    '참심제 설명',
    '해외 사례',
    '사법개혁',
    '시민 참여',
    '법률 지식',
    '기타'
];

export default function AdminCardNews() {
    // 작성자 코드 인증
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [writerName, setWriterName] = useState('');
    const [verifying, setVerifying] = useState(false);

    // 카드뉴스 관리
    const [cardNews, setCardNews] = useState([]);
    const [loadingCardNews, setLoadingCardNews] = useState(true);
    const [editingCard, setEditingCard] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', category: '', images: [] });

    // 페이지네이션
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const ITEMS_PER_PAGE = 15;

    // 새 카드뉴스 작성
    const [showNewCard, setShowNewCard] = useState(false);
    const [newCard, setNewCard] = useState({ title: '', description: '', category: '참심제 설명' });
    const [saving, setSaving] = useState(false);

    // 이미지 업로드
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);

    // 이미지 선택 핸들러 (다중)
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + imageFiles.length > 10) {
            alert('이미지는 최대 10장까지 업로드할 수 있습니다.');
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name}: 이미지 크기는 5MB 이하여야 합니다.`);
                return false;
            }
            return true;
        });

        setImageFiles([...imageFiles, ...validFiles]);

        // 미리보기 생성
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    // 이미지 삭제
    const removeImage = (index) => {
        setImageFiles(imageFiles.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    // 이미지 압축 함수
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;

                    // 카드뉴스 최적화: 1080x1080 (정사각형)
                    const maxSize = 1080;

                    if (width > maxSize || height > maxSize) {
                        const ratio = Math.min(maxSize / width, maxSize / height);
                        width = Math.round(width * ratio);
                        height = Math.round(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.8);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    // 이미지를 Firebase Storage에 업로드
    const uploadImage = async (file) => {
        const compressedBlob = await compressImage(file);
        const fileName = `cardnews_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const storageRef = ref(storage, `cardnews-images/${fileName}`);

        await uploadBytes(storageRef, compressedBlob, {
            contentType: 'image/jpeg'
        });

        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    };

    // 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        setVerifying(true);

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

    // 카드뉴스 목록 불러오기
    useEffect(() => {
        if (!isVerified) return;

        const fetchCardNews = async () => {
            if (adminCardNewsCache.data && adminCardNewsCache.timestamp &&
                (Date.now() - adminCardNewsCache.timestamp) < adminCardNewsCache.CACHE_DURATION) {
                setCardNews(adminCardNewsCache.data);
                setLoadingCardNews(false);
                setHasMore(adminCardNewsCache.data.length >= ITEMS_PER_PAGE);
                return;
            }

            try {
                const cardNewsRef = collection(db, 'cardnews');
                const q = query(cardNewsRef, orderBy('createdAt', 'desc'), limit(ITEMS_PER_PAGE));
                const querySnapshot = await getDocs(q);

                const cardNewsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                }));

                adminCardNewsCache.data = cardNewsData;
                adminCardNewsCache.timestamp = Date.now();

                setCardNews(cardNewsData);
                setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
                setHasMore(querySnapshot.docs.length >= ITEMS_PER_PAGE);
            } catch (error) {
                console.error('Error fetching card news:', error);
            } finally {
                setLoadingCardNews(false);
            }
        };

        fetchCardNews();
    }, [isVerified]);

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
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
            }));

            const newCardNews = [...cardNews, ...moreCardNews];
            setCardNews(newCardNews);
            adminCardNewsCache.data = newCardNews;
            setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHasMore(querySnapshot.docs.length >= ITEMS_PER_PAGE);
        } catch (error) {
            console.error('Error loading more card news:', error);
        } finally {
            setLoadingMore(false);
        }
    };

    // 카드뉴스 삭제
    const handleDeleteCard = async (cardId) => {
        if (!confirm('정말 이 카드뉴스를 삭제하시겠습니까?')) return;

        try {
            await deleteDoc(doc(db, 'cardnews', cardId));
            setCardNews(cardNews.filter(c => c.id !== cardId));
            alert('카드뉴스가 삭제되었습니다.');
        } catch (error) {
            console.error('Error deleting card news:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    // 수정용 이미지 상태
    const [editImageFiles, setEditImageFiles] = useState([]);
    const [editImagePreviews, setEditImagePreviews] = useState([]);

    // 수정용 이미지 선택 핸들러
    const handleEditImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const currentCount = editImagePreviews.length;

        if (files.length + currentCount > 10) {
            alert('이미지는 최대 10장까지 업로드할 수 있습니다.');
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name}: 이미지 크기는 5MB 이하여야 합니다.`);
                return false;
            }
            return true;
        });

        setEditImageFiles([...editImageFiles, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    // 수정용 이미지 삭제
    const removeEditImage = (index) => {
        // 기존 이미지인지 새 이미지인지 확인
        const existingImagesCount = editForm.images.length;

        if (index < existingImagesCount) {
            // 기존 이미지 삭제
            setEditForm({
                ...editForm,
                images: editForm.images.filter((_, i) => i !== index)
            });
            setEditImagePreviews(editImagePreviews.filter((_, i) => i !== index));
        } else {
            // 새 이미지 삭제
            const newIndex = index - existingImagesCount;
            setEditImageFiles(editImageFiles.filter((_, i) => i !== newIndex));
            setEditImagePreviews(editImagePreviews.filter((_, i) => i !== index));
        }
    };

    // 카드뉴스 수정 시작
    const handleEditCard = (card) => {
        setEditingCard(card.id);
        setEditForm({
            title: card.title,
            description: card.description || '',
            category: card.category || '참심제 설명',
            images: card.images || []
        });
        setEditImagePreviews(card.images || []);
        setEditImageFiles([]);
    };

    // 카드뉴스 수정 취소
    const handleCancelEdit = () => {
        setEditingCard(null);
        setEditForm({ title: '', description: '', category: '', images: [] });
        setEditImageFiles([]);
        setEditImagePreviews([]);
    };

    // 새 카드뉴스 저장
    const handleSaveNewCard = async () => {
        if (!newCard.title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (imageFiles.length === 0) {
            alert('이미지를 최소 1장 업로드해주세요.');
            return;
        }

        setSaving(true);
        setUploadingImage(true);

        try {
            // 모든 이미지 업로드
            const imageUrls = [];
            for (let i = 0; i < imageFiles.length; i++) {
                const url = await uploadImage(imageFiles[i]);
                imageUrls.push(url);
            }

            const docRef = await addDoc(collection(db, 'cardnews'), {
                title: newCard.title,
                description: newCard.description,
                category: newCard.category,
                images: imageUrls,
                author: writerName,
                createdAt: serverTimestamp()
            });

            // 목록에 추가
            setCardNews([{
                id: docRef.id,
                title: newCard.title,
                description: newCard.description,
                category: newCard.category,
                images: imageUrls,
                author: writerName,
                date: new Date().toLocaleDateString('ko-KR')
            }, ...cardNews]);

            setNewCard({ title: '', description: '', category: '참심제 설명' });
            setImageFiles([]);
            setImagePreviews([]);
            setShowNewCard(false);
            alert('카드뉴스가 등록되었습니다.');
        } catch (error) {
            console.error('Error saving card news:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
            setUploadingImage(false);
        }
    };

    // 카드뉴스 수정 저장
    const handleSaveEdit = async (cardId) => {
        if (!editForm.title) {
            alert('제목을 입력해주세요.');
            return;
        }

        try {
            setUploadingImage(true);

            // 새 이미지 업로드
            const newImageUrls = [];
            for (let i = 0; i < editImageFiles.length; i++) {
                const url = await uploadImage(editImageFiles[i]);
                newImageUrls.push(url);
            }

            // 기존 이미지 + 새 이미지
            const allImages = [...editForm.images, ...newImageUrls];

            await updateDoc(doc(db, 'cardnews', cardId), {
                title: editForm.title,
                description: editForm.description,
                category: editForm.category,
                images: allImages,
                updatedAt: serverTimestamp()
            });

            setCardNews(cardNews.map(c =>
                c.id === cardId ? { ...c, ...editForm, images: allImages } : c
            ));
            setEditingCard(null);
            setEditForm({ title: '', description: '', category: '', images: [] });
            setEditImageFiles([]);
            setEditImagePreviews([]);
            alert('카드뉴스가 수정되었습니다.');
        } catch (error) {
            console.error('Error updating card news:', error);
            alert('수정에 실패했습니다.');
        } finally {
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
                            카드뉴스 관리
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
                            <Link to="/cardnews" className="text-blue-600 hover:underline text-sm">
                                ← 카드뉴스로 돌아가기
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

            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">카드뉴스 관리</h1>
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

                    {/* 카드뉴스 관리 */}
                    <div>
                        <div className="mb-4">
                            <button
                                onClick={() => setShowNewCard(!showNewCard)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {showNewCard ? '취소' : '+ 새 카드뉴스 작성'}
                            </button>
                        </div>

                        {/* 새 카드뉴스 작성 폼 */}
                        {showNewCard && (
                            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">새 카드뉴스 작성</h2>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={newCard.title}
                                        onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                                        placeholder="제목"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />

                                    <select
                                        value={newCard.category}
                                        onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>

                                    <textarea
                                        value={newCard.description}
                                        onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                                        placeholder="설명 (선택사항)"
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />

                                    {/* 이미지 업로드 */}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            카드뉴스 이미지 (최대 10장)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageSelect}
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />

                                        {/* 이미지 미리보기 */}
                                        {imagePreviews.length > 0 && (
                                            <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
                                                {imagePreviews.map((preview, idx) => (
                                                    <div key={idx} className="relative">
                                                        <img
                                                            src={preview}
                                                            alt={`미리보기 ${idx + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm"
                                                        >
                                                            ×
                                                        </button>
                                                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <p className="mt-2 text-xs text-gray-500">
                                            권장 크기: 1080x1080px (정사각형), 최대 5MB/장
                                        </p>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveNewCard}
                                            disabled={saving || uploadingImage}
                                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                        >
                                            {uploadingImage ? '이미지 업로드 중...' : saving ? '저장 중...' : '카드뉴스 등록'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loadingCardNews ? (
                            <div className="text-center py-12">
                                <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : cardNews.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                등록된 카드뉴스가 없습니다.
                            </div>
                        ) : (
                            <>
                                {/* 수정 폼 */}
                                {editingCard && (
                                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                                        <h2 className="text-xl font-bold text-gray-900 mb-4">카드뉴스 수정</h2>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="제목"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />

                                            <select
                                                value={editForm.category}
                                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>

                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                placeholder="설명"
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />

                                            {/* 이미지 수정 */}
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    카드뉴스 이미지 (최대 10장)
                                                </label>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    multiple
                                                    onChange={handleEditImageSelect}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />

                                                {editImagePreviews.length > 0 && (
                                                    <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
                                                        {editImagePreviews.map((preview, idx) => (
                                                            <div key={idx} className="relative">
                                                                <img
                                                                    src={preview}
                                                                    alt={`이미지 ${idx + 1}`}
                                                                    className="w-full h-24 object-cover rounded-lg"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeEditImage(idx)}
                                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 text-sm"
                                                                >
                                                                    ×
                                                                </button>
                                                                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                                                                    {idx + 1}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                                                >
                                                    취소
                                                </button>
                                                <button
                                                    onClick={() => handleSaveEdit(editingCard)}
                                                    disabled={uploadingImage}
                                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                                >
                                                    {uploadingImage ? '이미지 업로드 중...' : '저장'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 카드뉴스 목록 (카드 형태) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {cardNews.map(card => (
                                        <div
                                            key={card.id}
                                            className={`bg-white rounded-xl shadow overflow-hidden ${editingCard === card.id ? 'ring-2 ring-blue-500' : ''}`}
                                        >
                                            {/* 썸네일 */}
                                            <div className="aspect-square overflow-hidden">
                                                {card.images?.[0] ? (
                                                    <img
                                                        src={card.images[0]}
                                                        alt={card.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                        <span className="text-gray-400">이미지 없음</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* 정보 */}
                                            <div className="p-4">
                                                {card.category && (
                                                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full mb-2">
                                                        {card.category}
                                                    </span>
                                                )}
                                                <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">
                                                    {card.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-3">
                                                    {card.date} · {card.images?.length || 0}장
                                                </p>

                                                {/* 버튼 */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditCard(card)}
                                                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCard(card.id)}
                                                        className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 더 불러오기 버튼 */}
                                {hasMore && cardNews.length > 0 && (
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
