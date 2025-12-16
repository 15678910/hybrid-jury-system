import { useState } from "react";

export default function CozeFloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(true)}
        title="시민법정 AI 상담 열기"
        className="
          fixed bottom-4 right-4 md:bottom-6 md:right-6
          bg-blue-600 hover:bg-blue-700
          text-white shadow-xl rounded-full 
          w-14 h-14 md:w-16 md:h-16
          flex items-center justify-center
          border-4 border-white transition
          z-[9999]
        "
        style={{
          fontSize: "20px",
          boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
        }}
      >
        ⚖️
      </button>

      {/* 배경 오버레이 */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-[9998]"
        />
      )}

      {/* 챗봇 팝업 */}
      <div
        className={`
          fixed 
          bottom-20 right-2 left-2
          md:bottom-24 md:right-6 md:left-auto
          w-auto md:w-[380px] 
          h-[85vh] md:h-[600px]
          max-h-[700px]
          bg-white rounded-2xl shadow-2xl border border-gray-200
          overflow-hidden z-[9999] transition-all duration-300
          ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
        `}
      >
        {/* 헤더 */}
        <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
          <span className="font-bold text-base md:text-lg">
            시민법정 AI 상담
          </span>

          <button
            onClick={() => setOpen(false)}
            className="text-xl font-bold hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Coze 챗봇 영역 */}
        <div
          className="relative w-full bg-white"
          style={{
            height: 'calc(100% - 60px)',
            overflow: 'hidden'
          }}
        >
          {/* iframe - 위로 이동시켜 헤더 숨기기 */}
          {open && (
            <iframe
              src="https://www.coze.com/s/Za8uUqrEo/"
              className="w-full border-0"
              title="Coze AI 챗봇"
              allow="microphone; camera"
              style={{
                height: 'calc(100% + 50px)',
                marginTop: '-50px',
                marginBottom: '0'
              }}
            />
          )}

          {/* 하단 가리개 - 영어 텍스트 숨기기 */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: '120px',
              background: 'linear-gradient(to top, white 95%, transparent)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          />
        </div>
      </div>
    </>
  );
}
