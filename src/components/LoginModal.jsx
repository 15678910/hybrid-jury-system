import { useState } from 'react';
import { signInWithGoogle, signInWithKakao } from '../lib/auth';
import ConsentCheckbox from './ConsentCheckbox';

// Google 아이콘
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

// Kakao 아이콘
const KakaoIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
);

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
    const [consents, setConsents] = useState({
        age14: false,
        privacy: false,
        terms: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // 모든 필수 동의 체크 확인
    const allConsentsChecked = consents.age14 && consents.privacy && consents.terms;

    // Google 로그인 처리
    const handleGoogleLogin = async () => {
        if (!allConsentsChecked) {
            setError('모든 필수 항목에 동의해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await signInWithGoogle();

        if (result.success) {
            onLoginSuccess(result.user);
            onClose();
        } else {
            setError('로그인에 실패했습니다. 다시 시도해주세요.');
        }

        setIsLoading(false);
    };

    // Kakao 로그인 처리
    const handleKakaoLogin = async () => {
        if (!allConsentsChecked) {
            setError('모든 필수 항목에 동의해주세요.');
            return;
        }

        setIsLoading(true);
        setError('');

        const result = await signInWithKakao();

        if (result.success) {
            onLoginSuccess(result.user);
            onClose();
        } else {
            // Kakao는 아직 미구현
            setError('');
        }

        setIsLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900">간편 로그인</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        disabled={isLoading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 본문 */}
                <div className="px-6 py-6">
                    {/* 소개 */}
                    <p className="text-gray-600 mb-6 text-center">
                        간편하게 로그인하고 시민법정 참심제를 응원해주세요!
                    </p>

                    {/* 동의 체크박스 */}
                    <ConsentCheckbox
                        consents={consents}
                        onChange={setConsents}
                    />

                    {/* 에러 메시지 */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Google 로그인 버튼 */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading || !allConsentsChecked}
                        className={`w-full flex items-center justify-center gap-3 px-6 py-3 border-2 rounded-xl font-medium transition-all ${allConsentsChecked
                                ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
                                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <GoogleIcon />
                        <span>{isLoading ? '로그인 중...' : 'Google로 계속하기'}</span>
                    </button>

                    {/* Kakao 로그인 버튼 (선택사항) */}
                    <button
                        onClick={handleKakaoLogin}
                        disabled={isLoading || !allConsentsChecked}
                        className={`w-full mt-3 flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${allConsentsChecked
                                ? 'bg-[#FEE500] hover:bg-[#FDD800] text-[#391B1B]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <KakaoIcon />
                        <span>Kakao로 계속하기 (준비중)</span>
                    </button>

                    {/* 구분선 */}
                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="px-4 text-sm text-gray-500">또는</span>
                        <div className="flex-1 border-t border-gray-300"></div>
                    </div>

                    {/* 로그인 없이 서명하기 버튼 */}
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition disabled:opacity-50"
                    >
                        로그인 없이 서명하기
                    </button>

                    {/* 안내 문구 */}
                    <p className="mt-4 text-xs text-gray-500 text-center">
                        로그인하시면 정보가 자동으로 입력되어 더 편리하게 서명하실 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
