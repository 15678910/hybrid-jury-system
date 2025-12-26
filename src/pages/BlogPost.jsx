import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc, increment, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';

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

const TelegramIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
);

const InstagramIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

export default function BlogPost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [allPosts, setAllPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [kakaoReady, setKakaoReady] = useState(false);

    // 좋아요 상태
    const [likes, setLikes] = useState(0);
    const [hasLiked, setHasLiked] = useState(false);

    // 댓글 상태
    const [comments, setComments] = useState([]);
    const [commentForm, setCommentForm] = useState({ nickname: '', content: '' });
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // 카카오 SDK 초기화
    useEffect(() => {
        const initKakao = () => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                try {
                    window.Kakao.init('83e843186c1251b9b5a8013fd5f29798');
                    console.log('Kakao SDK initialized');
                    setKakaoReady(true);
                } catch (e) {
                    console.error('Kakao init error:', e);
                }
            } else if (window.Kakao?.isInitialized()) {
                setKakaoReady(true);
            }
        };

        // SDK가 이미 로드되어 있으면 바로 초기화
        if (window.Kakao) {
            initKakao();
        } else {
            // SDK 로드 대기
            const checkKakao = setInterval(() => {
                if (window.Kakao) {
                    clearInterval(checkKakao);
                    initKakao();
                }
            }, 100);

            // 5초 후 타임아웃
            setTimeout(() => clearInterval(checkKakao), 5000);
        }
    }, []);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // Firestore에서 글 가져오기
                const docRef = doc(db, 'posts', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const postData = {
                        id: docSnap.id,
                        ...docSnap.data(),
                        date: docSnap.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    };
                    setPost(postData);
                    setLikes(postData.likes || 0);

                    // 로컬스토리지에서 좋아요 여부 확인
                    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
                    setHasLiked(likedPosts.includes(id));

                    // 댓글 불러오기
                    const commentsRef = collection(db, 'posts', id, 'comments');
                    const commentsQuery = query(commentsRef, orderBy('createdAt', 'desc'));
                    const commentsSnapshot = await getDocs(commentsQuery);
                    const commentsData = commentsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    }));
                    setComments(commentsData);

                    // 이전/다음 글을 위해 전체 글 목록 가져오기
                    const postsRef = collection(db, 'posts');
                    const q = query(postsRef, orderBy('createdAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    const firestorePosts = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().createdAt?.toDate().toLocaleDateString('ko-KR') || ''
                    }));
                    setAllPosts(firestorePosts);
                } else {
                    setPost(null);
                }
            } catch (error) {
                console.error('Error fetching post:', error);
                setPost(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    // 좋아요 처리
    const handleLike = async () => {
        if (hasLiked) return;

        try {
            const postRef = doc(db, 'posts', id);
            await updateDoc(postRef, {
                likes: increment(1)
            });

            setLikes(prev => prev + 1);
            setHasLiked(true);

            // 로컬스토리지에 좋아요 기록
            const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
            likedPosts.push(id);
            localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
        } catch (error) {
            console.error('Error liking post:', error);
            alert('좋아요에 실패했습니다.');
        }
    };

    // 댓글 작성
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!commentForm.nickname.trim() || !commentForm.content.trim()) {
            alert('닉네임과 내용을 입력해주세요.');
            return;
        }

        setIsSubmittingComment(true);
        try {
            const commentsRef = collection(db, 'posts', id, 'comments');
            const newComment = await addDoc(commentsRef, {
                nickname: commentForm.nickname.trim(),
                content: commentForm.content.trim(),
                createdAt: serverTimestamp()
            });

            // 댓글 목록에 추가
            setComments(prev => [{
                id: newComment.id,
                nickname: commentForm.nickname.trim(),
                content: commentForm.content.trim(),
                date: new Date().toLocaleDateString('ko-KR')
            }, ...prev]);

            setCommentForm({ nickname: '', content: '' });
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-500">글을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">글을 찾을 수 없습니다</h1>
                    <Link to="/blog" className="text-blue-600 hover:underline">
                        블로그 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    // ⚠️ 수정금지: SNS 공유 URL - 영문 도메인 사용 (한글 도메인 인코딩 문제 방지)
    const postUrl = `https://siminbupjung-blog.web.app/blog/${post.id}`;
    const postText = `${post.title} - 시민법정`;

    const shareToKakao = () => {
        console.log('Kakao SDK ready:', kakaoReady);
        console.log('Kakao object:', window.Kakao);

        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: post.title,
                        description: '시민법정 - 참심제로 시민이 판사가 되는 사법개혁',
                        imageUrl: 'https://siminbupjung-blog.web.app/og-image.png',
                        link: {
                            mobileWebUrl: postUrl,
                            webUrl: postUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '자세히 보기',
                            link: {
                                mobileWebUrl: postUrl,
                                webUrl: postUrl,
                            },
                        },
                    ],
                });
            } catch (e) {
                console.error('Kakao share error:', e);
                fallbackShare();
            }
        } else {
            console.log('Kakao SDK not ready, using fallback');
            fallbackShare();
        }
    };

    const fallbackShare = () => {
        const shareText = `${postText}\n${postUrl}`;
        navigator.clipboard.writeText(shareText);
        alert('링크가 복사되었습니다!\n카카오톡에 붙여넣기 해주세요.');
    };

    const shareToFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToTwitter = () => {
        const tweetText = `${postText}\n\n#시민법정 #참심제 #사법개혁`;
        window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(tweetText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToTelegram = () => {
        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(postText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToInstagram = () => {
        navigator.clipboard.writeText(`${postText} ${postUrl}`);
        alert('텍스트가 복사되었습니다! 인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    // 이전/다음 글
    const currentIndex = allPosts.findIndex(p => p.id === post.id);
    const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <article className="container mx-auto max-w-3xl">
                    {/* 뒤로가기 */}
                    <button
                        onClick={() => navigate('/blog')}
                        className="flex items-center text-gray-500 hover:text-blue-600 mb-6"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        목록으로
                    </button>

                    {/* 글 헤더 */}
                    <header className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {post.title}
                        </h1>
                        <div className="flex items-center text-gray-500 text-sm">
                            <span>{post.author}</span>
                            <span className="mx-2">·</span>
                            <span>{post.date}</span>
                        </div>
                    </header>

                    {/* 본문 */}
                    <div className="bg-white rounded-xl shadow-md p-6 md:p-10 mb-8">
                        <div className="prose prose-lg max-w-none">
                            {post.content.split('\n').map((line, index) => {
                                // 링크 변환 함수: [텍스트](URL) 또는 URL 자체를 링크로 변환
                                const renderWithLinks = (text) => {
                                    // 마크다운 링크 [텍스트](URL) 패턴 - 괄호 안의 URL을 더 정확하게 매칭
                                    const markdownLinkRegex = /\[([^\]]+)\]\(([^)\s]+)\)/g;
                                    // URL 패턴 (마크다운 링크가 아닌 경우)
                                    const urlRegex = /(https?:\/\/[^\s<]+)/g;

                                    // 먼저 마크다운 링크를 처리
                                    let parts = [];
                                    let lastIndex = 0;

                                    // 마크다운 링크 찾기
                                    const mdMatches = [...text.matchAll(markdownLinkRegex)];

                                    if (mdMatches.length > 0) {
                                        mdMatches.forEach((m, i) => {
                                            // 링크 이전 텍스트
                                            if (m.index > lastIndex) {
                                                parts.push(text.slice(lastIndex, m.index));
                                            }
                                            // 링크
                                            parts.push(
                                                <a key={`md-${i}`} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                    {m[1]}
                                                </a>
                                            );
                                            lastIndex = m.index + m[0].length;
                                        });
                                        // 나머지 텍스트
                                        if (lastIndex < text.length) {
                                            parts.push(text.slice(lastIndex));
                                        }
                                        return parts;
                                    }

                                    // 마크다운 링크가 없으면 일반 URL 처리
                                    lastIndex = 0;
                                    const urlMatches = [...text.matchAll(urlRegex)];

                                    if (urlMatches.length > 0) {
                                        urlMatches.forEach((m, i) => {
                                            if (m.index > lastIndex) {
                                                parts.push(text.slice(lastIndex, m.index));
                                            }
                                            parts.push(
                                                <a key={`url-${i}`} href={m[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                    {m[0]}
                                                </a>
                                            );
                                            lastIndex = m.index + m[0].length;
                                        });
                                        if (lastIndex < text.length) {
                                            parts.push(text.slice(lastIndex));
                                        }
                                        return parts;
                                    }

                                    return text;
                                };

                                if (line.startsWith('## ')) {
                                    return <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">{renderWithLinks(line.replace('## ', ''))}</h2>;
                                }
                                if (line.startsWith('- ')) {
                                    return <li key={index} className="text-gray-700 ml-4">{renderWithLinks(line.replace('- ', ''))}</li>;
                                }
                                if (line.match(/^\d+\./)) {
                                    return <li key={index} className="text-gray-700 ml-4 list-disc">{renderWithLinks(line.replace(/^\d+\.\s*/, ''))}</li>;
                                }
                                if (line.trim() === '') {
                                    return <br key={index} />;
                                }
                                return <p key={index} className="text-gray-700 mb-4 leading-relaxed">{renderWithLinks(line)}</p>;
                            })}
                        </div>
                    </div>

                    {/* 참여 안내 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-4 border border-blue-100">
                        <p className="text-gray-700 mb-3">
                            온라인 준비위원으로 참여하기 <a href="https://시민법정.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">시민법정.kr</a>
                        </p>
                        <p className="text-gray-700 mb-3">
                            온라인 준비위원 1만명이 참여하면 광장에서 주권자 세상 시작합니다.
                        </p>
                        <p className="text-gray-700 mb-4">
                            주권자에 의한 시민법관 참심제! <a href="https://youtu.be/5jWcQ7DX5WU" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">음악 듣기</a>
                        </p>

                        {/* 뉴스타파 스타일 후원 섹션 */}
                        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                            <p className="text-gray-700 text-center mb-4 leading-relaxed">
                                민주주의는 국민이 권력을 위임하는 제도가 아니라, 국민이 권력을 직접 행사하는 제도입니다. 참심제는 그 원리를 사법 영역에 구현하는, 민주주의 완성을 위한 시작입니다.
                            </p>
                            <div className="flex justify-center">
                                <a
                                    href="/donate"
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full transition-all shadow-md hover:shadow-lg"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    후원하기
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* SNS 공유 */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 mb-4">
                        <p className="text-white text-center mb-4 font-medium">이 글을 공유해주세요</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={shareToKakao}
                                className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform"
                                title="카카오톡"
                            >
                                <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                            </button>
                            <button
                                onClick={shareToFacebook}
                                className="w-12 h-12 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform"
                                title="페이스북"
                            >
                                <FacebookIcon className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={shareToTwitter}
                                className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform"
                                title="X"
                            >
                                <XIcon className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={shareToInstagram}
                                className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform"
                                title="인스타그램"
                            >
                                <InstagramIcon className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={shareToTelegram}
                                className="w-12 h-12 flex items-center justify-center bg-[#0088cc] rounded-full hover:scale-110 transition-transform"
                                title="텔레그램"
                            >
                                <TelegramIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* 좋아요 버튼 */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-4 text-center">
                        <button
                            onClick={handleLike}
                            disabled={hasLiked}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${hasLiked
                                    ? 'bg-pink-100 text-pink-600 cursor-default'
                                    : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                                }`}
                        >
                            <svg className="w-6 h-6" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>{hasLiked ? '감사합니다!' : '좋아요'}</span>
                            <span className="bg-white px-2 py-0.5 rounded-full text-sm">{likes}</span>
                        </button>
                    </div>

                    {/* 댓글 섹션 */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            댓글 {comments.length > 0 && <span className="text-blue-600">({comments.length})</span>}
                        </h3>

                        {/* 댓글 작성 폼 */}
                        <form onSubmit={handleSubmitComment} className="mb-6">
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={commentForm.nickname}
                                    onChange={(e) => setCommentForm({ ...commentForm, nickname: e.target.value })}
                                    placeholder="닉네임"
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    maxLength={20}
                                />
                            </div>
                            <div className="flex gap-2">
                                <textarea
                                    value={commentForm.content}
                                    onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                                    placeholder="댓글을 작성해주세요"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                    rows={2}
                                    maxLength={500}
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmittingComment}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
                                >
                                    {isSubmittingComment ? '등록중...' : '등록'}
                                </button>
                            </div>
                        </form>

                        {/* 댓글 목록 */}
                        <div className="space-y-4">
                            {comments.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">첫 댓글을 작성해주세요!</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-900">{comment.nickname}</span>
                                            <span className="text-xs text-gray-400">{comment.date}</span>
                                        </div>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 이전/다음 글 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prevPost ? (
                            <Link
                                to={`/blog/${prevPost.id}`}
                                className="bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow"
                            >
                                <span className="text-sm text-gray-400">← 이전 글</span>
                                <p className="font-medium text-gray-900 mt-1 line-clamp-1">{prevPost.title}</p>
                            </Link>
                        ) : <div />}
                        {nextPost && (
                            <Link
                                to={`/blog/${nextPost.id}`}
                                className="bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow text-right"
                            >
                                <span className="text-sm text-gray-400">다음 글 →</span>
                                <p className="font-medium text-gray-900 mt-1 line-clamp-1">{nextPost.title}</p>
                            </Link>
                        )}
                    </div>
                </article>
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
