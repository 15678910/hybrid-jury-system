/**
 * FAQ 매칭 시스템
 * - 질문 정규화
 * - 키워드 매칭
 * - 점수 계산
 * - 연관 FAQ 찾기
 */

export class FAQMatcher {
  constructor(faqData) {
    this.faqs = faqData.faqs;
    this.version = faqData.version;
  }

  /**
   * 질문 정규화
   * - 소문자 변환
   * - 특수문자 제거
   * - 공백 정리
   */
  normalizeQuestion(question) {
    return question
      .toLowerCase()
      .replace(/[?!.,;~`]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * FAQ 매칭 (핵심 로직)
   * 점수 계산 방식:
   * - 키워드 완전 매칭: 15점
   * - 키워드 부분 매칭: 10점
   * - 질문 단어 매칭: 3점
   * - 우선순위 가중치: x (3 - priority)
   */
  findMatch(userQuestion, threshold = 15) {
    if (!userQuestion || userQuestion.trim().length === 0) {
      return null;
    }

    const normalized = this.normalizeQuestion(userQuestion);
    const words = normalized.split(' ').filter(w => w.length > 1);
    
    // 각 FAQ에 대해 점수 계산
    const scores = this.faqs.map(faq => {
      let score = 0;
      
      // 1. 키워드 매칭
      faq.keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        
        // 완전 매칭 (단어 경계)
        const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
        if (regex.test(normalized)) {
          score += 15;
        }
        // 부분 매칭
        else if (normalized.includes(normalizedKeyword)) {
          score += 10;
        }
      });
      
      // 2. 질문 내 단어 매칭
      const faqQuestionNorm = this.normalizeQuestion(faq.question);
      words.forEach(word => {
        if (faqQuestionNorm.includes(word)) {
          score += 3;
        }
      });
      
      // 3. 우선순위 가중치 (priority 1이 가장 높음)
      const priorityMultiplier = 4 - faq.priority; // 1->3, 2->2, 3->1
      score *= priorityMultiplier;
      
      return { faq, score };
    });
    
    // 가장 높은 점수 찾기
    const best = scores.reduce((max, item) => 
      item.score > max.score ? item : max
    );
    
    // 임계값 이상이면 반환
    if (best.score >= threshold) {
      return best.faq;
    }
    
    return null;
  }

  /**
   * 여러 FAQ 매칭 (검색 결과용)
   */
  findMatches(userQuestion, maxResults = 5) {
    if (!userQuestion || userQuestion.trim().length === 0) {
      return [];
    }

    const normalized = this.normalizeQuestion(userQuestion);
    const words = normalized.split(' ').filter(w => w.length > 1);
    
    // 점수 계산
    const scores = this.faqs.map(faq => {
      let score = 0;
      
      faq.keywords.forEach(keyword => {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalized.includes(normalizedKeyword)) {
          score += 10;
        }
      });
      
      const faqQuestionNorm = this.normalizeQuestion(faq.question);
      words.forEach(word => {
        if (faqQuestionNorm.includes(word)) {
          score += 3;
        }
      });
      
      score *= (4 - faq.priority);
      
      return { faq, score };
    });
    
    // 점수 높은 순으로 정렬
    return scores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.faq);
  }

  /**
   * 연관 FAQ 가져오기
   */
  getRelated(faqId, maxResults = 3) {
    const faq = this.faqs.find(f => f.id === faqId);
    if (!faq || !faq.relatedIds || faq.relatedIds.length === 0) {
      return [];
    }
    
    return faq.relatedIds
      .slice(0, maxResults)
      .map(id => this.faqs.find(f => f.id === id))
      .filter(Boolean);
  }

  /**
   * 카테고리별 FAQ 가져오기
   */
  getByCategory(category) {
    return this.faqs.filter(faq => faq.category === category);
  }

  /**
   * 모든 카테고리 가져오기
   */
  getCategories() {
    const categories = new Set(this.faqs.map(f => f.category));
    return Array.from(categories);
  }

  /**
   * ID로 FAQ 가져오기
   */
  getById(id) {
    return this.faqs.find(f => f.id === id);
  }

  /**
   * 인기 FAQ (priority 1) 가져오기
   */
  getPopular(limit = 5) {
    return this.faqs
      .filter(f => f.priority === 1)
      .slice(0, limit);
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      total: this.faqs.length,
      categories: this.getCategories().length,
      byPriority: {
        high: this.faqs.filter(f => f.priority === 1).length,
        medium: this.faqs.filter(f => f.priority === 2).length,
        low: this.faqs.filter(f => f.priority === 3).length
      },
      version: this.version
    };
  }
}

/**
 * 싱글톤 인스턴스 생성 헬퍼
 */
let instance = null;

export function createFAQMatcher(faqData) {
  if (!instance) {
    instance = new FAQMatcher(faqData);
  }
  return instance;
}

export function getFAQMatcher() {
  if (!instance) {
    throw new Error('FAQMatcher not initialized. Call createFAQMatcher first.');
  }
  return instance;
}
