/**
 * buildGeminiEmbeddings.cjs
 *
 * Gemini gemini-embedding-001 모델로 PDF 청크 임베딩 벡터를 사전 계산합니다.
 * 오프라인에서 1회 실행하는 스크립트입니다.
 *
 * 사용법:
 *   node scripts/buildGeminiEmbeddings.cjs
 *
 * 전제 조건:
 *   - functions/.env 파일에 GOOGLE_API_KEY 설정 필요
 *   - functions/data/pdfChunks.json 파일 존재 필요
 *
 * 결과:
 *   - functions/data/chunkEmbeddings.json 생성
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── .env 수동 파싱 (dotenv 미설치 환경 대비) ───────────────────────────────
const envPath = path.join(__dirname, '..', 'functions', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = val;
    }
  });
}

// dotenv가 설치된 경우 추가로 로드 시도 (중복 설정은 위에서 이미 가드됨)
try {
  require('dotenv').config({ path: envPath });
} catch (_) {
  // dotenv 없어도 수동 파싱으로 처리 완료
}

// ─── API 키 검증 ─────────────────────────────────────────────────────────────
const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('ERROR: GOOGLE_API_KEY not found in functions/.env');
  console.error('functions/.env 파일에 GOOGLE_API_KEY=<your-key> 를 추가하세요.');
  process.exit(1);
}

// ─── Google Generative AI 초기화 ─────────────────────────────────────────────
let GoogleGenerativeAI;
try {
  ({ GoogleGenerativeAI } = require('@google/generative-ai'));
} catch (err) {
  console.error('ERROR: @google/generative-ai 패키지를 찾을 수 없습니다.');
  console.error('설치 명령: npm install @google/generative-ai');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// ─── 유틸리티 ─────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  // 입력 파일 로드
  const chunksPath = path.join(__dirname, '..', 'functions', 'data', 'pdfChunks.json');
  if (!fs.existsSync(chunksPath)) {
    console.error(`ERROR: 청크 파일이 없습니다: ${chunksPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(chunksPath, 'utf-8'));
  const chunks = data.chunks;

  if (!Array.isArray(chunks) || chunks.length === 0) {
    console.error('ERROR: pdfChunks.json에 chunks 배열이 없거나 비어 있습니다.');
    process.exit(1);
  }

  console.log(`총 ${chunks.length}개 청크 임베딩 시작...`);
  console.log(`모델: gemini-embedding-001 | 배치 크기: 100 | 배치 간 대기: 1초\n`);

  const embeddings = [];
  const BATCH_SIZE = 100;
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`배치 ${batchNum}/${totalBatches} (${batch.length}개)... `);

    try {
      // batchEmbedContents API — 최대 100개 지원
      const requests = batch.map(chunk => ({
        content: { parts: [{ text: chunk.text || '' }] }
      }));

      const result = await model.batchEmbedContents({ requests });

      for (let j = 0; j < batch.length; j++) {
        embeddings.push({
          id: batch[j].id,
          vector: result.embeddings[j].values
        });
      }

      console.log('완료');
    } catch (batchError) {
      console.log(`실패 (${batchError.message}) → 개별 재시도 중...`);

      // 배치 실패 시 개별 청크 단위로 재시도
      for (const chunk of batch) {
        try {
          const singleResult = await model.embedContent(chunk.text || '');
          embeddings.push({
            id: chunk.id,
            vector: singleResult.embedding.values
          });
        } catch (singleError) {
          console.error(`  청크 ${chunk.id} 스킵: ${singleError.message}`);
          // 실패한 청크는 결과에서 제외
        }
        await sleep(100); // 개별 재시도 간 짧은 대기
      }
    }

    // 마지막 배치가 아니면 레이트 리밋 방지를 위해 1초 대기
    if (i + BATCH_SIZE < chunks.length) {
      await sleep(1000);
    }
  }

  // ─── 결과 저장 ──────────────────────────────────────────────────────────────
  const dimensions = embeddings[0]?.vector?.length || 768;

  const output = {
    model: 'gemini-embedding-001',
    dimensions,
    count: embeddings.length,
    createdAt: new Date().toISOString(),
    embeddings
  };

  const outputPath = path.join(__dirname, '..', 'functions', 'data', 'chunkEmbeddings.json');

  // 출력 디렉터리가 없으면 생성
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(output));

  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  const skippedCount = chunks.length - embeddings.length;

  console.log(`\n완료!`);
  console.log(`임베딩 생성: ${embeddings.length}개${skippedCount > 0 ? ` (${skippedCount}개 스킵)` : ''}`);
  console.log(`저장 위치:  ${outputPath}`);
  console.log(`파일 크기:  ${fileSizeMB}MB`);
  console.log(`벡터 차원:  ${dimensions}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
