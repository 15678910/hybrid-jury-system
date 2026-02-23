'use strict';

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const INPUT_PATH = path.join(PROJECT_ROOT, 'public', 'pdfChunks.json');
const FUNCTIONS_DATA_DIR = path.join(PROJECT_ROOT, 'functions', 'data');
const OUTPUT_COPY_PATH = path.join(FUNCTIONS_DATA_DIR, 'pdfChunks.json');

/**
 * Repeatedly collapses spaces between Korean characters until no more changes occur.
 * "유 럽 연 합" -> "유럽연합"
 */
function fixKoreanSpacing(text) {
  if (!text) return text;
  let prev = null;
  let current = text;
  while (prev !== current) {
    prev = current;
    current = current.replace(/([가-힣])\s([가-힣])/g, '$1$2');
  }
  return current;
}

function fixKeywords(keywords) {
  if (!Array.isArray(keywords)) return keywords;
  return keywords.map(kw => fixKoreanSpacing(kw));
}

console.log('Reading:', INPUT_PATH);
const raw = fs.readFileSync(INPUT_PATH, 'utf8');
const data = JSON.parse(raw);

const totalChunks = data.chunks.length;
console.log(`Total chunks: ${totalChunks}`);

let modifiedCount = 0;
const samples = [];

data.chunks = data.chunks.map((chunk, idx) => {
  const originalText = chunk.text;
  const originalKeywords = JSON.stringify(chunk.keywords);

  const fixedText = fixKoreanSpacing(chunk.text);
  const fixedKeywords = fixKeywords(chunk.keywords);

  const changed =
    fixedText !== originalText ||
    JSON.stringify(fixedKeywords) !== originalKeywords;

  if (changed) {
    modifiedCount++;
    if (samples.length < 3) {
      samples.push({
        id: chunk.id || idx,
        before: originalText.substring(0, 100),
        after: fixedText.substring(0, 100),
      });
    }
  }

  return {
    ...chunk,
    text: fixedText,
    keywords: fixedKeywords,
  };
});

console.log(`\nModified chunks: ${modifiedCount} / ${totalChunks}`);

if (samples.length > 0) {
  console.log('\n--- Sample changes ---');
  samples.forEach((s, i) => {
    console.log(`\n[${i + 1}] id: ${s.id}`);
    console.log(`  BEFORE: ${s.before}`);
    console.log(`  AFTER:  ${s.after}`);
  });
}

// Save fixed data back to public/pdfChunks.json
const output = JSON.stringify(data, null, 2);
fs.writeFileSync(INPUT_PATH, output, 'utf8');
console.log(`\nSaved fixed data to: ${INPUT_PATH}`);

// Create functions/data/ directory and copy file
if (!fs.existsSync(FUNCTIONS_DATA_DIR)) {
  fs.mkdirSync(FUNCTIONS_DATA_DIR, { recursive: true });
  console.log(`Created directory: ${FUNCTIONS_DATA_DIR}`);
}

fs.writeFileSync(OUTPUT_COPY_PATH, output, 'utf8');
console.log(`Copied to: ${OUTPUT_COPY_PATH}`);
console.log('\nDone.');
