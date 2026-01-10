/**
 * 검찰 PDF 처리 스크립트
 * PDF를 텍스트로 추출하고 청크로 분할하여 기존 데이터에 병합
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const PDF_PATH = path.join(__dirname, '../public/검찰의세계세계의검찰.pdf');
const CHUNKS_PATH = path.join(__dirname, '../public/pdfChunks.json');
const EMBEDDINGS_PATH = path.join(__dirname, '../public/embeddings.json');

const CHUNK_SIZE = 800; // 글자 수
const CHUNK_OVERLAP = 100; // 중복 글자 수

async function extractTextFromPdf() {
    console.log('PDF 텍스트 추출 중...');
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdfParse(dataBuffer);
    console.log(`총 ${data.numpages} 페이지, ${data.text.length} 글자 추출됨`);
    return data.text;
}

function splitIntoChunks(text, source) {
    console.log('텍스트를 청크로 분할 중...');
    const chunks = [];

    // 텍스트 정리 - 연속 공백/줄바꿈 제거
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();

    let start = 0;
    let chunkId = 1;

    while (start < cleanedText.length) {
        let end = start + CHUNK_SIZE;

        // 문장 끝에서 자르기 (마침표, 물음표, 느낌표)
        if (end < cleanedText.length) {
            const searchEnd = Math.min(end + 100, cleanedText.length);
            const searchText = cleanedText.slice(end, searchEnd);
            const sentenceEnd = searchText.search(/[.!?。]\s/);
            if (sentenceEnd !== -1) {
                end = end + sentenceEnd + 1;
            }
        } else {
            end = cleanedText.length;
        }

        const chunkText = cleanedText.slice(start, end).trim();

        if (chunkText.length > 50) { // 너무 짧은 청크 제외
            // 키워드 추출 (한글 2글자 이상 또는 영어 3글자 이상)
            const keywords = extractKeywords(chunkText);

            chunks.push({
                id: `${source}_chunk_${chunkId}`,
                text: chunkText,
                source: source,
                keywords: keywords
            });
            chunkId++;
        }

        start = end - CHUNK_OVERLAP;
        if (start < 0) start = 0;
        if (end >= cleanedText.length) break;
    }

    console.log(`총 ${chunks.length}개 청크 생성됨`);
    return chunks;
}

function extractKeywords(text) {
    // 중요 키워드 목록
    const importantKeywords = [
        '검찰', '검사', '수사', '기소', '공소', '형사', '범죄', '피의자', '피고인',
        '재판', '법원', '판사', '변호사', '증거', '증인', '심리', '판결', '항소',
        '미국', '영국', '독일', '프랑스', '일본', '중국', '한국', '북한', '러시아',
        '유럽', '아시아', '호주', '캐나다', '이탈리아', '스페인', '네덜란드',
        '검찰청', '대검찰청', '지방검찰청', '고등검찰청', '특별검사',
        '수사권', '기소권', '영장', '체포', '구속', '압수', '수색',
        '부패', '뇌물', '사기', '횡령', '배임', '폭력', '살인', '마약',
        '인권', '민주주의', '법치주의', '사법개혁', '검찰개혁'
    ];

    const found = [];
    importantKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            found.push(keyword);
        }
    });

    return found.slice(0, 10); // 최대 10개
}

function createEmbeddings(chunks, existingVocabulary) {
    console.log('임베딩 생성 중...');

    // 기존 vocabulary 사용 또는 새로 구축
    let vocabulary = existingVocabulary ? [...existingVocabulary] : [];
    const vocabSet = new Set(vocabulary);

    // 새 청크에서 vocabulary 확장
    chunks.forEach(chunk => {
        const words = chunk.text.match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];
        words.forEach(word => {
            const lower = word.toLowerCase();
            if (!vocabSet.has(lower) && lower.length >= 2) {
                vocabSet.add(lower);
                vocabulary.push(lower);
            }
        });
    });

    console.log(`Vocabulary 크기: ${vocabulary.length}`);

    // 각 청크의 벡터 생성
    const embeddings = chunks.map(chunk => {
        const words = chunk.text.toLowerCase().match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];
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

        return {
            id: chunk.id,
            vector: vector
        };
    });

    return { vocabulary, embeddings };
}

async function main() {
    try {
        // 1. PDF 텍스트 추출
        const text = await extractTextFromPdf();

        // 2. 청크 분할
        const newChunks = splitIntoChunks(text, '검찰의세계세계의검찰');

        // 3. 기존 데이터 로드
        console.log('기존 데이터 로드 중...');
        const existingChunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, 'utf8'));
        const existingEmbeddings = JSON.parse(fs.readFileSync(EMBEDDINGS_PATH, 'utf8'));

        console.log(`기존 청크 수: ${existingChunks.chunks.length}`);
        console.log(`기존 vocabulary 크기: ${existingEmbeddings.vocabulary.length}`);

        // 4. 새 청크 임베딩 생성 (기존 vocabulary 사용)
        const { vocabulary: newVocabulary, embeddings: newEmbeddingsData } =
            createEmbeddings(newChunks, existingEmbeddings.vocabulary);

        // 5. 기존 임베딩 벡터 확장 (vocabulary가 늘어난 경우)
        const vocabExtension = newVocabulary.length - existingEmbeddings.vocabulary.length;
        if (vocabExtension > 0) {
            console.log(`Vocabulary ${vocabExtension}개 확장, 기존 벡터 업데이트 중...`);
            existingEmbeddings.embeddings.forEach(emb => {
                // 기존 벡터에 0 추가하여 길이 맞추기
                emb.vector = [...emb.vector, ...new Array(vocabExtension).fill(0)];
            });
        }

        // 6. 데이터 병합
        const mergedChunks = {
            chunks: [...existingChunks.chunks, ...newChunks]
        };

        const mergedEmbeddings = {
            vocabulary: newVocabulary,
            embeddings: [...existingEmbeddings.embeddings, ...newEmbeddingsData]
        };

        console.log(`병합 후 청크 수: ${mergedChunks.chunks.length}`);
        console.log(`병합 후 vocabulary 크기: ${mergedEmbeddings.vocabulary.length}`);

        // 7. 파일 저장
        console.log('파일 저장 중...');
        fs.writeFileSync(CHUNKS_PATH, JSON.stringify(mergedChunks, null, 2), 'utf8');
        fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(mergedEmbeddings), 'utf8');

        console.log('완료! 검찰 자료가 챗봇에 통합되었습니다.');

    } catch (error) {
        console.error('오류 발생:', error);
        process.exit(1);
    }
}

main();
