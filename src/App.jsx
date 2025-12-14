export default function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
                <div className="text-8xl mb-6 animate-bounce">
                    🚧
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                    사이트 업그레이드 중
                </h1>

                <p className="text-xl text-gray-600 mb-8">
                    더 나은 서비스 제공을 위해<br />
                    잠시 점검 중입니다
                </p>

                <div className="border-t border-gray-300 my-8"></div>

                <div className="bg-blue-50 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-bold text-blue-800 mb-3">
                        ⚖️ 혼합형 참심제 도입 추진위원회(준)
                    </h2>
                    <p className="text-gray-700 leading-relaxed">
                        시민이 참여하는 사법개혁을 위한<br />
                        더 나은 플랫폼을 준비하고 있습니다.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">곧 다시 찾아뵙겠습니다</span>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                        급한 문의사항은 이메일로 연락 주세요
                    </p>
                    <a 
                        href="mailto:info@시민법정.kr" 
                        className="text-blue-600 hover:text-blue-700 font-medium inline-block mt-2"
                    >
                        info@시민법정.kr
                    </a>
                </div>
            </div>

            <style jsx>{`
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                .animate-bounce {
                    animation: bounce 2s infinite;
                }
            `}</style>
        </div>
    );
}