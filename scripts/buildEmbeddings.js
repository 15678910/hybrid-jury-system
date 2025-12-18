/**
 * PDF 텍스트 추출 및 임베딩 생성 스크립트
 * 빌드 타임에 1회 실행하여 정적 JSON 파일 생성
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// PDF 파일 목록 (한국어 번역본 우선)
const PDF_FILES = [
  // 한국어 번역본
  'Characteristics of European Union Justice_kr.pdf',
  'FULLTEXT01sweden_kr.pdf',
  'HoffmannHollandPutzerLayJudgesGermany_kr.pdf',
  'karhu_jenna_fin_kr.pdf',
  'Madeleine_Rundberg_SOLM02_Masters_Thesis_2022sweden_kr.pdf',
  'Sanni Tolonen_fin_kr.pdf',
  'ssrn-2665612eu_kr.pdf',
  'TIV_Lautamies_esite_A5_FIN_kr.pdf',
  // 원본 (번역본 없는 경우)
  'korea_mixed_jury_system.pdf',
  'proposal.pdf'
];

// 청크 크기 설정
const CHUNK_SIZE = 500; // 문자 수
const CHUNK_OVERLAP = 100; // 겹침

/**
 * 텍스트를 청크로 분할
 */
function splitIntoChunks(text, source) {
  const chunks = [];
  const sentences = text.split(/(?<=[.!?。])\s+/);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE) {
      if (currentChunk.trim()) {
        chunks.push({
          id: `${source}-${chunkIndex}`,
          text: currentChunk.trim(),
          source: source,
          index: chunkIndex
        });
        chunkIndex++;
      }
      // 오버랩 적용
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(CHUNK_OVERLAP / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  // 마지막 청크
  if (currentChunk.trim()) {
    chunks.push({
      id: `${source}-${chunkIndex}`,
      text: currentChunk.trim(),
      source: source,
      index: chunkIndex
    });
  }

  return chunks;
}

/**
 * 간단한 TF-IDF 기반 키워드 추출
 */
function extractKeywords(text) {
  // 한국어 + 영어 단어 추출
  const words = text.match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];

  // 불용어 제거
  const stopwords = new Set([
    '그리고', '하지만', '그러나', '따라서', '이러한', '그러한', '것이다', '있다', '없다',
    '한다', '된다', '이다', '에서', '으로', '에게', '부터', '까지', '대한', '위한',
    'the', 'and', 'for', 'that', 'this', 'with', 'are', 'from', 'have', 'has'
  ]);

  const filtered = words.filter(w => !stopwords.has(w.toLowerCase()));

  // 빈도 계산
  const freq = {};
  filtered.forEach(w => {
    const key = w.toLowerCase();
    freq[key] = (freq[key] || 0) + 1;
  });

  // 상위 키워드 반환
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * 간단한 임베딩 생성 (TF-IDF 기반)
 * 실제 프로덕션에서는 Transformers.js 사용 권장
 */
function createSimpleEmbedding(text, vocabulary) {
  const words = text.toLowerCase().match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];
  const vector = new Array(vocabulary.length).fill(0);

  words.forEach(word => {
    const idx = vocabulary.indexOf(word);
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

async function main() {
  console.log('=== PDF 임베딩 생성 시작 ===\n');

  // pdf-parse 동적 임포트
  const pdfParse = (await import('pdf-parse')).default;

  const allChunks = [];
  const publicDir = path.join(rootDir, 'public');

  // PDF 파일 처리
  for (const pdfFile of PDF_FILES) {
    const pdfPath = path.join(publicDir, pdfFile);

    if (!fs.existsSync(pdfPath)) {
      console.log(`  [스킵] ${pdfFile} - 파일 없음`);
      continue;
    }

    try {
      console.log(`  [처리 중] ${pdfFile}`);
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(dataBuffer);

      // 텍스트 정제
      let text = data.text
        .replace(/\s+/g, ' ')
        .replace(/[^\w가-힣\s.,!?。]/g, ' ')
        .trim();

      if (text.length < 100) {
        console.log(`    -> 텍스트 너무 짧음 (${text.length}자), 스킵`);
        continue;
      }

      // 청크 분할
      const sourceName = pdfFile.replace('.pdf', '');
      const chunks = splitIntoChunks(text, sourceName);

      console.log(`    -> ${chunks.length}개 청크 생성`);
      allChunks.push(...chunks);

    } catch (error) {
      console.log(`  [오류] ${pdfFile}: ${error.message}`);
    }
  }

  console.log(`\n총 ${allChunks.length}개 청크 생성됨`);

  // 어휘 구축 (상위 1000개 단어)
  console.log('\n어휘 구축 중...');
  const allText = allChunks.map(c => c.text).join(' ');
  const allWords = allText.toLowerCase().match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];

  const wordFreq = {};
  allWords.forEach(w => {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });

  const vocabulary = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1000)
    .map(([word]) => word);

  console.log(`어휘 크기: ${vocabulary.length}`);

  // 임베딩 생성
  console.log('\n임베딩 생성 중...');
  const chunksWithEmbeddings = allChunks.map((chunk, idx) => {
    if (idx % 50 === 0) {
      console.log(`  ${idx}/${allChunks.length} 처리 중...`);
    }

    return {
      ...chunk,
      keywords: extractKeywords(chunk.text),
      embedding: createSimpleEmbedding(chunk.text, vocabulary)
    };
  });

  // JSON 파일 저장
  const outputDir = path.join(rootDir, 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 청크 데이터 저장 (임베딩 제외 - 용량 절약)
  const chunksData = chunksWithEmbeddings.map(c => ({
    id: c.id,
    text: c.text,
    source: c.source,
    keywords: c.keywords
  }));

  fs.writeFileSync(
    path.join(outputDir, 'pdfChunks.json'),
    JSON.stringify({ chunks: chunksData, version: '1.0', createdAt: new Date().toISOString() }, null, 2)
  );

  // 임베딩 데이터 저장 (별도 파일)
  const embeddingsData = {
    vocabulary: vocabulary,
    embeddings: chunksWithEmbeddings.map(c => ({
      id: c.id,
      vector: c.embedding
    })),
    version: '1.0'
  };

  fs.writeFileSync(
    path.join(outputDir, 'embeddings.json'),
    JSON.stringify(embeddingsData)
  );

  console.log('\n=== 완료 ===');
  console.log(`청크 파일: src/data/pdfChunks.json`);
  console.log(`임베딩 파일: src/data/embeddings.json`);
}

main().catch(console.error);
