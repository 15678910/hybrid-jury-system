import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import { KakaoIcon, FacebookIcon, TelegramIcon } from '../components/icons';
import { JUDGES_DATA } from '../data/judges';

// 카테고리 정의
const CATEGORIES = [
    { id: 'constitutional', name: '헌법재판소', icon: '⚖️' },
    { id: 'supreme', name: '대법원', icon: '🏛️' },
    { id: 'insurrection', name: '내란전담재판부', icon: '🔒' },
    { id: 'warrant', name: '영장전담판사', icon: '📋' }
];

const CATEGORY_MAP = {
    '헌법재판소': 'constitutional',
    '대법원': 'supreme',
    '내란전담재판부': 'insurrection',
    '영장전담판사': 'warrant'
};

export default function JudgeEvaluation() {
    const [searchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category');
    const [judges] = useState(JUDGES_DATA);
    const [kakaoReady, setKakaoReady] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || '헌법재판소');

    // Kakao SDK 초기화
    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                try {
                    window.Kakao.init('83e843186c1251b9b5a8013fd5f29798');
                    setKakaoReady(true);
                } catch (e) {
                    console.error('Kakao init error:', e);
                }
            } else if (window.Kakao?.isInitialized()) {
                setKakaoReady(true);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    // 카카오톡 공유
    const shareToKakao = () => {
        const pageUrl = 'https://xn--lg3b0kt4n41f.kr/judge-evaluation';

        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendScrap({
                    requestUrl: pageUrl,
                    templateId: 0,
                    templateArgs: {}
                });
            } catch (e) {
                console.error('Kakao share error:', e);
                fallbackShare(pageUrl);
            }
        } else {
            fallbackShare(pageUrl);
        }
    };

    // 텔레그램 공유
    const shareToTelegram = () => {
        const pageUrl = `https://xn--lg3b0kt4n41f.kr/judge-evaluation?t=${Date.now()}`;
        const text = '판사 평가 | 시민법정';
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(text)}`;
        window.open(telegramUrl, '_blank', 'width=600,height=400');
    };

    // 페이스북 공유 (클립보드 복사)
    const shareToFacebook = async () => {
        const pageUrl = 'https://xn--lg3b0kt4n41f.kr/judge-evaluation';
        try {
            await navigator.clipboard.writeText(pageUrl);
            alert('링크가 복사되었습니다!\n페이스북에 붙여넣기 하세요.');
        } catch (err) {
            alert('링크: ' + pageUrl);
        }
    };

    // 폴백 공유 (클립보드 복사)
    const fallbackShare = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            alert('링크가 복사되었습니다!');
        } catch (err) {
            alert('링크: ' + url);
        }
    };

    // 필터링된 판사 목록
    const filteredJudges = selectedCategory
        ? judges.filter(j => j.category === selectedCategory)
        : judges;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
            <Header />
            <div className="pt-20 pb-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* 헤더 */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            ⚖️ 판사 평가
                        </h1>
                        <p className="text-gray-300 text-lg mb-6">
                            내란 재판 담당 판사들의 판결을 평가하고 의견을 공유하세요
                        </p>

                        {/* SNS 공유 버튼 */}
                        <div className="flex justify-center gap-4 mb-8">
                            <button
                                onClick={shareToKakao}
                                className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-500 transition font-medium"
                            >
                                <KakaoIcon className="w-5 h-5" />
                                카카오톡
                            </button>
                            <button
                                onClick={shareToTelegram}
                                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                            >
                                <TelegramIcon className="w-5 h-5" />
                                텔레그램
                            </button>
                            <button
                                onClick={shareToFacebook}
                                className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition font-medium"
                            >
                                <FacebookIcon className="w-5 h-5" />
                                페이스북
                            </button>
                        </div>

                        {/* 카테고리 필터 탭 */}
                        <div className="flex flex-wrap justify-center gap-2 mb-8">
                            {CATEGORIES.map(cat => {
                                const count = judges.filter(j => j.category === cat.name).length;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`px-4 py-2 rounded-full font-medium transition ${
                                            selectedCategory === cat.name
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {cat.icon} {cat.name} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        {/* 면책 문구 */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-3xl mx-auto">
                            <p className="text-yellow-800 text-sm">
                                ⚠️ <strong>면책 고지:</strong> 본 평가는 개인의 의견을 자유롭게 표현하는 공간입니다.
                                모든 평가는 주관적 견해이며, 법적 판단이나 공식적인 평가가 아닙니다.
                                판사에 대한 명예훼손, 모욕, 허위사실 유포는 법적 책임을 질 수 있으니
                                사실에 근거한 건설적인 의견을 부탁드립니다.
                            </p>
                        </div>
                    </div>

                    {/* 선택된 카테고리 헤더 */}
                    {selectedCategory && (
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                            {CATEGORIES.find(c => c.name === selectedCategory)?.icon}
                            {selectedCategory}
                        </h2>
                    )}

                    {/* 판사 카드 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredJudges.map((judge) => (
                            <Link
                                key={judge.id}
                                to={`/judge/${judge.id}`}
                                className="block"
                            >
                                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                            {judge.photo ? (
                                                <img
                                                    src={judge.photo}
                                                    alt={judge.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                />
                                            ) : null}
                                            <span className={`text-3xl font-bold text-white ${judge.photo ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                                                {judge.name[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-xl text-gray-900">{judge.name}</h3>
                                            <p className="text-gray-500 text-sm">{judge.court}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">직책:</span> {judge.position}
                                        </p>
                                        {judge.cases && judge.cases.length > 0 && (
                                            <div className="text-sm text-gray-600">
                                                <span className="font-medium">담당:</span>
                                                {judge.cases.length === 1 ? (
                                                    <span> {judge.cases[0].text || judge.cases[0]}</span>
                                                ) : (
                                                    <ul className="ml-4 mt-1 space-y-1">
                                                        {judge.cases.map((caseItem, idx) => (
                                                            <li key={idx}>• {caseItem.text || caseItem}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}

                                        {/* 평점 (향후 기능) */}
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-1 text-yellow-500">
                                                <span className="text-lg">⭐</span>
                                                <span className="font-medium text-gray-700">
                                                    {judge.rating > 0 ? judge.rating.toFixed(1) : '평가없음'}
                                                </span>
                                            </div>
                                            <span className="text-gray-400 text-sm">
                                                ({judge.reviewCount}개 평가)
                                            </span>
                                        </div>
                                    </div>

                                    {/* 호버 효과 */}
                                    <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                        상세보기
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* 하단 안내 */}
                    <div className="mt-12 text-center">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto">
                            <h3 className="text-lg font-bold text-blue-900 mb-2">
                                🗳️ 시민법관 참심제를 통한 사법 민주화
                            </h3>
                            <p className="text-blue-800 text-sm">
                                판사의 판결에 대한 시민의 감시와 평가는 건강한 사법 시스템을 위해 필수적입니다.
                                시민법관 참심제는 중대 형사사건에서 시민이 직접 재판에 참여하여
                                판결의 정당성을 높이고 사법 불신을 해소하는 제도입니다.
                            </p>
                            <Link
                                to="/"
                                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition font-medium"
                            >
                                사법개혁 자세히 보기
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
