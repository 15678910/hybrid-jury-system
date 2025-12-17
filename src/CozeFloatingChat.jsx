import React from 'react';

export default function CozeFloatingChat() {
  
  const handleOpen = () => {
    // 숨겨진 Coze 버튼 찾아서 클릭
    const cozeBtn = document.querySelector('body > div:not(#root) button');
    if (cozeBtn) {
      cozeBtn.click();
    } else {
      console.log('Coze 버튼을 찾을 수 없습니다');
    }
  };

  return (
    <button
      onClick={handleOpen}
      className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center text-2xl"
      aria-label="챗봇 열기"
    >
      ⚖️
    </button>
  );
}
