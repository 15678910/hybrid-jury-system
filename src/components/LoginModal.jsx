import { useState } from 'react';
import { signInWithGoogle, signInWithKakao } from '../lib/auth';

// Kakao 아이콘
const KakaoIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
);

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
    const [step, setStep] = useState(1); // 1: 동의 단계, 2: 로그인 단계
    const [consents, setConsents] = useState({
        all: false,
        age14: false,
        privacy: false,
        terms: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // 모든 필수 동의 체크 확인
    const allConsentsChecked = consents.age14 && consents.privacy && consents.terms;

    // 전체 동의 처리
    const handleAllConsent = (checked) => {
        setConsents({
            all: checked,
            age14: checked,
            privacy: checked,
            terms: checked
        });
    };

    // 개별 동의 처리
    const handleIndividualConsent = (key, checked) => {
        const newConsents = { ...consents, [key]: checked };
        newConsents.all = newConsents.age14 && newConsents.privacy && newConsents.terms;
        setConsents(newConsents);
    };

    // 동의 후 다음 단계로
    const handleAgree = () => {
        if (allConsentsChecked) {
            setStep(2);
        }
    };

    // Google 로그인 처리
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');

        const result = await signInWithGoogle();

        if (result.success) {
            onLoginSuccess(result.user);
            resetAndClose();
        } else {
            setError('로그인에 실패했습니다. 다시 시도해주세요.');
        }

        setIsLoading(false);
    };

    // Kakao 로그인 처리
    const handleKakaoLogin = async () => {
        setIsLoading(true);
        setError('');

        const result = await signInWithKakao();

        if (result.success) {
            onLoginSuccess(result.user);
            resetAndClose();
        } else {
            setError('카카오 로그인은 준비 중입니다.');
        }

        setIsLoading(false);
    };

    // 모달 닫기 및 상태 초기화
    const resetAndClose = () => {
        setStep(1);
        setConsents({ all: false, age14: false, privacy: false, terms: false });
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

                {/* Step 1: 동의 단계 */}
                {step === 1 && (
                    <>
                        {/* 헤더 */}
                        <div className="px-8 pt-8 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold text-gray-900">이용 약관</h2>
                                <button
                                    onClick={resetAndClose}
                                    className="text-gray-400 hover:text-gray-600 transition p-1"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* 동의 체크박스 */}
                        <div className="px-8 pb-6">
                            {/* 전체 동의 */}
                            <label className="flex items-center gap-3 py-3 cursor-pointer border-b border-gray-200">
                                <input
                                    type="checkbox"
                                    checked={consents.all}
                                    onChange={(e) => handleAllConsent(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="font-medium text-gray-900">다음 모든 항목에 동의합니다.</span>
                            </label>

                            {/* 만 14세 이상 */}
                            <label className="flex items-center gap-3 py-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={consents.age14}
                                    onChange={(e) => handleIndividualConsent('age14', e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">본인은 만 14세 이상입니다.</span>
                            </label>

                            {/* 이용약관 */}
                            <label className="flex items-center gap-3 py-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={consents.terms}
                                    onChange={(e) => handleIndividualConsent('terms', e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">
                                    <a href="/terms" target="_blank" className="text-blue-600 hover:underline">이용 약관</a>에 동의합니다.
                                </span>
                            </label>

                            {/* 개인정보 처리방침 */}
                            <label className="flex items-center gap-3 py-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={consents.privacy}
                                    onChange={(e) => handleIndividualConsent('privacy', e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700">
                                    (필수) 개인정보의 수집 및 사용에 동의합니다. (<a href="/privacy" target="_blank" className="text-blue-600 hover:underline">더 보기</a>)
                                </span>
                            </label>
                        </div>

                        {/* 동의 버튼 */}
                        <div className="px-8 pb-8">
                            <button
                                onClick={handleAgree}
                                disabled={!allConsentsChecked}
                                className={`w-full py-4 rounded-xl font-medium text-lg transition-all ${
                                    allConsentsChecked
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                동의 및 계속하기
                            </button>
                        </div>
                    </>
                )}

                {/* Step 2: 로그인 단계 */}
                {step === 2 && (
                    <>
                        {/* 헤더 */}
                        <div className="px-8 pt-8 pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold text-gray-900">간편 로그인</h2>
                                <button
                                    onClick={resetAndClose}
                                    className="text-gray-400 hover:text-gray-600 transition p-1"
                                    disabled={isLoading}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-gray-500 text-sm">
                                이메일이나 다른 서비스로 계속 사용하세요 (무료).
                            </p>
                        </div>

                        {/* 로그인 버튼들 */}
                        <div className="px-8 pb-6 space-y-3">
                            {/* 에러 메시지 */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Kakao 로그인 버튼 */}
                            <button
                                onClick={handleKakaoLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#391B1B] rounded-xl font-medium transition-all disabled:opacity-50"
                            >
                                <KakaoIcon />
                                <span>{isLoading ? '로그인 중...' : '카카오로 계속하기'}</span>
                            </button>

                            {/* Google 로그인 버튼 */}
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                <span>{isLoading ? '로그인 중...' : 'Google로 계속하기'}</span>
                            </button>
                        </div>

                        {/* 구분선 */}
                        <div className="px-8">
                            <div className="flex items-center">
                                <div className="flex-1 border-t border-gray-200"></div>
                                <span className="px-4 text-sm text-gray-400">다른 방법으로 계속하기</span>
                                <div className="flex-1 border-t border-gray-200"></div>
                            </div>
                        </div>

                        {/* 로그인 없이 서명하기 */}
                        <div className="px-8 py-6">
                            <button
                                onClick={resetAndClose}
                                disabled={isLoading}
                                className="w-full py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                로그인 없이 서명하기
                            </button>

                            <p className="mt-4 text-xs text-gray-400 text-center">
                                계속하면 시민법정의 <a href="/terms" target="_blank" className="text-blue-600 hover:underline">이용 약관</a>에 동의하는 것으로 간주됩니다.<br />
                                시민법정의 <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">개인정보 처리방침</a>을 확인하세요.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
