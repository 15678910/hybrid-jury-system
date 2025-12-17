import React, { useState, useEffect } from 'react';
import { FAQMatcher } from '../lib/faqMatcher';
import faqData from '../data/faq.json';

export default function FAQTest() {
  const [matcher, setMatcher] = useState(null);
  const [question, setQuestion] = useState('');
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const faqMatcher = new FAQMatcher(faqData);
    setMatcher(faqMatcher);
    setStats(faqMatcher.getStats());
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!matcher || !question.trim()) {
      setResults([]);
      return;
    }

    const matches = matcher.findMatches(question, 3);
    setResults(matches);
  };

  const handleQuestionClick = (q) => {
    setQuestion(q);
    if (matcher) {
      const matches = matcher.findMatches(q, 3);
      setResults(matches);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            FAQ 매칭 테스트
          </h1>
          {stats && (
            <p className="text-gray-600">
              총 {stats.totalFAQs}개 FAQ | 카테고리: {stats.categories.join(', ')} | 우선순위 높음 5개
            </p>
          )}
        </div>

        {/* 질문 입력 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">질문 입력:</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="예: 혼합형 참심제가 무엇인가요?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              검색
            </button>
          </form>
        </div>

        {/* 예시 질문 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">예시 질문:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              '혼합형 참심제가 무엇인가요?',
              '한국에서 시행되고 있나요?',
              '시민법관은 어떻게 선발되나요?',
              '헌법 개정이 필요한가요?',
              '독일은 어떻게 운영하나요?',
              '참심제와 배심제의 차이는?'
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestionClick(q)}
                className="text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 결과 */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              검색 결과 ({results.length}개)
            </h2>
            {results.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    {faq.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    우선순위: {faq.priority}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {faq.question}
                </h3>
                
                <div className="prose prose-sm max-w-none text-gray-700 mb-4 whitespace-pre-line">
                  {faq.answer}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    출처: {faq.source}
                  </span>
                  <div className="flex gap-2">
                    {faq.keywords.slice(0, 5).map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 검색했지만 결과 없음 */}
        {question && results.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              '{question}'에 대한 FAQ를 찾을 수 없습니다.
            </p>
            <p className="text-sm text-yellow-600 mt-2">
              다른 키워드로 검색해보시거나, 예시 질문을 참고해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
