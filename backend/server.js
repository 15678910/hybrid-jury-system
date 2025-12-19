import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@vercel/kv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// Vercel KV 클라이언트 (선택사항)
let kv = null;

if (process.env.KV_REST_API_URL && 
    process.env.KV_REST_API_TOKEN &&
    !process.env.KV_REST_API_URL.includes('your_') &&
    process.env.KV_REST_API_URL.startsWith('https://')) {
  try {
    kv = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    console.log('✅ Vercel KV 연결 성공');
  } catch (error) {
    console.warn('⚠️  Vercel KV 연결 실패, 캐시 없이 실행');
    kv = null;
  }
} else {
  console.warn('⚠️  Vercel KV 미설정, 캐시 기능 비활성화');
  console.log('   Google Gemini API만 사용하여 실행합니다.');
}

// Google Gemini AI 초기화
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// 캐시 키 생성 함수
function generateCacheKey(question) {
  // 질문을 정규화하고 해시 생성
  const normalized = question
    .toLowerCase()
    .replace(/[?!.,;:\s]+/g, '_')
    .substring(0, 100);
  return `chat:${normalized}`;
}

// 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 "시민법정" 챗봇입니다. 혼합형 참심제에 대해 설명하는 전문가입니다.

**역할:**
- 혼합형 참심제에 대한 정확한 정보 제공
- 한국의 현재 사법 제도와 비교 설명
- 독일, 핀란드 등 해외 사례 소개
- 도입 방안과 헌법적 쟁점 설명

**답변 원칙:**
1. 정확하고 객관적인 정보 제공
2. 한국어로 자연스럽게 답변
3. 복잡한 법률 용어는 쉽게 설명
4. 필요시 구체적인 예시 제공
5. 출처가 명확한 정보 우선

**주요 내용:**
- 혼합형 참심제: 전문법관과 시민법관이 함께 재판하는 제도
- 한국 현황: 참심제 미도입, 국민참여재판(배심제)만 운영 중
- 배심제와 차이: 참심제는 법적 구속력, 배심제는 권고사항
- 도입 필요성: 사법 신뢰 회복, 국민 주권 실현
- 헌법 개정: 시민법관 참여 명시 필요

답변은 300자 이내로 간결하게 작성하되, 필요시 좀 더 길게 설명할 수 있습니다.`;

// 챗 API 엔드포인트
app.post('/api/chat', async (req, res) => {
  try {
    const { question, conversationHistory = [] } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: '질문을 입력해주세요.' });
    }

    // 1단계: 캐시 확인 (KV가 있을 때만)
    const cacheKey = generateCacheKey(question);
    
    if (kv) {
      try {
        const cachedAnswer = await kv.get(cacheKey);
        
        if (cachedAnswer) {
          console.log(`✅ 캐시 히트: ${cacheKey}`);
          return res.json({
            answer: cachedAnswer,
            cached: true,
            source: 'cache'
          });
        }
      } catch (cacheError) {
        console.warn('캐시 조회 실패:', cacheError.message);
        // 캐시 실패해도 계속 진행
      }
    }

    // 2단계: Google Gemini API 호출
    console.log(`🤖 AI 호출: ${question}`);
    
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 대화 히스토리 포맷팅
    const historyText = conversationHistory
      .slice(-6) // 최근 3턴
      .map(msg => `${msg.role === 'user' ? '사용자' : '챗봇'}: ${msg.content}`)
      .join('\n');

    const prompt = `${SYSTEM_PROMPT}

이전 대화:
${historyText}

사용자 질문: ${question}

답변:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    // 3단계: 캐시에 저장 (KV가 있을 때만, 24시간 TTL)
    if (kv) {
      try {
        await kv.set(cacheKey, answer, { ex: 86400 }); // 24시간
        console.log(`💾 캐시 저장: ${cacheKey}`);
      } catch (cacheError) {
        console.warn('캐시 저장 실패:', cacheError.message);
        // 캐시 저장 실패해도 응답은 반환
      }
    }

    res.json({
      answer,
      cached: false,
      source: 'ai'
    });

  } catch (error) {
    console.error('API 오류:', error);
    
    res.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 캐시 통계 엔드포인트
app.get('/api/cache/stats', async (req, res) => {
  try {
    if (!kv) {
      return res.json({
        message: 'Vercel KV가 설정되지 않았습니다.',
        cacheEnabled: false
      });
    }
    
    res.json({
      message: '캐시 통계는 Vercel KV 대시보드에서 확인하세요.',
      cacheKeyPattern: 'chat:*',
      cacheEnabled: true
    });
  } catch (error) {
    res.status(500).json({ error: '통계 조회 실패' });
  }
});

// 캐시 초기화 엔드포인트 (개발용)
app.delete('/api/cache/clear', async (req, res) => {
  try {
    if (!kv) {
      return res.json({
        message: 'Vercel KV가 설정되지 않았습니다.',
        cacheEnabled: false
      });
    }
    
    // 주의: 프로덕션에서는 인증 필요
    const { adminKey } = req.body;
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // Vercel KV는 패턴 삭제가 제한적이므로 개별 삭제 필요
    res.json({
      message: '캐시 초기화는 Vercel KV 대시보드에서 수동으로 진행하세요.'
    });
  } catch (error) {
    res.status(500).json({ error: '캐시 초기화 실패' });
  }
});

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cacheEnabled: kv !== null
  });
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📊 헬스체크: http://localhost:${PORT}/health`);
  console.log(`💾 캐시 상태: ${kv ? '활성화' : '비활성화 (Gemini API만 사용)'}`);
});

export default app;
