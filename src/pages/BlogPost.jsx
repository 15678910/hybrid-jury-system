import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import { KakaoIcon, FacebookIcon, XIcon, TelegramIcon, InstagramIcon, ThreadsIcon, LinkedInIcon } from '../components/icons';

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
    const postUrl = `https://xn--lg3b0kt4n41f.kr/blog/${post.id}`;
    const postText = `${post.title} - 시민법정`;

    const shareToKakao = () => {
        console.log('Kakao SDK ready:', kakaoReady);
        console.log('Kakao object:', window.Kakao);

        // 요약본 생성: summary가 있으면 사용, 없으면 본문 첫 100자
        const description = post.summary || post.content.substring(0, 100).replace(/\n/g, ' ') + '...';

        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: post.title,
                        description: description,
                        imageUrl: post.imageUrl || 'https://xn--lg3b0kt4n41f.kr/og-image.jpg',
                        link: {
                            mobileWebUrl: postUrl,
                            webUrl: postUrl,
                        },
                    },
                    buttons: [
                        {
                            title: '더 보기',
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

    // Facebook 공유 - 클립보드 복사 방식
    const shareToFacebook = () => {
        const shareText = `${post.title}\n${postUrl}`;
        navigator.clipboard.writeText(shareText);
        alert('링크가 복사되었습니다!\n페이스북에 붙여넣기 해주세요.');
        window.open('https://www.facebook.com/', '_blank');
    };

    const shareToTwitter = () => {
        const tweetText = `${postText}\n\n${postUrl}\n\n#시민법정 #참심제 #사법개혁`;
        navigator.clipboard.writeText(tweetText);
        alert('텍스트가 복사되었습니다!\nX에서 붙여넣기 해주세요.');
        window.open('https://x.com/', '_blank');
    };

    const shareToTelegram = () => {
        // 캐시 무효화를 위해 타임스탬프 추가
        const urlWithCache = `${postUrl}?t=${Date.now()}`;
        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(urlWithCache)}&text=${encodeURIComponent(postText)}`,
            '_blank',
            'width=600,height=400'
        );
    };

    const shareToInstagram = async () => {
        try {
            await navigator.clipboard.writeText(`${postText} ${postUrl}`);
            alert('텍스트가 복사되었습니다!\n인스타그램에서 스토리나 게시물에 붙여넣기 해주세요.');
            window.open('https://www.instagram.com/', '_blank');
        } catch (err) {
            alert('복사에 실패했습니다. 직접 링크를 복사해주세요.');
        }
    };

    const shareToThreads = async () => {
        try {
            await navigator.clipboard.writeText(`${postText}\n\n${postUrl}\n\n#시민법정 #참심제 #사법개혁`);
            alert('텍스트가 복사되었습니다!\nThreads에서 붙여넣기 해주세요.');
            window.open('https://www.threads.net/', '_blank');
        } catch (err) {
            alert('복사에 실패했습니다. 직접 링크를 복사해주세요.');
        }
    };

    const shareToLinkedIn = () => {
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
            '_blank',
            'width=600,height=400'
        );
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
                        onClick={() => navigate(post.category === '사법뉴스' ? '/news' : '/blog')}
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

                    {/* 대표 이미지 */}
                    {post.imageUrl && post.imageUrl !== 'https://siminbupjung-blog.web.app/og-image.jpg' && (
                        <div className="mb-8">
                            <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full rounded-xl shadow-md object-cover max-h-96"
                            />
                        </div>
                    )}

                    {/* 본문 */}
                    <div className="bg-white rounded-xl shadow-md p-6 md:p-10 mb-8">
                        {/* HTML 콘텐츠 (Quill 에디터) 또는 일반 텍스트 렌더링 */}
                        {post.content.trim().startsWith('<') ? (
                            // HTML 콘텐츠 (리치 텍스트 에디터로 작성된 글)
                            <div
                                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        ) : (
                            // 일반 텍스트 (기존 글 호환)
                            <div className="prose prose-lg max-w-none">
                                {post.content.split('\n').map((line, index) => {
                                    // URL을 링크로 변환
                                    const renderWithLinks = (text) => {
                                        const urlRegex = /(https?:\/\/[^\s<]+)/g;
                                        const parts = [];
                                        let lastIndex = 0;
                                        const matches = [...text.matchAll(urlRegex)];

                                        if (matches.length === 0) return text;

                                        matches.forEach((m, i) => {
                                            if (m.index > lastIndex) {
                                                parts.push(text.slice(lastIndex, m.index));
                                            }
                                            parts.push(
                                                <a key={i} href={m[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">
                                                    {m[0]}
                                                </a>
                                            );
                                            lastIndex = m.index + m[0].length;
                                        });
                                        if (lastIndex < text.length) {
                                            parts.push(text.slice(lastIndex));
                                        }
                                        return parts;
                                    };

                                    if (line.trim() === '') return <br key={index} />;
                                    return <p key={index} className="text-gray-700 mb-4 leading-relaxed">{renderWithLinks(line)}</p>;
                                })}
                            </div>
                        )}
                    </div>

                    {/* 참여 안내 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-4 border border-blue-100">
                        <p className="text-gray-700 mb-3">
                            온라인 준비위원으로 참여하기 <a href="https://시민법정.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">시민법정.kr</a>
                        </p>
                        <p className="text-gray-700 mb-3">
                            온라인 준비위원 1만명이 참여하면 광장에서 주권자 세상 시작합니다.
                        </p>
                        <p className="text-gray-700">
                            주권자에 의한 시민법관 참심제! <a href={post.musicUrl || "https://youtu.be/Qu3pn7OF9vw"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">음악 듣기</a>
                        </p>
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
                            <button
                                onClick={shareToThreads}
                                className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform"
                                title="Threads"
                            >
                                <ThreadsIcon className="w-6 h-6 text-white" />
                            </button>
                            <button
                                onClick={shareToLinkedIn}
                                className="w-12 h-12 flex items-center justify-center bg-[#0A66C2] rounded-full hover:scale-110 transition-transform"
                                title="LinkedIn"
                            >
                                <LinkedInIcon className="w-6 h-6 text-white" />
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
