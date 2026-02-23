import { useState } from 'react';

export default function Resources() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: '전체', icon: '📚' },
    { id: 'law', name: '법률안', icon: '⚖️' },
    { id: 'research', name: '연구자료', icon: '📊' },
    { id: 'international', name: '해외사례', icon: '🌍' },
    { id: 'media', name: '언론보도', icon: '📰' }
  ];

  const resources = [
    {
      id: 1,
      category: 'law',
      title: '혼합형 참심제 운용에 관한 법률안 (가칭)',
      description: '시민법관이 전문법관과 동등한 권한으로 재판에 참여하는 제도의 구체적인 법률안',
      date: '2024-12-01',
      type: 'PDF',
      size: '2.5MB',
      link: '/documents/law-proposal.pdf',
      tags: ['법률안', '참심제', '시민법관']
    },
    {
      id: 2,
      category: 'research',
      title: '참심제와 배심제 비교 연구',
      description: '한국의 국민참여재판(배심제)와 독일식 참심제의 구조적 차이와 효과성 분석',
      date: '2024-11-15',
      type: 'PDF',
      size: '3.8MB',
      link: '/documents/comparison-study.pdf',
      tags: ['비교연구', '배심제', '참심제']
    },
    {
      id: 3,
      category: 'international',
      title: '독일 참심제 운영 현황',
      description: '독일 Schöffe 제도의 역사, 선발 방식, 운영 사례 및 성과 분석',
      date: '2024-10-20',
      type: 'PDF',
      size: '4.2MB',
      link: '/documents/germany-case.pdf',
      tags: ['독일', '해외사례', 'Schöffe']
    },
    {
      id: 4,
      category: 'international',
      title: '북유럽 참심제 사례 연구',
      description: '핀란드, 스웨덴, 노르웨이의 참심제 운영 방식과 시사점',
      date: '2024-10-10',
      type: 'PDF',
      size: '3.5MB',
      link: '/documents/nordic-cases.pdf',
      tags: ['북유럽', '핀란드', '스웨덴']
    },
    {
      id: 5,
      category: 'research',
      title: '사법 신뢰도 제고를 위한 시민 참여 방안',
      description: '국민의 사법부 신뢰도 현황과 시민법관 제도를 통한 개선 방안 연구',
      date: '2024-09-25',
      type: 'PDF',
      size: '2.1MB',
      link: '/documents/trust-study.pdf',
      tags: ['사법신뢰', '시민참여', '개혁']
    },
    {
      id: 6,
      category: 'law',
      title: '헌법 개정안 검토 보고서',
      description: '참심제 도입을 위한 헌법 제27조 개정 방향 및 법리적 검토',
      date: '2024-09-10',
      type: 'PDF',
      size: '1.8MB',
      link: '/documents/constitution-review.pdf',
      tags: ['헌법', '개정', '법리검토']
    },
    {
      id: 7,
      category: 'media',
      title: '시민법정, 사법 민주주의의 새 지평',
      description: '주요 언론의 참심제 도입 필요성 보도 모음',
      date: '2024-11-01',
      type: 'PDF',
      size: '1.5MB',
      link: '/documents/media-coverage.pdf',
      tags: ['언론', '보도자료', '여론']
    },
    {
      id: 8,
      category: 'research',
      title: '시민법관 선발 및 교육 프로그램 설계',
      description: '효과적인 시민법관 선발 방식과 재판 참여를 위한 교육 커리큘럼',
      date: '2024-08-15',
      type: 'PDF',
      size: '2.9MB',
      link: '/documents/training-program.pdf',
      tags: ['선발', '교육', '프로그램']
    }
  ];

  const filteredResources = selectedCategory === 'all'
    ? resources
    : resources.filter(r => r.category === selectedCategory);

  const getCategoryName = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  const handleDownload = (resource) => {
    // 실제 다운로드 로직 (파일이 존재하는 경우)
    // window.open(resource.link, '_blank');

    // 파일이 없는 경우 알림
    alert(`"${resource.title}" 파일 준비 중입니다.\n곧 다운로드 가능합니다.`);
  };

  return (
    <div className="container mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">자료실</h2>
      <p className="text-center text-gray-600 mb-12">
        혼합형 참심제 관련 법률안, 연구 자료, 해외 사례 등을 확인하세요
      </p>

      {/* 카테고리 필터 */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-6 py-3 rounded-full font-medium transition transform hover:scale-105 ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* 자료 목록 */}
      <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {filteredResources.map(resource => (
          <div
            key={resource.id}
            className="bg-white rounded-xl shadow-lg hover:shadow-xl transition p-6 border border-gray-200"
          >
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {getCategoryName(resource.category)}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {resource.type}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {resource.title}
                </h3>
              </div>
            </div>

            {/* 설명 */}
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {resource.description}
            </p>

            {/* 태그 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {resource.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 하단 정보 */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>📅 {resource.date}</span>
                <span>📦 {resource.size}</span>
              </div>
              <button
                onClick={() => handleDownload(resource)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                다운로드
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 결과 없음 */}
      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">
            해당 카테고리의 자료가 없습니다.
          </p>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="mt-16 max-w-4xl mx-auto bg-blue-50 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          더 많은 자료가 필요하신가요?
        </h3>
        <p className="text-gray-700 mb-6">
          추가 자료 요청이나 문의사항이 있으시면 언제든지 연락주세요.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="mailto:contact@example.com"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition inline-flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            이메일 문의
          </a>
          <button
            onClick={() => document.getElementById('signature')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition"
          >
            지지 서명하기
          </button>
        </div>
      </div>
    </div>
  );
}
