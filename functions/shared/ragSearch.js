/**
 * BM25 기반 서버사이드 RAG 검색 모듈
 * Firebase Functions Node.js 20 환경에서 동작 (외부 의존성 없음)
 *
 * BM25 파라미터:
 *   k1 = 1.5 (term frequency saturation)
 *   b  = 0.75 (document length normalization)
 */

'use strict';

const path = require('path');

// ---------------------------------------------------------------------------
// 상수
// ---------------------------------------------------------------------------

const BM25_K1 = 1.5;
const BM25_B  = 0.75;
const BOOST_MULTIPLIER = 2.0;

const COUNTRY_KEYWORDS = [
  '핀란드', '독일', '스웨덴', '프랑스', '일본', '덴마크', '노르웨이',
  '한국', '북한', '중국', '러시아', '영국', '미국', '호주'
];

const LEGAL_KEYWORDS = [
  '참심', '배심', '시민법관', '혼합형', '법원', '재판', '판사',
  '변호사', '검찰', '기소', '양형', '형사', '민사'
];

const BOOSTED_KEYWORDS = new Set([...COUNTRY_KEYWORDS, ...LEGAL_KEYWORDS]);

const SOURCE_LABELS = {
  'Characteristics of European Union Justice_kr': 'EU 사법제도',
  'FULLTEXT01sweden_kr': '스웨덴 참심제',
  'HoffmannHollandPutzerLayJudgesGermany_kr': '독일 참심원 제도',
  'karhu_jenna_fin_kr': '핀란드 사법참여',
  'Madeleine_Rundberg_SOLM02_Masters_Thesis_2022sweden_kr': '스웨덴 참심제 논문',
  'Sanni Tolonen_fin_kr': '핀란드 참심제',
  'ssrn-2665612eu_kr': 'EU 사법 연구',
  'TIV_Lautamies_esite_A5_FIN_kr': '핀란드 참심원 안내',
  'korea_mixed_jury_system': '한국 혼합형 참심제',
  'proposal': '제안 법률안',
  '시민이재판을1': '시민이 재판을 (참심제 연구)',
  '형사재판절차에 있어서 배심 및 참심제도의 도입방안': '배심 및 참심제도 도입방안',
  '검찰의세계세계의검찰': '검찰의 세계 세계의 검찰'
};

// ---------------------------------------------------------------------------
// 모듈 레벨 캐시 (웜 인보케이션 재사용)
// ---------------------------------------------------------------------------

/** @type {Array<{id: string, text: string, source: string, keywords: string[]}>|null} */
let chunks = null;

/**
 * BM25 인덱스 구조체
 * @type {{
 *   df: Map<string, number>,       // term → 문서 출현 수
 *   docLen: number[],              // 문서별 토큰 수
 *   avgDocLen: number,
 *   tokenizedDocs: string[][]      // 문서별 토큰 배열
 * }|null}
 */
let bm25Index = null;

/** @type {Map<string, Float64Array>|null} */
let chunkEmbeddings = null;

// ---------------------------------------------------------------------------
// 토크나이저
// ---------------------------------------------------------------------------

/**
 * 텍스트를 한국어/영어 토큰 배열로 분해
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text.match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];
}

// ---------------------------------------------------------------------------
// 데이터 로드 & 인덱스 초기화
// ---------------------------------------------------------------------------

function loadData() {
  if (chunks !== null) return; // 이미 로드됨

  const dataPath = path.join(__dirname, '..', 'data', 'pdfChunks.json');
  // eslint-disable-next-line
  const raw = require(dataPath);
  chunks = Array.isArray(raw.chunks) ? raw.chunks : [];

  buildBm25Index();
}

function buildBm25Index() {
  const n = chunks.length;

  // 문서별 토큰화
  const tokenizedDocs = chunks.map(c => tokenize(c.text || ''));

  // 문서 길이
  const docLen = tokenizedDocs.map(tokens => tokens.length);

  // 평균 문서 길이
  const totalLen = docLen.reduce((s, l) => s + l, 0);
  const avgDocLen = n > 0 ? totalLen / n : 1;

  // Document frequency 계산
  const df = new Map();
  tokenizedDocs.forEach(tokens => {
    const seen = new Set(tokens);
    seen.forEach(term => {
      df.set(term, (df.get(term) || 0) + 1);
    });
  });

  bm25Index = { df, docLen, avgDocLen, tokenizedDocs };
}

// ---------------------------------------------------------------------------
// BM25 점수 계산
// ---------------------------------------------------------------------------

/**
 * 단일 용어의 BM25 기여 점수를 계산한다.
 * @param {string} term
 * @param {string[]} docTokens   - 해당 문서의 토큰 배열
 * @param {number}  docLenValue  - 해당 문서 길이
 * @param {number}  N            - 전체 문서 수
 * @returns {number}
 */
function bm25TermScore(term, docTokens, docLenValue, N) {
  const { df, avgDocLen } = bm25Index;

  // term frequency in document
  let tf = 0;
  for (let i = 0; i < docTokens.length; i++) {
    if (docTokens[i] === term) tf++;
  }
  if (tf === 0) return 0;

  const docFreq = df.get(term) || 0;
  if (docFreq === 0) return 0;

  // IDF (BM25 변형 — 음수 방지 위해 +0.5)
  const idf = Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1);

  // TF 포화 + 문서 길이 정규화
  const tfNorm = (tf * (BM25_K1 + 1)) /
    (tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLenValue / bm25Index.avgDocLen)));

  return idf * tfNorm;
}

