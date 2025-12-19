import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `당신은 "시민법정" 챗봇입니다. 참심제 전문가로서 사용자 질문에 정확하게 답변합니다.

중요 원칙:
1. 사용자 질문에서 언급된 국가(핀란드, 독일, 스웨덴, 일본 등)에 대해 질문하면, 반드시 해당 국가의 정보만 답변하세요.
2. 제공된 참고자료에서 질문과 관련된 내용을 찾아 답변하세요.
3. 참고자료에 해당 국가 정보가 있으면 그 내용을 요약해서 답변하세요.
4. 질문과 무관한 다른 국가 정보는 답변하지 마세요.

답변 형식:
- 핵심 내용을 먼저 요약 (2-3문장)
- 세부 사항은 불릿 포인트로 정리
- 300자 이내로 간결하게
- 마크다운 문법(**,## 등) 사용하지 마세요`;

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

[참고자료 - 아래 내용에서 질문과 관련된 정보를 찾아 답변하세요]

${context}

---

질문: ${question}

위 참고자료에서 "${question}"에 대한 답변을 찾아 요약해주세요. 질문에서 특정 국가를 언급했다면 해당 국가 정보만 답변하세요.`;
    } else {
      prompt = `${SYSTEM_PROMPT}

질문: ${question}

참심제에 대한 일반적인 지식으로 답변해주세요.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    return res.status(200).json({
      answer,
      source: 'ai'
    });

  } catch (error) {
    console.error('API 오류:', error.message || error);

    // API 키 관련 오류 처리
    const errorMsg = error.message || String(error);
    if (errorMsg.includes('leaked') || errorMsg.includes('API key')) {
      return res.status(500).json({
        error: 'API 키를 갱신해야 합니다. 관리자에게 문의하세요.'
      });
    }

    return res.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다.',
      details: errorMsg
    });
  }
}
