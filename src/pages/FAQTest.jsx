import { useState, useEffect } from 'react';
import { FAQMatcher } from '../lib/faqMatcher';
import faqData from '../data/faq.json';

export default function FAQTest() {
  const [matcher, setMatcher] = useState(null);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    setMatcher(new FAQMatcher(faqData));
  }, []);

  const handleSearch = () => {
    if (!matcher || !question) return;

    const match = matcher.findMatch(question);
    const allMatches = matcher.findMatches(question);

    setResult(match);
    setMatches(allMatches);
  };

  if (!matcher) return <div className="p-8">Loading...</div>;

  const stats = matcher.getStats();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FAQ 매칭 테스트
          </h1>
          <div className="text-sm text-gray-600">
            총 {stats.total}개 FAQ | 카테고리 {stats.categories}개 | 
            우선순위 높음 {stats.byPriority.high}개
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            질문 입력:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="예: 혼합형 참심제가 무엇인가요?"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              검색
            </button>
          </div>
        </div>

        {/* 최적 매칭 결과 */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs rounded-full mb-2">
                  최적 매칭
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  {result.question}
                </h3>
              </div>
              <span className="text-sm text-gray-500">
                {result.category} | Priority {result.priority}
              </span>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-gray-700">
                {result.answer}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              출처: {result.source}
            </div>
          </div>
        )}

        {/* 기타 매칭 결과 */}
        {matches.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              기타 관련 FAQ ({matches.length}개)
            </h3>
            <div className="space-y-3">
              {matches.map((faq) => (
                <div
                  key={faq.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900">
                      {faq.question}
                    </h4>
                    <span className="text-xs text-gray-500 ml-4">
                      {faq.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 매칭 없음 */}
        {question && !result && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              매칭되는 FAQ가 없습니다. AI가 답변하겠습니다.
            </p>
          </div>
        )}

        {/* 예시 질문 */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            예시 질문:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              '혼합형 참심제가 무엇인가요?',
              '한국에서 시행되고 있나요?',
              '시민법관은 어떻게 선발되나요?',
              '참심제와 배심제의 차이는?',
              '헌법 개정이 필요한가요?',
              '독일은 어떻게 운영하나요?'
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  setTimeout(handleSearch, 100);
                }}
                className="text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
