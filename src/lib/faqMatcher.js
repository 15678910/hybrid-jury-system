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
    let matchedKeywordCount = 0;
    const faqKeywords = faq.keywords.map(k => k.toLowerCase());

    // 일반적인 단어는 제외 (너무 광범위한 매칭 방지)
    const commonWords = ['참심제', '배심제', '무엇', '어떻게', '왜', '언제', '어디', '누가'];

    // 1. 직접 키워드 매칭 (가중치: 10점, 정확한 매칭만)
    for (const qWord of questionKeywords) {
      for (const faqWord of faqKeywords) {
        // 정확한 매칭 또는 포함 관계 (단, 2글자 이상)
        if (qWord.length >= 2 && faqWord.length >= 2) {
          if (qWord === faqWord) {
            score += 15; // 정확한 매칭
            matchedKeywordCount++;
          } else if (qWord.includes(faqWord) && faqWord.length >= 3) {
            score += 8; // 부분 매칭 (긴 키워드만)
            matchedKeywordCount++;
          } else if (faqWord.includes(qWord) && qWord.length >= 3) {
            score += 8;
            matchedKeywordCount++;
          }
        }
      }
    }

    // 2. 질문 텍스트 자체와 매칭 (가중치: 3점, 긴 단어만)
    const faqQuestion = faq.question.toLowerCase();
    for (const qWord of questionKeywords) {
      if (qWord.length >= 3 && faqQuestion.includes(qWord) && !commonWords.includes(qWord)) {
        score += 3;
      }
    }

    // 3. 우선순위 보너스
    if (faq.priority === 1) {
      score += 2;
    }

    // 4. 최소 2개 이상의 키워드가 매칭되어야 유효
    if (matchedKeywordCount < 2) {
      score = Math.min(score, 15); // 1개만 매칭되면 점수 제한
    }

    return score;
  }

  /**
   * 질문에 맞는 FAQ 찾기
   */
  findMatch(question, threshold = 20) {
    const questionKeywords = this.extractKeywords(question);
    
    if (questionKeywords.length === 0) {
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
