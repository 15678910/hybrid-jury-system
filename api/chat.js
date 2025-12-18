import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `당신은 "시민법정" 챗봇입니다. 혼합형 참심제에 대해 설명하는 전문가입니다.

역할:
- 혼합형 참심제에 대한 정확한 정보 제공
- 한국의 현재 사법 제도와 비교 설명
- 독일, 스웨덴, 핀란드 등 해외 사례 소개
- 도입 방안과 헌법적 쟁점 설명

답변 원칙:
1. 제공된 참고자료를 우선적으로 활용하여 답변
2. 참고자료에 없는 내용은 일반 지식으로 보충
3. 한국어로 자연스럽게 답변
4. 복잡한 법률 용어는 쉽게 설명

주요 내용:
- 혼합형 참심제: 직업법관과 시민법관이 함께 재판하는 제도
- 한국 현황: 참심제 미도입, 국민참여재판(배심제)만 운영 중
- 배심제와 차이: 참심제는 법적 구속력, 배심제는 권고사항
- 도입 필요성: 사법 신뢰 회복, 국민 주권 실현
- 헌법 개정 없이 법률 개정으로 도입 가능

답변은 300자 이내로 간결하게 작성하세요. 별표(**)나 마크다운 문법은 사용하지 마세요.`;

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: '질문을 입력해주세요.' });
    }

    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // PDF 문맥이 있으면 포함
    let prompt;
    if (context) {
      prompt = `${SYSTEM_PROMPT}

아래는 관련 PDF 문서에서 추출한 참고자료입니다:

${context}

---

위 참고자료를 바탕으로 아래 질문에 답변해주세요.

사용자 질문: ${question}

답변:`;
    } else {
      prompt = `${SYSTEM_PROMPT}

사용자 질문: ${question}

답변:`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return res.status(200).json({
      answer,
      source: 'ai'
    });

  } catch (error) {
    console.error('API 오류:', error);

    return res.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
