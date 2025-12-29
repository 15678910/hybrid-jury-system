import { useState } from 'react';
import { signInWithGoogle, signInWithKakao } from '../lib/auth';

// Kakao 아이콘
const KakaoIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
);

// Google 아이콘
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingUser, setPendingUser] = useState(null); // 계정 선택 후 대기중인 사용자
    const [pendingProvider, setPendingProvider] = useState(null); // 'google' | 'kakao'

    // Google 로그인 - 계정 선택만 진행
    const handleGoogleSelect = async () => {
        setIsLoading(true);
        setError('');

        const result = await signInWithGoogle();

        if (result.success) {
            // 계정 선택 완료 - 확인 화면으로 이동
            setPendingUser(result.user);
            setPendingProvider('google');
        } else {
            setError('로그인에 실패했습니다. 다시 시도해주세요.');
        }

        setIsLoading(false);
    };

    // Kakao 로그인 - 계정 선택만 진행
    const handleKakaoSelect = async () => {
        setIsLoading(true);
        setError('');

        const result = await signInWithKakao();

        if (result.success) {
            // 계정 선택 완료 - 확인 화면으로 이동
            setPendingUser(result.user);
            setPendingProvider('kakao');
        } else {
            setError(result.error || '카카오 로그인에 실패했습니다.');
        }

        setIsLoading(false);
    };

    // Continue 버튼 클릭 - 실제 로그인 완료
    const handleContinue = () => {
        if (pendingUser) {
            onLoginSuccess(pendingUser);
            resetAndClose();
        }
    };

    // 뒤로가기 (다른 계정 선택)
    const handleBack = () => {
        setPendingUser(null);
        setPendingProvider(null);
        setError('');
    };

    // 모달 닫기 및 상태 초기화
    const resetAndClose = () => {
        setError('');
        setPendingUser(null);
        setPendingProvider(null);
        onClose();
    };

    if (!isOpen) return null;

    // 계정 선택 완료 후 확인 화면
    if (pendingUser && pendingProvider) {
        const isGoogle = pendingProvider === 'google';
        const userName = pendingUser.displayName || pendingUser.email || '사용자';
        const userEmail = pendingUser.email || '';

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleBack}
                                className="text-gray-400 hover:text-gray-600 transition p-1"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isGoogle ? 'Google' : '카카오'} 로그인
                            </h2>
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

                    <div className="px-8 pb-8 space-y-4">
                        {/* 사용자 정보 표시 */}
                        <div className="flex flex-col items-center py-4">
                            {/* 프로필 이미지 또는 아이콘 */}
                            {pendingUser.photoURL ? (
                                <img
                                    src={pendingUser.photoURL}
                                    alt={userName}
                                    className="w-16 h-16 rounded-full mb-3"
                                />
                            ) : (
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                                    isGoogle ? 'bg-gray-100' : 'bg-[#FEE500]'
                                }`}>
                                    {isGoogle ? (
                                        <svg className="w-8 h-8" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-8 h-8 text-[#391B1B]" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.89 5.33 4.71 6.73l-.96 3.57c-.07.27.2.5.45.38l4.27-2.43c.49.05 1 .08 1.53.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                                        </svg>
                                    )}
                                </div>
                            )}

                            {/* 사용자 이름 */}
                            <p className="text-lg font-medium text-gray-900">{userName}</p>

                            {/* 이메일 */}
                            {userEmail && (
                                <p className="text-sm text-gray-500">{userEmail}</p>
                            )}
                        </div>

                        <p className="text-center text-gray-600 text-sm">
                            이 계정으로 시민법정에 로그인합니다.
                        </p>

                        {/* Continue 버튼 */}
                        <button
                            onClick={handleContinue}
                            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all ${
                                isGoogle
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-[#FEE500] hover:bg-[#FDD800] text-[#391B1B]'
                            }`}
                        >
                            {isGoogle ? <GoogleIcon /> : <KakaoIcon />}
                            <span>Continue with {isGoogle ? 'Google' : 'Kakao'}</span>
                        </button>

                        {/* 다른 계정 사용 */}
                        <button
                            onClick={handleBack}
                            className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition text-sm"
                        >
                            다른 계정 사용
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 기본 선택 화면
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
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
                        onClick={handleKakaoSelect}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#391B1B] rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        <KakaoIcon />
                        <span>{isLoading ? '로그인 중...' : '카카오로 계속하기'}</span>
                    </button>

                    {/* Google 로그인 버튼 */}
                    <button
                        onClick={handleGoogleSelect}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        <GoogleIcon />
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
                        시민법정의 <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">개인정보 처리방침</a>을 확인하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
