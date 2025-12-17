import React, { useState, useEffect } from 'react';

export default function CozeFloatingChat({ botId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // botId가 없으면 기본값 사용
  const chatBotId = botId || '7580759900293578757';
  const iframeUrl = `https://www.coze.com/web/chatbot-launcher/${chatBotId}`;

  return (
    <>
      {/* 챗봇 버튼 */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50"
          aria-label="챗봇 열기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        </button>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <div
          className={`fixed ${
            isMobile
              ? 'inset-0 z-50'
              : 'bottom-6 right-6 z-50 w-96 h-[600px]'
          } bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col`}
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">시민법정 챗봇</span>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
              aria-label="챗봇 닫기"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 챗봇 iframe */}
          <div className="flex-1 relative">
            <iframe
              src={iframeUrl}
              className="absolute inset-0 w-full h-full border-0"
              allow="microphone"
              title="Coze Chatbot"
            />
          </div>
        </div>
      )}
    </>
  );
}
