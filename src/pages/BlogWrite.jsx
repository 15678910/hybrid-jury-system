import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function BlogWrite() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [writerCode, setWriterCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [writerName, setWriterName] = useState('');
    const [verifying, setVerifying] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        category: '참심제 소개'
    });

    const categories = ['참심제 소개', '해외 사례', '사법개혁', '공지사항'];

    // Firestore에서 작성자 코드 검증
    const verifyWriterCode = async () => {
        if (!writerCode.trim()) {
            alert('작성자 코드를 입력해주세요.');
            return;
        }

        setVerifying(true);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified) {
            alert('먼저 작성자 코드를 입력해주세요.');
            return;
        }

        if (!formData.title || !formData.summary || !formData.content) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const docRef = await addDoc(collection(db, 'posts'), {
                ...formData,
                author: writerName,
                writerCode: writerCode,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                published: true
            });

            alert('글이 성공적으로 등록되었습니다!');
            navigate(`/blog/${docRef.id}`);
        } catch (error) {
            console.error('Error adding document: ', error);
            alert('글 등록에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <header className="bg-white shadow-md fixed top-0 w-full z-50">
                <div className="container mx-auto px-4">
                    <nav className="flex items-center justify-between py-4">
                        <Link to="/" className="text-2xl font-bold text-blue-600">
                            ⚖️ 사법개혁
                        </Link>
                        <div className="flex gap-6">
                            <Link to="/" className="text-gray-600 hover:text-blue-600">홈</Link>
                            <Link to="/blog" className="text-blue-600 font-semibold">블로그</Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* 메인 콘텐츠 */}
            <main className="pt-24 pb-16 px-4">
                <div className="container mx-auto max-w-3xl">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        새 글 작성
                    </h1>

                    {/* 작성자 코드 입력 (미인증 시) */}
                    {!isVerified ? (
                        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">작성자 인증</h2>
                            <p className="text-gray-600 mb-6">
                                글을 작성하려면 발급받은 작성자 코드를 입력해주세요.
                            </p>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={writerCode}
                                    onChange={(e) => setWriterCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && verifyWriterCode()}
                                    placeholder="작성자 코드 입력"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={verifyWriterCode}
                                    disabled={verifying}
                                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
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
                                    onClick={() => {
                                        setIsVerified(false);
                                        setWriterCode('');
                                        setWriterName('');
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    다른 계정으로 변경
                                </button>
                            </div>

                            {/* 글 작성 폼 */}
                            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
                                {/* 카테고리 */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        카테고리
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 제목 */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        제목
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="글 제목을 입력하세요"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* 요약 */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        요약 (목록에 표시됨)
                                    </label>
                                    <input
                                        type="text"
                                        name="summary"
                                        value={formData.summary}
                                        onChange={handleChange}
                                        placeholder="글의 요약을 입력하세요 (1-2문장)"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* 본문 */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        본문
                                    </label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="글 내용을 입력하세요. 마크다운 형식을 사용할 수 있습니다.

## 소제목
- 목록 항목
1. 번호 목록"
                                        rows={15}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        팁: ## 로 소제목, - 로 목록, 숫자. 로 번호 목록을 만들 수 있습니다.
                                    </p>
                                </div>

                                {/* 버튼 */}
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/blog')}
                                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
                                    >
                                        {isSubmitting ? '등록 중...' : '글 등록하기'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* 뒤로가기 */}
                    <div className="mt-8 text-center">
                        <Link to="/blog" className="text-blue-600 hover:underline">
                            ← 블로그 목록으로 돌아가기
                        </Link>
                    </div>
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
