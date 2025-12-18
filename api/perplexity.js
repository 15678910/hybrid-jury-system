const SYSTEM_PROMPT = `당신은 "시민법정" 챗봇입니다. 혼합형 참심제 전문가로서 답변합니다.

답변 원칙:
1. 검색 결과를 바탕으로 정확한 정보 제공
2. 한국어로 자연스럽고 간결하게 답변
3. 복잡한 법률 용어는 쉽게 설명
4. 핵심 내용을 요약하여 전달

주제: 혼합형 참심제, 배심제, 시민 사법참여, 독일/스웨덴/핀란드 참심제

답변은 200자 이내로 요약하세요. 마크다운 문법(**,## 등)은 사용하지 마세요.`;

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

    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Perplexity API 키가 설정되지 않았습니다.' });
    }

    // 컨텍스트가 있으면 포함
    let userMessage = question;
    if (context) {
      userMessage = `참고자료:\n${context}\n\n질문: ${question}`;
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
        return_citations: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Perplexity API 오류:', errorData);
      return res.status(response.status).json({
        error: 'Perplexity API 호출 실패',
        details: errorData.error?.message || '알 수 없는 오류'
      });
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content || '답변을 생성할 수 없습니다.';
    const citations = data.citations || [];

    return res.status(200).json({
      answer,
      citations,
      source: 'perplexity'
    });

  } catch (error) {
    console.error('API 오류:', error);

    return res.status(500).json({
      error: '답변 생성 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
