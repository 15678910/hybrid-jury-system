/**
 * FAQ Matcher
 * 키워드 기반 FAQ 매칭 시스템
 */

export class FAQMatcher {
  constructor(faqData) {
    this.faqs = faqData.faqs || [];
    this.version = faqData.version;
    this.lastUpdated = faqData.lastUpdated;
  }

  /**
   * 질문에서 키워드 추출
   */
  extractKeywords(question) {
    // 특수문자 제거하고 공백으로 분리
    const normalized = question
      .toLowerCase()
      .replace(/[?!.,;:]/g, ' ')
      .trim();
    
    return normalized.split(/\s+/).filter(word => word.length > 0);
  }

  /**
   * FAQ와 질문의 매칭 점수 계산
   */
  calculateMatchScore(faq, questionKeywords) {
    let score = 0;
    const faqKeywords = faq.keywords.map(k => k.toLowerCase());
    
    // 1. 직접 키워드 매칭 (가중치: 10점)
    for (const qWord of questionKeywords) {
      for (const faqWord of faqKeywords) {
        if (qWord.includes(faqWord) || faqWord.includes(qWord)) {
          score += 10;
        }
      }
    }

    // 2. 질문 텍스트 자체와 매칭 (가중치: 5점)
    const faqQuestion = faq.question.toLowerCase();
    for (const qWord of questionKeywords) {
      if (faqQuestion.includes(qWord)) {
        score += 5;
      }
    }

    // 3. 우선순위 보너스
    if (faq.priority === 1) {
      score += 2;
    }

    return score;
  }

  /**
   * 질문에 맞는 FAQ 찾기
   * 국가별 상세 질문은 PDF 검색으로 넘김
   */
  findMatch(question, threshold = 20) {
    const questionKeywords = this.extractKeywords(question);

    if (questionKeywords.length === 0) {
      return null;
    }

    // 특정 국가명이 포함된 질문은 FAQ에서 제외 (PDF에서 찾아야 함)
    const countryKeywords = ['독일', '스웨덴', '핀란드', '노르웨이', '프랑스', '덴마크', '일본', '유럽', '미국', '영국', '호주'];
    const hasCountryKeyword = countryKeywords.some(country =>
      question.includes(country)
    );

    // 국가명이 포함되면 무조건 PDF 검색으로 (FAQ 스킵)
    if (hasCountryKeyword) {
      console.log('국가명 감지, FAQ 스킵:', question);
      return null;
    }

    // 역사, 배경, 사례, 운영 등 상세 질문은 PDF로
    const detailKeywords = ['역사', '배경', '사례', '구체적', '자세히', '운영', '도입', '발전', '변화', '현황', '통계'];
    const hasDetailKeyword = detailKeywords.some(keyword =>
      question.includes(keyword)
    );

    // 상세 키워드가 있으면 PDF 검색으로
    if (hasDetailKeyword) {
      console.log('상세 키워드 감지, FAQ 스킵:', question);
      return null;
    }

    const matches = this.faqs.map(faq => ({
      faq,
      score: this.calculateMatchScore(faq, questionKeywords)
    }))
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score);

    return matches.length > 0 ? matches[0].faq : null;
  }

  /**
   * 여러 개의 매칭 결과 반환
   */
  findMatches(question, limit = 3, threshold = 5) {
    const questionKeywords = this.extractKeywords(question);
    
    if (questionKeywords.length === 0) {
      return [];
    }

    const matches = this.faqs.map(faq => ({
      faq,
      score: this.calculateMatchScore(faq, questionKeywords)
    }))
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

    return matches.map(m => m.faq);
  }

  /**
   * 관련 FAQ 찾기 (relatedIds 기반)
   */
  getRelatedFAQs(faqId, limit = 3) {
    const faq = this.faqs.find(f => f.id === faqId);
    if (!faq || !faq.relatedIds) {
      return [];
    }

    return faq.relatedIds
      .map(id => this.faqs.find(f => f.id === id))
      .filter(f => f !== undefined)
      .slice(0, limit);
  }

  /**
   * 카테고리별 FAQ 가져오기
   */
  getFAQsByCategory(category) {
    return this.faqs.filter(faq => faq.category === category);
  }

  /**
   * 모든 카테고리 목록
   */
  getCategories() {
    return [...new Set(this.faqs.map(faq => faq.category))];
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      totalFAQs: this.faqs.length,
      categories: this.getCategories(),
      version: this.version,
      lastUpdated: this.lastUpdated
    };
  }
}

export default FAQMatcher;
