import React, { useState, useEffect, useRef } from 'react';
import { FAQMatcher } from '../lib/faqMatcher';
import { getVectorSearch } from '../lib/vectorSearch';
import faqData from '../data/faq.json';
import SNSShareBar from '../components/SNSShareBar';
import SEOHead from '../components/SEOHead';

export default function HybridChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matcher, setMatcher] = useState(null);
  const [vectorSearch, setVectorSearch] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const faqMatcher = new FAQMatcher(faqData);
    setMatcher(faqMatcher);

    // 벡터 검색 초기화
    getVectorSearch().then(vs => {
      setVectorSearch(vs);
      console.log('벡터 검색 초기화 완료:', vs.getStats());
    }).catch(err => {
      console.error('벡터 검색 초기화 실패:', err);
    });
    
    // 초기 환영 메시지
    setMessages([{
      role: 'assistant',
      content: '안녕하세요! 시민법정 챗봇입니다. 혼합형 참심제에 대해 궁금하신 점을 물어보세요.',
      source: 'system',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setInput('');
    setIsLoading(true);

    try {
      // 1단계: FAQ 매칭 시도
      const faqMatch = matcher?.findMatch(input.trim());

      if (faqMatch) {
        // FAQ에서 찾았으면 즉시 반환 (AI 호출 없음 - 비용 0원)
        const faqResponse = {
          role: 'assistant',
          content: `**${faqMatch.question}**\n\n${faqMatch.answer}`,
          source: 'faq',
          faqId: faqMatch.id,
          category: faqMatch.category,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, faqResponse]);
        setIsLoading(false);
        return;
      }

      // 2단계: 벡터 검색 - 높은 점수면 AI 없이 직접 답변 (비용 0원)
      if (vectorSearch) {
        const searchResults = vectorSearch.search(input.trim(), 3, 0.01);
        console.log('벡터 검색 결과:', searchResults.length > 0 ? searchResults[0] : '없음');

        // 점수가 0.2 이상이면 PDF 내용으로 직접 답변
        if (searchResults.length > 0 && searchResults[0].score >= 0.2) {
          const topResult = searchResults[0];
          const sourceLabel = vectorSearch.getSourceLabel(topResult.source);

          const vectorResponse = {
            role: 'assistant',
            content: `[${sourceLabel}에서 찾은 정보]\n\n${topResult.text}`,
            source: 'pdf',
            timestamp: new Date()
          };

          setMessages(prev => [...prev, vectorResponse]);
          setIsLoading(false);
          return;
        }

        // 점수가 0.05~0.2이면 컨텍스트와 함께 AI 호출 (비용 발생하지만 정확도 높음)
        if (searchResults.length > 0 && searchResults[0].score >= 0.05) {
          const context = vectorSearch.getContextString(input.trim(), 3);

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: input.trim(),
              context: context
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const aiResponse = {
              role: 'assistant',
              content: data.answer,
              source: 'ai+pdf',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
            setIsLoading(false);
            return;
          }
        }
      }

      // 3단계: 캐시 + AI API 호출 (일반 질문)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: input.trim(),
          conversationHistory: messages.slice(-6) // 최근 3턴만 전달
        }),
      });

      if (!response.ok) {
        throw new Error('API 요청 실패');
      }

      const data = await response.json();
      
      const aiResponse = {
        role: 'assistant',
        content: data.answer,
        source: data.cached ? 'cache' : 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error:', error);
      
      const errorResponse = {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        source: 'error',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (question) => {
    setInput(question);
  };

  const getSourceBadge = (source) => {
    const badges = {
      faq: { text: 'FAQ', color: 'bg-green-100 text-green-800' },
      pdf: { text: 'PDF', color: 'bg-yellow-100 text-yellow-800' },
      'ai+pdf': { text: 'AI+PDF', color: 'bg-orange-100 text-orange-800' },
      cache: { text: '캐시', color: 'bg-blue-100 text-blue-800' },
      ai: { text: 'AI', color: 'bg-purple-100 text-purple-800' },
      system: { text: '시스템', color: 'bg-gray-100 text-gray-800' },
      error: { text: '오류', color: 'bg-red-100 text-red-800' }
    };
    
    const badge = badges[source] || badges.system;
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEOHead title="시민법정 AI 법률 챗봇" description="참심제·사법개혁에 관한 질문을 AI에게 물어보세요" path="/chat" />
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            시민법정 AI 챗봇
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            FAQ 우선 검색 → 캐시 확인 → AI 응답 (하이브리드 시스템)
          </p>
        </div>
      </div>

      {/* 예시 질문 (메시지가 적을 때만 표시) */}
      {messages.length <= 3 && (
        <div className="max-w-4xl mx-auto w-full px-6 py-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">자주 묻는 질문:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              '혼합형 참심제가 무엇인가요?',
              '시민법관은 어떻게 선발되나요?',
              '헌법 개정이 필요한가요?'
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(q)}
                className="text-left text-sm px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    {getSourceBadge(message.source)}
                    {message.category && (
                      <span className="text-xs text-gray-500">
                        {message.category}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="whitespace-pre-line text-sm leading-relaxed">
                  {message.content}
                </div>

                <div className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <span className="text-sm text-gray-600 ml-2">답변 생성 중...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="질문을 입력하세요..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>💡 FAQ 50개 (무료)</span>
            <span>📄 PDF 검색 (무료)</span>
            <span>🤖 AI 요약 (필요시만)</span>
          </div>
        </form>
      </div>
      <SNSShareBar />
      <footer className="bg-gray-900 text-gray-400 py-6 px-4">
          <div className="container mx-auto text-center">
              <p>© 주권자사법개혁추진준비위원회</p>
              <p className="mt-2 text-sm">문의: siminbupjung@gmail.com</p>
          </div>
      </footer>
    </div>
  );
}
