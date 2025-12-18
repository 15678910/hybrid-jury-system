import { useState, useEffect, useRef } from 'react';
import { FAQMatcher } from './lib/faqMatcher';
import { getVectorSearch } from './lib/vectorSearch';
import faqData from './data/faq.json';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matcher, setMatcher] = useState(null);
  const [vectorSearch, setVectorSearch] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const faqMatcher = new FAQMatcher(faqData);
    setMatcher(faqMatcher);

    // 벡터 검색 비동기 초기화
    const initVectorSearch = async () => {
      try {
        const vs = await getVectorSearch();
        setVectorSearch(vs);
        console.log('벡터 검색 초기화 완료:', vs.getStats());
      } catch (err) {
        console.log('벡터 검색 초기화 실패:', err);
      }
    };
    initVectorSearch();

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

      // 2단계: PDF 검색 + AI 요약 (더 많은 청크를 AI에게 전달)
      let pdfResults = [];
      if (vectorSearch) {
        try {
          // 더 많은 청크 검색 (10개)
          pdfResults = vectorSearch.search(currentInput, 10, 0.01);
          console.log('PDF 검색 결과:', pdfResults.length, '개');
        } catch (err) {
          console.log('PDF 검색 오류:', err);
        }
      }

      // PDF 검색 결과가 있으면 AI에게 요약 요청
      const pdfContext = pdfResults.length > 0
        ? pdfResults.map((r, i) => `[출처: ${vectorSearch.getSourceLabel(r.source)}]\n${r.text}`).join('\n\n---\n\n')
        : null;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: currentInput, context: pdfContext }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResponse = {
            role: 'assistant',
            content: data.answer,
            source: pdfContext ? 'ai' : 'ai', // PDF 기반이든 아니든 AI 표시
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiResponse]);
          setIsLoading(false);
          return;
        }
      } catch (apiError) {
        console.log('AI API 호출 실패, 안내 메시지로 대체:', apiError);
      }

      // 3단계: AI API도 실패하면 안내 메시지
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

  // 텍스트 포맷팅 - 가독성 향상
  const formatContent = (content, source) => {
    if (!content) return null;

    // 소스 라벨 제거 (별도로 표시)
    let text = content.replace(/^\[.*?\]\n\n/, '');

    // 줄바꿈으로 단락 분리
    const paragraphs = text.split('\n\n').filter(p => p.trim());

    return paragraphs.map((para, idx) => {
      // 불릿 포인트 처리
      if (para.includes('•') || para.includes('-')) {
        const items = para.split(/[•\-]/).filter(item => item.trim());
        return (
          <ul key={idx} className="list-none space-y-1 my-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{item.trim()}</span>
              </li>
            ))}
          </ul>
        );
      }

      // 일반 단락
      return (
        <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
          {para}
        </p>
      );
    });
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
        className={`fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center text-2xl ${isOpen ? 'rotate-0' : ''}`}
        aria-label={isOpen ? '챗봇 닫기' : '챗봇 열기'}
      >
        ⚖️
      </button>

      {/* 챗봇 모달 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base">시민법정 참심제 AI 상담</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* 메시지 영역 */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 pt-1 pb-3 space-y-3">
            {messages.map((message, index) => (
              <div key={index}>
                {/* 사용자 질문 - 상단에 눈에 띄게 (고정 스타일) */}
                {message.role === 'user' && (
                  <div data-type="question" className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl px-4 py-2.5 mb-3 shadow-md">
                    <div className="flex items-center gap-1.5 mb-0.5">
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
