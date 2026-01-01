import { useState } from 'react';
import { selectGoogleAccount, confirmGoogleLogin, selectKakaoAccount, confirmKakaoLogin } from '../lib/auth';

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

// LoginModal - 상태를 App.jsx에서 관리하여 리렌더링 시에도 유지
export default function LoginModal({
    isOpen,
    onClose,
    onLoginSuccess,
    step,
    setStep,
    selectedUser,
    setSelectedUser,
    selectedProvider,
    setSelectedProvider,
    googleLoginInProgress
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // 디버그 로그
    console.log('[LoginModal] step:', step, 'selectedUser:', selectedUser?.email, 'googleLoginInProgress:', googleLoginInProgress?.current);

    // 모달 초기화
    const resetModal = () => {
        setIsLoading(false);
        setError('');
        setStep('select');
        setSelectedUser(null);
        setSelectedProvider(null);
    };

    // 모달 닫기
    const handleClose = () => {
        resetModal();
        sessionStorage.removeItem('pendingKakaoUser');
        sessionStorage.removeItem('pendingKakaoToken');
        onClose();
    };

    // Google 로그인 버튼 클릭
    const handleGoogleClick = async () => {
        setIsLoading(true);
        setError('');

        // 1. 먼저 플래그 설정 (동기적으로!)
        if (googleLoginInProgress) {
            googleLoginInProgress.current = true;
            console.log('[LoginModal] googleLoginInProgress.current = true 설정됨');
        }

        // 2. provider 설정
        setSelectedProvider('google');

        try {
            console.log('[LoginModal] Google 로그인 시작');

            const result = await selectGoogleAccount();
            console.log('[LoginModal] Google 로그인 결과:', result.success, result.user?.email);

            if (result.success && result.user) {
                // 로그인 성공 - 확인 화면으로 이동
                console.log('[LoginModal] 확인 화면으로 전환');
                setSelectedUser(result.user);
                setStep('confirm');
                setIsLoading(false);
                console.log('[LoginModal] setStep(confirm) 호출 완료');
                return; // 여기서 종료
            } else if (result.isRedirect) {
                // 리다이렉트 방식으로 전환됨 - 페이지가 리다이렉트되므로 대기
                console.log('[LoginModal] 리다이렉트 방식으로 전환됨');
                return;
            } else {
                // 에러 처리 - 플래그 해제
                if (googleLoginInProgress) {
                    googleLoginInProgress.current = false;
                }
                setSelectedProvider(null);
                const errorMsg = result.error || '';
                if (errorMsg.includes('popup-closed') || errorMsg.includes('cancelled')) {
                    // 팝업 닫기는 에러로 표시하지 않음
                } else if (errorMsg.includes('popup-blocked')) {
                    setError('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
                } else if (errorMsg.includes('network')) {
                    setError('네트워크 오류가 발생했습니다.');
                } else if (errorMsg) {
                    setError('Google 로그인에 실패했습니다.');
                }
            }
        } catch (err) {
            console.error('[LoginModal] Google 로그인 에러:', err);
            if (googleLoginInProgress) {
                googleLoginInProgress.current = false;
            }
            setSelectedProvider(null);
            setError('Google 로그인 중 오류가 발생했습니다.');
        }

        setIsLoading(false);
    };

    // Kakao 로그인 버튼 클릭
    const handleKakaoClick = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await selectKakaoAccount();

            if (result.success && result.user) {
                // 로그인 성공 - 확인 화면으로 이동
                setSelectedUser(result.user);
                setSelectedProvider('kakao');
                setStep('confirm');
            } else {
                setError(result.error || '카카오 로그인에 실패했습니다.');
            }
        } catch (err) {
            setError('카카오 로그인 중 오류가 발생했습니다.');
        }

        setIsLoading(false);
    };

    // 계속하기 버튼 클릭 (로그인 완료 - 2차 검증)
    const handleContinue = async () => {
        setIsLoading(true);
        setError('');

        try {
            let result;
            if (selectedProvider === 'google') {
                result = await confirmGoogleLogin();
            } else if (selectedProvider === 'kakao') {
                result = await confirmKakaoLogin();
            }

            if (result && result.success) {
                // 로그인 완료 - 임시 데이터 정리
                sessionStorage.removeItem('pendingKakaoUser');
                sessionStorage.removeItem('pendingKakaoToken');

                // 로컬 상태만 정리 (App.jsx의 handleLoginSuccess에서 모달 상태 초기화)
                setIsLoading(false);
                setError('');

                // 성공 콜백 호출 (App.jsx의 handleLoginSuccess에서 모달 닫기 및 포스터 팝업 처리)
                onLoginSuccess(result.user);
                return;
            } else {
                setError(result?.error || '로그인에 실패했습니다.');
            }
        } catch (err) {
            setError('로그인 처리 중 오류가 발생했습니다.');
        }

        setIsLoading(false);
    };

    // 뒤로 가기 (다른 계정 선택)
    const handleBack = () => {
        setStep('select');
        setSelectedUser(null);
        setSelectedProvider(null);
        setError('');
        sessionStorage.removeItem('pendingKakaoUser');
        sessionStorage.removeItem('pendingKakaoToken');
    };

    if (!isOpen) return null;

    // 확인 화면 (2단계)
    if (step === 'confirm' && selectedUser) {
        const isGoogle = selectedProvider === 'google';
        const userName = selectedUser.displayName || selectedUser.email || '사용자';
        const userEmail = selectedUser.email || '';

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                    {/* 헤더 */}
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={handleBack}
                                className="text-gray-400 hover:text-gray-600 transition p-1"
                                disabled={isLoading}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">
                                {isGoogle ? 'Google' : '카카오'} 로그인
                            </h2>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition p-1"
                                disabled={isLoading}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* 내용 */}
                    <div className="px-8 pb-8 space-y-4">
                        {/* 에러 메시지 */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* 사용자 정보 */}
                        <div className="flex flex-col items-center py-4">
                            {selectedUser.photoURL ? (
                                <img
                                    src={selectedUser.photoURL}
                                    alt={userName}
                                    className="w-16 h-16 rounded-full mb-3"
                                />
                            ) : (
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${isGoogle ? 'bg-gray-100' : 'bg-[#FEE500]'}`}>
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

                            <p className="text-lg font-medium text-gray-900">{userName}</p>
                            {userEmail && (
                                <p className="text-sm text-gray-500">{userEmail}</p>
                            )}
                        </div>

                        <p className="text-center text-gray-600 text-sm">
                            이 계정으로 시민법정에 로그인합니다.
                        </p>

                        {/* 계속하기 버튼 */}
                        <button
                            onClick={handleContinue}
                            disabled={isLoading}
                            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-medium transition-all disabled:opacity-50 ${
                                isGoogle
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-[#FEE500] hover:bg-[#FDD800] text-[#391B1B]'
                            }`}
                        >
                            {isGoogle ? <GoogleIcon /> : <KakaoIcon />}
                            <span>{isLoading ? '처리 중...' : '계속하기'}</span>
                        </button>

                        {/* 다른 계정 사용 */}
                        <button
                            onClick={handleBack}
                            disabled={isLoading}
                            className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition text-sm disabled:opacity-50"
                        >
                            다른 계정 사용
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 선택 화면 (1단계)
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* 헤더 */}
                <div className="px-8 pt-8 pb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-900">간편 로그인</h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition p-1"
                            disabled={isLoading}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm">
                        소셜 계정으로 간편하게 로그인하세요.
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
                        onClick={handleKakaoClick}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#FEE500] hover:bg-[#FDD800] text-[#391B1B] rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        <KakaoIcon />
                        <span>{isLoading ? '로딩 중...' : '카카오로 계속하기'}</span>
                    </button>

                    {/* Google 로그인 버튼 */}
                    <button
                        onClick={handleGoogleClick}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                        <GoogleIcon />
                        <span>{isLoading ? '로딩 중...' : 'Google로 계속하기'}</span>
                    </button>
                </div>

                {/* 구분선 */}
                <div className="px-8">
                    <div className="flex items-center">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-4 text-sm text-gray-400">또는</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>
                </div>

                {/* 로그인 없이 서명하기 */}
                <div className="px-8 py-6">
                    <button
                        onClick={handleClose}
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
