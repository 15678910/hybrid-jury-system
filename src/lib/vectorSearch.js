/**
 * 벡터 검색 모듈
 * PDF 청크에서 관련 문맥을 검색
 */

class VectorSearch {
  constructor() {
    this.chunks = [];
    this.vocabulary = [];
    this.embeddings = [];
    this.embeddingMap = new Map();
    this.isLoaded = false;
  }

  /**
   * 데이터 비동기 로드
   */
  async load() {
    if (this.isLoaded) return;

    try {
      // public 폴더에서 JSON 파일 로드
      const [chunksRes, embeddingsRes] = await Promise.all([
        fetch('/pdfChunks.json'),
        fetch('/embeddings.json')
      ]);

      const chunksData = await chunksRes.json();
      const embeddingsData = await embeddingsRes.json();

      this.chunks = chunksData.chunks;
      this.vocabulary = embeddingsData.vocabulary;
      this.embeddings = embeddingsData.embeddings;

      // ID로 빠른 조회를 위한 맵
      this.embeddings.forEach(e => {
        this.embeddingMap.set(e.id, e.vector);
      });

      this.isLoaded = true;
      console.log('벡터 검색 데이터 로드 완료:', this.getStats());
    } catch (error) {
      console.error('벡터 검색 데이터 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 텍스트를 벡터로 변환
   */
  textToVector(text) {
    const words = text.toLowerCase().match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];
    const vector = new Array(this.vocabulary.length).fill(0);

    words.forEach(word => {
      const idx = this.vocabulary.indexOf(word);
      if (idx !== -1) {
        vector[idx] += 1;
      }
    });

    // L2 정규화
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= norm;
      }
    }

    return vector;
  }

  /**
   * 코사인 유사도 계산
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }

  /**
   * 키워드 기반 매칭 점수 계산
   */
  keywordMatchScore(query, chunk) {
    const queryWords = query.toLowerCase().match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];
    const chunkKeywords = chunk.keywords || [];

    let score = 0;
    queryWords.forEach(qWord => {
      chunkKeywords.forEach(kWord => {
        if (qWord.includes(kWord) || kWord.includes(qWord)) {
          score += 1;
        }
      });
    });

    return score;
  }

  /**
   * 관련 청크 검색
   * threshold를 0.01로 낮춰서 더 많은 결과 반환
   */
  search(query, topK = 3, threshold = 0.01) {
    if (!this.isLoaded) {
      console.warn('벡터 검색 데이터가 로드되지 않았습니다.');
      return [];
    }

    const queryVector = this.textToVector(query);
    console.log('검색 쿼리:', query);
    console.log('쿼리 벡터 non-zero 요소:', queryVector.filter(v => v > 0).length);

    const results = this.chunks.map(chunk => {
      const chunkVector = this.embeddingMap.get(chunk.id);
      if (!chunkVector) return { chunk, score: 0 };

      // 벡터 유사도 (70%)
      const vectorScore = this.cosineSimilarity(queryVector, chunkVector);

      // 키워드 매칭 점수 (30%)
      const keywordScore = this.keywordMatchScore(query, chunk) * 0.1;

      // 종합 점수
      const totalScore = vectorScore * 0.7 + keywordScore * 0.3;

      return { chunk, score: totalScore };
    })
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

    console.log('검색 결과 수:', results.length);
    if (results.length > 0) {
      console.log('상위 결과:', results[0].chunk.source, '점수:', results[0].score);
    }

    return results.map(r => ({
      ...r.chunk,
      score: r.score
    }));
  }

  /**
   * 검색 결과를 문맥 문자열로 변환
   */
  getContextString(query, topK = 3) {
    const results = this.search(query, topK);

    if (results.length === 0) {
      return null;
    }

    const context = results.map((r, idx) => {
      const sourceLabel = this.getSourceLabel(r.source);
      return `[참고자료 ${idx + 1}: ${sourceLabel}]\n${r.text}`;
    }).join('\n\n');

    return context;
  }

  /**
   * 소스 이름을 한글 레이블로 변환
   */
  getSourceLabel(source) {
    const labels = {
      'Characteristics of European Union Justice_kr': 'EU 사법제도',
      'FULLTEXT01sweden_kr': '스웨덴 참심제',
      'HoffmannHollandPutzerLayJudgesGermany_kr': '독일 참심원 제도',
      'karhu_jenna_fin_kr': '핀란드 사법참여',
      'Madeleine_Rundberg_SOLM02_Masters_Thesis_2022sweden_kr': '스웨덴 참심제 논문',
      'Sanni Tolonen_fin_kr': '핀란드 참심제',
      'ssrn-2665612eu_kr': 'EU 사법 연구',
      'TIV_Lautamies_esite_A5_FIN_kr': '핀란드 참심원 안내',
      'korea_mixed_jury_system': '한국 혼합형 참심제',
      'proposal': '제안 법률안'
    };

    return labels[source] || source;
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      totalChunks: this.chunks.length,
      vocabularySize: this.vocabulary.length,
      sources: [...new Set(this.chunks.map(c => c.source))]
    };
  }
}

// 싱글톤 인스턴스
let vectorSearchInstance = null;

export async function getVectorSearch() {
  if (!vectorSearchInstance) {
    vectorSearchInstance = new VectorSearch();
    await vectorSearchInstance.load();
  }
  return vectorSearchInstance;
}

export default VectorSearch;
