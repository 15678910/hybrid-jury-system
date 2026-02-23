import { useState, useEffect, useRef } from 'react';
import { FAQMatcher } from './lib/faqMatcher';
import faqData from './data/faq.json';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matcher, setMatcher] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const faqMatcher = new FAQMatcher(faqData);
    setMatcher(faqMatcher);

    // 초기 환영 메시지
    setMessages([{
      role: 'assistant',
      content: '안녕하세요! 시민법정 AI 상담사입니다.\n참심제에 대해 무엇이든 물어보세요.',
      source: 'system',
      timestamp: new Date()
    }]);
  }, []);

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    // 새 메시지가 추가되면 해당 메시지의 시작 부분으로 스크롤
    scrollToLatestQuestion();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToLatestQuestion = () => {
    // 마지막 질문 위치로 스크롤 (답변이 아래에 보이도록)
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const questions = container.querySelectorAll('[data-type="question"]');
      if (questions.length > 0) {
        const lastQuestion = questions[questions.length - 1];
        lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 1단계: FAQ 매칭 (단순 질문만 - 빠른 응답)
      const faqMatch = matcher?.findMatch(currentInput);

      if (faqMatch) {
        const faqResponse = {
          role: 'assistant',
          content: faqMatch.answer,
          source: 'faq',
          faqId: faqMatch.id,
          category: faqMatch.category,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, faqResponse]);
        setIsLoading(false);
        return;
      }

      // 2단계: 서버 RAG API 호출
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentInput,
            conversationHistory: messages.slice(-6)
          }),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          const aiResponse = {
            role: 'assistant',
            content: data.answer,
            source: data.mode === 'rag' ? 'ai' : (data.mode === 'fallback' ? 'pdf' : 'ai'),
            sources: data.sources || [],
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiResponse]);
          setIsLoading(false);
          return;
        }
        throw new Error('API 요청 실패');
      } catch (apiError) {
        console.error('RAG API 호출 실패:', apiError);
      }

      // 3단계: API 실패 시 안내 메시지
      const fallbackResponse = {
        role: 'assistant',
        content: '해당 질문에 대한 답변을 찾지 못했습니다.\n\n아래 주제에 대해 질문해 보세요:\n• 참심제가 무엇인가요?\n• 참심제와 배심제의 차이점\n• 헌법 개정이 필요한가요?\n• 시민법관 선발 방법\n• 시민법관의 권한과 보수',
        source: 'system',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } catch (error) {
      console.error('Error:', error);

      const errorResponse = {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        source: 'error',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const getSourceBadge = (source) => {
    const badges = {
      faq: { text: 'FAQ', color: 'bg-emerald-500', icon: '📋' },
      pdf: { text: '문서', color: 'bg-blue-500', icon: '📄' },
      ai: { text: 'AI', color: 'bg-purple-500', icon: '✨' },
      system: { text: '안내', color: 'bg-gray-500', icon: '💬' },
      error: { text: '오류', color: 'bg-red-500', icon: '⚠️' }
    };

    const badge = badges[source] || badges.system;
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full text-white ${badge.color}`}>
        <span>{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  // 인라인 마크다운 처리 (**, *, 참고자료 등)
  const renderInline = (text) => {
    if (!text) return null;
    // **bold** → <strong>, *italic* → <em>, (참고자료 N) → badge
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // 텍스트 포맷팅 - 마크다운 렌더링
  const formatContent = (content, source) => {
    if (!content) return null;

    // 소스 라벨 제거 (별도로 표시)
    let text = content.replace(/^\[.*?\]\n\n/, '');

    // 줄 단위로 파싱
    const lines = text.split('\n');
    const elements = [];
    let currentList = [];
    let listType = null; // 'ul' or 'ol'

    const flushList = () => {
      if (currentList.length === 0) return;
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-none space-y-1.5 my-2 ml-1">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 font-semibold min-w-[1.2em] text-right">{item.num}.</span>
                <span>{renderInline(item.text)}</span>
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-none space-y-1 my-2 ml-3">
            {currentList.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{renderInline(item.text)}</span>
              </li>
            ))}
          </ul>
        );
      }
      currentList = [];
      listType = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 빈 줄 → 리스트 종료 + 간격
      if (!trimmed) {
        flushList();
        continue;
      }

      // ## 제목
      if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(
          <p key={`h-${i}`} className="font-semibold text-white mt-3 mb-1">
            {renderInline(trimmed.slice(3))}
          </p>
        );
        continue;
      }

      // 번호 리스트: "1. ", "2. " 등
      const olMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
      if (olMatch) {
        if (listType !== 'ol') flushList();
        listType = 'ol';
        currentList.push({ num: olMatch[1], text: olMatch[2] });
        continue;
      }

      // 불릿 리스트: "* ", "- ", "• " 등
      const ulMatch = trimmed.match(/^[*\-•]\s+(.+)/);
      if (ulMatch) {
        if (listType !== 'ul') flushList();
        listType = 'ul';
        currentList.push({ text: ulMatch[1] });
        continue;
      }

      // 들여쓴 하위 항목: "  * ", "    - " 등
      const subMatch = trimmed.match(/^[*\-•]\s+(.+)/);
      if (line.startsWith('    ') && subMatch) {
        if (listType !== 'ul') flushList();
        listType = 'ul';
        currentList.push({ text: `  ${subMatch[1]}` });
        continue;
      }

      // 일반 텍스트
      flushList();
      elements.push(
        <p key={`p-${i}`} className="mt-1">
          {renderInline(trimmed)}
        </p>
      );
    }

    flushList();
    return elements;
  };

  const quickQuestions = [
    '참심제가 무엇인가요?',
    '헌법 개정이 필요한가요?',
    '시민법관은 어떻게 선발되나요?',
    '참심제와 배심제의 차이는?',
    '시민법관의 권한은 무엇인가요?'
  ];

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 transition-all duration-300 hover:scale-110 z-50 bg-transparent"
        aria-label={isOpen ? '챗봇 닫기' : '챗봇 열기'}
      >
        <img src="/Chatbot_Message_Bubble__1.png" alt="챗봇" className="w-full h-full object-contain" />
      </button>

      {/* 챗봇 모달 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">시민법관 참심제 AI 상담</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* 메시지 영역 */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 pt-0 pb-3 space-y-2">
            {messages.map((message, index) => (
              <div key={index}>
                {/* 사용자 질문 - 상단에 눈에 띄게 (고정 스타일) */}
                {message.role === 'user' && (
                  <div data-type="question" className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-4 py-2 mb-2 shadow-md scroll-mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-xs">🔍</span>
                      <span className="text-[10px] text-blue-100 font-medium">질문</span>
                    </div>
                    <p className="text-[14px] font-semibold text-white leading-relaxed">{message.content}</p>
                  </div>
                )}

                {/* AI 답변 - 카드 형태로 정돈 */}
                {message.role === 'assistant' && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* 답변 헤더 */}
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {getSourceBadge(message.source)}
                        {message.category && (
                          <span className="text-[10px] text-gray-500">{message.category}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* 답변 본문 */}
                    <div className="px-3 py-3">
                      <div className="text-[13px] leading-[1.7] text-gray-700">
                        {formatContent(message.content, message.source)}
                      </div>

                      {/* 출처 표시 */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((s, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                                📎 {s.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 환영 메시지 아래 자주 묻는 질문 */}
                      {message.source === 'system' && index === 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-[11px] text-gray-500 mb-2 font-medium">자주 묻는 질문</p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {quickQuestions.map((q, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleQuickQuestion(q)}
                                className="text-[12px] px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all text-left flex items-center gap-2"
                              >
                                <span className="text-gray-400">→</span>
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="질문을 입력하세요..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                전송
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
