import { useState, useEffect, useRef } from "react";

export default function CozeFloatingChat() {
  const [open, setOpen] = useState(false);
  const chatRef = useRef(null);

  // Coze Chatbot SDK 삽입
  useEffect(() => {
    const existing = document.getElementById("coze-sdk");
    if (existing) return;

    const script = document.createElement("script");
    script.id = "coze-sdk";
    script.src =
      "https://sf-cdn.coze.com/obj/unpkg-va/flow-platform/chat-app-sdk/0.1.0-beta.5/libs/oversea/index.js";
    script.onload = () => {
      window.cozeChatbot = new CozeWebSDK.WebChatClient({
        bot_id: "7580759900293578757",
        el: "#coze-chat-container",
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 
          bg-blue-600 hover:bg-blue-700
          text-white shadow-xl rounded-full w-16 h-16
          flex items-center justify-center
          border-4 border-white transition
          z-[9999]
        "
        style={{
          fontSize: "24px",
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
        ref={chatRef}
        className={`
          fixed bottom-24 right-6 w-[380px] h-[520px]
          bg-white rounded-2xl shadow-2xl border border-gray-200
          overflow-hidden z-[9999] transition-all duration-300
          ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"}
        `}
      >
        {/* 헤더 */}
        <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
          <span className="font-bold">시민참여 법률 상담</span>
          <button onClick={() => setOpen(false)} className="text-xl font-bold">
            ×
          </button>
        </div>

        {/* Coze 챗봇 영역 */}
        <div id="coze-chat-container" className="w-full h-full"></div>
      </div>
    </>
  );
}