/**
 * 쿼리에 대해 문서 idx의 총 BM25 점수를 계산한다.
 * 부스트 키워드가 쿼리와 문서 모두에 존재하면 해당 용어 점수를 2배로 증폭한다.
 * @param {string[]} queryTerms
 * @param {number}   docIdx
 * @param {Set<string>} queryBoostedTerms - 쿼리에 등장한 부스트 키워드
 * @returns {number}
 */
function scoreBm25(queryTerms, docIdx, queryBoostedTerms) {
  const { tokenizedDocs, docLen } = bm25Index;
  const N = chunks.length;
  const docTokens = tokenizedDocs[docIdx];
  const docLenValue = docLen[docIdx];

  // 문서에 등장하는 부스트 키워드 집합 (청크 원문 기준)
  const chunkText = chunks[docIdx].text || '';

  let total = 0;
  for (let i = 0; i < queryTerms.length; i++) {
    const term = queryTerms[i];
    let termScore = bm25TermScore(term, docTokens, docLenValue, N);

    // 부스트: 쿼리에도 있고 문서 원문에도 있는 부스트 키워드이면 2배
    if (termScore > 0 && queryBoostedTerms.has(term) && chunkText.includes(term)) {
      termScore *= BOOST_MULTIPLIER;
    }

    total += termScore;
  }
  return total;
}

// ---------------------------------------------------------------------------
// 임베딩 로드
// ---------------------------------------------------------------------------

function loadEmbeddings() {
  if (chunkEmbeddings !== null) return true;
  try {
    const embPath = path.join(__dirname, '..', 'data', 'chunkEmbeddings.json');
    // eslint-disable-next-line
    const raw = require(embPath);
    chunkEmbeddings = new Map();
    for (const item of raw.embeddings) {
      chunkEmbeddings.set(item.id, new Float64Array(item.vector));
    }
    return true;
  } catch (err) {
    // Embeddings file not found — semantic search unavailable
    return false;
  }
}

// ---------------------------------------------------------------------------
// 코사인 유사도 (Float64Array 최적화)
// ---------------------------------------------------------------------------

/**
 * 두 Float64Array 벡터의 코사인 유사도를 계산한다.
 * @param {Float64Array} a
 * @param {Float64Array} b
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// 공개 API
// ---------------------------------------------------------------------------

/**
 * BM25 기반 검색을 수행하고 상위 K개 청크를 반환한다.
 *
 * @param {string} query   - 사용자 질의
 * @param {number} [topK=5]
 * @returns {Array<{id: string, text: string, source: string, sourceLabel: string, score: number, keywords: string[]}>}
 */
function search(query, topK = 5) {
  // 엣지 케이스: 빈 쿼리
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  loadData();

  if (chunks.length === 0) return [];

  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  // 쿼리에 등장한 부스트 키워드 집합
  const queryBoostedTerms = new Set();
  BOOSTED_KEYWORDS.forEach(kw => {
    if (query.includes(kw)) {
      queryBoostedTerms.add(kw);
    }
  });

  // 각 문서의 BM25 점수 계산
  const scored = [];
  for (let i = 0; i < chunks.length; i++) {
    const score = scoreBm25(queryTerms, i, queryBoostedTerms);
    if (score > 0) {
      scored.push({ idx: i, score });
    }
  }

  // 점수 내림차순 정렬 후 상위 K개 추출
  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  return topResults.map(({ idx, score }) => {
    const chunk = chunks[idx];
    return {
      id: chunk.id,
      text: chunk.text || '',
      source: chunk.source || '',
      sourceLabel: getSourceLabel(chunk.source || ''),
      score,
      keywords: chunk.keywords || []
    };
  });
}

/**
 * Gemini Embedding 기반 시맨틱 검색.
 * 쿼리 임베딩 벡터를 받아서 사전 계산된 청크 임베딩과 코사인 유사도로 비교.
 *
 * @param {number[]} queryEmbedding - Gemini API에서 받은 쿼리 임베딩 벡터
 * @param {number} [topK=5]
 * @returns {Array<{id: string, text: string, source: string, sourceLabel: string, score: number, keywords: string[]}>}
 */
function semanticSearch(queryEmbedding, topK = 5) {
  loadData();        // chunks 로드
  if (!loadEmbeddings()) return [];   // 임베딩 파일 없으면 빈 배열
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  const queryVec = new Float64Array(queryEmbedding);

  const scored = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkVec = chunkEmbeddings.get(chunks[i].id);
    if (!chunkVec) continue;

    const score = cosineSimilarity(queryVec, chunkVec);
    if (score > 0) {
      scored.push({ idx: i, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  return topResults.map(({ idx, score }) => {
    const chunk = chunks[idx];
    return {
      id: chunk.id,
      text: chunk.text || '',
      source: chunk.source || '',
      sourceLabel: getSourceLabel(chunk.source || ''),
      score: Math.round(score * 10000) / 10000,
      keywords: chunk.keywords || []
    };
  });
}

/**
 * 소스 키를 한글 레이블로 변환한다.
 * @param {string} source
 * @returns {string}
 */
function getSourceLabel(source) {
  return SOURCE_LABELS[source] || source;
}

/**
 * 로드된 데이터의 통계 정보를 반환한다.
 * @returns {{totalChunks: number, sources: string[], avgChunkLength: number}}
 */
function getStats() {
  loadData();

  const totalChunks = chunks.length;
  const sources = [...new Set(chunks.map(c => c.source || ''))];
  const avgChunkLength = totalChunks > 0
    ? Math.round(chunks.reduce((s, c) => s + (c.text || '').length, 0) / totalChunks)
    : 0;

  return { totalChunks, sources, avgChunkLength };
}

// ---------------------------------------------------------------------------

module.exports = { search, semanticSearch, getSourceLabel, getStats };
