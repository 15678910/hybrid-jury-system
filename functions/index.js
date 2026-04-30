const functions = require('firebase-functions/v1');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const iconv = require('iconv-lite');

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();

// Google AI 설정
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const genAI = GOOGLE_API_KEY ? new GoogleGenerativeAI(GOOGLE_API_KEY) : null;

// 텔레그램 봇 설정 (환경변수에서 가져옴)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || '-1003615735371';

// 투표 설정
const DEFAULT_POLL_DURATION_HOURS = 24; // 기본 투표 기간 (시간)

// ============================================
// 보안 헬퍼 함수
// ============================================

// CORS 헬퍼 - 허용된 도메인만 허용
const ALLOWED_ORIGINS = ['https://xn--lg3b0kt4n41f.kr', 'https://siminbupjung-blog.web.app', 'https://siminbupjung-blog.firebaseapp.com'];
function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    res.set('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// 관리자 인증 검증
async function verifyAdmin(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const adminKey = req.headers['x-admin-key'];
        if (adminKey === process.env.ADMIN_SECRET_KEY) return true;
        res.status(401).json({ error: '인증이 필요합니다.' });
        return false;
    }
    try {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        return true;
    } catch (error) {
        console.error('Auth verification failed:', error);
        res.status(403).json({ error: '인증이 유효하지 않습니다.' });
        return false;
    }
}

// Rate Limiting (IP 기반)
const rateLimitMap = new Map();
function checkRateLimit(req, res, maxRequests = 30) {
    const ip = req.headers['x-forwarded-for'] || req.ip || 'unknown';
    const now = Date.now();
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
        return true;
    }
    const record = rateLimitMap.get(ip);
    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + 60000;
        return true;
    }
    record.count++;
    if (record.count > maxRequests) {
        res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' });
        return false;
    }
    return true;
}
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap) {
        if (now > record.resetTime) rateLimitMap.delete(ip);
    }
}, 300000);

/**
 * 한국어 파라미터 안전 디코딩 유틸리티
 * - 이중 URL 인코딩 방어 (curl 등에서 발생)
 * - U+FFFD (유니코드 대체 문자) 감지 및 거부
 * @param {string} raw - 원본 파라미터 값
 * @returns {string|null} - 디코딩된 값 또는 null (유효하지 않은 경우)
 */
function safeDecodeKorean(raw) {
    if (!raw) return null;
    let decoded = raw;
    // 이중 URL 인코딩 방어
    try {
        if (raw.includes('%')) decoded = decodeURIComponent(raw);
    } catch (e) {
        // 디코딩 실패 시 원본 사용
    }
    // U+FFFD (유니코드 대체 문자) 감지 - 깨진 인코딩 표시
    if (decoded.includes('\uFFFD')) {
        console.error(`[safeDecodeKorean] U+FFFD detected in parameter: ${JSON.stringify(decoded)} — rejecting garbled input`);
        return null;
    }
    return decoded;
}

// 환영 메시지 템플릿
const getWelcomeMessage = (userName) => {
    return `🎉 환영합니다, ${userName}님!

⚖️ 시민법관 참심제 텔레그램 그룹에 오신 것을 환영합니다!

이 그룹은 '주권자에 의한 시민법관 참심제' 도입을 위한 소통 공간입니다.

📌 주요 활동:
• 참심제 관련 소식 공유
• 사법개혁 논의
• 시민 참여 활동 안내

🔗 웹사이트: https://시민법정.kr

함께 민주적인 사법 개혁을 만들어가요! 💪`;
};

// 텔레그램 메시지 전송 함수
const sendTelegramMessage = async (chatId, text, options = {}) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                ...options
            })
        });

        const result = await response.json();
        console.log('Telegram response:', result);
        return result;
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        throw error;
    }
};

// 텔레그램 사진 전송 함수
const sendTelegramPhoto = async (chatId, photoUrl, caption = '', options = {}) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                photo: photoUrl,
                caption: caption,
                parse_mode: 'HTML',
                ...options
            })
        });

        const result = await response.json();
        console.log('Telegram photo response:', result);
        return result;
    } catch (error) {
        console.error('Error sending Telegram photo:', error);
        throw error;
    }
};

// 텔레그램 투표 생성 함수
const sendTelegramPoll = async (chatId, question, options, openPeriod = DEFAULT_POLL_DURATION_HOURS * 3600, allowsMultipleAnswers = false) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPoll`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                question: question,
                options: options,
                is_anonymous: false, // 공개 투표
                allows_multiple_answers: allowsMultipleAnswers,
                open_period: openPeriod // 초 단위
            })
        });

        const result = await response.json();
        console.log('Telegram poll response:', result);
        return result;
    } catch (error) {
        console.error('Error sending Telegram poll:', error);
        throw error;
    }
};

// 참고사항에서 마감일 파싱 함수 (예: "투표마감: 2026년 1월 1일 24:00")
const parseDeadlineFromDescriptions = (descriptions) => {
    for (let i = 0; i < descriptions.length; i++) {
        const line = descriptions[i];
        // "투표마감: 2026년 1월 1일 24:00" 또는 "마감: 1월 1일 24:00" 패턴
        const deadlineMatch = line.match(/(?:투표)?마감[:\s]*(\d{4}년\s*)?(\d{1,2})월\s*(\d{1,2})일\s*(\d{1,2})[:\s]?(\d{2})?/);
        if (deadlineMatch) {
            const now = new Date();
            const year = deadlineMatch[1] ? parseInt(deadlineMatch[1]) : now.getFullYear();
            const month = parseInt(deadlineMatch[2]) - 1; // 0-indexed
            const day = parseInt(deadlineMatch[3]);
            const hour = parseInt(deadlineMatch[4]);
            const minute = deadlineMatch[5] ? parseInt(deadlineMatch[5]) : 0;

            // 24:00는 다음날 0:00로 처리
            let targetDate;
            if (hour === 24) {
                targetDate = new Date(year, month, day + 1, 0, minute);
            } else {
                targetDate = new Date(year, month, day, hour, minute);
            }

            // 현재 시간과의 차이를 시간 단위로 계산
            const diffMs = targetDate.getTime() - now.getTime();
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

            if (diffHours > 0 && diffHours <= 240) { // 최대 10일
                // 마감일 라인을 descriptions에서 제거
                descriptions.splice(i, 1);
                return { hours: diffHours, deadline: targetDate };
            }
        }
    }
    return null;
};

// 투표 기간 파싱 함수 (예: "48시간", "7일", "3일")
const parseDuration = (text) => {
    // 시간 패턴: "24시간", "48시간" 등
    const hourMatch = text.match(/^(\d+)시간\s+/);
    if (hourMatch) {
        const hours = parseInt(hourMatch[1]);
        if (hours >= 1 && hours <= 240) { // 최대 10일
            return { hours, remaining: text.replace(hourMatch[0], '') };
        }
    }

    // 일 패턴: "1일", "7일" 등
    const dayMatch = text.match(/^(\d+)일\s+/);
    if (dayMatch) {
        const days = parseInt(dayMatch[1]);
        if (days >= 1 && days <= 10) { // 최대 10일
            return { hours: days * 24, remaining: text.replace(dayMatch[0], '') };
        }
    }

    // 기본값
    return { hours: DEFAULT_POLL_DURATION_HOURS, remaining: text };
};

// #투표 메시지 처리 함수 (다중 선택지 투표용)
const handleCustomPoll = async (message) => {
    const chatId = message.chat.id;
    const text = message.text || '';
    const userName = message.from?.first_name || message.from?.username || '익명';

    // #투표 태그 확인
    const pollMatch = text.match(/^#투표\s+(.+)/s);

    if (!pollMatch) return false;

    const rawContent = pollMatch[1].trim();

    // 투표 기간 파싱
    const { hours: pollDurationHours, remaining: contentWithOptions } = parseDuration(rawContent);

    // 줄바꿈으로 분리하여 질문, 부가설명, 선택지 파싱
    const lines = contentWithOptions.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 1) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 투표 형식이 올바르지 않습니다.\n\n사용법:\n#투표 질문 내용\n장소: OOO (선택)\n- 선택지1\n- 선택지2\n\n예시:\n#투표 오프라인 모임 날짜 선택\n장소: 방정환 도서관\n- 1월 2일\n- 1월 5일`
        );
        return true;
    }

    // 첫 줄은 질문
    const question = lines[0];

    // -로 시작하는 줄은 선택지, 나머지는 부가설명
    const options = [];
    const descriptions = [];

    lines.slice(1).forEach(line => {
        if (line.match(/^[-•]/)) {
            // 선택지 (-로 시작)
            options.push(line.replace(/^[-•]\s*/, '').trim());
        } else if (line.length > 0) {
            // 부가설명 (장소:, 준비물: 등)
            descriptions.push(line);
        }
    });

    // 참고사항에서 마감일 파싱 (예: "투표마감: 2026년 1월 1일 24:00")
    const deadlineResult = parseDeadlineFromDescriptions(descriptions);
    let finalPollDurationHours = pollDurationHours;
    let deadline;

    if (deadlineResult) {
        // 마감일이 명시된 경우 해당 시간 사용
        finalPollDurationHours = deadlineResult.hours;
        deadline = deadlineResult.deadline;
    } else {
        // 기본 계산
        deadline = new Date(Date.now() + pollDurationHours * 60 * 60 * 1000);
    }

    // 선택지가 없으면 오류
    if (options.length < 2) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 선택지가 2개 이상 필요합니다.\n\n사용법:\n#투표 질문 내용\n장소: OOO (선택)\n- 선택지1\n- 선택지2\n\n예시:\n#투표 오프라인 모임 날짜 선택\n장소: 방정환 도서관\n- 1월 2일\n- 1월 5일`
        );
        return true;
    }

    // 텔레그램 투표는 최대 10개 선택지
    if (options.length > 10) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 선택지는 최대 10개까지 가능합니다. (현재 ${options.length}개)`
        );
        return true;
    }

    // Firestore에 투표 저장
    const pollData = {
        content: question,
        description: descriptions.join('\n'), // 부가설명 저장
        options: options,
        proposer: userName,
        proposerId: message.from?.id,
        chatId: chatId,
        messageId: message.message_id,
        createdAt: new Date(),
        type: 'custom_poll', // 커스텀 투표 타입
        status: 'voting',
        pollDurationHours: finalPollDurationHours
    };

    const pollRef = await db.collection('telegram_proposals').add(pollData);

    // 투표 기간 표시
    const durationText = finalPollDurationHours >= 24 && finalPollDurationHours % 24 === 0
        ? `${finalPollDurationHours / 24}일`
        : `${finalPollDurationHours}시간`;

    // 마감일 텍스트
    const deadlineText = `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 ${deadline.getHours().toString().padStart(2, '0')}:${deadline.getMinutes().toString().padStart(2, '0')}`;

    // 부가설명 포맷팅
    const descriptionText = descriptions.length > 0
        ? `\n📝 참고사항:\n${descriptions.map(d => `  ${d}`).join('\n')}\n`
        : '';

    // 투표 안내 메시지
    const announcementMsg = `🗳️ <b>새로운 투표가 등록되었습니다!</b>

👤 제안자: ${userName}
❓ 질문: ${question}
${descriptionText}
📋 선택지:
${options.map((opt, i) => `  ${i + 1}. ${opt}`).join('\n')}

⏰ 투표 기간: ${durationText}
📅 마감: ${deadlineText}
📋 투표번호: #${pollRef.id.slice(-6)}

아래 투표에 참여해주세요! 👇`;

    await sendTelegramMessage(chatId, announcementMsg);

    // 투표 생성
    const pollQuestion = question.length > 250
        ? question.substring(0, 247) + '...'
        : question;

    const pollResult = await sendTelegramPoll(
        chatId,
        `[투표] ${pollQuestion}`,
        options,
        finalPollDurationHours * 3600
    );

    // 투표 ID 저장
    if (pollResult.ok && pollResult.result?.poll) {
        await pollRef.update({
            pollId: pollResult.result.poll.id,
            pollMessageId: pollResult.result.message_id
        });
    }

    console.log(`Custom poll created: ${pollRef.id} by ${userName}`);
    return true;
};

// #복수투표 메시지 처리 함수 (복수 선택 가능한 투표)
const handleMultiPoll = async (message) => {
    const chatId = message.chat.id;
    const text = message.text || '';
    const userName = message.from?.first_name || message.from?.username || '익명';

    // #복수투표 태그 확인
    const pollMatch = text.match(/^#복수투표\s+(.+)/s);

    if (!pollMatch) return false;

    const rawContent = pollMatch[1].trim();

    // 투표 기간 파싱
    const { hours: pollDurationHours, remaining: contentWithOptions } = parseDuration(rawContent);

    // 줄바꿈으로 분리하여 질문, 부가설명, 선택지 파싱
    const lines = contentWithOptions.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 1) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 복수투표 형식이 올바르지 않습니다.\n\n사용법:\n#복수투표 질문 내용\n장소: OOO (선택)\n- 선택지1\n- 선택지2\n\n예시:\n#복수투표 지역모임 일정 선택\n장소: 강남역 카페\n- 토요일 2시\n- 일요일 2시\n- 환경 문제 토론\n- 주민 자치 논의`
        );
        return true;
    }

    // 첫 줄은 질문
    const question = lines[0];

    // -로 시작하는 줄은 선택지, 나머지는 부가설명
    const options = [];
    const descriptions = [];

    lines.slice(1).forEach(line => {
        if (line.match(/^[-•]/)) {
            options.push(line.replace(/^[-•]\s*/, '').trim());
        } else if (line.length > 0) {
            descriptions.push(line);
        }
    });

    // 참고사항에서 마감일 파싱 (예: "투표마감: 2026년 1월 1일 24:00")
    const deadlineResult = parseDeadlineFromDescriptions(descriptions);
    let finalPollDurationHours = pollDurationHours;
    let deadline;

    if (deadlineResult) {
        // 마감일이 명시된 경우 해당 시간 사용
        finalPollDurationHours = deadlineResult.hours;
        deadline = deadlineResult.deadline;
    } else {
        // 기본 계산
        deadline = new Date(Date.now() + pollDurationHours * 60 * 60 * 1000);
    }

    // 선택지가 없으면 오류
    if (options.length < 2) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 선택지가 2개 이상 필요합니다.\n\n예시:\n#복수투표 지역모임 일정 선택\n- 토요일 2시\n- 일요일 2시\n- 환경 문제 토론`
        );
        return true;
    }

    if (options.length > 10) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 선택지는 최대 10개까지 가능합니다. (현재 ${options.length}개)`
        );
        return true;
    }

    // Firestore에 투표 저장
    const pollData = {
        content: question,
        description: descriptions.join('\n'),
        options: options,
        proposer: userName,
        proposerId: message.from?.id,
        chatId: chatId,
        messageId: message.message_id,
        createdAt: new Date(),
        type: 'multi_poll', // 복수 선택 투표 타입
        status: 'voting',
        pollDurationHours: finalPollDurationHours
    };

    const pollRef = await db.collection('telegram_proposals').add(pollData);

    // 투표 기간 표시
    const durationText = finalPollDurationHours >= 24 && finalPollDurationHours % 24 === 0
        ? `${finalPollDurationHours / 24}일`
        : `${finalPollDurationHours}시간`;

    // 마감일 텍스트
    const deadlineText = `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 ${deadline.getHours().toString().padStart(2, '0')}:${deadline.getMinutes().toString().padStart(2, '0')}`;

    // 부가설명 포맷팅
    const descriptionText = descriptions.length > 0
        ? `\n📝 참고사항:\n${descriptions.map(d => `  ${d}`).join('\n')}\n`
        : '';

    // 투표 안내 메시지
    const announcementMsg = `🗳️ <b>새로운 복수선택 투표가 등록되었습니다!</b>

👤 제안자: ${userName}
❓ 질문: ${question}
${descriptionText}
📋 선택지 (복수 선택 가능):
${options.map((opt, i) => `  ${i + 1}. ${opt}`).join('\n')}

⏰ 투표 기간: ${durationText}
📅 마감: ${deadlineText}
📋 투표번호: #${pollRef.id.slice(-6)}

✅ <b>여러 개를 선택할 수 있습니다!</b>
아래 투표에 참여해주세요! 👇`;

    await sendTelegramMessage(chatId, announcementMsg);

    // 복수 선택 투표 생성
    const pollQuestion = question.length > 250
        ? question.substring(0, 247) + '...'
        : question;

    const pollResult = await sendTelegramPoll(
        chatId,
        `[복수투표] ${pollQuestion}`,
        options,
        finalPollDurationHours * 3600,
        true // 복수 선택 허용
    );

    // 투표 ID 저장
    if (pollResult.ok && pollResult.result?.poll) {
        await pollRef.update({
            pollId: pollResult.result.poll.id,
            pollMessageId: pollResult.result.message_id
        });
    }

    console.log(`Multi poll created: ${pollRef.id} by ${userName}`);
    return true;
};

// #설문 메시지 처리 함수 (간단한 의견 수렴용)
const handleSurvey = async (message) => {
    const chatId = message.chat.id;
    const text = message.text || '';
    const userName = message.from?.first_name || message.from?.username || '익명';

    // #설문 태그 확인
    const surveyMatch = text.match(/^#설문\s+(.+)/s);

    if (!surveyMatch) return false;

    const rawContent = surveyMatch[1].trim();

    // 투표 기간 파싱
    const { hours: pollDurationHours, remaining: surveyContent } = parseDuration(rawContent);

    if (surveyContent.length < 5) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 설문 내용이 너무 짧습니다.\n\n예시: #설문 다음 정기모임 날짜는 언제가 좋을까요?\n기간 지정: #설문 48시간 오프라인 모임 참석 가능하신가요?`
        );
        return true;
    }

    // Firestore에 설문 저장
    const surveyData = {
        content: surveyContent,
        proposer: userName,
        proposerId: message.from?.id,
        chatId: chatId,
        messageId: message.message_id,
        createdAt: new Date(),
        type: 'survey', // 설문 타입 표시
        status: 'voting',
        votes: { agree: 0, disagree: 0, abstain: 0 },
        pollDurationHours: pollDurationHours
    };

    const surveyRef = await db.collection('telegram_proposals').add(surveyData);

    // 투표 기간 표시
    const durationText = pollDurationHours >= 24 && pollDurationHours % 24 === 0
        ? `${pollDurationHours / 24}일`
        : `${pollDurationHours}시간`;

    // 마감일 계산
    const deadline = new Date(Date.now() + pollDurationHours * 60 * 60 * 1000);
    const deadlineText = `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 ${deadline.getHours().toString().padStart(2, '0')}:${deadline.getMinutes().toString().padStart(2, '0')}`;

    // 설문 안내 메시지
    const announcementMsg = `📋 <b>새로운 설문이 등록되었습니다!</b>

👤 제안자: ${userName}
❓ 질문: ${surveyContent}

⏰ 응답 기간: ${durationText}
📅 마감: ${deadlineText}
📋 설문번호: #${surveyRef.id.slice(-6)}

아래 투표에 참여해주세요! 👇`;

    await sendTelegramMessage(chatId, announcementMsg);

    // 투표 생성
    const pollQuestion = surveyContent.length > 250
        ? surveyContent.substring(0, 247) + '...'
        : surveyContent;

    const pollResult = await sendTelegramPoll(
        chatId,
        `[설문] ${pollQuestion}`,
        ['👍 예', '👎 아니오', '🤔 잘 모르겠음'],
        pollDurationHours * 3600
    );

    // 투표 ID 저장
    if (pollResult.ok && pollResult.result?.poll) {
        await surveyRef.update({
            pollId: pollResult.result.poll.id,
            pollMessageId: pollResult.result.message_id
        });
    }

    console.log(`Survey created: ${surveyRef.id} by ${userName}`);
    return true;
};

// #제안 메시지 처리 함수
const handleProposal = async (message) => {
    const chatId = message.chat.id;
    const text = message.text || '';
    const userName = message.from?.first_name || message.from?.username || '익명';

    // #제안 태그 확인 (대소문자 무관)
    const proposalMatch = text.match(/^#제안\s+(.+)/s);

    if (!proposalMatch) return false;

    const rawContent = proposalMatch[1].trim();

    // 투표 기간 파싱
    const { hours: pollDurationHours, remaining: proposalContent } = parseDuration(rawContent);

    if (proposalContent.length < 5) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 제안 내용이 너무 짧습니다.\n\n예시: #제안 월례회의를 토요일로 변경하자\n투표 기간 지정: #제안 48시간 월례회의를 토요일로 변경하자`
        );
        return true;
    }

    // Firestore에 제안 저장
    const proposalData = {
        content: proposalContent,
        proposer: userName,
        proposerId: message.from?.id,
        chatId: chatId,
        messageId: message.message_id,
        createdAt: new Date(),
        status: 'voting', // voting, passed, rejected
        votes: { agree: 0, disagree: 0, abstain: 0 },
        pollDurationHours: pollDurationHours
    };

    const proposalRef = await db.collection('telegram_proposals').add(proposalData);

    // 투표 기간 표시 (일 단위로 변환 가능하면 변환)
    const durationText = pollDurationHours >= 24 && pollDurationHours % 24 === 0
        ? `${pollDurationHours / 24}일`
        : `${pollDurationHours}시간`;

    // 마감일 계산
    const deadline = new Date(Date.now() + pollDurationHours * 60 * 60 * 1000);
    const deadlineText = `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 ${deadline.getHours().toString().padStart(2, '0')}:${deadline.getMinutes().toString().padStart(2, '0')}`;

    // 제안 접수 알림
    const announcementMsg = `📣 <b>새로운 제안이 등록되었습니다!</b>

👤 제안자: ${userName}
📝 내용: ${proposalContent}

⏰ 투표 기간: ${durationText}
📅 마감: ${deadlineText}
📋 제안번호: #${proposalRef.id.slice(-6)}

아래 투표에 참여해주세요! 👇`;

    await sendTelegramMessage(chatId, announcementMsg);

    // 투표 생성
    const pollQuestion = proposalContent.length > 250
        ? proposalContent.substring(0, 247) + '...'
        : proposalContent;

    const pollResult = await sendTelegramPoll(
        chatId,
        `[제안] ${pollQuestion}`,
        ['✅ 찬성', '❌ 반대', '⏸️ 기권'],
        pollDurationHours * 3600
    );

    // 투표 ID 저장
    if (pollResult.ok && pollResult.result?.poll) {
        await proposalRef.update({
            pollId: pollResult.result.poll.id,
            pollMessageId: pollResult.result.message_id
        });
    }

    console.log(`Proposal created: ${proposalRef.id} by ${userName}`);
    return true;
};

// 투표 결과 처리 함수
const handlePollResult = async (poll) => {
    // 투표가 종료되었는지 확인
    if (!poll.is_closed) return;

    const pollId = poll.id;

    // Firestore에서 해당 투표의 제안 찾기
    const proposalsRef = db.collection('telegram_proposals');
    const snapshot = await proposalsRef.where('pollId', '==', pollId).get();

    if (snapshot.empty) {
        console.log('No proposal found for poll:', pollId);
        return;
    }

    const proposalDoc = snapshot.docs[0];
    const proposal = proposalDoc.data();

    // 이미 처리된 제안인지 확인
    if (proposal.status !== 'voting') {
        console.log('Proposal already processed:', proposalDoc.id);
        return;
    }

    // 투표 결과 집계
    const options = poll.options || [];
    const agreeVotes = options[0]?.voter_count || 0;  // 찬성
    const disagreeVotes = options[1]?.voter_count || 0;  // 반대
    const abstainVotes = options[2]?.voter_count || 0;  // 기권

    const totalVotes = agreeVotes + disagreeVotes + abstainVotes;
    const effectiveVotes = agreeVotes + disagreeVotes; // 기권 제외

    // 결과 판정 (찬성이 반대보다 많으면 통과)
    let status, resultEmoji, resultText;
    if (effectiveVotes === 0) {
        status = 'rejected';
        resultEmoji = '⚪';
        resultText = '무효 (투표 참여 없음)';
    } else if (agreeVotes > disagreeVotes) {
        status = 'passed';
        resultEmoji = '✅';
        resultText = '통과';
    } else if (agreeVotes < disagreeVotes) {
        status = 'rejected';
        resultEmoji = '❌';
        resultText = '부결';
    } else {
        status = 'rejected';
        resultEmoji = '⚖️';
        resultText = '부결 (동률)';
    }

    // Firestore 업데이트
    await proposalDoc.ref.update({
        status: status,
        votes: {
            agree: agreeVotes,
            disagree: disagreeVotes,
            abstain: abstainVotes
        },
        totalVotes: totalVotes,
        closedAt: new Date()
    });

    // 타입별 결과 메시지 생성
    let resultMsg;

    if (proposal.type === 'custom_poll' || proposal.type === 'multi_poll') {
        // 커스텀 투표/복수투표 결과 (다중 선택지)
        const pollOptions = poll.options || [];
        const optionResults = pollOptions.map((opt, i) =>
            `  ${i + 1}. ${opt.text}: ${opt.voter_count || 0}표`
        ).join('\n');

        // 가장 많은 득표 옵션 찾기
        let maxVotes = 0;
        let winners = [];
        pollOptions.forEach((opt) => {
            const votes = opt.voter_count || 0;
            if (votes > maxVotes) {
                maxVotes = votes;
                winners = [opt.text];
            } else if (votes === maxVotes && votes > 0) {
                winners.push(opt.text);
            }
        });

        const winnerText = maxVotes > 0
            ? (winners.length > 1 ? `동률: ${winners.join(', ')}` : `1위: ${winners[0]}`)
            : '투표 참여 없음';

        const pollTypeLabel = proposal.type === 'multi_poll' ? '복수투표' : '투표';

        resultMsg = `🗳️ <b>${pollTypeLabel} 결과 발표</b>

❓ 질문: ${proposal.content}
👤 제안자: ${proposal.proposer}

📈 투표 현황:
${optionResults}
  📊 총 참여: ${totalVotes}명

🏆 <b>${winnerText}</b> (${maxVotes}표)

📋 투표번호: #${proposalDoc.id.slice(-6)}`;
    } else if (proposal.type === 'survey') {
        // 설문 결과
        const voteLabels = { yes: '👍 예', no: '👎 아니오', neutral: '🤔 잘 모르겠음' };
        resultMsg = `📊 <b>설문 결과 발표</b>

❓ 질문: ${proposal.content}
👤 제안자: ${proposal.proposer}

📈 응답 현황:
  ${voteLabels.yes}: ${agreeVotes}표
  ${voteLabels.no}: ${disagreeVotes}표
  ${voteLabels.neutral}: ${abstainVotes}표
  📊 총 참여: ${totalVotes}명

📋 설문번호: #${proposalDoc.id.slice(-6)}`;
    } else {
        // 제안 결과
        const voteLabels = { yes: '✅ 찬성', no: '❌ 반대', neutral: '⏸️ 기권' };
        resultMsg = `📊 <b>투표 결과 발표</b>

📝 제안: ${proposal.content}
👤 제안자: ${proposal.proposer}

${resultEmoji} <b>결과: ${resultText}</b>

📈 투표 현황:
  ${voteLabels.yes}: ${agreeVotes}표
  ${voteLabels.no}: ${disagreeVotes}표
  ${voteLabels.neutral}: ${abstainVotes}표
  📊 총 참여: ${totalVotes}명

${status === 'passed' ? '🎉 제안이 통과되었습니다! 커뮤니티 규칙에 반영됩니다.' : '제안이 부결되었습니다.'}

📋 제안번호: #${proposalDoc.id.slice(-6)}`;
    }

    await sendTelegramMessage(proposal.chatId, resultMsg);
    console.log(`Poll result processed: ${proposalDoc.id} - ${proposal.type}`);
};

// 텔레그램 Webhook 처리 (새 멤버 감지 + #제안 처리 + 투표 결과 처리)
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    try {
        console.log('Received webhook:', JSON.stringify(req.body));

        const update = req.body;

        // 1. 새 멤버가 그룹에 참가했을 때
        if (update.message && update.message.new_chat_members) {
            const chatId = update.message.chat.id;
            const newMembers = update.message.new_chat_members;

            for (const member of newMembers) {
                // 봇 자체는 환영하지 않음
                if (member.is_bot) continue;

                const userName = member.first_name || member.username || '새로운 멤버';
                const welcomeMsg = getWelcomeMessage(userName);

                await sendTelegramMessage(chatId, welcomeMsg);
                console.log(`Welcomed new member: ${userName}`);
            }
        }

        // 2. #제안, #설문, #투표 메시지 처리
        if (update.message && update.message.text) {
            let handled = false;

            // /참여하기 명령어 처리
            if (!handled && update.message.text.trim() === '/참여하기') {
                const chatId = update.message.chat.id;
                const posterUrl = 'https://siminbupjung-blog.web.app/%EC%B0%B8%EC%8B%AC%EC%A0%9C%ED%8F%AC%EC%8A%A4%ED%84%B01.png';
                const caption = '⚖️ <b>시민법관 참심제 - 온라인 준비위원 참여</b>\n\n직업법관 소수가 아닌, 주권자인 국민이 직접 판결을 결정하는 참심제!\n지금, 사법개혁추진준비위원으로 연대해주십시오!\n\n👇 아래 버튼을 눌러 참여하세요';

                await sendTelegramPhoto(chatId, posterUrl, caption, {
                    reply_markup: {
                        inline_keyboard: [[
                            { text: '✊ 참여하기', url: 'https://xn--lg3b0kt4n41f.kr/#signature' }
                        ]]
                    }
                });
                handled = true;
                console.log('참여하기 poster sent');
            }

            // #제안 처리
            if (!handled) {
                handled = await handleProposal(update.message);
                if (handled) console.log('Proposal handled');
            }

            // #설문 처리
            if (!handled) {
                handled = await handleSurvey(update.message);
                if (handled) console.log('Survey handled');
            }

            // #투표 처리 (커스텀 선택지)
            if (!handled) {
                handled = await handleCustomPoll(update.message);
                if (handled) console.log('Custom poll handled');
            }

            // #복수투표 처리 (복수 선택 가능)
            if (!handled) {
                handled = await handleMultiPoll(update.message);
                if (handled) console.log('Multi poll handled');
            }
        }

        // 3. 투표 종료 처리 (poll 결과)
        if (update.poll) {
            await handlePollResult(update.poll);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

// Webhook 설정 함수 (수동 호출용)
exports.setWebhook = functions.https.onRequest(async (req, res) => {
    if (!(await verifyAdmin(req, res))) return;
    const webhookUrl = `https://us-central1-siminbupjung-blog.cloudfunctions.net/telegramWebhook`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                allowed_updates: ['message', 'poll', 'chat_member', 'my_chat_member']
            })
        });
        const result = await response.json();
        console.log('Webhook set result:', result);
        res.json(result);
    } catch (error) {
        console.error('Error setting webhook:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// Webhook 삭제 함수 (필요 시)
exports.deleteWebhook = functions.https.onRequest(async (req, res) => {
    if (!(await verifyAdmin(req, res))) return;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 참여하기 포스터 수동 전송 (HTTP 트리거)
exports.sendPosterToGroup = functions.https.onRequest(async (req, res) => {
    if (!(await verifyAdmin(req, res))) return;
    try {
        const posterUrl = 'https://siminbupjung-blog.web.app/%EC%B0%B8%EC%8B%AC%EC%A0%9C%ED%8F%AC%EC%8A%A4%ED%84%B01.png';
        const caption = '⚖️ <b>시민법관 참심제 - 온라인 준비위원 참여</b>\n\n직업법관 소수가 아닌, 주권자인 국민이 직접 판결을 결정하는 참심제!\n지금, 사법개혁추진준비위원으로 연대해주십시오!\n\n👇 아래 버튼을 눌러 참여하세요';

        const result = await sendTelegramPhoto(GROUP_CHAT_ID, posterUrl, caption, {
            reply_markup: {
                inline_keyboard: [[
                    { text: '✊ 참여하기', url: 'https://xn--lg3b0kt4n41f.kr/#signature' }
                ]]
            }
        });

        res.json({ success: true, result });
    } catch (error) {
        console.error('Error sending poster:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// Webhook 정보 확인
exports.getWebhookInfo = functions.https.onRequest(async (req, res) => {
    if (!(await verifyAdmin(req, res))) return;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// ============================================
// 투표 마감 확인 스케줄러 (5분마다 실행)
// ============================================

exports.checkExpiredPolls = functions.pubsub.schedule('0 * * * *').onRun(async (context) => {
    console.log('Checking for expired polls...');

    const now = new Date();
    const proposalsRef = db.collection('telegram_proposals');

    // 투표 중인 제안들 조회
    const snapshot = await proposalsRef.where('status', '==', 'voting').get();

    if (snapshot.empty) {
        console.log('No active polls found');
        return null;
    }

    for (const doc of snapshot.docs) {
        const proposal = doc.data();
        const createdAt = proposal.createdAt?.toDate ? proposal.createdAt.toDate() : new Date(proposal.createdAt);
        const durationHours = proposal.pollDurationHours || 24;
        const expiresAt = new Date(createdAt.getTime() + durationHours * 60 * 60 * 1000);

        // 마감 시간이 지났는지 확인
        if (now >= expiresAt) {
            console.log(`Poll expired: ${doc.id}`);

            // 텔레그램에서 투표 결과 가져오기
            if (proposal.pollMessageId) {
                try {
                    // 투표 종료 처리
                    const stopUrl = `https://api.telegram.org/bot${BOT_TOKEN}/stopPoll`;
                    const stopResponse = await fetch(stopUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: proposal.chatId,
                            message_id: proposal.pollMessageId
                        })
                    });
                    const stopResult = await stopResponse.json();

                    if (stopResult.ok && stopResult.result) {
                        const poll = stopResult.result;

                        // 투표 결과 집계
                        const options = poll.options || [];
                        const agreeVotes = options[0]?.voter_count || 0;
                        const disagreeVotes = options[1]?.voter_count || 0;
                        const abstainVotes = options[2]?.voter_count || 0;
                        const totalVotes = options.reduce((sum, opt) => sum + (opt.voter_count || 0), 0);

                        // 결과 판정
                        let status, resultEmoji, resultText;
                        const effectiveVotes = agreeVotes + disagreeVotes;
                        if (effectiveVotes === 0) {
                            status = 'rejected';
                            resultEmoji = '⚪';
                            resultText = '무효 (투표 참여 없음)';
                        } else if (agreeVotes > disagreeVotes) {
                            status = 'passed';
                            resultEmoji = '✅';
                            resultText = '통과';
                        } else if (agreeVotes < disagreeVotes) {
                            status = 'rejected';
                            resultEmoji = '❌';
                            resultText = '부결';
                        } else {
                            status = 'rejected';
                            resultEmoji = '⚖️';
                            resultText = '부결 (동률)';
                        }

                        // Firestore 업데이트
                        await doc.ref.update({
                            status: status,
                            votes: { agree: agreeVotes, disagree: disagreeVotes, abstain: abstainVotes },
                            totalVotes: totalVotes,
                            closedAt: new Date()
                        });

                        // 결과 메시지 생성
                        let resultMsg;

                        if (proposal.type === 'custom_poll' || proposal.type === 'multi_poll') {
                            const optionResults = options.map((opt, i) =>
                                `  ${i + 1}. ${opt.text}: ${opt.voter_count || 0}표`
                            ).join('\n');

                            let maxVotes = 0;
                            let winners = [];
                            options.forEach((opt) => {
                                const votes = opt.voter_count || 0;
                                if (votes > maxVotes) {
                                    maxVotes = votes;
                                    winners = [opt.text];
                                } else if (votes === maxVotes && votes > 0) {
                                    winners.push(opt.text);
                                }
                            });

                            const winnerText = maxVotes > 0
                                ? (winners.length > 1 ? `동률: ${winners.join(', ')}` : `1위: ${winners[0]}`)
                                : '투표 참여 없음';

                            const pollTypeLabel = proposal.type === 'multi_poll' ? '복수투표' : '투표';

                            resultMsg = `🗳️ <b>${pollTypeLabel} 결과 발표</b>

❓ 질문: ${proposal.content}
👤 제안자: ${proposal.proposer}

📈 투표 현황:
${optionResults}
  📊 총 참여: ${totalVotes}명

🏆 <b>${winnerText}</b> (${maxVotes}표)

📋 투표번호: #${doc.id.slice(-6)}`;
                        } else if (proposal.type === 'survey') {
                            resultMsg = `📊 <b>설문 결과 발표</b>

❓ 질문: ${proposal.content}
👤 제안자: ${proposal.proposer}

📈 응답 현황:
  👍 예: ${agreeVotes}표
  👎 아니오: ${disagreeVotes}표
  🤔 잘 모르겠음: ${abstainVotes}표
  📊 총 참여: ${totalVotes}명

📋 설문번호: #${doc.id.slice(-6)}`;
                        } else {
                            resultMsg = `📊 <b>투표 결과 발표</b>

📝 제안: ${proposal.content}
👤 제안자: ${proposal.proposer}

${resultEmoji} <b>결과: ${resultText}</b>

📈 투표 현황:
  ✅ 찬성: ${agreeVotes}표
  ❌ 반대: ${disagreeVotes}표
  ⏸️ 기권: ${abstainVotes}표
  📊 총 참여: ${totalVotes}명

${status === 'passed' ? '🎉 제안이 통과되었습니다! 커뮤니티 규칙에 반영됩니다.' : '제안이 부결되었습니다.'}

📋 제안번호: #${doc.id.slice(-6)}`;
                        }

                        await sendTelegramMessage(proposal.chatId, resultMsg);
                        console.log(`Poll result sent: ${doc.id}`);
                    }
                } catch (error) {
                    console.error(`Error processing poll ${doc.id}:`, error);
                    // 오류 발생 시에도 상태 업데이트
                    await doc.ref.update({
                        status: 'error',
                        error: error.message,
                        closedAt: new Date()
                    });
                }
            }
        }
    }

    return null;
});

// ============================================
// 일일 등록 제한 확인 API
// ============================================

const DAILY_LIMIT = 1000; // 하루 최대 등록 수

exports.checkDailyLimit = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        // 한국 시간 기준 오늘 00:00:00
        const now = new Date();
        const koreaOffset = 9 * 60 * 60 * 1000; // UTC+9
        const koreaTime = new Date(now.getTime() + koreaOffset);
        const todayStart = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
        todayStart.setTime(todayStart.getTime() - koreaOffset); // UTC로 변환

        // 오늘 등록된 서명 수 조회
        const signaturesRef = db.collection('signatures');
        const todaySignatures = await signaturesRef
            .where('timestamp', '>=', todayStart)
            .get();

        const todayCount = todaySignatures.size;
        const remaining = Math.max(0, DAILY_LIMIT - todayCount);
        const isLimitReached = todayCount >= DAILY_LIMIT;

        res.json({
            todayCount,
            dailyLimit: DAILY_LIMIT,
            remaining,
            isLimitReached
        });
    } catch (error) {
        console.error('Error checking daily limit:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// ============================================
// 서명 등록 API (백엔드 검증 포함)
// ============================================

exports.registerSignature = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (!checkRateLimit(req, res, 10)) return;

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { name, phone, type, address, talent } = req.body;

        // 필수 필드 검증
        if (!name || !phone || !type) {
            res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
            return;
        }

        // 타입 검증
        if (!['individual', 'organization'].includes(type)) {
            res.status(400).json({ error: '잘못된 구분입니다.' });
            return;
        }

        // 한국 시간 기준 오늘 00:00:00
        const now = new Date();
        const koreaOffset = 9 * 60 * 60 * 1000;
        const koreaTime = new Date(now.getTime() + koreaOffset);
        const todayStart = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
        todayStart.setTime(todayStart.getTime() - koreaOffset);

        // 일일 제한 확인 (ISO 문자열 형식으로 비교)
        const signaturesRef = db.collection('signatures');
        const todaySignatures = await signaturesRef
            .where('timestamp', '>=', todayStart.toISOString())
            .get();

        if (todaySignatures.size >= DAILY_LIMIT) {
            res.status(429).json({
                error: '오늘 등록이 마감되었습니다.',
                message: '시스템 안정을 위해 하루 등록 인원을 제한하고 있습니다. 내일 다시 시도해주세요.'
            });
            return;
        }

        // 전화번호 중복 확인
        const phoneClean = phone.replace(/[\s-]/g, '');
        const existingPhone = await signaturesRef
            .where('phone', '==', phoneClean)
            .get();

        if (!existingPhone.empty) {
            res.status(409).json({ error: '이미 등록된 전화번호입니다.' });
            return;
        }

        // 서명 등록
        const signatureData = {
            name: name.trim(),
            phone: phoneClean,
            type,
            address: address || '',
            talent: talent || '',
            timestamp: new Date().toISOString() // 프론트엔드와 형식 통일 (ISO 문자열)
        };

        const docRef = await signaturesRef.add(signatureData);

        res.json({
            success: true,
            id: docRef.id,
            message: '서명이 등록되었습니다.'
        });
    } catch (error) {
        console.error('Error registering signature:', error);
        res.status(500).json({ error: '서명 등록 중 오류가 발생했습니다.' });
    }
});

// ============================================
// 새 서명 등록 시 관리자 알림
// ============================================

exports.onNewSignature = functions.firestore
    .document('signatures/{signatureId}')
    .onCreate(async (snap, context) => {
        const signature = snap.data();
        const signatureId = context.params.signatureId;

        // 이름 마스킹
        const maskName = (name) => {
            if (!name || name.length === 0) return '';
            if (name.length === 1) return name;
            if (name.length === 2) return name[0] + '*';
            const first = name[0];
            const last = name[name.length - 1];
            const middle = '*'.repeat(name.length - 2);
            return first + middle + last;
        };

        // 전화번호 마스킹
        const maskPhone = (phone) => {
            if (!phone) return '';
            const clean = phone.replace(/[\s-]/g, '');
            if (clean.length >= 10) {
                return clean.slice(0, 3) + '-****-' + clean.slice(-4);
            }
            return phone;
        };

        const typeLabel = signature.type === 'individual' ? '개인' : '단체';
        const maskedName = maskName(signature.name);
        const maskedPhone = maskPhone(signature.phone);

        // 관리자 알림 메시지
        const adminMessage = `🎉 <b>새로운 지지 서명!</b>

👤 이름: ${maskedName}
📋 구분: ${typeLabel}
📍 주소: ${signature.address || '미입력'}
🎯 재능: ${signature.talent || '미선택'}
📱 연락처: ${maskedPhone}
⏰ 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

📊 서명 ID: ${signatureId}`;

        try {
            await sendTelegramMessage(GROUP_CHAT_ID, adminMessage);
            console.log('Admin notification sent for signature:', signatureId);
        } catch (error) {
            console.error('Failed to send admin notification:', error);
        }

        return null;
    });

// ============================================
// 블로그 글 알림 API (프론트엔드에서 호출)
// ============================================

exports.sendBlogNotification = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (!(await verifyAdmin(req, res))) return;

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { post, postId, isEdit } = req.body;

        if (!post || !postId) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const postUrl = `https://siminbupjung-blog.web.app/#/blog/${postId}`;

        const message = isEdit
            ? `📝 글이 수정되었습니다!\n\n📌 ${post.title}\n\n${post.summary}\n\n📂 카테고리: ${post.category}\n✍️ 작성자: ${post.author}\n\n👉 자세히 보기: ${postUrl}`
            : `📢 새 글이 등록되었습니다!\n\n📌 ${post.title}\n\n${post.summary}\n\n📂 카테고리: ${post.category}\n✍️ 작성자: ${post.author}\n\n👉 자세히 보기: ${postUrl}`;

        await sendTelegramMessage(GROUP_CHAT_ID, message);
        res.json({ success: true });
    } catch (error) {
        console.error('Blog notification error:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// ============================================
// 블로그 SSR - 동적 OG 태그 생성
// ============================================

// HTML 이스케이프 함수
const escapeHtml = (text) => {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// 블로그 글 SSR 함수
exports.blog = functions.https.onRequest(async (req, res) => {
    try {
        // ⚠️ 수정금지: 크롤러 감지 로직 - SNS 미리보기(OG태그)와 인앱 브라우저 동작에 직접 영향
        // User-Agent 체크 - 크롤러/스크래퍼만 OG 태그 HTML 반환
        // 카카오톡 인앱 브라우저(KAKAOTALK)는 일반 사용자로 처리하고,
        // 카카오 스크래퍼(Kakaotalk-Scrap, Kakao-Agent)만 크롤러로 처리
        // TelegramBot: 텔레그램 미리보기 봇 (인앱 브라우저와 다름)
        const userAgent = req.get('User-Agent') || '';
        const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

        // 일반 사용자는 query parameter로 전달
        if (!isCrawler) {
            const pathParts = req.path.split('/');
            const blogId = pathParts[pathParts.length - 1];
            const redirectUrl = blogId && blogId !== 'blog' ? `/?r=/blog/${blogId}` : '/';

            return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
        }

        // 크롤러만 아래 로직 실행
        // URL에서 블로그 ID 추출 (/blog/abc123)
        const pathParts = req.path.split('/');
        const blogId = pathParts[pathParts.length - 1];

        if (!blogId || blogId === 'blog') {
            // 블로그 목록 페이지 - 홈으로 리다이렉트
            return res.redirect(302, '/');
        }

        // Firestore에서 블로그 글 가져오기
        const docRef = db.collection('posts').doc(blogId);
        const doc = await docRef.get();

        if (!doc.exists) {
            // 글이 없으면 메인 페이지로 리다이렉트
            return res.redirect(302, '/');
        }

        const post = doc.data();
        const title = escapeHtml(post.title) || '시민법정 블로그';
        const description = escapeHtml(post.summary || post.content?.substring(0, 150)) || '시민법정 블로그 글';
        const imageUrl = post.imageUrl || 'https://siminbupjung-blog.web.app/og-image.jpg';
        const postUrl = `https://siminbupjung-blog.web.app/blog/${blogId}`;

        // 크롤러를 위한 최소한의 HTML (메타 태그만)
        const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO 메타태그 -->
    <title>${title} - 시민법정</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="시민법정" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${postUrl}" />

    <!-- Open Graph (Facebook, KakaoTalk 등) -->
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@siminbupjung" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- 네이버 검색 등록 -->
    <meta name="naver-site-verification" content="3a332da27c6871ed25fd1c673e8337e0a534f90f" />

    <!-- 카카오 SDK -->
    <script src="https://developers.kakao.com/sdk/js/kakao.js"></script>

    <!-- 구조화 데이터 (JSON-LD) - 블로그 글 -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": "${title}",
      "description": "${description}",
      "image": "${imageUrl}",
      "url": "${postUrl}",
      "publisher": {
        "@type": "Organization",
        "name": "시민법정",
        "url": "https://xn--lg3b0kt4n41f.kr"
      }
    }
    </script>
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(html);

    } catch (error) {
        console.error('Blog SSR error:', error);
        res.redirect(302, '/');
    }
});

// ============================================
// 카카오 OAuth 토큰 프록시 API
// ============================================

const KAKAO_APP_KEY = '83e843186c1251b9b5a8013fd5f29798';

exports.kakaoToken = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { code, redirect_uri } = req.body;

        if (!code) {
            res.status(400).json({ error: 'Authorization code is required' });
            return;
        }

        // 카카오 토큰 요청
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: KAKAO_APP_KEY,
                redirect_uri: redirect_uri || 'https://siminbupjung-blog.web.app',
                code: code
            })
        });

        const tokenData = await tokenResponse.json();

        console.log('Kakao token response:', tokenData.error ? tokenData : 'success');

        res.json(tokenData);
    } catch (error) {
        console.error('Kakao token error:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// ============================================
// 사법 뉴스 자동 수집 (2일마다 실행)
// ============================================

const NEWS_KEYWORDS = [
    '검찰개혁', '법원개혁', '사법개혁', '참심제',
    '국민참여재판', '배심원제', '사법민주화', '법관인사',
    '검찰수사권', '공수처', '국가수사본부', '전담재판부',
    '중수청', '공소청', '대법관', '헌법재판소',
    '내란', '영장전담판사', '국정원', '방첩사',
    '김건희', '뇌물', '유전무죄', '솜방망이처벌', '무죄선고', '특검'
];

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

// ============================================
// 대법원 보도자료 크롤링
// ============================================

// 대법원 보도자료 페이지 크롤링
const crawlSupremeCourtPressReleases = async (maxItems = 10) => {
    console.log('Crawling Supreme Court press releases...');

    try {
        const url = 'https://www.scourt.go.kr/supreme/news/NewsListAction.work?gubun=702';

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9',
                'Accept': 'text/html,application/xhtml+xml'
            }
        });

        if (!response.ok) {
            console.error('Supreme Court fetch failed:', response.status);
            return [];
        }

        // EUC-KR 인코딩 처리 (대법원 페이지는 EUC-KR 사용)
        const buffer = await response.buffer();
        const html = iconv.decode(buffer, 'euc-kr');
        const pressReleases = [];
        const seenSeqnums = new Set();

        // 대법원 페이지 구조 (확인됨):
        // <td class="tit"><a href='/news/NewsViewAction2.work?...seqnum=1721...'>
        //     제목 (공백/줄바꿈 포함)
        // </a></td>
        // <td>2026-01-29</td>

        // 방법 1: 테이블 행에서 제목과 날짜 함께 추출
        const rowRegex = /<td\s+class="tit"[^>]*>\s*<a\s+href=['"]([^'"]*seqnum=(\d+)[^'"]*)['"]\s*>([\s\S]*?)<\/a>\s*<\/td>\s*<td[^>]*>(\d{4}-\d{2}-\d{2})<\/td>/gi;

        let match;
        while ((match = rowRegex.exec(html)) !== null && pressReleases.length < maxItems) {
            const [, href, seqnum, rawTitle, dateStr] = match;

            if (seenSeqnums.has(seqnum)) continue;
            seenSeqnums.add(seqnum);

            // 제목 정리
            const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();
            if (cleanTitle.length < 5) continue;

            // 날짜 파싱
            const dateParts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
            let pubDate = new Date();
            if (dateParts) {
                pubDate = new Date(parseInt(dateParts[1]), parseInt(dateParts[2]) - 1, parseInt(dateParts[3]));
            }

            const detailUrl = `https://www.scourt.go.kr/supreme/news/NewsViewAction2.work?seqnum=${seqnum}&gubun=702`;

            pressReleases.push({
                title: cleanTitle,
                link: detailUrl,
                pubDate: pubDate.toISOString(),
                source: '대법원',
                keyword: '대법원 보도자료',
                isOfficial: true
            });
        }

        // 방법 2: 폴백 - 싱글쿼트/더블쿼트 모두 처리
        if (pressReleases.length === 0) {
            console.log('Trying fallback regex for Supreme Court...');
            const linkRegex = /href=['"]([^'"]*\/news\/NewsViewAction2\.work[^'"]*seqnum=(\d+)[^'"]*)['"]\s*>([\s\S]*?)<\/a>/gi;

            while ((match = linkRegex.exec(html)) !== null && pressReleases.length < maxItems) {
                const [, href, seqnum, rawTitle] = match;

                if (seenSeqnums.has(seqnum)) continue;
                seenSeqnums.add(seqnum);

                const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim();
                if (cleanTitle.length < 5 || /^\d+$/.test(cleanTitle)) continue;

                const detailUrl = `https://www.scourt.go.kr/supreme/news/NewsViewAction2.work?seqnum=${seqnum}&gubun=702`;

                pressReleases.push({
                    title: cleanTitle,
                    link: detailUrl,
                    pubDate: new Date().toISOString(),
                    source: '대법원',
                    keyword: '대법원 보도자료',
                    isOfficial: true
                });
            }
        }

        console.log(`Found ${pressReleases.length} Supreme Court press releases`);
        return pressReleases;
    } catch (error) {
        console.error('Supreme Court crawl error:', error);
        return [];
    }
};

// 대법원 인사발령 크롤링 (사법정보공개포털)
const crawlJudgePersonnelChanges = async () => {
    console.log('Crawling judge personnel changes...');

    try {
        // 사법정보공개포털 인사정보 페이지
        const url = 'https://portal.scourt.go.kr/pgrgpdshms/pgrgpdshmsR.work';

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });

        if (!response.ok) {
            console.log('Personnel portal fetch failed:', response.status);
            return [];
        }

        // EUC-KR 인코딩 처리
        const buffer = await response.buffer();
        const html = iconv.decode(buffer, 'euc-kr');
        const personnelNews = [];

        // 인사발령 정보 파싱 시도
        const personnelRegex = /<td[^>]*>([^<]*발령[^<]*)<\/td>/gi;
        let match;
        while ((match = personnelRegex.exec(html)) !== null && personnelNews.length < 5) {
            personnelNews.push({
                title: match[1].trim(),
                link: url,
                pubDate: new Date().toISOString(),
                source: '사법정보공개포털',
                keyword: '법관 인사',
                isOfficial: true
            });
        }

        console.log(`Found ${personnelNews.length} personnel items`);
        return personnelNews;
    } catch (error) {
        console.error('Personnel crawl error:', error);
        return [];
    }
};

// 뉴스 제목에서 출처 추출 (Google News: "제목 - 출처" 형식)
const extractNewsSource = (title) => {
    const parts = title.split(' - ');
    return parts.length > 1 ? parts[parts.length - 1].trim() : '';
};

// 뉴스 제목에서 출처 제거
const cleanNewsTitle = (title) => {
    const parts = title.split(' - ');
    return parts.length > 1 ? parts.slice(0, -1).join(' - ').trim() : title;
};

// 날짜 포맷팅
const formatNewsDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 키워드별 뉴스 수집
const fetchNewsForKeyword = async (keyword) => {
    try {
        const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=ko&gl=KR&ceid=KR:ko`;
        const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(googleNewsUrl)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'ok' && data.items) {
            return data.items.slice(0, 3).map(item => ({
                title: cleanNewsTitle(item.title),
                link: item.link,
                pubDate: item.pubDate,
                source: extractNewsSource(item.title),
                keyword: keyword
            }));
        }
    } catch (error) {
        console.error(`Error fetching news for "${keyword}":`, error);
    }
    return [];
};

// URL 기준 중복 제거
const deduplicateNews = (newsItems) => {
    const seen = new Set();
    return newsItems.filter(item => {
        const key = item.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

// AI 요약 함수
const summarizeNewsWithAI = async (newsItems) => {
    // genAI가 없으면 기본 요약 방식 사용
    if (!genAI) {
        console.log('Google AI not configured, using default summary');
        const grouped = {};
        newsItems.forEach(news => {
            if (!grouped[news.keyword]) {
                grouped[news.keyword] = [];
            }
            grouped[news.keyword].push(news);
        });
        const activeKeywords = Object.keys(grouped).slice(0, 5).join(', ');
        return `오늘의 사법 관련 주요 뉴스입니다. ${activeKeywords} 등 ${newsItems.length}건의 뉴스를 수집했습니다.`;
    }

    try {
        // 뉴스 제목 리스트 생성
        const titles = newsItems.map(item => `- ${item.title}`).join('\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `다음은 오늘의 사법 관련 뉴스 제목들입니다. 전체적인 동향을 2-3문장으로 요약해주세요.\n\n${titles}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const summary = response.text();

        console.log('AI summary generated:', summary);
        return summary.trim();
    } catch (error) {
        console.error('AI summarization error:', error);
        // 에러 발생 시 기본 요약 방식으로 폴백
        const grouped = {};
        newsItems.forEach(news => {
            if (!grouped[news.keyword]) {
                grouped[news.keyword] = [];
            }
            grouped[news.keyword].push(news);
        });
        const activeKeywords = Object.keys(grouped).slice(0, 5).join(', ');
        return `오늘의 사법 관련 주요 뉴스입니다. ${activeKeywords} 등 ${newsItems.length}건의 뉴스를 수집했습니다.`;
    }
};

// 최근 24시간 내 뉴스만 필터링
const filterRecentNews = (newsItems) => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return newsItems.filter(item => {
        if (!item.pubDate) return false;
        const pubDate = new Date(item.pubDate);
        return pubDate >= twentyFourHoursAgo;
    });
};

// 뉴스 수집 및 블로그 포스트 생성 (공통 로직)
const collectAndPostNews = async (force = false) => {
    console.log('Starting news collection...');

    // 최근 6시간 이내 수집했는지 확인 (오전6시/오후6시 각각 수집되도록)
    const now = new Date();
    const koreaOffset = 9 * 60 * 60 * 1000;
    const koreaTime = new Date(now.getTime() + koreaOffset);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const recentPosts = await db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

    const alreadyCollected = recentPosts.docs.some(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        return data.isAutoNews === true && createdAt && createdAt >= sixHoursAgo;
    });

    if (alreadyCollected && !force) {
        console.log('News already collected within last 6 hours, skipping');
        return { skipped: true, message: '최근 6시간 이내 이미 뉴스가 수집되었습니다.' };
    }

    // 모든 키워드에 대해 뉴스 수집
    let allNews = [];

    for (const keyword of NEWS_KEYWORDS) {
        const news = await fetchNewsForKeyword(keyword);
        allNews = allNews.concat(news);
        // API 과부하 방지
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 대법원 보도자료 수집 추가
    try {
        const supremeCourtNews = await crawlSupremeCourtPressReleases(5);
        if (supremeCourtNews.length > 0) {
            console.log(`Adding ${supremeCourtNews.length} Supreme Court press releases`);
            allNews = allNews.concat(supremeCourtNews);
        }
    } catch (error) {
        console.error('Supreme Court news fetch error:', error);
    }

    // 중복 제거
    allNews = deduplicateNews(allNews);

    // 최근 24시간 내 뉴스만 필터링
    allNews = filterRecentNews(allNews);
    console.log(`Filtered to ${allNews.length} news items from last 24 hours`);

    if (allNews.length === 0) {
        console.log('No news found in last 24 hours');
        return { skipped: true, message: '최근 24시간 내 수집된 뉴스가 없습니다.' };
    }

    // 키워드별 그룹핑 (뉴스가 있는 키워드만)
    const grouped = {};
    allNews.forEach(news => {
        if (!grouped[news.keyword]) {
            grouped[news.keyword] = [];
        }
        grouped[news.keyword].push(news);
    });

    const dateStr = `${koreaTime.getFullYear()}년 ${koreaTime.getMonth() + 1}월 ${koreaTime.getDate()}일`;

    // HTML 콘텐츠 생성
    let content = '';

    for (const [keyword, items] of Object.entries(grouped)) {
        if (items.length === 0) continue;
        content += `<h3>📌 ${keyword}</h3>\n<ul>\n`;
        items.forEach(item => {
            const sourceText = item.source ? ` | 📰 ${item.source}` : '';
            content += `<li><a href="${item.link}" target="_blank" rel="noopener noreferrer"><strong>${item.title}</strong></a><br/>${formatNewsDate(item.pubDate)}${sourceText}</li>\n`;
        });
        content += `</ul>\n`;
    }

    content += `<hr/>\n<p style="color: #888; font-size: 0.9em;">※ 이 글은 자동 수집된 뉴스입니다. 원문 링크를 통해 전체 기사를 확인해 주세요.</p>`;

    // AI 요약 생성
    const summary = await summarizeNewsWithAI(allNews);

    // Firestore에 저장
    const postData = {
        title: `[사법뉴스] ${dateStr} 주요 소식`,
        summary: summary,
        content: content,
        category: '사법뉴스',
        author: '시민법정 뉴스봇',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isAutoNews: true
    };

    const postRef = await db.collection('posts').add(postData);
    console.log(`News post created: ${postRef.id} with ${allNews.length} articles`);

    // 텔레그램 알림
    try {
        const telegramMsg = `📰 <b>[사법뉴스] ${dateStr} 주요 소식</b>\n\n👉 https://siminbupjung-blog.web.app/blog/${postRef.id}`;
        await sendTelegramMessage(GROUP_CHAT_ID, telegramMsg);
    } catch (e) {
        console.error('Telegram notification failed:', e);
    }

    return { success: true, postId: postRef.id, newsCount: allNews.length };
};

// 매일 오전 6시, 오후 6시(한국시간) 자동 실행
exports.autoCollectNews = functions
    .runWith({ timeoutSeconds: 540, memory: '512MB' })
    .pubsub.schedule('0 6,18 * * *')
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        try {
            await collectAndPostNews();
        } catch (error) {
            console.error('Auto news collection error:', error);
        }
        return null;
    });

// 수동 뉴스 수집 (관리자용 테스트)
exports.collectNewsManual = functions
    .runWith({ timeoutSeconds: 540, memory: '512MB' })
    .https.onRequest(async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (!(await verifyAdmin(req, res))) return;

    try {
        const force = req.query.force === 'true';
        const result = await collectAndPostNews(force);
        res.json(result);
    } catch (error) {
        console.error('Manual news collection error:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// 대법원 보도자료 수동 수집 (테스트용)
exports.collectSupremeCourtNews = functions.https.onRequest(async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (!(await verifyAdmin(req, res))) return;

    try {
        console.log('Manual Supreme Court news collection started');

        // 대법원 보도자료 크롤링
        const pressReleases = await crawlSupremeCourtPressReleases(10);

        if (pressReleases.length === 0) {
            return res.json({
                success: false,
                message: '대법원 보도자료를 가져오지 못했습니다. 페이지 구조가 변경되었을 수 있습니다.',
                data: []
            });
        }

        // Firestore에 저장 (선택적)
        const saveToFirestore = req.query.save === 'true';
        if (saveToFirestore) {
            const now = new Date();
            const koreaOffset = 9 * 60 * 60 * 1000;
            const koreaTime = new Date(now.getTime() + koreaOffset);
            const dateStr = `${koreaTime.getFullYear()}년 ${koreaTime.getMonth() + 1}월 ${koreaTime.getDate()}일`;

            // HTML 콘텐츠 생성
            let content = '<h3>⚖️ 대법원 보도자료</h3>\n<ul>\n';
            pressReleases.forEach(item => {
                content += `<li><a href="${item.link}" target="_blank" rel="noopener noreferrer"><strong>${item.title}</strong></a></li>\n`;
            });
            content += '</ul>\n';
            content += '<hr/>\n<p style="color: #888; font-size: 0.9em;">※ 대법원 공식 보도자료입니다. 원문 링크를 통해 전체 내용을 확인해 주세요.</p>';

            const postRef = await db.collection('posts').add({
                title: `[대법원 보도자료] ${dateStr}`,
                content: content,
                summary: `대법원 공식 보도자료 ${pressReleases.length}건`,
                category: '사법뉴스',
                author: '시민법정',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isAutoNews: true,
                isOfficialSource: true
            });

            return res.json({
                success: true,
                message: `대법원 보도자료 ${pressReleases.length}건을 수집하고 저장했습니다.`,
                postId: postRef.id,
                data: pressReleases
            });
        }

        res.json({
            success: true,
            message: `대법원 보도자료 ${pressReleases.length}건을 수집했습니다. 저장하려면 ?save=true 파라미터를 추가하세요.`,
            data: pressReleases
        });
    } catch (error) {
        console.error('Supreme Court news collection error:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// ============================================
// 동영상 SSR - 동적 OG 태그 생성 (YouTube 썸네일)
// ============================================

exports.videos = functions.https.onRequest(async (req, res) => {
    try {
        // URL에서 video ID 추출 (/v/VIDEO_ID 또는 ?v=VIDEO_ID)
        const pathParts = req.path.split('/').filter(p => p);
        const videoId = pathParts[pathParts.length - 1] !== 'v' ? pathParts[pathParts.length - 1] : req.query.v;

        // User-Agent 체크 - 크롤러/스크래퍼만 OG 태그 HTML 반환
        const userAgent = req.get('User-Agent') || '';
        const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

        // 일반 사용자는 SPA의 Videos 페이지로 리다이렉트
        if (!isCrawler) {
            const redirectUrl = videoId ? `/videos?v=${videoId}` : '/videos';
            return res.redirect(302, redirectUrl);
        }

        // 크롤러: 동적 OG 태그 생성
        let title = '시민법정 동영상';
        let description = '시민법정 - 참심제로 시민이 법관이 되는 사법개혁';
        let imageUrl = 'https://siminbupjung-blog.web.app/og-image.jpg';
        const pageUrl = videoId
            ? `https://siminbupjung-blog.web.app/v/${videoId}`
            : 'https://siminbupjung-blog.web.app/v/';

        // videoId가 있으면 Firestore에서 동영상 정보 가져오기
        if (videoId) {
            // YouTube 썸네일 URL
            imageUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

            // Firestore에서 동영상 제목 가져오기
            try {
                const videosRef = db.collection('videos');
                const snapshot = await videosRef.where('videoId', '==', videoId).limit(1).get();

                if (!snapshot.empty) {
                    const video = snapshot.docs[0].data();
                    title = escapeHtml(video.title) || title;
                    description = escapeHtml(video.description || video.title) || description;
                }
            } catch (dbError) {
                console.error('Firestore error:', dbError);
            }
        }

        // 크롤러를 위한 HTML (메타 태그)
        const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- SEO 메타태그 -->
    <title>${title} - 시민법정</title>
    <meta name="description" content="${description}" />
    <meta name="author" content="시민법정" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${pageUrl}" />

    <!-- Open Graph (Facebook, KakaoTalk, Telegram 등) -->
    <meta property="og:type" content="video.other" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@siminbupjung" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />

    <!-- 네이버 검색 등록 -->
    <meta name="naver-site-verification" content="3a332da27c6871ed25fd1c673e8337e0a534f90f" />

    <!-- 구조화 데이터 (JSON-LD) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": "${title}",
      "description": "${description}",
      "thumbnailUrl": "${imageUrl}",
      "url": "${pageUrl}",
      "publisher": {
        "@type": "Organization",
        "name": "시민법정",
        "url": "https://xn--lg3b0kt4n41f.kr"
      }
    }
    </script>
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(html);

    } catch (error) {
        console.error('Videos SSR error:', error);
        res.redirect(302, '/');
    }
});

// ============================================
// 재판분석 데이터 자동 크롤링
// ============================================

// 내란 관련 인물 목록
const SENTENCING_PERSONS = [
    { name: '곽종근', position: '전 육군특수전사령관' },
    { name: '김건희', position: '대통령 배우자' },
    { name: '김봉식', position: '전 서울경찰청장' },
    { name: '김용현', position: '전 국방부 장관' },
    { name: '김주현', position: '전 대통령실 민정수석' },
    { name: '김태효', position: '전 국가안보실 제1차장' },
    { name: '노상원', position: '전 국군정보사령관' },
    { name: '목현태', position: '전 국회경비대장' },
    { name: '문상호', position: '전 국군정보사령관 (육군 소장)' },
    { name: '박안수', position: '전 육군참모총장 (계엄사령관)' },
    { name: '박성재', position: '법무부 장관' },
    { name: '박종준', position: '대통령경호처장' },
    { name: '심우정', position: '전 검찰총장' },
    { name: '여인형', position: '전 국군방첩사령관' },
    { name: '윤석열', position: '대통령 (직무정지)' },
    { name: '윤승영', position: '전 국수본 수사기획조정관' },
    { name: '이상민', position: '전 행정안전부 장관' },
    { name: '이완규', position: '전 법제처장' },
    { name: '이진우', position: '전 수도방위사령관' },
    { name: '조지호', position: '전 경찰청장' },
    { name: '조태용', position: '전 국정원장' },
    { name: '추경호', position: '국민의힘 의원 (전 원내대표)' },
    { name: '최상목', position: '기획재정부 장관' },
    { name: '한덕수', position: '전 국무총리' }
];

// Bing 뉴스 RSS 검색 함수 (Google이 서버 IP 차단하므로 Bing 사용)
const searchNews = async (query, display = 10) => {
    try {
        // Bing 뉴스 RSS (한국어)
        const bingNewsUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=RSS&mkt=ko-KR`;
        console.log('Fetching Bing News RSS:', bingNewsUrl);

        const response = await fetch(bingNewsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });

        if (!response.ok) {
            console.error('Bing News RSS response not OK:', response.status);
            return [];
        }

        const xmlText = await response.text();
        console.log('Bing News RSS response length:', xmlText.length);

        // XML 파싱: <item>...</item> 추출
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const items = [];
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null && items.length < display) {
            const itemContent = match[1];

            // 각 필드 추출
            const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
            const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/);
            const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            const descriptionMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);

            if (titleMatch && linkMatch) {
                items.push({
                    title: titleMatch[1].trim().replace(/<[^>]*>/g, ''),
                    link: linkMatch[1].trim().replace(/&amp;/g, '&'),
                    pubDate: pubDateMatch ? pubDateMatch[1] : '',
                    description: descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').trim() : ''
                });
            }
        }

        console.log('Parsed news items count:', items.length);
        return items;
    } catch (error) {
        console.error('Bing News RSS search error:', error);
        return [];
    }
};

// Bing 리다이렉트 URL에서 실제 기사 URL 추출
const extractRealUrl = (bingUrl) => {
    if (bingUrl.includes('bing.com/news/apiclick.aspx')) {
        const urlMatch = bingUrl.match(/[?&]url=([^&]+)/);
        if (urlMatch) {
            return decodeURIComponent(urlMatch[1]);
        }
    }
    return bingUrl;
};

// 뉴스 기사 본문 가져오기
const fetchArticleContent = async (url) => {
    try {
        // Bing 리다이렉트 URL에서 실제 URL 추출
        const actualUrl = extractRealUrl(url);
        console.log('Fetching article from:', actualUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(actualUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            },
            redirect: 'follow',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.log('Article fetch failed:', response.status);
            return null;
        }

        const html = await response.text();
        console.log('HTML fetched, length:', html.length);

        // 1. JSON-LD 구조화 데이터에서 기사 본문 추출 (가장 정확)
        let content = '';
        const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const jsonLdTag of jsonLdMatches) {
            try {
                const jsonStr = jsonLdTag.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
                const jsonData = JSON.parse(jsonStr);
                // NewsArticle 또는 Article 타입 확인
                const articleData = Array.isArray(jsonData) ? jsonData.find(d => d['@type'] && d['@type'].includes('Article')) : jsonData;
                if (articleData && articleData.articleBody) {
                    content = articleData.articleBody;
                    console.log('Extracted from JSON-LD articleBody');
                    break;
                }
            } catch (e) {
                // JSON 파싱 실패 무시
            }
        }

        // 2. <meta> og:description 추출 (JSON-LD 없을 때)
        if (!content || content.length < 100) {
            const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i) ||
                                html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i);
            if (ogDescMatch && ogDescMatch[1].length > 50) {
                content = ogDescMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
                console.log('Extracted from og:description');
            }
        }

        // 3. <article> 태그 내용
        if (!content || content.length < 100) {
            const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
            if (articleMatch) {
                content = articleMatch[1];
                console.log('Extracted from <article> tag');
            }
        }

        // 4. 본문 영역 클래스/ID 기반 추출
        if (!content || content.length < 100) {
            const bodyPatterns = [
                /<div[^>]*class="[^"]*article[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*news[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*content[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*news[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*article[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*id="[^"]*article[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*id="[^"]*news[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                // MSN 특화
                /<div[^>]*class="[^"]*body-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
            ];

            for (const pattern of bodyPatterns) {
                const match = html.match(pattern);
                if (match && match[1].length > 200) {
                    content = match[1];
                    console.log('Extracted from body div pattern');
                    break;
                }
            }
        }

        // 5. <p> 태그 추출 (최후의 수단)
        if (!content || content.length < 100) {
            const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
            const meaningfulPs = pMatches.filter(p => {
                const text = p.replace(/<[^>]+>/g, '').trim();
                return text.length > 30; // 의미 있는 단락만
            });
            if (meaningfulPs.length > 0) {
                content = meaningfulPs.slice(0, 20).join(' ');
                console.log('Extracted from <p> tags');
            }
        }

        // HTML 태그 제거 및 정제
        content = content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#\d+;/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        // 최소 100자 이상인 경우만 반환, 최대 5000자
        if (content.length > 100) {
            console.log(`Article content: ${content.length} chars from ${actualUrl}`);
            return content.substring(0, 5000);
        }

        console.log(`Article content too short (${content.length} chars) from ${actualUrl}`);
        return null;
    } catch (error) {
        console.error('Article fetch error:', error.message);
        return null;
    }
};

// AI로 판결 정보 추출 (뉴스 본문 기반)
const extractVerdictInfo = async (personName, newsItems) => {
    if (!genAI || newsItems.length === 0) {
        return null;
    }

    try {
        // 각 뉴스 기사의 본문 가져오기 (최대 5개)
        const articlesToFetch = newsItems.slice(0, 5);
        const articleContents = [];

        for (const item of articlesToFetch) {
            const content = await fetchArticleContent(item.link);
            if (content) {
                articleContents.push({
                    title: item.title.replace(/<[^>]*>/g, ''),
                    content: content
                });
            }
            // API 과부하 방지
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 본문을 가져온 기사가 없으면 기존 방식으로 폴백
        let newsText;
        if (articleContents.length > 0) {
            newsText = articleContents.map(item =>
                `제목: ${item.title}\n본문: ${item.content}`
            ).join('\n\n---\n\n');
            console.log(`Using ${articleContents.length} article contents for AI analysis`);
        } else {
            // 폴백: RSS의 제목과 설명 사용
            newsText = newsItems.map(item => {
                const title = item.title.replace(/<[^>]*>/g, '');
                const desc = item.description.replace(/<[^>]*>/g, '');
                return `제목: ${title}\n내용: ${desc}`;
            }).join('\n\n');
            console.log('Fallback: Using RSS title/description only');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `다음은 "${personName}"의 재판 관련 최신 뉴스 기사입니다. 기사 본문을 분석하여 정확한 재판 정보를 JSON 형식으로 추출해주세요.

뉴스 기사:
${newsText}

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
{
    "hasVerdict": true/false (1심 선고가 있었는지),
    "verdictDate": "YYYY년 M월 D일" 또는 null,
    "status": "구속" 또는 "불구속" 또는 "직무정지" 또는 null,
    "verdict": "징역 X년" 또는 "무죄" 또는 "재판 진행 중",
    "charges": [
        {
            "name": "혐의명",
            "law": "적용 법률 (예: 형법 제000조)",
            "verdict": "유죄/무죄/재판 진행 중",
            "sentence": "형량 (예: 징역 3년) 또는 null"
        }
    ],
    "summary": "1-2문장 요약",
    "keyFacts": ["핵심 사실 1", "핵심 사실 2", "핵심 사실 3"],
    "trialStatus": "1심 선고 완료" 또는 "1심 재판 진행 중" 또는 "헌법재판소 심판 중" 등
}

기사에 명시적으로 언급된 정보만 기입하고, 정보가 부족하면 해당 필드는 null로 두세요.
특히 선고일, 형량, 혐의별 판결 내용은 기사에서 정확히 확인된 경우에만 기입해주세요.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // JSON 파싱 시도
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error('AI extraction error for', personName, ':', error);
        return null;
    }
};

// 단일 인물 데이터 크롤링 및 저장
const crawlPersonSentencing = async (person) => {
    console.log(`Crawling sentencing data for: ${person.name}`);

    // 뉴스 검색 (판결, 선고 관련)
    const newsItems = await searchNews(`${person.name} 판결 선고 재판`, 15);

    if (newsItems.length === 0) {
        console.log(`No news found for ${person.name}`);
        return null;
    }

    console.log(`Found ${newsItems.length} news items for ${person.name}`);

    // AI로 정보 추출 시도
    let verdictInfo = await extractVerdictInfo(person.name, newsItems);

    // AI 추출 실패 시 기본 데이터로 저장
    if (!verdictInfo) {
        console.log(`AI extraction failed for ${person.name}, saving basic news data`);

        // 뉴스 제목에서 판결 관련 키워드 확인
        const titles = newsItems.map(n => n.title).join(' ');
        const hasVerdictKeyword = /선고|판결|징역|무죄|유죄|구속|석방/.test(titles);

        verdictInfo = {
            hasVerdict: hasVerdictKeyword,
            verdictDate: null,
            status: null,
            verdict: null,
            charges: [],
            summary: newsItems.slice(0, 3).map(n => n.title).join(' | '),
            keyFacts: newsItems.slice(0, 5).map(n => n.title),
            trialStatus: null
        };
    }

    // Firestore에 저장 (기존 판결 데이터를 보호)
    const docRef = db.collection('sentencingData').doc(person.name);

    // 기존 문서 확인 — 이미 판결 데이터가 있으면 verdict/trialStatus/verdictDate를 null로 덮어쓰지 않음
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
        const existing = existingDoc.data();
        if (existing.verdictDate && !verdictInfo.verdictDate) {
            verdictInfo.verdictDate = existing.verdictDate;
        }
        if (existing.verdict && existing.verdict !== '재판 진행 중' && !verdictInfo.verdict) {
            verdictInfo.verdict = existing.verdict;
        }
        if (existing.trialStatus && existing.trialStatus !== '재판 진행 중' && !verdictInfo.trialStatus) {
            verdictInfo.trialStatus = existing.trialStatus;
        }
    }

    const data = {
        name: person.name,
        position: person.position,
        ...verdictInfo,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        newsCount: newsItems.length,
        recentNews: newsItems.slice(0, 5).map(n => ({
            title: n.title,
            link: n.link,
            pubDate: n.pubDate
        }))
    };

    await docRef.set(data, { merge: true });
    console.log(`Saved sentencing data for ${person.name}`);

    return data;
};

// 모든 인물 데이터 크롤링 (스케줄 함수)
exports.crawlAllSentencingData = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .pubsub.schedule('0 6,18 * * *') // 매일 오전 6시, 오후 6시
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        console.log('Starting scheduled sentencing data crawl...');

        const results = [];
        for (const person of SENTENCING_PERSONS) {
            try {
                const result = await crawlPersonSentencing(person);
                if (result) {
                    results.push({ name: person.name, success: true });
                } else {
                    results.push({ name: person.name, success: false });
                }
                // API 제한 방지를 위한 딜레이
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.error(`Error crawling ${person.name}:`, error);
                results.push({ name: person.name, success: false, error: error.message });
            }
        }

        console.log('Sentencing data crawl completed:', results);

        // 텔레그램 알림
        try {
            const successCount = results.filter(r => r.success).length;
            const now = new Date();
            const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
            const timestamp = Math.floor(now.getTime() / 1000);
            const telegramMsg = `📊 <b>[내란재판분석] ${dateStr} 소식</b>\n\n👉 https://siminbupjung-blog.web.app/sentencing-analysis?t=${timestamp}`;
            await sendTelegramMessage(GROUP_CHAT_ID, telegramMsg);
        } catch (e) {
            console.error('Telegram notification failed:', e);
        }

        return null;
    });

// 재판분석 페이지 SSR (OG 태그 - 텔레그램/카카오/페이스북 미리보기)
exports.sentencingAnalysisPage = functions.https.onRequest(async (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

    if (!isCrawler) {
        // query params 전달 (tab, person 등 상태 유지)
        const queryString = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
        const redirectUrl = `/?r=/sentencing-analysis${queryString}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
    const person = req.query.person ? decodeURIComponent(req.query.person) : null;
    const title = person
        ? `[재판분석] ${person} - ${dateStr}`
        : `[내란재판분석] ${dateStr} 소식`;
    const description = person
        ? `${person} 내란 재판 현황 및 AI 양형 예측 분석 - 시민법정`
        : '내란 관련 인물 재판 현황 및 판결 분석 - 시민법정';
    const imageUrl = 'https://siminbupjung-blog.web.app/ai%EC%96%91%ED%98%95%EC%98%88%EC%B8%A1.png';
    const pageUrl = person
        ? `https://siminbupjung-blog.web.app/sentencing-analysis?person=${encodeURIComponent(person)}`
        : 'https://siminbupjung-blog.web.app/sentencing-analysis';

    const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - 시민법정</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

    res.send(html);
});

// 개혁안 비교 페이지 SSR (OG 태그 - 텔레그램/카카오/페이스북 미리보기)
exports.reformAnalysisPage = functions.https.onRequest(async (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

    if (!isCrawler) {
        // query params 전달 (tab 등 상태 유지)
        const queryString = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
        const redirectUrl = `/?r=/reform-analysis${queryString}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });

    // 탭별 OG 태그 분기
    const urlObj = new URL(req.url, 'https://siminbupjung-blog.web.app');
    const tab = urlObj.searchParams.get('tab') || '';
    const BASE = 'https://siminbupjung-blog.web.app';

    let title, description, imageUrl, pageUrl;
    if (tab === 'prosecution-reform') {
        title = `[검찰개혁 심층분석] ${dateStr}`;
        description = '공소청법·중수청법 정부안 vs 김용민·박은정 의원안 비교, 핵심 쟁점, 국제 비교, AI 법안 위험도 분석';
        imageUrl = `${BASE}/${encodeURIComponent('검찰개혁심층분석')}.png`;
        pageUrl = `${BASE}/reform-analysis?tab=prosecution-reform`;
    } else if (tab === 'finland-reform') {
        title = `[핀란드식 사법개혁안] ${dateStr}`;
        description = '수사·기소 완전 분리, 참심제, 이중 감시 체계 - 핀란드 모델 벤치마킹 종합 사법개혁 법률안';
        imageUrl = `${BASE}/${encodeURIComponent('핀란드식사법개혁안')}.png`;
        pageUrl = `${BASE}/reform-analysis?tab=finland-reform`;
    } else {
        title = `[개혁안 비교] ${dateStr} 주요 소식`;
        description = '사법개혁 9대 영역별 정당·시민사회 입장 비교 - 시민법정';
        imageUrl = `${BASE}/${encodeURIComponent('사법개혁안비교')}.png`;
        pageUrl = `${BASE}/reform-analysis`;
    }

    const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - 시민법정</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

    res.send(html);
});

// 내란재판종합분석 페이지 SSR (OG 태그 - 텔레그램/카카오/페이스북 미리보기)
exports.trialAnalysisPage = functions.https.onRequest(async (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

    if (!isCrawler) {
        // query params 전달 (tab 등 상태 유지)
        const queryString = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
        const redirectUrl = `/?r=/trial-analysis${queryString}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
    const tab = req.query.tab || null;
    const TAB_TITLES = {
        simulation: '참심제 시뮬레이션',
        courts: '재판부별 분석',
        timeline: '타임라인',
        classAnalysis: '계급별 분석',
        legal: '법적 쟁점'
    };
    const tabTitle = tab && TAB_TITLES[tab] ? TAB_TITLES[tab] : null;
    const title = tabTitle
        ? `[내란재판종합분석] ${tabTitle} - ${dateStr}`
        : `[내란재판종합분석] 12.3 내란사건 참심제 시뮬레이션 - ${dateStr}`;
    const description = tabTitle
        ? `내란재판 ${tabTitle} - 내란 27명 피고인 판결 분석, AI 양형 예측 vs 참심제 시뮬레이션 비교 - 시민법정`
        : '내란 27명 피고인 판결 분석, AI 양형 예측 vs 참심제 시뮬레이션 비교, 사법살인 70년 역사와 참심제 도입 당위성 - 시민법정';
    const imageUrl = 'https://siminbupjung-blog.web.app/%EC%B0%B8%EC%8B%AC%EC%A0%9C%EC%8B%9C%EB%AE%AC%EB%A0%88%EC%9D%B4%EC%85%98.png';
    const pageUrl = tab
        ? `https://siminbupjung-blog.web.app/trial-analysis?tab=${tab}`
        : 'https://siminbupjung-blog.web.app/trial-analysis';

    const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - 시민법정</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

    res.send(html);
});

// 판사평가 페이지 SSR (OG 태그 - 텔레그램/카카오/페이스북 미리보기)
exports.judgeEvaluationPage = functions.https.onRequest(async (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

    if (!isCrawler) {
        const queryString = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
        const redirectUrl = `/?r=/judge-evaluation${queryString}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const title = '판사 평가 - 시민법정';
    const description = '내란 재판 담당 판사들의 판결 성향 - 사법정의평가';
    const imageUrl = 'https://siminbupjung-blog.web.app/ai%EC%9D%98%ED%8C%90%EC%82%AC%ED%8F%89%EA%B0%80.png';
    const pageUrl = 'https://siminbupjung-blog.web.app/judge-evaluation';

    const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

    res.send(html);
});

// 판사 slug → 한글명 매핑
const JUDGE_NAME_MAP = {
    'moon-hyungbae': '문형배', 'lee-misun': '이미선', 'jung-jeongmi': '정정미',
    'kim-hyungdu': '김형두', 'jung-gyeseon': '정계선', 'jung-hyungsik': '정형식',
    'cho-hanchang': '조한창', 'kim-sanghwan': '김상환', 'oh-youngjun': '오영준',
    'ma-eunhyuk': '마은혁', 'cho-heedae': '조희대', 'noh-taeark': '노태악',
    'lee-heunggu': '이흥구', 'cheon-daeyeop': '천대엽', 'oh-kyungmi': '오경미',
    'oh-sukjun': '오석준', 'seo-kyunghwan': '서경환', 'kwon-youngjun': '권영준',
    'eom-sangpil': '엄상필', 'shin-sukhee': '신숙희', 'noh-kyungpil': '노경필',
    'park-youngjae': '박영재', 'lee-sukyeon': '이숙연', 'ma-yongju': '마용주',
    'kim-bokhyung': '김복형', 'ji-gwiyeon': '지귀연', 'woo-insung': '우인성',
    'lee-jingwan': '이진관', 'ryu-kyungjin': '류경진', 'yoon-sungsik': '윤성식',
    'min-sungchul': '민성철', 'lee-donghyun': '이동현', 'lee-seungchul': '이승철',
    'cho-jingu': '조진구', 'kim-mina': '김민아', 'ma-sungyoung': '마성영',
    'park-wonjung': '박원정', 'myung-jaekwon': '명재권', 'jung-jaewook': '정재욱',
    'park-jungho': '박정호', 'lee-jungjae': '이정재', 'nam-sejin': '남세진',
};

// 개별 판사 페이지 SSR (OG 태그)
exports.judgeDetailPage = functions.https.onRequest(async (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

    // URL에서 판사 slug 추출 (/judge/woo-insung -> woo-insung)
    const judgeSlug = decodeURIComponent(req.path.split('/').pop() || '');
    const judgeName = JUDGE_NAME_MAP[judgeSlug] || judgeSlug;

    if (!isCrawler) {
        const queryString = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
        const redirectUrl = `/?r=/judge/${encodeURIComponent(judgeSlug)}${queryString}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const title = `${judgeName} 판사 평가 - 시민법정`;
    const description = `${judgeName} 판사의 판결 성향 - 사법정의평가`;
    const imageUrl = 'https://siminbupjung-blog.web.app/%EB%82%B4%EB%9E%80%EC%9E%AC%ED%8C%90%EB%B6%84%EC%84%9D.png?v=3';
    const pageUrl = `https://siminbupjung-blog.web.app/judge/${encodeURIComponent(judgeSlug)}`;

    const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

    res.send(html);
});

// ============================================
// 정적 페이지 SSR 헬퍼 (OG 태그 - SNS 미리보기)
// ============================================
const CRAWLER_REGEX = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i;
const DEFAULT_OG_IMAGE = 'https://siminbupjung-blog.web.app/og-image.jpg';

function createStaticPageHandler(route, title, description, imageUrl) {
    return functions.https.onRequest(async (req, res) => {
        const userAgent = req.get('User-Agent') || '';
        const isCrawler = CRAWLER_REGEX.test(userAgent);

        if (!isCrawler) {
            const queryString = req.url.includes('?') ? '&' + req.url.split('?')[1] : '';
            const redirectUrl = `/?r=${route}${queryString}`;
            return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
        }

        const pageUrl = `https://siminbupjung-blog.web.app${route}`;
        const ogImage = imageUrl || DEFAULT_OG_IMAGE;

        const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - 시민법정</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
        res.status(200).send(html);
    });
}

// 거버넌스 페이지
exports.governancePage = createStaticPageHandler(
    '/governance',
    '거버넌스 - 시민법정',
    '시민법정 의사결정 구조와 운영 체계 - 주권자사법개혁추진준비위원회'
);

// 유럽 참심제 비교분석 페이지
exports.europeJuryPage = createStaticPageHandler(
    '/europe-jury',
    '유럽 참심제 비교분석',
    '독일, 프랑스, 핀란드, 스웨덴 등 유럽 각국의 참심제 운영 현황 비교 분석',
    'https://siminbupjung-blog.web.app/%EC%9C%A0%EB%9F%BD%EC%B0%B8%EC%8B%AC%EC%A0%9C.png'
);

// 법률정보 검색 서비스
exports.caseSearchPage = createStaticPageHandler(
    '/case-search',
    '법률정보 검색 서비스',
    '판례, 법령, 헌재결정, 법률용어 등 법률정보를 검색하세요'
);

// 참심제 아카데미
exports.juryAcademyPage = createStaticPageHandler(
    '/jury-academy',
    '참심제 아카데미 - 시민법관 온라인 교육',
    '스웨덴·독일 모델 기반 시민법관 온라인 교육 프로그램. 입문 과정과 심화 과정을 통해 참심제의 기초부터 전문 지식까지 학습합니다.',
    'https://siminbupjung-blog.web.app/참심제아카데미.png'
);

// 참심제 모의재판 체험
exports.mockTrialPage = createStaticPageHandler(
    '/mock-trial',
    '참심제 모의재판 체험 - 시민법정',
    '시민법관이 되어 모의재판에 참여해보세요. 참심원으로서 직접 증거를 검토하고 판결에 참여하는 체험입니다.',
    'https://siminbupjung-blog.web.app/참심제모의재판체험.png'
);

// 후원 페이지
exports.donatePage = createStaticPageHandler(
    '/donate',
    '시민법정 후원',
    '사법개혁을 위한 시민법정 활동을 후원해 주세요'
);

// 사법부 네트워크 분석
exports.judicialNetworkPage = createStaticPageHandler(
    '/judicial-network',
    '사법부 네트워크 분석',
    '대한민국 사법부 인맥·학맥 네트워크 시각화 분석',
    'https://siminbupjung-blog.web.app/%EA%B4%80%EA%B3%84%EB%8F%84.png'
);

// 법률 데이터베이스
exports.lawDatabasePage = createStaticPageHandler(
    '/law-database',
    '법률 데이터베이스',
    '형법 조문, 판례, 헌재결정, 법률용어 검색'
);

// AI 법률 챗봇
exports.chatPage = createStaticPageHandler(
    '/chat',
    '시민법정 AI 법률 챗봇',
    '참심제·사법개혁에 관한 질문을 AI에게 물어보세요'
);

// 사법뉴스
exports.newsPage = createStaticPageHandler(
    '/news',
    '사법뉴스 - 시민법정',
    '대한민국 사법부 관련 최신 뉴스'
);

// 참심제 시뮬레이션 체험
exports.simulationPage = createStaticPageHandler(
    '/simulation',
    '참심제 체험 - 시민법정',
    '당신이 참심원이 되어 내란 사건을 판단해보세요. 시민이 참여하면 판결이 달라집니다.',
    'https://siminbupjung-blog.web.app/og-simulation.png'
);

// 판례 상세 페이지
exports.precedentDetailPage = functions.https.onRequest(async (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = CRAWLER_REGEX.test(userAgent);

    const caseId = decodeURIComponent(req.path.split('/').pop() || '');

    if (!isCrawler) {
        const redirectUrl = `/?r=/precedent/${encodeURIComponent(caseId)}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${redirectUrl}"><script>window.location.replace("${redirectUrl}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const title = caseId ? `판례 ${caseId}` : '판례 상세';
    const description = `${caseId} 판결 상세 정보 - 시민법정`;
    const pageUrl = `https://siminbupjung-blog.web.app/precedent/${encodeURIComponent(caseId)}`;

    const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - 시민법정</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${DEFAULT_OG_IMAGE}" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:site_name" content="시민법정" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />
  </head>
  <body>
    <h1>${title}</h1>
    <p>${description}</p>
  </body>
</html>`;

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600');
    res.status(200).send(html);
});

// 피고인-판사 judgeHistory 매핑 업데이트 유틸리티
const DEFENDANT_JUDGE_MAP = {
    '윤석열': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '김용현': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '조지호': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '이진우': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '곽종근': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '여인형': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '노상원': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '이관섭': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '김성훈': { judgeName: '지귀연', position: '서울중앙지방법원 형사합의34부 부장판사', court: '서울중앙지방법원' },
    '한덕수': { judgeName: '이진관', position: '서울중앙지방법원 형사합의33부 부장판사', court: '서울중앙지방법원' },
    '전성배': { judgeName: '이진관', position: '서울중앙지방법원 형사합의33부 부장판사', court: '서울중앙지방법원' },
    '김건희': { judgeName: '우인성', position: '서울중앙지방법원 형사합의27부 부장판사', court: '서울중앙지방법원' },
    '이상민': { judgeName: '류경진', position: '서울중앙지방법원 형사합의32부 부장판사', court: '서울중앙지방법원' },
};

exports.updateJudgeHistory = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        const defendant = safeDecodeKorean(req.query.defendant);
        const updateAll = req.query.all === 'true';

        try {
            const results = [];
            const targets = updateAll ? Object.keys(DEFENDANT_JUDGE_MAP) : (defendant ? [defendant] : []);

            if (targets.length === 0) {
                return res.status(400).json({ error: 'defendant 또는 all=true 파라미터 필요' });
            }

            for (const name of targets) {
                const judgeInfo = DEFENDANT_JUDGE_MAP[name];
                if (!judgeInfo) {
                    results.push({ name, status: 'skipped', reason: '매핑 없음' });
                    continue;
                }

                await db.collection('sentencingData').doc(name).set({
                    judgeHistory: {
                        judgeName: judgeInfo.judgeName,
                        position: judgeInfo.position,
                        court: judgeInfo.court,
                    }
                }, { merge: true });

                results.push({ name, status: 'updated', judge: judgeInfo.judgeName });
            }

            res.json({ success: true, results });
        } catch (error) {
            console.error('updateJudgeHistory error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 수동 트리거 (HTTP)
exports.triggerSentencingCrawl = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        // CORS 설정
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (!(await verifyAdmin(req, res))) return;

        const personName = req.query.person;

        try {
            if (personName) {
                // 특정 인물만 크롤링
                const person = SENTENCING_PERSONS.find(p => p.name === personName);
                if (!person) {
                    res.status(404).json({ error: '인물을 찾을 수 없습니다' });
                    return;
                }
                const result = await crawlPersonSentencing(person);
                res.json({ success: true, data: result });
            } else {
                // 전체 크롤링
                const results = [];
                for (const person of SENTENCING_PERSONS) {
                    try {
                        const result = await crawlPersonSentencing(person);
                        results.push({ name: person.name, success: !!result, data: result });
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (error) {
                        results.push({ name: person.name, success: false, error: error.message });
                    }
                }
                res.json({ success: true, results });
            }
        } catch (error) {
            console.error('Trigger sentencing crawl error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 특정 인물 데이터 조회 API
exports.getSentencingData = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        try {
            const personName = req.query.person;

            if (personName) {
                // 특정 인물 조회
                const doc = await db.collection('sentencingData').doc(personName).get();
                if (doc.exists) {
                    res.json({ success: true, data: doc.data() });
                } else {
                    res.status(404).json({ error: '데이터가 없습니다' });
                }
            } else {
                // 전체 목록 조회
                const snapshot = await db.collection('sentencingData').get();
                const data = {};
                snapshot.forEach(doc => {
                    data[doc.id] = doc.data();
                });
                res.json({ success: true, data });
            }
        } catch (error) {
            console.error('Get sentencing data error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// ============================================
// 개혁안 관련 뉴스 자동 수집
// ============================================

const REFORM_AREA_KEYWORDS = {
    'prosecution': {
        title: '검찰 조직 개편',
        keywords: ['중수청', '공소청', '검찰개혁', '수사사법관', '수사기소분리']
    },
    'supreme-court': {
        title: '대법원 구성',
        keywords: ['대법관 증원', '대법원 구성', '상고법원']
    },
    'law-distortion': {
        title: '법왜곡죄',
        keywords: ['법왜곡죄', '법관 책임']
    },
    'trial-appeal': {
        title: '재판소원제',
        keywords: ['재판소원', '재판소원제', '헌법소원']
    },
    'court-admin': {
        title: '법원행정처 개혁',
        keywords: ['법원행정처 개혁', '사법행정권']
    },
    'judge-personnel': {
        title: '법관 인사제도',
        keywords: ['법관 인사', '법조일원화', '법관 독립']
    },
    'citizen-trial': {
        title: '국민참여재판 확대',
        keywords: ['국민참여재판 확대', '참심제', '배심원']
    }
};

const collectReformAreaNews = async (areaId, areaConfig) => {
    console.log(`Collecting reform news for: ${areaConfig.title}`);

    let allNews = [];

    for (const keyword of areaConfig.keywords) {
        try {
            const news = await searchNews(keyword, 5);
            allNews = allNews.concat(news.map(item => ({
                ...item,
                keyword
            })));
        } catch (error) {
            console.error(`Search error for keyword "${keyword}":`, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 제목 기준 중복 제거
    const seen = new Set();
    allNews = allNews.filter(item => {
        const key = item.title.replace(/<[^>]*>/g, '').trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    if (allNews.length === 0) {
        console.log(`No news found for ${areaConfig.title}`);
        return null;
    }

    // 상위 5건 추출
    const topNews = allNews.slice(0, 5).map(item => ({
        title: item.title.replace(/<[^>]*>/g, '').trim(),
        link: extractRealUrl(item.link),
        pubDate: item.pubDate || '',
        description: (item.description || '').replace(/<[^>]*>/g, '').trim().slice(0, 200)
    }));

    // Gemini AI 요약
    let aiSummary = `${areaConfig.title} 관련 최신 뉴스 ${topNews.length}건`;
    if (genAI && topNews.length > 0) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const newsText = topNews.map(n => `- ${n.title}`).join('\n');
            const prompt = `다음은 "${areaConfig.title}" 관련 최신 뉴스 제목들입니다. 이 사법개혁 영역의 최근 동향을 1-2문장으로 간결하게 요약해주세요. 한국어로 작성하세요.\n\n${newsText}`;

            const result = await model.generateContent(prompt);
            aiSummary = result.response.text().trim();
        } catch (error) {
            console.error(`AI summary error for ${areaId}:`, error.message);
        }
    }

    // Firestore 저장
    const docRef = db.collection('reformNews').doc(areaId);
    const data = {
        areaId,
        areaTitle: areaConfig.title,
        news: topNews,
        aiSummary,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        newsCount: allNews.length,
        keywords: areaConfig.keywords
    };

    await docRef.set(data, { merge: true });
    console.log(`Saved ${topNews.length} news for ${areaConfig.title} (total found: ${allNews.length})`);

    return data;
};

// 매일 오전 9:10 (한국시간) 자동 실행
exports.collectReformNews = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .pubsub.schedule('10 6,18 * * *')
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        console.log('Starting reform news collection...');

        const results = [];
        for (const [areaId, config] of Object.entries(REFORM_AREA_KEYWORDS)) {
            try {
                const result = await collectReformAreaNews(areaId, config);
                results.push({ areaId, success: !!result });
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error collecting reform news for ${areaId}:`, error);
                results.push({ areaId, success: false, error: error.message });
            }
        }

        console.log('Reform news collection completed:', results);

        try {
            const successCount = results.filter(r => r.success).length;
            const now = new Date();
            const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
            const timestamp = Math.floor(now.getTime() / 1000);
            const telegramMsg = `📰 <b>[개혁안 비교] ${dateStr} 주요 소식</b>\n\n👉 https://siminbupjung-blog.web.app/reform-analysis?t=${timestamp}`;
            await sendTelegramMessage(GROUP_CHAT_ID, telegramMsg);
        } catch (e) {
            console.error('Telegram notification failed:', e);
        }

        return null;
    });

// 수동 개혁안 뉴스 수집 (관리자용)
exports.collectReformNewsManual = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (!(await verifyAdmin(req, res))) return;

        const areaId = req.query.area;

        try {
            if (areaId && REFORM_AREA_KEYWORDS[areaId]) {
                const result = await collectReformAreaNews(areaId, REFORM_AREA_KEYWORDS[areaId]);
                res.json({ success: true, area: areaId, newsCount: result?.news?.length || 0 });
            } else {
                const results = [];
                for (const [id, config] of Object.entries(REFORM_AREA_KEYWORDS)) {
                    try {
                        const result = await collectReformAreaNews(id, config);
                        results.push({ areaId: id, success: !!result, newsCount: result?.news?.length || 0 });
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        results.push({ areaId: id, success: false, error: error.message });
                    }
                }
                res.json({ success: true, results });
            }
        } catch (error) {
            console.error('Manual reform news collection error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// ============================================
// 판사별 판결 이력 크롤링
// ============================================

const JUDGES_TO_CRAWL = [
    { name: '우인성', position: '서울중앙지방법원 형사합의27부 부장판사' }
];

// AI로 판사 판결 사례 추출
const extractJudgeCases = async (judgeName, newsItems) => {
    if (!genAI || newsItems.length === 0) return null;

    try {
        const articlesToFetch = newsItems.slice(0, 5);
        const articleContents = [];

        for (const item of articlesToFetch) {
            const content = await fetchArticleContent(item.link);
            if (content) {
                articleContents.push({
                    title: item.title.replace(/<[^>]*>/g, ''),
                    content: content
                });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        let newsText;
        if (articleContents.length > 0) {
            newsText = articleContents.map(item =>
                `제목: ${item.title}\n본문: ${item.content}`
            ).join('\n\n---\n\n');
        } else {
            newsText = newsItems.map(item => {
                const title = item.title.replace(/<[^>]*>/g, '');
                const desc = item.description.replace(/<[^>]*>/g, '');
                return `제목: ${title}\n내용: ${desc}`;
            }).join('\n\n');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `다음은 "${judgeName}" 판사에 대한 뉴스 기사입니다. 기사에서 이 판사의 판결 사례, 논란, 여론 등을 추출해주세요.

뉴스 기사:
${newsText}

다음 JSON 형식으로만 응답해주세요:
{
    "cases": [
        {
            "year": "YYYY",
            "caseName": "사건명",
            "verdict": "판결 내용 (유죄/무죄, 형량 등)",
            "controversy": "논란이 있다면 요약, 없으면 null"
        }
    ],
    "publicOpinion": ["여론/비판 1", "여론/비판 2"],
    "recentNews": ["최신 뉴스 요약 1", "최신 뉴스 요약 2"],
    "tendencyAnalysis": "이 판사의 판결 성향 분석 (1-2문장)"
}

기사에 명시적으로 언급된 정보만 기입해주세요.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return null;
    } catch (error) {
        console.error('Judge case extraction error:', error);
        return null;
    }
};

// 판사 뉴스 크롤링
const crawlJudgeNews = async (judge) => {
    console.log(`Crawling judge data for: ${judge.name}`);

    const queries = [
        `${judge.name} 판사 판결`,
        `${judge.name} 부장판사 논란`,
        `${judge.name} 판사 재판`
    ];

    let allNewsItems = [];
    for (const query of queries) {
        const items = await searchNews(query, 10);
        allNewsItems = allNewsItems.concat(items);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 중복 제거 (제목 기준)
    const seen = new Set();
    allNewsItems = allNewsItems.filter(item => {
        const key = item.title.replace(/<[^>]*>/g, '').trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    console.log(`Found ${allNewsItems.length} unique news items for judge ${judge.name}`);

    if (allNewsItems.length === 0) return null;

    const judgeInfo = await extractJudgeCases(judge.name, allNewsItems);

    const docRef = db.collection('judgeData').doc(judge.name);
    const data = {
        name: judge.name,
        position: judge.position,
        ...judgeInfo,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        newsCount: allNewsItems.length,
        recentNewsLinks: allNewsItems.slice(0, 10).map(n => ({
            title: n.title.replace(/<[^>]*>/g, ''),
            link: n.link,
            pubDate: n.pubDate
        }))
    };

    await docRef.set(data, { merge: true });
    console.log(`Saved judge data for ${judge.name}`);
    return data;
};

// ============================================
// YouTube 자막 크롤링
// ============================================

// YouTube 동영상 검색 (YouTube 검색 페이지 직접 스크래핑)
const searchYouTubeVideos = async (query, maxResults = 5) => {
    try {
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAI%253D`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });

        const html = await response.text();

        // ytInitialData에서 비디오 ID 추출
        const videoIds = new Set();

        // 방법 1: ytInitialData JSON에서 추출
        const ytDataMatch = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
        if (ytDataMatch) {
            try {
                const videoIdMatches = ytDataMatch[1].match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g) || [];
                for (const m of videoIdMatches) {
                    const id = m.match(/"([a-zA-Z0-9_-]{11})"/);
                    if (id && videoIds.size < maxResults) {
                        videoIds.add(id[1]);
                    }
                }
            } catch (e) {
                console.log('ytInitialData parse error:', e.message);
            }
        }

        // 방법 2: HTML에서 직접 추출 (fallback)
        if (videoIds.size === 0) {
            const idRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
            let match;
            while ((match = idRegex.exec(html)) !== null && videoIds.size < maxResults) {
                videoIds.add(match[1]);
            }
        }

        console.log(`Found ${videoIds.size} YouTube videos for: ${query}`);
        return Array.from(videoIds);
    } catch (error) {
        console.error('YouTube search error:', error);
        return [];
    }
};

// YouTube 영상 정보 추출 (oEmbed API + 메타태그)
const fetchYouTubeVideoInfo = async (videoId) => {
    try {
        let title = '';
        let description = '';
        let channelName = '';

        // 1. oEmbed API로 기본 정보 (제목, 채널명)
        try {
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const oembedResponse = await fetch(oembedUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (oembedResponse.ok) {
                const oembedData = await oembedResponse.json();
                title = oembedData.title || '';
                channelName = oembedData.author_name || '';
            }
        } catch (e) {
            console.log(`oEmbed failed for ${videoId}:`, e.message);
        }

        // 2. 영상 페이지에서 설명 추출 (og:description 메타 태그)
        try {
            const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const pageResponse = await fetch(watchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept-Language': 'ko-KR,ko;q=0.9'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (pageResponse.ok) {
                const html = await pageResponse.text();

                // og:description에서 설명 추출
                const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/) ||
                                   html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"/);
                if (descMatch) {
                    description = descMatch[1]
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'");
                }

                // 제목이 없으면 og:title에서
                if (!title) {
                    const titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/) ||
                                       html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"/);
                    if (titleMatch) title = titleMatch[1];
                }

                // 채널명이 없으면 메타태그에서
                if (!channelName) {
                    const channelMatch = html.match(/"ownerChannelName"\s*:\s*"([^"]+)"/) ||
                                         html.match(/<link[^>]*itemprop="name"[^>]*content="([^"]*)"/) ;
                    if (channelMatch) channelName = channelMatch[1];
                }
            }
        } catch (e) {
            if (e.name !== 'AbortError') {
                console.log(`Page fetch failed for ${videoId}:`, e.message);
            }
        }

        if (!title) {
            console.log(`No info found for video: ${videoId}`);
            return null;
        }

        console.log(`Video info: ${videoId} - ${title} (${channelName})`);

        return {
            videoId,
            title,
            description: description.substring(0, 2000),
            channelName,
            viewCount: 0,
            duration: 0,
            transcript: null,
            url: `https://www.youtube.com/watch?v=${videoId}`
        };
    } catch (error) {
        console.error(`YouTube video info error for ${videoId}:`, error.message);
        return null;
    }
};

// YouTube에서 판사 관련 정보 크롤링
const crawlYouTubeForJudge = async (judgeName) => {
    console.log(`Crawling YouTube for judge: ${judgeName}`);

    const queries = [
        `${judgeName} 판사`,
        `${judgeName} 판결 논란`,
        `${judgeName} 부장판사`
    ];

    const allVideoIds = new Set();
    for (const query of queries) {
        const ids = await searchYouTubeVideos(query, 5);
        ids.forEach(id => allVideoIds.add(id));
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Total unique YouTube videos found: ${allVideoIds.size}`);

    const videoInfos = [];
    for (const videoId of allVideoIds) {
        const info = await fetchYouTubeVideoInfo(videoId);
        if (info) {
            videoInfos.push(info);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Got ${videoInfos.length} video infos out of ${allVideoIds.size} videos`);

    if (videoInfos.length === 0) return null;

    // AI로 영상 정보에서 판사 관련 정보 추출
    try {
        const videoText = videoInfos.map(v =>
            `[영상: ${v.title}] (채널: ${v.channelName}, 조회수: ${v.viewCount.toLocaleString()})\n설명: ${v.description}${v.transcript ? '\n자막: ' + v.transcript : ''}`
        ).join('\n\n---\n\n').substring(0, 15000);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `다음은 "${judgeName}" 판사에 대한 YouTube 영상 정보입니다. 영상 제목, 설명, 자막(있는 경우)에서 이 판사에 대한 평가, 비판, 분석 등을 추출해주세요.

영상 정보:
${videoText}

다음 JSON 형식으로만 응답해주세요:
{
    "mentions": [
        {
            "videoTitle": "영상 제목",
            "context": "이 판사가 언급된 맥락 요약 (1-2문장)",
            "sentiment": "긍정/부정/중립",
            "keyQuotes": ["인용문 1", "인용문 2"]
        }
    ],
    "overallSentiment": "전체적인 여론 평가 (1-2문장)",
    "controversies": ["논란 1", "논란 2"]
}

"${judgeName}"이 관련된 영상의 정보만 추출해주세요. 관련 없으면 mentions를 빈 배열로 두세요.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const youtubeData = JSON.parse(jsonMatch[0]);

            // Firestore에 저장
            const docRef = db.collection('judgeYouTubeData').doc(judgeName);
            await docRef.set({
                name: judgeName,
                ...youtubeData,
                videoCount: videoInfos.length,
                videos: videoInfos.map(v => ({
                    videoId: v.videoId,
                    title: v.title,
                    channelName: v.channelName,
                    viewCount: v.viewCount,
                    url: v.url,
                    hasTranscript: !!v.transcript
                })),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`Saved YouTube data for judge ${judgeName}`);
            return youtubeData;
        }
    } catch (error) {
        console.error('YouTube AI extraction error:', error);
    }

    return null;
};

// ============================================
// 국가법령정보 판례 API 연동
// ============================================

const crawlCourtCases = async (judgeName) => {
    console.log(`Crawling court cases for judge: ${judgeName}`);

    try {
        // 국가법령정보 판례 검색 API
        // API 키가 없으면 스킵
        const courtApiKey = process.env.COURT_API_KEY;
        if (!courtApiKey) {
            console.log('Court API key not configured, skipping court case crawl');
            console.log('Register at https://open.law.go.kr to get an API key');
            return null;
        }

        const searchUrl = `https://www.law.go.kr/DRF/lawSearch.do?OC=${courtApiKey}&target=prec&type=JSON&query=${encodeURIComponent(judgeName)}&display=20&sort=date`;

        const response = await fetch(searchUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error('Court API response error:', response.status);
            return null;
        }

        const data = await response.json();

        if (!data.PrecSearch || !data.PrecSearch.prec) {
            console.log(`No court cases found for ${judgeName}`);
            return null;
        }

        const cases = Array.isArray(data.PrecSearch.prec) ? data.PrecSearch.prec : [data.PrecSearch.prec];

        const parsedCases = cases.map(c => ({
            caseNumber: c['사건번호'] || c.사건번호 || '',
            caseName: c['사건명'] || c.사건명 || '',
            courtName: c['법원명'] || c.법원명 || '',
            verdictDate: c['선고일자'] || c.선고일자 || '',
            verdictType: c['판결유형'] || c.판결유형 || '',
            caseType: c['사건종류명'] || c.사건종류명 || '',
            link: c['판례상세링크'] || c.판례상세링크 || ''
        }));

        // Firestore에 저장
        const docRef = db.collection('judgeCourtCases').doc(judgeName);
        await docRef.set({
            name: judgeName,
            cases: parsedCases,
            totalCount: parsedCases.length,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Saved ${parsedCases.length} court cases for judge ${judgeName}`);
        return parsedCases;
    } catch (error) {
        console.error('Court API error:', error);
        return null;
    }
};

// ============================================
// 판사 데이터 통합 크롤링
// ============================================

// 스케줄 크롤링 (매일 새벽 3시)
exports.crawlAllJudgeData = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .pubsub.schedule('0 3 * * *')
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        console.log('Starting scheduled judge data crawl...');

        for (const judge of JUDGES_TO_CRAWL) {
            try {
                // 1. 뉴스 크롤링
                console.log(`[1/3] Crawling news for ${judge.name}...`);
                await crawlJudgeNews(judge);

                // 2. YouTube 크롤링
                console.log(`[2/3] Crawling YouTube for ${judge.name}...`);
                await crawlYouTubeForJudge(judge.name);

                // 3. 법원 판결문 크롤링
                console.log(`[3/3] Crawling court cases for ${judge.name}...`);
                await crawlCourtCases(judge.name);

                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error(`Error crawling judge ${judge.name}:`, error);
            }
        }

        console.log('Judge data crawl completed');
        return null;
    });

// 수동 트리거 (HTTP)
exports.triggerJudgeCrawl = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (!(await verifyAdmin(req, res))) return;

        const judgeName = req.query.judge || '우인성';
        const source = req.query.source; // 'news', 'youtube', 'court', or all

        try {
            const results = {};
            const judge = JUDGES_TO_CRAWL.find(j => j.name === judgeName) || { name: judgeName, position: '' };

            if (!source || source === 'news') {
                console.log('Crawling news...');
                results.news = await crawlJudgeNews(judge);
            }

            if (!source || source === 'youtube') {
                console.log('Crawling YouTube...');
                results.youtube = await crawlYouTubeForJudge(judgeName);
            }

            if (!source || source === 'court') {
                console.log('Crawling court cases...');
                results.court = await crawlCourtCases(judgeName);
            }

            res.json({ success: true, judge: judgeName, results });
        } catch (error) {
            console.error('Judge crawl error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 판사 데이터 조회 API
exports.getJudgeData = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        const judgeName = req.query.judge || '우인성';

        try {
            const [newsDoc, youtubeDoc, courtDoc] = await Promise.all([
                db.collection('judgeData').doc(judgeName).get(),
                db.collection('judgeYouTubeData').doc(judgeName).get(),
                db.collection('judgeCourtCases').doc(judgeName).get()
            ]);

            res.json({
                success: true,
                judge: judgeName,
                data: {
                    news: newsDoc.exists ? newsDoc.data() : null,
                    youtube: youtubeDoc.exists ? youtubeDoc.data() : null,
                    court: courtDoc.exists ? courtDoc.data() : null
                }
            });
        } catch (error) {
            console.error('Get judge data error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// ============================================
// 국가법령정보 OPEN API 프록시
// ============================================

exports.lawApi = functions.https.onRequest(async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const OC = process.env.LAWAPI_OC || 'lacoiffure828';
    const { target, query, type, display, page, search, MST, ID, sort } = req.query;

    if (!target) {
        res.status(400).json({ error: 'target parameter is required' });
        return;
    }

    try {
        const params = new URLSearchParams({ OC, target, type: type || 'JSON' });
        if (query) params.set('query', query);
        if (display) params.set('display', display);
        if (page) params.set('page', page);
        if (search) params.set('search', search);
        if (MST) params.set('MST', MST);
        if (ID) params.set('ID', ID);
        if (sort) params.set('sort', sort);

        const apiUrl = `https://www.law.go.kr/DRF/lawSearch.do?${params.toString()}`;
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' }
        });

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('json')) {
            const data = await response.json();
            res.json(data);
        } else {
            const text = await response.text();
            res.set('Content-Type', contentType);
            res.send(text);
        }
    } catch (error) {
        console.error('Law API proxy error:', error);
        console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
});

// ============================================
// 네이버 뉴스 검색 API
// ============================================

exports.searchNaverNews = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'query parameter is required' });
    }

    try {
        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;

        const response = await fetch(
            `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=5&sort=sim`,
            {
                headers: {
                    'X-Naver-Client-Id': clientId,
                    'X-Naver-Client-Secret': clientSecret
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Naver API error: ${response.status}`);
        }

        const data = await response.json();
        return res.json(data);
    } catch (error) {
        console.error('Naver News API error:', error);
        return res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// ========== 판결 자동 수집 시스템 ==========

// 판결 뉴스 키워드
const VERDICT_KEYWORDS = [
    '내란 선고', '내란 판결', '내란 1심', '내란 항소심',
    '내란수괴 판결', '내란중요임무종사 판결',
    '윤석열 판결', '김용현 판결', '한덕수 판결',
    '내란 징역', '내란 무죄', '내란 유죄', '내란 법정구속'
];

// AI로 판결 데이터 구조화
const extractStructuredVerdict = async (newsItems) => {
    if (!genAI || newsItems.length === 0) return [];

    try {
        const articlesToFetch = newsItems.slice(0, 8);
        const articleContents = [];

        for (const item of articlesToFetch) {
            const content = await fetchArticleContent(item.link);
            if (content) {
                articleContents.push({
                    title: item.title.replace(/<[^>]*>/g, ''),
                    content: content,
                    link: item.link,
                    pubDate: item.pubDate
                });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        let newsText;
        if (articleContents.length > 0) {
            newsText = articleContents.map(item =>
                `제목: ${item.title}\n출처: ${item.link}\n본문: ${item.content}`
            ).join('\n\n---\n\n');
        } else {
            newsText = newsItems.map(item => {
                const title = item.title.replace(/<[^>]*>/g, '');
                const desc = item.description?.replace(/<[^>]*>/g, '') || '';
                return `제목: ${title}\n내용: ${desc}`;
            }).join('\n\n');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `다음은 내란 재판 관련 최신 뉴스 기사입니다. 기사에서 새로운 판결/선고 정보를 찾아서 구조화된 JSON 배열로 추출해주세요.

뉴스 기사:
${newsText}

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이):
[
    {
        "date": "YYYY.MM.DD",
        "defendant": "피고인 이름",
        "court": "법원명 (예: 서울중앙지법 형사합의25부)",
        "judge": "재판장 이름 부장판사",
        "charge": "혐의명 (예: 내란수괴, 내란중요임무종사)",
        "sentence": "선고 형량 (예: 무기징역, 징역 30년, 무죄)",
        "prosecution": "구형 (예: 사형, 징역 30년)",
        "status": "convicted 또는 acquitted 또는 partial 또는 pending",
        "detail": "핵심 판결 내용 1-2문장",
        "source": "뉴스 URL"
    }
]

주의사항:
- 기사에 명시적으로 언급된 판결/선고 정보만 추출
- 이미 알려진 과거 판결이라도 기사에 언급되면 포함
- 판결이 없는 기사는 빈 배열 [] 반환
- 각 피고인별로 별도 항목으로 분리
- status는 반드시 convicted/acquitted/partial/pending 중 하나`;

        // 429 에러 대응: 최대 3회 재시도, 지수 백오프
        let result;
        let lastError;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                if (attempt > 0) {
                    const waitMs = Math.pow(2, attempt) * 5000; // 10s, 20s
                    console.log(`Retry ${attempt}/3 after ${waitMs}ms wait...`);
                    await new Promise(r => setTimeout(r, waitMs));
                }
                result = await model.generateContent(prompt);
                break;
            } catch (err) {
                lastError = err;
                if (err.status === 429 || err.message?.includes('429')) {
                    console.warn(`Rate limit hit (attempt ${attempt + 1}/3)`);
                    continue;
                }
                throw err;
            }
        }

        if (!result) {
            console.error('Verdict extraction failed after retries:', lastError?.message);
            return [];
        }

        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return [];
    } catch (error) {
        console.error('Verdict extraction error:', error);
        return [];
    }
};

// 1. 판결 자동 수집 (스케줄 + 수동 트리거)
exports.crawlVerdictData = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .pubsub.schedule('0 9 * * *')
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        console.log('Starting scheduled verdict data crawl...');

        const allNewsItems = [];
        for (const keyword of VERDICT_KEYWORDS) {
            try {
                const items = await searchNews(keyword, 10);
                allNewsItems.push(...items);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error(`Error searching "${keyword}":`, error);
            }
        }

        // 중복 제거 (제목 기준)
        const seen = new Set();
        const uniqueNews = allNewsItems.filter(item => {
            const title = item.title.replace(/<[^>]*>/g, '').trim();
            if (seen.has(title)) return false;
            seen.add(title);
            return true;
        });

        console.log(`Found ${uniqueNews.length} unique news items`);

        if (uniqueNews.length === 0) {
            console.log('No verdict news found');
            return null;
        }

        // AI로 구조화된 판결 데이터 추출
        const verdicts = await extractStructuredVerdict(uniqueNews);
        console.log(`Extracted ${verdicts.length} verdicts`);

        let savedCount = 0;
        for (const verdict of verdicts) {
            if (!verdict.defendant || !verdict.date) continue;

            // 중복 체크 (같은 피고인 + 같은 날짜)
            const existingSnap = await db.collection('insurrectionVerdicts')
                .where('defendant', '==', verdict.defendant)
                .where('date', '==', verdict.date)
                .get();

            if (existingSnap.empty) {
                await db.collection('insurrectionVerdicts').add({
                    ...verdict,
                    autoGenerated: true,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                savedCount++;
                console.log(`Saved new verdict: ${verdict.defendant} ${verdict.date}`);
            } else {
                console.log(`Skipped duplicate: ${verdict.defendant} ${verdict.date}`);
            }
        }

        // 텔레그램 알림 (새 판결이 있을 때만)
        if (savedCount > 0) {
            try {
                const now = new Date();
                const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
                const timestamp = Math.floor(now.getTime() / 1000);
                const telegramMsg = `⚖️ <b>[판결 자동 수집] ${dateStr}</b>\n\n새로운 판결 ${savedCount}건 감지\n\n👉 https://siminbupjung-blog.web.app/trial-analysis?t=${timestamp}`;
                await sendTelegramMessage(GROUP_CHAT_ID, telegramMsg);
            } catch (e) {
                console.error('Telegram notification failed:', e);
            }
        }

        console.log(`Verdict crawl completed. Saved ${savedCount} new verdicts.`);

        // ========== 통합 헬스체크 (모든 프로젝트 사이트 점검) ==========
        try {
            await runHealthCheck();
        } catch (e) {
            console.error('Health check failed:', e);
        }

        return null;
    });

// ========== 사이트 헬스체크 ==========
const HEALTH_CHECK_SITES = [
    { name: '시민법정', url: 'https://siminbupjung-blog.web.app' },
    { name: 'budget', url: 'https://budget.ai.kr' },
    { name: 'aitutorial', url: 'https://aitutorial.kr' },
    { name: 'election', url: 'https://election.re.kr' }
];

const runHealthCheck = async () => {
    console.log('Starting health check...');
    const results = [];

    for (const site of HEALTH_CHECK_SITES) {
        const result = { name: site.name, url: site.url, issues: [] };
        try {
            const startTime = Date.now();
            const response = await fetch(site.url, {
                redirect: 'follow',
                headers: { 'User-Agent': 'Mozilla/5.0 (HealthCheckBot)' }
            });
            const elapsed = Date.now() - startTime;

            result.status = response.status;
            result.responseMs = elapsed;

            if (response.status >= 400) {
                result.issues.push(`HTTP ${response.status} 에러`);
            } else if (elapsed > 10000) {
                result.issues.push(`응답 느림 (${(elapsed / 1000).toFixed(1)}초)`);
            }

            // HTML 본문에서 깨진 이미지 패턴 감지
            const html = await response.text();
            const imgMatches = html.match(/<img[^>]+src="([^"]+)"/g) || [];
            const externalImgs = imgMatches
                .map(tag => (tag.match(/src="([^"]+)"/) || [])[1])
                .filter(src => src && (src.startsWith('http://') || src.startsWith('https://')))
                .filter(src => !src.includes('data:'));

            // 외부 이미지 최대 5개만 샘플 체크 (시간 절약)
            const sampleImgs = externalImgs.slice(0, 5);
            let brokenCount = 0;
            for (const imgUrl of sampleImgs) {
                try {
                    const imgRes = await fetch(imgUrl, { method: 'HEAD' });
                    if (imgRes.status >= 400) brokenCount++;
                } catch {
                    brokenCount++;
                }
            }
            if (brokenCount > 0) {
                result.issues.push(`외부 이미지 ${brokenCount}/${sampleImgs.length}개 로드 실패`);
            }
        } catch (err) {
            result.status = 'ERROR';
            result.issues.push(`접속 불가: ${err.message?.substring(0, 100)}`);
        }
        results.push(result);
    }

    // 텔레그램 알림 — 문제가 있는 사이트만 보고
    const problemSites = results.filter(r => r.issues.length > 0);

    const dateStr = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul'
    });

    let telegramMsg;
    if (problemSites.length === 0) {
        telegramMsg = `🌅 <b>일일 헬스체크 정상 (${dateStr})</b>\n\n` +
            results.map(r => `✅ ${r.name} (${r.responseMs}ms)`).join('\n');
    } else {
        telegramMsg = `⚠️ <b>일일 헬스체크 — 문제 발견 (${dateStr})</b>\n\n` +
            results.map(r => {
                if (r.issues.length === 0) {
                    return `✅ ${r.name}`;
                }
                return `❌ <b>${r.name}</b>\n   ${r.issues.join('\n   ')}\n   ${r.url}`;
            }).join('\n\n');
    }

    try {
        await sendTelegramMessage(GROUP_CHAT_ID, telegramMsg);
        console.log('Health check telegram sent');
    } catch (e) {
        console.error('Health check telegram failed:', e);
    }

    return results;
};

// 헬스체크 수동 트리거 (테스트용)
exports.triggerHealthCheck = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 300, memory: '512MB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        try {
            const results = await runHealthCheck();
            res.json({ success: true, results });
        } catch (e) {
            console.error('Health check error:', e);
            res.status(500).json({ error: e.message });
        }
    });

// 판결 수동 크롤링 트리거
exports.triggerVerdictCrawl = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (!(await verifyAdmin(req, res))) return;

        try {
            const allNewsItems = [];
            for (const keyword of VERDICT_KEYWORDS) {
                const items = await searchNews(keyword, 10);
                allNewsItems.push(...items);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const seen = new Set();
            const uniqueNews = allNewsItems.filter(item => {
                const title = item.title.replace(/<[^>]*>/g, '').trim();
                if (seen.has(title)) return false;
                seen.add(title);
                return true;
            });

            const verdicts = await extractStructuredVerdict(uniqueNews);

            let savedCount = 0;
            for (const verdict of verdicts) {
                if (!verdict.defendant || !verdict.date) continue;

                const existingSnap = await db.collection('insurrectionVerdicts')
                    .where('defendant', '==', verdict.defendant)
                    .where('date', '==', verdict.date)
                    .get();

                if (existingSnap.empty) {
                    await db.collection('insurrectionVerdicts').add({
                        ...verdict,
                        autoGenerated: true,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    savedCount++;
                }
            }

            res.json({
                success: true,
                totalNews: uniqueNews.length,
                extractedVerdicts: verdicts.length,
                savedNew: savedCount,
                verdicts
            });
        } catch (error) {
            console.error('Trigger verdict crawl error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 2. AI 심층 분석 (관리자 트리거)
exports.analyzeVerdictWithAI = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (!(await verifyAdmin(req, res))) return;
        if (!checkRateLimit(req, res, 5)) return;

        const defendant = safeDecodeKorean(req.query.defendant);
        if (!defendant) {
            res.status(400).json({ error: 'defendant parameter required' });
            return;
        }

        try {
            // 뉴스 수집
            const newsItems = await searchNews(`${defendant} 내란 판결 선고 양형`, 15);
            if (newsItems.length === 0) {
                res.status(404).json({ error: 'No news found for ' + defendant });
                return;
            }

            // 기사 본문 수집
            const articleContents = [];
            for (const item of newsItems.slice(0, 5)) {
                const content = await fetchArticleContent(item.link);
                if (content) {
                    articleContents.push({ title: item.title.replace(/<[^>]*>/g, ''), content });
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const newsText = articleContents.length > 0
                ? articleContents.map(a => `제목: ${a.title}\n본문: ${a.content}`).join('\n\n---\n\n')
                : newsItems.map(n => `제목: ${n.title.replace(/<[^>]*>/g, '')}\n내용: ${n.description?.replace(/<[^>]*>/g, '') || ''}`).join('\n\n');

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const prompt = `"${defendant}"의 내란 재판 관련 뉴스를 분석하여 심층 양형 분석 데이터를 JSON으로 생성해주세요.

뉴스 기사:
${newsText}

다음 JSON 형식으로만 응답 (다른 텍스트 없이):
{
    "sentencingGuidelines": [
        {
            "crime": "혐의명 (법 조항 포함)",
            "standardRange": "양형기준 권고형",
            "aggravating": ["가중요소1", "가중요소2"],
            "mitigating": ["감경요소1"],
            "verdict": "실제 선고 결과",
            "analysis": "재판부 판단 요약"
        }
    ],
    "keyIssues": [
        {
            "title": "쟁점 제목",
            "description": "쟁점 상세 설명",
            "opinion": {
                "prosecution": "검찰 입장",
                "defense": "변호인 입장",
                "court": "법원 판단"
            }
        }
    ],
    "judgeHistory": {
        "judgeName": "재판장 이름",
        "position": "소속 직위",
        "recentCases": [
            {
                "caseName": "사건명",
                "year": "연도",
                "verdict": "판결",
                "detail": "상세"
            }
        ],
        "profile": "재판장 약력"
    }
}

기사에서 확인된 정보만 포함하세요.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                res.status(500).json({ error: 'AI analysis failed to produce JSON' });
                return;
            }

            const analysisData = JSON.parse(jsonMatch[0]);

            // sentencingData 컬렉션에 저장
            await db.collection('sentencingData').doc(defendant).set({
                name: defendant,
                sentencingGuidelines: analysisData.sentencingGuidelines || [],
                keyIssues: analysisData.keyIssues || [],
                judgeHistory: analysisData.judgeHistory || null,
                aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            res.json({ success: true, defendant, analysis: analysisData });
        } catch (error) {
            console.error('AI analysis error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 역사적 내란 사건 선례 데이터
const HISTORICAL_PRECEDENTS = {
    chundoohwan: {
        name: '전두환',
        year: 1996,
        charges: '내란수괴 (형법 제87조), 내란목적살인 (형법 제88조)',
        background: '1979년 12.12 군사반란으로 군권 장악 후 1980년 5.18 광주민주화운동 유혈진압. 1995년 "역사바로세우기" 특별법 제정으로 공소시효 문제 해결 후 재판 개시.',
        firstInstance: '사형 (1996년 8월 26일, 서울지방법원)',
        appeal: '무기징역 (1996년 12월 16일, 서울고등법원)',
        supremeCourt: '무기징역 확정 (1997년 4월 17일, 대법원)',
        finalResult: '1997년 12월 22일 특별사면 (김영삼 대통령, 김대중 대통령 당선자 합의)',
        aggravatingFactors: [
            '군사반란 및 내란의 최고 주도자(수괴)',
            '계엄군을 동원한 광주 시민 살상 명령',
            '헌정질서 파괴 및 국가 전복 행위',
            '대통령 권한 불법 찬탈'
        ],
        mitigatingFactors: [
            '항소심에서 내란목적살인 일부 감경',
            '사건 발생 후 16년 경과',
            '국민 화합 차원의 정치적 고려'
        ]
    },
    nohtaewoo: {
        name: '노태우',
        year: 1996,
        charges: '내란중요임무종사 (형법 제87조)',
        background: '12.12 군사반란 당시 9사단장으로서 핵심 전투부대를 동원하여 전두환의 군사반란을 적극 지원.',
        firstInstance: '징역 22년 6개월 (1996년 8월 26일)',
        appeal: '징역 17년 (1996년 12월 16일)',
        supremeCourt: '징역 17년 확정 (1997년 4월 17일)',
        finalResult: '1997년 12월 22일 특별사면',
        aggravatingFactors: [
            '군사반란의 핵심 실행자',
            '9사단 병력 동원으로 반란 성공에 결정적 기여',
            '내란 후 권력 핵심부 진입'
        ],
        mitigatingFactors: [
            '수괴가 아닌 중요임무종사자 지위',
            '전두환 대비 종속적 역할',
            '항소심에서 역할 재평가 (22년6월→17년)'
        ]
    },
    kimjaegyu: {
        name: '김재규',
        year: 1979,
        charges: '내란목적살인 (형법 제88조), 살인 (형법 제250조)',
        background: '1979년 10월 26일 중앙정보부장 김재규가 박정희 대통령과 차지철 경호실장을 사살한 10.26 사건. 김재규는 유신체제 종식과 민주화를 주장했으나, 법원은 내란목적살인으로 판단.',
        firstInstance: '사형 (1980년 5월 20일, 서울형사지방법원)',
        appeal: '없음 (대법원 직접 상고)',
        supremeCourt: '사형 확정 (1980년 5월 20일, 대법원 전원합의체)',
        finalResult: '1980년 5월 24일 사형 집행 (서울구치소)',
        aggravatingFactors: [
            '대통령 시해라는 극단적 행위',
            '국가 최고 통수권자 살해로 헌정질서 중대 침해',
            '계획적 범행 (사전 권총 준비, 연회 장소 선정)',
            '경호실장 등 다수 살상'
        ],
        mitigatingFactors: [
            '유신독재 종식 목적 주장 (법원 불인정)',
            '사건 직후 자수적 행위',
            '일부 국민의 민주화 열망과 연계'
        ]
    },
    leesukki: {
        name: '이석기',
        year: 2014,
        charges: '내란음모 (형법 제90조), 내란선동 (형법 제90조)',
        background: '통합진보당 국회의원 이석기가 2013년 5월 지하혁명조직(RO) 회합에서 북한의 대남전쟁 시 내란을 선동한 혐의. 국정원이 통신 감청으로 적발.',
        firstInstance: '징역 12년, 자격정지 10년 (2014년 2월 17일, 수원지방법원)',
        appeal: '징역 9년, 자격정지 7년 (2014년 8월 11일, 서울고등법원) - 내란음모 무죄, 내란선동만 유죄',
        supremeCourt: '징역 9년, 자격정지 7년 확정 (2015년 1월 22일, 대법원)',
        finalResult: '2021년 12월 31일 특별사면 (문재인 대통령)',
        aggravatingFactors: [
            '현직 국회의원의 내란 관련 범죄',
            '지하혁명조직(RO) 활용한 조직적 범행',
            '실제 전쟁 대비 구체적 행동 지침 전달',
            '국가안보에 대한 중대한 위협'
        ],
        mitigatingFactors: [
            '항소심에서 내란음모 무죄 (구체적 실행계획 부재)',
            '실제 폭동이나 무력행사에 이르지 않음',
            '발언의 구체적 실현가능성 낮음'
        ]
    }
};

// 프론트엔드 양형 데이터 (정적 데이터 통합)
const FRONTEND_SENTENCING_DATA = {
    '윤석열': {
        position: '대통령 (직무정지)',
        charges: '내란수괴 (형법 제87조), 특수공무집행방해 등',
        prosecutionRequest: '내란수괴: 사형 구형 + 특수공무집행방해 등: 징역 10년 구형',
        verdict: '내란수괴: 무기징역 (2026.2.19) + 체포방해 등: 징역 5년 (2026.1.16)',
        ratio: '사형→무기징역 (감경)',
        sentencingGuidelines: {
            aggravating: ['범행을 주도적으로 계획·지시', '국회 기능 마비 시도', '대통령으로서 헌법 수호 의무 중대 위반', '재판 출석 거부 및 반성 부재', '막대한 사회적 비용 초래'],
            mitigating: ['계엄이 수시간 만에 해제', '실질적 인명 피해 없음']
        },
        pendingTrials: [
            '일반이적 (형법 제93조) - 평양 무인기 대북전단 살포로 북한 도발 유도 (비공개 증인신문 중)',
            '위증 (형법 제152조) - 채상병 수사외압 사건',
            '채상병 수사외압·은폐 (직권남용)',
            '이종섭 범인도피교사',
            '명태균 게이트',
            '20대 대선 허위사실공표 (공직선거법)'
        ],
        uncharged: [
            '외환유치 (형법 제92조, 사형/무기) - 북한과의 통모 입증 어려움으로 미기소, 일반이적으로 대체',
            '여적 (형법 제93조, 사형 단일형) - 북한과 직접 합세 증거 부재',
            '내란목적살인예비 (형법 제88조) - 노상원 수첩 500명 살해 계획, 노상원만 피의자 전환'
        ],
        verdictOmissions: [
            '노상원 수첩 증거능력 배척 - "작성 시기 불명확, 내용 사실 불일치, 형태·보관 조악"',
            '계엄 모의 시점 축소 - 특검 주장 2023년부터 vs 재판부 인정 2024.12.1 무렵',
            '외환죄(일반이적) 별도 재판으로 분리 - 내란+외환 병합 시 양형 가중 가능했음',
            '내란목적살인예비 미적용 - 수첩 배척으로 폭력성·계획성 과소평가 비판'
        ]
    },
    '김용현': {
        position: '전 국방부 장관',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '무기징역 (특검 구형)',
        verdict: '징역 30년 (2026.2.19 선고)',
        ratio: '무기징역→30년 (감경)',
        sentencingGuidelines: {
            aggravating: ['비상계엄을 주도적으로 준비', '부정선거 수사 등 독단적 계획 수립', '대통령의 비이성적 결심 조장', '안가회동 5회 주도 (2024.11.29~12.3) — 체포명단 14명 배포', '롯데리아 회동 주관 (군·정보 라인 사전 모의)', '군·경찰 양면 동원 총괄 (김용현→박안수→곽종근/이진우 + 김용현→조지호 라인)'],
            mitigating: ['내란수괴가 아닌 종사자 지위']
        },
        pendingTrials: ['일반이적 (형법 제93조) - 평양 무인기 사건 공동 피고인']
    },
    '한덕수': {
        position: '전 국무총리',
        charges: '내란중요임무종사 (형법 제87조), 허위공문서 작성, 대통령기록물법 위반, 위증',
        prosecutionRequest: '징역 15년 (특검 구형)',
        verdict: '징역 23년, 법정구속 (2026.1.21)',
        ratio: '구형의 약 1.5배 (8년 초과)',
        sentencingGuidelines: {
            aggravating: ['국무총리 직위의 중대성', '헌법 수호 의무 위반', '국헌문란 목적 내란 가담', '"위로부터의 내란"에 합류'],
            mitigating: ['직접 병력 동원은 아님']
        }
    },
    '이상민': {
        position: '전 행정안전부 장관',
        charges: '내란중요임무종사 (형법 제87조), 위증',
        prosecutionRequest: '징역 15년 (특검 구형)',
        verdict: '징역 7년 (직권남용 무죄) (2026.2.12)',
        ratio: '구형의 47%',
        sentencingGuidelines: {
            aggravating: ['국가 존립 위태롭게 함', '장관급 고위직 가담'],
            mitigating: ['직접 실행행위 아닌 지시 전달']
        }
    },
    '김건희': {
        position: '대통령 배우자',
        charges: '도이치모터스 주가조작 (자본시장법 위반), 정치자금법 위반, 알선수재',
        prosecutionRequest: '징역 15년, 벌금 20억원, 추징금 9억 4,800만원 (특검 구형)',
        verdict: '징역 1년 8개월, 추징금 1,281만 5,000원 (주가조작·정치자금법 무죄) (2026.1.28)',
        ratio: '구형의 약 1/9 수준',
        sentencingGuidelines: {
            aggravating: ['공무원 배우자 지위 이용', '금품 수수', '반복적 범행', '검찰 수사 무마 개입 의혹'],
            mitigating: ['초범', '공동정범 요건 불성립(주가조작)', '명태균 진술 신빙성 부족(정치자금)']
        },
        doichiMotors: {
            description: '2009-2012년 권오수 회장 일당 91명 명의 157개 계좌 동원, 주가 2000원대→8000원 조작',
            kimRole: '2010년부터 2년간 주가조작 일당과 공모, 8억 1000만원 부당이득 혐의',
            mainCulpritsVerdict: '2025.4.3 대법원 전원 유죄 확정 (권오수: 징역 3년 집행유예 4년)',
            firstTrialResult: '2026.1.28 주가조작 무죄 (공동정범 요건 불성립, 방조해도 공소시효 완성)'
        },
        prosecutorCorruption: {
            description: '검찰의 조직적 수사 무마 및 증거 인멸 의혹',
            suspects: ['박성재 전 법무부장관', '심우정 전 검찰총장', '이창수 전 서울중앙지검장'],
            evidence: [
                '2024.10 김건희 도이치모터스·디올백 무혐의·불기소 처분',
                '특검 서울중앙지검 압수수색 시 담당자 컴퓨터 데이터 완전 삭제(디가우징) 발견',
                '디가우징으로 포렌식 복원 불가능',
                '김건희→박성재 메시지: "내 수사는 어떻게 되고 있느냐"'
            ]
        },
        pendingTrials: [
            '도이치모터스 주가조작 항소심 (특검 항소)',
            '정치자금법 위반 항소심'
        ]
    },
    '조지호': {
        position: '전 경찰청장',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '징역 20년 (특검 구형)',
        verdict: '징역 12년 (2026.2.19 선고)',
        ratio: '구형의 60%',
        sentencingGuidelines: {
            aggravating: ['경찰청장으로서 포고령 위법성 미검토', '군의 국회 진입 조력', '국회의원 출입 차단 지시'],
            mitigating: ['상급자 지시에 따른 측면']
        }
    },
    '김봉식': {
        position: '전 서울경찰청장',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '징역 15년 (특검 구형)',
        verdict: '징역 10년 (2026.2.19 선고)',
        ratio: '구형의 67%',
        sentencingGuidelines: {
            aggravating: ['서울경찰청장으로서 국회 봉쇄 가담', '안가회동 문건 수령', '포고령 위법성 미검토'],
            mitigating: ['상급자 지시에 따른 측면', '직접 군사작전 지휘는 아님']
        }
    },
    '노상원': {
        position: '전 국군정보사령관 (예비역, 민간인)',
        charges: '내란중요임무종사 (형법 제87조), 내란목적살인예비',
        prosecutionRequest: '징역 30년 (내란 본건)',
        verdict: '징역 18년 (2026.2.19 선고) + 별건 징역 2년',
        ratio: '구형의 60%',
        sentencingGuidelines: {
            aggravating: ['계엄 사전 모의 핵심 참여 — 22회 대통령 공관 방문', '포고령 초안 작성 및 USB 전달', '선관위 침입 지휘 (문상호 통해 중간 연결)', '체포·살해 명단 수첩 기록 (70페이지)', '예비역 민간인이면서 현역 장성급 역할 수행'],
            mitigating: ['예비역 민간인으로서 직접 지휘권 부재']
        },
        notebook: {
            description: '70페이지 수기 메모 — "계엄의 스모킹건"',
            content: [
                '500명 체포(수거) 대상 명단: 문재인, 이재명, 조국, 유시민, 이준석, 김제동 등 (A~D등급 분류)',
                '살해 방법: "이송 중 사고", "막사 폭발물", "확인사살", "외부업체 어뢰 공격"',
                '수용 장소: 연평도, 울릉도, 마라도, 민통선(오음리, 현리, 인제, 화천, 양구)',
                'NLL 북한 공격 유도: "외부 용역업체 미리/어뢰 공격", "북에 나포 직전 격침"',
                '3선 개헌 계획, 중국·러시아 선거제도 연구, 전국민 출국 금지 검토'
            ],
            evidenceStatus: '1심 증거능력 배척 (지귀연 재판부), 항소심 재검토 가능'
        }
    },
    '목현태': {
        position: '전 서울경찰청 국회경비대장',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '징역 12년 (특검 구형)',
        verdict: '징역 3년 (2026.2.19 선고)',
        ratio: '구형의 25%',
        sentencingGuidelines: {
            aggravating: ['국회경비대장으로서 국회의원 출입 차단 지시', '계엄해제 의결 방해'],
            mitigating: ['하급자로서 독자적 판단 여지 제한']
        }
    },
    '여인형': {
        position: '전 국군방첩사령관',
        charges: '내란중요임무종사 (형법 제87조), 일반이적 (형법 제99조)',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (2026.2.11 첫 공판, 혐의 전면 부인)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['방첩사령관으로서 계엄 핵심 모의 참여', '김용현→여인형 라인 — 방첩사 체포조 운영 지휘', '일반이적(외환죄) 추가 기소 — 평양 무인기 침투로 북한 도발 유도', '계엄 명분 마련 목적의 대북 도발 기획', '국방부 파면 징계 (2025.12.29)'],
            mitigating: ['혐의 전면 부인', '상급자(대통령) 지시에 따른 측면']
        }
    },
    '문상호': {
        position: '전 국군정보사령관',
        charges: '내란중요임무종사 (형법 제87조), 군사기밀누설, 직권남용',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['정보사 요원 30여명 개인정보를 민간인(노상원)에게 전달', '선관위 침투 라인: 김용현→노상원→문상호→정보사 요원', '선관위 직원 체포·감금 계획 지휘', '"포승줄로 묶고 복면 씌워 수방사 벙커로 이송" 지시', '롯데리아 회동 참석 — 사전 모의 가담', '군사기밀 누설 추가 혐의', '국방부 파면 징계 (2026.1.2)'],
            mitigating: ['상급자 지시에 따른 측면']
        }
    },
    '박안수': {
        position: '전 육군참모총장 (계엄사령관)',
        charges: '내란중요임무종사 (형법 제87조), 직권남용',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (서울중앙지법 이송 요청 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['계엄사령관으로서 불법 계엄 포고령 발령', '군 동원 명령 체계 중간 지휘자 (김용현→박안수→곽종근/이진우)', '국회에 특전사·707특수임무단 등 무장 병력 투입 지휘', '위헌적 포고령으로 정당·국회 활동 금지', '국회 권능 행사 방해 총괄 지휘'],
            mitigating: ['상급자(대통령) 지시에 의한 측면']
        }
    },
    '이진우': {
        position: '전 수도방위사령관',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (2026.2.11 첫 공판, 혐의 부인)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['수방사 병력 약 3,300명 동원하여 국회 봉쇄', '"국회의원을 끌어내라" 지시 수행 의혹', '윤석열 대통령 직접 전화로 "빨리하라" 독촉 — 명령 체계 직접 연결', '탄핵심판 위증 혐의 추가 (2026.2.13 경찰 소환)', '국방부 파면 징계 (2025.12.29)'],
            mitigating: ['혐의 부인', '수방사 목적이 "외부 위협 방어 및 질서 유지"라고 주장']
        }
    },
    '곽종근': {
        position: '전 육군특수전사령관',
        charges: '내란중요임무종사 (형법 제87조), 직권남용',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['특전사 부대를 직접 이끌고 국회 진입 지시', '명령 체계: 김용현→박안수→곽종근 라인', '대통령 통화 이전에 이미 1공수여단장에게 "문 부수고 의원 끌어내라" 지시', '롯데리아 회동 참석 — 사전 모의 가담', '국회 주권 직접 침해'],
            mitigating: ['상급자 지시에 따른 측면', '증언 일관성 문제']
        }
    },
    '추경호': {
        position: '국민의힘 전 원내대표',
        charges: '내란중요임무종사 (형법 제87조)',
        prosecutionRequest: '미정 (2026.3.25 첫 정식재판 예정)',
        verdict: '미선고 (불구속 기소, 구속영장 기각)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['국회 계엄 해제 표결 방해', '긴급 의원총회 장소 변경으로 의원 소집 지연'],
            mitigating: ['불구속 상태', '직접 병력 동원은 아님']
        }
    },
    '박성재': {
        position: '전 법무부 장관',
        charges: '내란중요임무종사 (형법 제87조), 직권남용, 청탁금지법 위반',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (불구속 기소, 주 2회 재판 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['12.4 안가회동(삼청동 안전가옥) 참석', '계엄 선포 후 검사 파견 및 구치소 수용 공간 확보 지시', '서울권 구치소 3,600명 추가 수용 공간 확보 지시', '전시 경미범 임시 가석방 제도 언급 (전시 아닌데 전시 제도 적용 시도)', '김건희 수사 무마 의혹 (도이치모터스 불기소 당시 지휘부)'],
            mitigating: ['불구속 상태', '직접 병력 동원은 아님']
        }
    },
    '조태용': {
        position: '전 국가정보원장',
        charges: '직무유기, 국정원법 위반 (정치 중립 위반)',
        prosecutionRequest: '미정 (재판 진행 중)',
        verdict: '미선고 (구속 기소, 2026.2.4 첫 공판 혐의 전면 부인)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['계엄 선포 계획 알고도 국회 정보위에 미보고', '국민의힘에만 CCTV 영상 선별 제공 (정치 중립 위반)', '홍장원 1차장으로부터 이재명·한동훈 체포 계획 들었으나 침묵'],
            mitigating: ['혐의 전면 부인 ("상상에 기반한 기소")', '직접 내란 실행행위는 아님']
        }
    },
    '김주현': {
        position: '전 대통령실 민정수석',
        charges: '직권남용권리행사방해 (형법 제123조), 내란 방조 수사 중 (형법 제87조, 제32조)',
        prosecutionRequest: '직권남용 재판 진행 중 + 내란 방조 수사 중',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['12.4 안가회동 참석 — 계엄 사후 수습 논의', '계엄선포문 사후 작성 관여 — 계엄의 졸속성 증거', '헌법재판관 3인 졸속 지명 — 탄핵심판 영향력 확보 시도', '대통령 핵심 법률 참모로서 내란 법적 기반 마련'],
            mitigating: ['직접적 내란 실행 행위 아님', '불구속 상태', '대통령 지시에 따른 업무 수행']
        }
    },
    '이완규': {
        position: '전 법제처장',
        charges: '위증 (국회증언감정법), 내란 방조 수사 중 (형법 제87조, 제32조)',
        prosecutionRequest: '위증 재판 진행 중 + 내란 방조 수사 중',
        verdict: '미선고 (재판 진행 중)',
        ratio: '미선고',
        sentencingGuidelines: {
            aggravating: ['12.4 안가회동 참석 — 법률적 뒷받침 역할', '법제처장으로서 비상계엄의 법적 정당성 자문 의혹', '국회 법사위 위증 — 안가회동 참석 사실 허위 진술', '윤석열 사법연수원 25기 동기 — 핵심 법률 측근'],
            mitigating: ['직접적 내란 실행 행위 아님', '불구속 상태']
        }
    },
    '윤승영': {
        position: '전 경찰청 국수본 수사기획조정관 (치안정감)',
        charges: '내란중요임무종사 (형법 제87조), 직권남용권리행사방해',
        prosecutionRequest: '불구속 기소 (2025.2.28)',
        verdict: '무죄 (2026.2.19 선고)',
        ratio: '무죄 (내란죄·직권남용 모두 무죄)',
        sentencingGuidelines: {
            aggravating: ['방첩사 체포조 편성 시 경찰 인력 지원 중간 보고·조정', '조지호 청장에게 보고 후 승인 받아 체포조 지원 가담'],
            mitigating: ['비상계엄 매뉴얼에 따른 합동수사단 지원으로 오인 — 재판부 수용', '체포 대상을 정치인이 아닌 포고령 위반 사범으로 인식', '국회 활동 저지·마비 목적 공유 증거 부족', '명령 전달자(중간 실무급)로서 범의 불인정']
        }
    },
    '전성배': {
        position: '건진법사 (승려)',
        charges: '알선수재 (특정범죄가중처벌법), 정치자금법 위반',
        prosecutionRequest: '징역 5년, 추징금 1억 8,079만원',
        verdict: '징역 6년, 추징금 1억 8,079만원, 그라프 목걸이 몰수 (2026.2.24)',
        ratio: '구형 120% (구형 초과 선고)',
        sentencingGuidelines: {
            aggravating: ['김건희와의 공모로 대통령 배우자 영향력 이용한 알선', '반복적·상습적 알선수재 약 3년간', '수수 금품 약 2억 8천만원 상당 (특가법)', '정교유착 초래 — 헌법상 정교분리 원칙 위반', '고가 명품으로 수수하여 뇌물 은폐 의도'],
            mitigating: ['내란 직접 가담 아님 (알선수재 별건)', '정치자금법 위반 혐의 1심 무죄', '통일교 측의 적극적 로비가 범행 유발']
        },
        isInsurrection: false
    },
    '정진석': {
        position: '전 대통령비서실장',
        charges: '증거인멸 (형법 제155조), 대통령기록물관리법 위반, 직권남용 (형법 제123조)',
        prosecutionRequest: '미정 (수사 및 기소 단계)',
        verdict: '재판 진행 중',
        ratio: '미정',
        sentencingGuidelines: {
            aggravating: ['대통령비서실장으로서 헌정질서 수호 의무 위반', 'PC 약 1000대 초기화 지시 대규모 증거인멸', '대통령기록물 무단 반출', '헌법재판관 졸속 지명 과정 주도', '비상계엄 직후 핵심 참모로서 사후 수습 관여'],
            mitigating: ['불구속 상태 도주 우려 낮음', '직접적 내란 실행행위 아닌 사후 증거인멸 혐의', '대통령 지시에 따른 업무 수행 주장']
        },
        isInsurrection: false
    }
};

// AI 양형 예측 함수
exports.predictSentencingWithAI = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        // CORS 헤더
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        if (!(await verifyAdmin(req, res))) return;
        if (!checkRateLimit(req, res, 5)) return;

        const defendant = safeDecodeKorean(req.query.defendant || req.body?.defendant);
        if (!defendant) {
            return res.status(400).json({ error: '피고인 이름(defendant)을 지정해주세요.' });
        }

        try {
            // 1. 기존 sentencingData에서 피고인 정보 조회
            const existingDoc = await db.collection('sentencingData').doc(defendant).get();
            const existingData = existingDoc.exists ? existingDoc.data() : {};

            // 2. 이미 선고된 공범 데이터 조회
            const verdictsSnap = await db.collection('insurrectionVerdicts').get();
            const codefendantVerdicts = verdictsSnap.docs
                .map(d => d.data())
                .filter(v => v.status === 'convicted' && v.defendant !== defendant)
                .map(v => `${v.defendant}: ${v.charge} → ${v.sentence} (${v.court}, ${v.date})`)
                .join('\n');

            // 2.5. 정적 양형 데이터 조회 (뉴스 검색 조건 분기에 필요)
            const staticData = FRONTEND_SENTENCING_DATA[defendant];

            // 3. 최신 뉴스 수집
            const isInsurrectionCase = staticData ? (staticData.isInsurrection !== false) : true;
            const newsQueries = isInsurrectionCase ? [
                `${defendant} 내란 재판 양형`,
                `${defendant} 내란 구형 판결`,
                `${defendant} 내란 선고`
            ] : [
                `${defendant} 재판 양형 선고`,
                `${defendant} 구형 판결`,
                `${defendant} ${existingData.position || staticData?.position || ''} 재판`
            ];

            let allNews = [];
            for (const query of newsQueries) {
                try {
                    const news = await searchNews(query, 10);
                    allNews = allNews.concat(news);
                } catch (e) { /* 뉴스 검색 실패 무시 */ }
                await new Promise(r => setTimeout(r, 500));
            }

            // 중복 제거
            const seen = new Set();
            allNews = allNews.filter(item => {
                const key = item.title?.replace(/\s/g, '');
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            // MSN 필터링 (JavaScript 렌더링 필요, 본문 추출 불가)
            allNews = allNews.filter(item => {
                const url = item.link || '';
                return !url.includes('msn.com');
            });

            // 신뢰 출처 우선 정렬
            const trustedDomains = ['yna.co.kr', 'hani.co.kr', 'khan.co.kr', 'news1.kr', 'ytn.co.kr', 'sbs.co.kr', 'kbs.co.kr', 'mbc.co.kr', 'joongang.co.kr', 'donga.com', 'chosun.com', 'hankyung.com', 'mk.co.kr', 'lawtimes.co.kr', 'lec.co.kr'];
            allNews.sort((a, b) => {
                const aUrl = a.link || '';
                const bUrl = b.link || '';
                const aTrusted = trustedDomains.some(d => aUrl.includes(d)) ? 0 : 1;
                const bTrusted = trustedDomains.some(d => bUrl.includes(d)) ? 0 : 1;
                return aTrusted - bTrusted;
            });

            // 4. 기사 본문 추출 (상위 5개)
            let newsText = '';
            const topNews = allNews.slice(0, 5);
            for (const item of topNews) {
                try {
                    const content = await fetchArticleContent(item.link);
                    if (content) {
                        newsText += `[${item.title}]\n${content.substring(0, 1000)}\n\n`;
                    }
                } catch (e) { /* 본문 추출 실패 무시 */ }
                await new Promise(r => setTimeout(r, 300));
            }

            if (!newsText && topNews.length > 0) {
                newsText = topNews.map(n => `[${n.title}] ${n.description || ''}`).join('\n');
            }

            // 5. 피고인 혐의/구형 정보 구성
            const chargesInfo = existingData.charges
                ? existingData.charges.map(c => `- ${c.name} (${c.law}): 구형 ${c.prosecutionRequest || '미정'}`).join('\n')
                : '혐의 정보 없음';

            const prosecutionTotal = existingData.summary?.prosecutionTotal || '미정';

            // 6. (staticData already loaded in step 2.5)

            // 7. 3단계 AI 분석 파이프라인
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            // === Step 1: 법률 분석 (Legal Framework) ===
            const legalFramework = isInsurrectionCase ? `## ⚖️ 내란죄 관련 법정형 체계 (반드시 준수)

### 형법 제87조 (내란) - 국헌문란 목적 폭동
1호. **내란수괴**: 사형·무기징역·무기금고 → 법정 최고형: 사형, 법정 최저형: 무기징역/무기금고 (유기징역 선택지 없음)
2호. **내란중요임무종사** (모의참여·지휘·중요임무종사·살인파괴 실행자): 사형·무기 또는 5년 이상의 징역이나 금고
3호. **부화수행·단순관여**: 5년 이하의 징역 또는 금고

### 형법 제88조 (내란목적살인)
내란 목적으로 사람을 살해한 자: 사형·무기 또는 7년 이상의 징역

### 형법 제89조 (미수범)
내란죄의 미수범은 처벌 (법정형 기수범과 동일)

### 형법 제90조 (예비·음모·선전·선동)
내란 예비·음모: 3년 이상의 유기징역·유기금고
내란 선전·선동: 동일

### 형법 제91조 (국헌문란의 정의)
1호. 헌법 또는 법률에 정한 절차에 의하지 아니하고 헌법 또는 법률의 기능을 소멸시키는 것
2호. 헌법에 의하여 설치된 국가기관을 강압에 의하여 전복 또는 그 권능행사를 불가능하게 하는 것

### 외환죄 관련 법정형 체계 (별도 재판 진행 중인 혐의)
- 형법 제92조 (외환유치): 사형 또는 무기징역 — 외국과 통모하여 전단을 열게 하는 행위
- 형법 제93조 (여적): 사형(단일형, 형법상 유일) — 적국과 합세하여 항적
- 형법 제99조 (일반이적): 무기 또는 3년 이상 징역 — 군사상 이익을 해하거나 적국에 군사상 이익 공여
- 쟁점: 북한이 형법상 '적국'인지 (헌법 제3조 영토조항 vs 정전협정 상대 실질론)

### 핵심 양형 원칙
- 내란수괴(제87조 1호)는 사형·무기징역·무기금고만 선택 가능하며, 유기징역 선고가 법률상 불가능
- 내란중요임무종사(제87조 2호)는 사형부터 징역 5년까지 폭넓은 범위
- 경합범 가중(형법 제37조, 제38조): 동시 판결 시 가장 중한 죄의 장기에 1/2 가중
- 내란죄 + 외환죄(일반이적) 경합 시 양형에 중대한 영향` : `## ⚖️ 해당 피고인 적용 법정형 체계

### 피고인 혐의: ${staticData?.charges || existingData.charges?.map(c => c.name).join(', ') || '미상'}

이 피고인은 내란 사건이 아닌 별도 형사사건 피고인입니다.
해당 혐의에 적용되는 법조항의 법정형(최고형·최저형)을 정확히 분석하세요.
특정범죄가중처벌법, 형법 각 조항의 법정형을 기준으로 분석합니다.

### 핵심 양형 원칙
- 경합범 가중(형법 제37조, 제38조): 동시 판결 시 가장 중한 죄의 장기에 1/2 가중
- 특가법 적용 시 가중된 법정형 범위 적용
- 양형기준에 따른 권고형 범위 확인`;

            const step1Prompt = `당신은 대한민국 형사법 전문가입니다. 다음 피고인에 대한 법률 분석을 수행하세요.

${legalFramework}

## 피고인 정보
- 이름: ${defendant}
- 직위: ${existingData.position || staticData?.position || '미상'}
- 현재 상태: ${existingData.status || '재판 진행 중'}
- 검찰 총 구형: ${prosecutionTotal}
${staticData ? `- 1심 판결: ${staticData.verdict}` : ''}

## 혐의 상세
${chargesInfo}

${staticData?.pendingTrials ? `## 별도 진행 중인 추가 재판
${staticData.pendingTrials.map(t => `- ${t}`).join('\n')}` : ''}

${staticData?.uncharged ? `## 언론에서 논의되었으나 미기소된 혐의
${staticData.uncharged.map(u => `- ${u}`).join('\n')}` : ''}

${staticData?.verdictOmissions ? `## 1심 판결에서 누락/배척된 사항 (비판점)
${staticData.verdictOmissions.map(o => `- ${o}`).join('\n')}` : ''}

${staticData ? `## 대법원 양형위원회 기준 참고
- 가중사유: ${staticData.sentencingGuidelines.aggravating.join(', ')}
- 감경사유: ${staticData.sentencingGuidelines.mitigating.join(', ')}` : ''}

## 이미 선고된 공범 판결
${codefendantVerdicts || '아직 선고된 공범 없음'}

${staticData ? `## 전체 공범 판결 요약
${Object.entries(FRONTEND_SENTENCING_DATA).filter(([name]) => name !== defendant).map(([name, data]) => `- ${name} (${data.position}): ${data.charges} → 구형: ${data.prosecutionRequest} → 판결: ${data.verdict} (${data.ratio})`).join('\n')}` : ''}

다음 JSON 형식으로만 응답하세요:
{
    "applicableLaws": ["적용 법조항과 각 법조항의 법정형(최고형·최저형 명시) 상세 설명 (최소 5개)"],
    "statutoryRange": "이 피고인에게 적용되는 법정형의 정확한 범위. 반드시 해당 조항의 최고형과 최저형을 명시할 것 (3-5문장)",
    "aggravatingFactors": ["가중 사유 - 각 항목을 2-3문장으로 구체적 근거와 함께 서술 (최소 5개)"],
    "mitigatingFactors": ["감경 사유 - 각 항목을 2-3문장으로 구체적 근거와 함께 서술 (최소 3개)"],
    "keyLegalIssues": ["핵심 법적 쟁점 - 각 쟁점의 법리적 논쟁을 3-4문장으로 상세 서술 (최소 4개)"],
    "sentencingFramework": "위 법정형 체계에 근거한 양형 범위 분석. 반드시 해당 죄명의 법정 최고형·최저형을 명시하고, 경합범 가중 시 범위 변동도 설명 (5-7문장)"
}`;

            const step1Result = await model.generateContent(step1Prompt);
            const step1Text = step1Result.response.text();
            let step1Data;
            try {
                const json1 = step1Text.match(/\{[\s\S]*\}/);
                step1Data = json1 ? JSON.parse(json1[0]) : JSON.parse(step1Text);
            } catch (e) {
                step1Data = { applicableLaws: [], aggravatingFactors: [], mitigatingFactors: [], keyLegalIssues: [], sentencingFramework: '파싱 실패' };
            }

            // === Step 2: 역사적 선례 비교 (Historical Precedent) ===
            const allPrecedents = Object.values(HISTORICAL_PRECEDENTS);
            const step2Prompt = `당신은 대한민국 형사법 선례 분석 전문가입니다. Step 1의 법률 분석 결과를 바탕으로 역사적 선례와 공범 판결을 비교 분석하세요.

## Step 1 법률 분석 결과
- 적용법조: ${JSON.stringify(step1Data.applicableLaws)}
- 가중사유: ${JSON.stringify(step1Data.aggravatingFactors)}
- 감경사유: ${JSON.stringify(step1Data.mitigatingFactors)}
- 양형기준: ${step1Data.sentencingFramework}

## 피고인 정보
- 이름: ${defendant}
- 직위: ${existingData.position || staticData?.position || '미상'}
- 검찰 구형: ${prosecutionTotal}
${staticData ? `- 1심 판결: ${staticData.verdict}
- 구형 대비 선고 비율: ${staticData.ratio}` : ''}

## 역사적 선례 (${allPrecedents.length}건)
${allPrecedents.map((p, i) => `### 선례 ${i + 1}: ${p.name} (${p.year}년)
- 혐의: ${p.charges}
- 배경: ${p.background}
- 1심: ${p.firstInstance}
- 항소심: ${p.appeal}
- 대법원: ${p.supremeCourt}
- 최종: ${p.finalResult}
- 가중요소: ${p.aggravatingFactors.join(', ')}
- 감경요소: ${p.mitigatingFactors.join(', ')}`).join('\n\n')}

## 이미 선고된 공범 판결
${codefendantVerdicts || '아직 선고된 공범 없음'}

${staticData ? `## 전체 공범 양형 비교 데이터
${Object.entries(FRONTEND_SENTENCING_DATA).filter(([name]) => name !== defendant).map(([name, data]) => `- ${name}: 구형 ${data.prosecutionRequest} → 판결 ${data.verdict} (비율: ${data.ratio}). 가중: ${data.sentencingGuidelines.aggravating.join(', ')} / 감경: ${data.sentencingGuidelines.mitigating.join(', ')}`).join('\n')}` : ''}

${FRONTEND_SENTENCING_DATA['노상원']?.notebook ? `## 노상원 수첩 (70페이지 수기 메모 — "계엄의 스모킹건")
${FRONTEND_SENTENCING_DATA['노상원'].notebook.content.map(c => `- ${c}`).join('\n')}
- 증거 상태: ${FRONTEND_SENTENCING_DATA['노상원'].notebook.evidenceStatus}` : ''}

${staticData?.verdictOmissions ? `## 1심 판결 누락/배척 사항 (언론·법조계 비판)
${staticData.verdictOmissions.map(o => `- ${o}`).join('\n')}` : ''}

다음 JSON 형식으로만 응답하세요:
{
    "historicalComparison": {
        "chundoohwan": {
            "similarity": "전두환 사건과의 유사점 (3-4문장, 구체적 법조항 비교 포함)",
            "difference": "전두환 사건과의 차이점 (3-4문장, 시대적·법률적 차이 분석)",
            "sentenceImpact": "전두환 선례가 이 피고인 양형에 미치는 영향 (3-4문장)"
        },
        "nohtaewoo": {
            "similarity": "노태우 사건과의 유사점 (3-4문장)",
            "difference": "노태우 사건과의 차이점 (3-4문장)",
            "sentenceImpact": "노태우 선례가 양형에 미치는 영향 (3-4문장)"
        },
        "kimjaegyu": {
            "similarity": "김재규 사건과의 유사점 (3-4문장)",
            "difference": "김재규 사건과의 차이점 (3-4문장)",
            "sentenceImpact": "김재규 선례가 양형에 미치는 영향 (3-4문장)"
        },
        "leesukki": {
            "similarity": "이석기 사건과의 유사점 (3-4문장)",
            "difference": "이석기 사건과의 차이점 (3-4문장)",
            "sentenceImpact": "이석기 선례가 양형에 미치는 영향 (3-4문장)"
        }
    },
    "codefendantComparison": [
        {
            "name": "공범 이름",
            "sentence": "선고 형량",
            "role": "사건 내 역할",
            "comparedToDefendant": "이 피고인과의 비교 분석 (3-4문장, 역할·책임 수준 비교)"
        }
    ],
    "verdictOmissionAnalysis": {
        "omittedCharges": "1심에서 누락/별도 분리된 혐의 분석 (외환죄, 내란목적살인예비 등)과 향후 양형 영향 (3-5문장)",
        "notebookImpact": "노상원 수첩 증거 배척이 양형에 미친 영향 분석. 수첩이 증거로 채택되었다면 양형이 어떻게 달라졌을지 (3-5문장)",
        "pendingTrialsImpact": "별도 진행 중인 재판(일반이적 등)이 최종 양형에 미칠 영향 (3-5문장)"
    },
    "precedentSummary": "역사적 선례, 공범 판결, 판결 누락 사항을 종합한 양형 방향 분석 (5-7문장)"
}`;

            const step2Result = await model.generateContent(step2Prompt);
            const step2Text = step2Result.response.text();
            let step2Data;
            try {
                const json2 = step2Text.match(/\{[\s\S]*\}/);
                step2Data = json2 ? JSON.parse(json2[0]) : JSON.parse(step2Text);
            } catch (e) {
                step2Data = { historicalComparison: {}, codefendantComparison: [], precedentSummary: '파싱 실패' };
            }

            // === Step 3: 최종 예측 (Final Prediction) ===
            const step3Prompt = `당신은 대한민국 최고의 양형 예측 전문가입니다. Step 1(법률 분석)과 Step 2(선례 비교)의 결과를 종합하여 최종 양형을 예측하세요.

## ⚖️ 법정형 제약 (양형 예측 시 반드시 준수)
- 내란수괴(형법 제87조 1호): 사형·무기징역·무기금고만 가능. 유기징역(예: 징역 20년) 선고 법률상 불가능
- 내란중요임무종사(형법 제87조 2호): 사형, 무기 또는 5년 이상의 징역·금고
- 부화수행(형법 제87조 3호): 5년 이하의 징역·금고
- 내란수괴의 경우 '사형 또는 무기징역' 중에서만 예측해야 하며, 유기징역 예측은 법적 오류
${step1Data.statutoryRange ? `- Step 1 법정형 분석: ${step1Data.statutoryRange}` : ''}

## Step 1 법률 분석 요약
- 적용법조: ${JSON.stringify(step1Data.applicableLaws)}
- 가중사유 수: ${step1Data.aggravatingFactors?.length || 0}개
- 감경사유 수: ${step1Data.mitigatingFactors?.length || 0}개
- 양형기준: ${step1Data.sentencingFramework}

## Step 2 선례 분석 요약
- 역사적 선례 비교: ${allPrecedents.length}건 분석 완료
- 공범 비교: ${step2Data.codefendantComparison?.length || 0}건
- 선례 종합: ${step2Data.precedentSummary}

## 피고인 정보
- 이름: ${defendant}
- 직위: ${existingData.position || staticData?.position || '미상'}
- 검찰 구형: ${prosecutionTotal}
${staticData ? `- 1심 판결: ${staticData.verdict}
- 구형 대비 선고 비율: ${staticData.ratio}` : ''}

${staticData ? `## 공범별 구형 대비 선고 비율 통계
${Object.entries(FRONTEND_SENTENCING_DATA).map(([name, data]) => `- ${name} (${data.position}): ${data.ratio}`).join('\n')}` : ''}

## 최근 뉴스 (참고자료)
${newsText || '최신 뉴스 없음'}

위 정보를 종합하여 최종 양형을 예측하세요. 반드시 해당 죄명의 법정형 범위 내에서만 예측할 것. 다음 JSON 형식으로만 응답:
{
    "predictedSentence": {
        "range": "법정형 범위 내 예측 양형 범위 (내란수괴는 '사형 또는 무기징역'만 가능)",
        "mostLikely": "가장 유력한 양형 (법정형 범위 내에서만 선택)",
        "confidence": "high 또는 medium 또는 low",
        "reasoning": "예측 근거 요약 - 법정형 제약과 선례를 반영 (3-4문장)"
    },
    "sentencingReasoning": "종합 양형 예측 근거 - 법정형 체계, 법률분석, 선례비교, 공범판결, 뉴스 동향을 모두 반영한 상세 분석. 특히 법정형의 최고형·최저형을 명시하고 그 범위 내에서 분석 (10-15문장으로 매우 상세하게)",
    "riskFactors": [
        {
            "factor": "양형에 영향을 미칠 수 있는 위험/변수 요인",
            "impact": "해당 요인이 양형을 높이거나 낮출 수 있는 방향과 정도 (2-3문장)",
            "probability": "high 또는 medium 또는 low"
        }
    ],
    "appealOutlook": {
        "likelihood": "항소 가능성 (high/medium/low)",
        "expectedChange": "항소심 예상 변화 - 법정형 범위 내에서 변경 가능성 (2-3문장)",
        "finalOutlook": "최종 확정 예상 (2-3문장)"
    },
    "disclaimer": "본 분석은 AI가 공개된 자료를 기반으로 생성한 예측이며, 실제 법원 판결과 다를 수 있습니다. 법적 조언이 아닌 참고 자료로만 활용하시기 바랍니다."
}`;

            const step3Result = await model.generateContent(step3Prompt);
            const step3Text = step3Result.response.text();
            let step3Data;
            try {
                const json3 = step3Text.match(/\{[\s\S]*\}/);
                step3Data = json3 ? JSON.parse(json3[0]) : JSON.parse(step3Text);
            } catch (e) {
                step3Data = { predictedSentence: { range: '분석 실패', mostLikely: '분석 실패', confidence: 'low' }, sentencingReasoning: step3Text?.substring(0, 500) || '파싱 실패' };
            }

            // 8. 3단계 결과 병합
            const prediction = {
                ...step1Data,
                ...step2Data,
                ...step3Data
            };

            // 9. Firestore에 저장
            await db.collection('sentencingData').doc(defendant).set({
                aiPrediction: {
                    ...prediction,
                    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    newsSourceCount: topNews.length,
                    model: 'gemini-2.5-flash',
                    analysisSteps: 3,
                    version: 'v2.0',
                    historicalPrecedentCount: Object.keys(HISTORICAL_PRECEDENTS).length,
                    hasStaticData: !!staticData
                },
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return res.json({
                success: true,
                defendant,
                prediction,
                newsCount: topNews.length,
                version: 'v2.0',
                analysisSteps: 3
            });

        } catch (error) {
            return res.status(500).json({
                error: 'AI 양형 예측 실패',
                message: error.message
            });
        }
    });

// 3. 재판부 구성 자동 수집 (관리자 트리거)
exports.crawlCourtComposition = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }
        if (!(await verifyAdmin(req, res))) return;

        try {
            const keywords = ['내란 전담재판부', '내란 항소심 재판부', '내란 재판부 배정'];
            const allNewsItems = [];

            for (const keyword of keywords) {
                const items = await searchNews(keyword, 10);
                allNewsItems.push(...items);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const seen = new Set();
            const uniqueNews = allNewsItems.filter(item => {
                const title = item.title.replace(/<[^>]*>/g, '').trim();
                if (seen.has(title)) return false;
                seen.add(title);
                return true;
            });

            if (uniqueNews.length === 0) {
                res.json({ success: true, message: 'No court composition news found', courts: [] });
                return;
            }

            const articleContents = [];
            for (const item of uniqueNews.slice(0, 5)) {
                const content = await fetchArticleContent(item.link);
                if (content) {
                    articleContents.push({ title: item.title.replace(/<[^>]*>/g, ''), content });
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const newsText = articleContents.length > 0
                ? articleContents.map(a => `제목: ${a.title}\n본문: ${a.content}`).join('\n\n---\n\n')
                : uniqueNews.map(n => `제목: ${n.title.replace(/<[^>]*>/g, '')}`).join('\n');

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const prompt = `내란 재판부 구성 관련 뉴스를 분석하여 재판부 정보를 JSON 배열로 추출해주세요.

뉴스:
${newsText}

JSON 형식:
[
    {
        "type": "first 또는 appeal",
        "division": "부서명 (예: 형사합의25부)",
        "chief": "재판장 이름",
        "chiefClass": 숫자 (사법연수원 기수),
        "associates": [{"name": "이름", "classYear": 기수, "role": "배석"}],
        "feature": "특징",
        "mainCase": "주요 사건"
    }
]

기사에서 확인된 정보만 포함. 정보가 없으면 빈 배열 반환.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            const courts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

            // Firestore에 저장
            for (const court of courts) {
                const existingSnap = await db.collection('insurrectionCourts')
                    .where('division', '==', court.division)
                    .where('type', '==', court.type)
                    .get();

                if (existingSnap.empty) {
                    await db.collection('insurrectionCourts').add({
                        ...court,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                } else {
                    const docId = existingSnap.docs[0].id;
                    await db.collection('insurrectionCourts').doc(docId).update({
                        ...court,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }

            res.json({ success: true, totalNews: uniqueNews.length, courts });
        } catch (error) {
            console.error('Court composition crawl error:', error);
            console.error('Internal error:', error.message); res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// ============================================
// 증거 기반 사법 정의 평가 시스템
// Evidence-Based Judicial Evaluation System
// ============================================

// 증거 유형 분류
const EVIDENCE_TYPES = {
    LEGAL_PRECEDENT: 'legal_precedent',
    NEWS_ARTICLE: 'news_article',
    SEARCH_TREND: 'search_trend',
    OPINION_POLL: 'opinion_poll'
};

// 내란 사건 피고인 목록 (24명)
const INSURRECTION_DEFENDANTS = [
    '윤석열', '한덕수', '김용현', '조지호', '노상원',
    '이상민', '김봉식', '목현태', '윤승영', '김건희',
    '곽종근', '박안수', '여인형', '이진우', '문상호',
    '김태효', '조태용', '박종준', '심우정', '이완규',
    '박성재', '최상목', '추경호', '김주현', '김용군'
];

// 관련 판례 수집 헬퍼
const collectLegalPrecedentsHelper = async (defendant) => {
    try {
        const OC = process.env.LAWAPI_OC || 'lacoiffure828';
        const queries = [
            `${defendant} 내란`,
            '내란죄 형법 87조',
            '전두환 내란',
            '노태우 내란'
        ];

        const allPrecedents = [];

        for (const query of queries) {
            try {
                const apiUrl = `https://www.law.go.kr/DRF/lawSearch.do?OC=${OC}&target=prec&type=JSON&query=${encodeURIComponent(query)}&display=10`;
                console.log('Fetching law precedents:', apiUrl);

                const response = await fetch(apiUrl, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!response.ok) {
                    console.error('Law API response not OK:', response.status);
                    continue;
                }

                const contentType = response.headers.get('content-type') || '';
                let data;
                if (contentType.includes('json')) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        console.error('Law API response not JSON:', text.substring(0, 200));
                        continue;
                    }
                }

                // 판례 목록 추출
                const precList = data.PrecSearch?.prec || data.prec || [];
                const items = Array.isArray(precList) ? precList : [precList];

                for (const item of items) {
                    if (!item || !item['판례일련번호']) continue;
                    allPrecedents.push({
                        caseId: item['판례일련번호'],
                        caseName: item['사건명'] || '',
                        court: item['법원명'] || '',
                        date: item['선고일자'] || '',
                        summary: (item['판시사항'] || item['판결요지'] || '').substring(0, 500),
                        url: `https://www.law.go.kr/판례/${item['판례일련번호']}`,
                        type: EVIDENCE_TYPES.LEGAL_PRECEDENT
                    });
                }
            } catch (queryError) {
                console.error(`Law API query error (${query}):`, queryError.message);
            }

            // API 제한 방지 딜레이
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 중복 제거 (판례일련번호 기준)
        const seen = new Set();
        const uniquePrecedents = allPrecedents.filter(p => {
            if (seen.has(p.caseId)) return false;
            seen.add(p.caseId);
            return true;
        });

        console.log(`Collected ${uniquePrecedents.length} unique legal precedents for ${defendant}`);
        return uniquePrecedents;
    } catch (error) {
        console.error('collectLegalPrecedentsHelper error:', error);
        return [];
    }
};

// 뉴스 증거 수집 헬퍼
const collectNewsEvidenceHelper = async (defendant) => {
    try {
        // 1. Bing RSS 뉴스 검색
        const bingQueries = [
            `${defendant} 판결 반응`,
            `${defendant} 양형 비판`,
            `${defendant} 재판 공정성`
        ];

        let allNewsItems = [];

        for (const query of bingQueries) {
            try {
                const bingResults = await searchNews(query, 10);
                allNewsItems = allNewsItems.concat(bingResults.map(item => ({
                    title: item.title,
                    url: extractRealUrl(item.link || ''),
                    source: 'bing',
                    date: item.pubDate || '',
                    description: item.description || ''
                })));
            } catch (e) {
                console.error(`Bing news search error (${query}):`, e.message);
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 2. 네이버 뉴스 API 검색
        const naverClientId = process.env.NAVER_CLIENT_ID;
        const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

        if (naverClientId && naverClientSecret) {
            const naverQueries = [
                `${defendant} 판결 반응`,
                `${defendant} 양형 비판`,
                `${defendant} 재판 공정성`
            ];

            for (const query of naverQueries) {
                try {
                    const naverRes = await fetch(
                        `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=10&sort=date`,
                        {
                            headers: {
                                'X-Naver-Client-Id': naverClientId,
                                'X-Naver-Client-Secret': naverClientSecret
                            }
                        }
                    );

                    if (naverRes.ok) {
                        const naverData = await naverRes.json();
                        const naverItems = naverData.items || [];
                        allNewsItems = allNewsItems.concat(naverItems.map(item => ({
                            title: (item.title || '').replace(/<[^>]*>/g, ''),
                            url: item.originallink || item.link || '',
                            source: 'naver',
                            date: item.pubDate || '',
                            description: (item.description || '').replace(/<[^>]*>/g, '')
                        })));
                    }
                } catch (e) {
                    console.error(`Naver news search error (${query}):`, e.message);
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        // 3. URL 기준 중복 제거
        const seenUrls = new Set();
        const uniqueNews = allNewsItems.filter(item => {
            const url = item.url.replace(/\/$/, '').replace(/^https?:\/\//, '');
            if (!url || seenUrls.has(url)) return false;
            seenUrls.add(url);
            return true;
        });

        // MSN 필터링
        const filteredNews = uniqueNews.filter(item => !item.url.includes('msn.com'));

        // 상위 8개 기사 본문 추출 + 감정 분석
        const topArticles = filteredNews.slice(0, 8);
        const enrichedArticles = [];

        for (const article of topArticles) {
            try {
                const content = await fetchArticleContent(article.url);
                const articleContent = content ? content.substring(0, 2000) : article.description;

                // Gemini 감정 분석
                let sentiment = 'neutral';
                let relevance = '';

                if (genAI && articleContent) {
                    try {
                        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
                        const analysisPrompt = `다음 뉴스 기사의 감정(positive/negative/neutral)과 관련 이슈를 분석하세요.
기사 제목: ${article.title}
기사 내용: ${articleContent.substring(0, 2000)}

JSON 형식으로 응답:
{"sentiment": "positive|negative|neutral", "relevance": "관련 이슈 한줄 설명"}`;

                        const result = await model.generateContent(analysisPrompt);
                        const analysisText = result.response.text();
                        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);
                            sentiment = parsed.sentiment || 'neutral';
                            relevance = parsed.relevance || '';
                        }
                    } catch (aiError) {
                        console.error('Gemini sentiment analysis error:', aiError.message);
                    }
                }

                enrichedArticles.push({
                    title: article.title,
                    url: article.url,
                    source: article.source,
                    date: article.date,
                    content: (content || article.description || '').substring(0, 500),
                    sentiment,
                    relevance,
                    type: EVIDENCE_TYPES.NEWS_ARTICLE
                });
            } catch (articleError) {
                console.error(`Article enrichment error (${article.title}):`, articleError.message);
                enrichedArticles.push({
                    title: article.title,
                    url: article.url,
                    source: article.source,
                    date: article.date,
                    content: (article.description || '').substring(0, 500),
                    sentiment: 'neutral',
                    relevance: '',
                    type: EVIDENCE_TYPES.NEWS_ARTICLE
                });
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`Collected ${enrichedArticles.length} enriched news articles for ${defendant}`);
        return enrichedArticles;
    } catch (error) {
        console.error('collectNewsEvidenceHelper error:', error);
        return [];
    }
};

// 검색 트렌드 수집 헬퍼
const collectSearchTrendsHelper = async (defendant) => {
    try {
        const naverClientId = process.env.NAVER_CLIENT_ID;
        const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

        if (!naverClientId || !naverClientSecret) {
            console.log('Naver API credentials not available for DataLab');
            return [];
        }

        const endDate = new Date().toISOString().split('T')[0];
        const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Naver-Client-Id': naverClientId,
                'X-Naver-Client-Secret': naverClientSecret
            },
            body: JSON.stringify({
                startDate: '2024-12-01',
                endDate: endDate,
                timeUnit: 'week',
                keywordGroups: [
                    { groupName: defendant, keywords: [defendant, `${defendant} 재판`] },
                    { groupName: '내란 재판', keywords: ['내란 재판', '내란 판결'] }
                ]
            })
        });

        if (!response.ok) {
            console.error('Naver DataLab API error:', response.status);
            return [];
        }

        const data = await response.json();
        const results = data.results || [];
        const trends = [];

        for (const group of results) {
            const dataPoints = (group.data || []).map(d => ({
                date: d.period,
                ratio: d.ratio
            }));

            // 피크 날짜와 평균 비율 계산
            let peakDate = '';
            let peakRatio = 0;
            let totalRatio = 0;

            for (const point of dataPoints) {
                totalRatio += point.ratio;
                if (point.ratio > peakRatio) {
                    peakRatio = point.ratio;
                    peakDate = point.date;
                }
            }

            const avgRatio = dataPoints.length > 0 ? Math.round((totalRatio / dataPoints.length) * 100) / 100 : 0;

            // 트렌드 방향 계산
            let trendDirection = 'stable';
            if (dataPoints.length >= 4) {
                const recentAvg = dataPoints.slice(-2).reduce((s, d) => s + d.ratio, 0) / 2;
                const olderAvg = dataPoints.slice(-4, -2).reduce((s, d) => s + d.ratio, 0) / 2;
                if (recentAvg > olderAvg * 1.2) trendDirection = 'rising';
                else if (recentAvg < olderAvg * 0.8) trendDirection = 'declining';
            }

            trends.push({
                keyword: group.title,
                period: `2024-12-01 ~ ${endDate}`,
                data: dataPoints,
                avgRatio,
                peakDate,
                trendDirection,
                type: EVIDENCE_TYPES.SEARCH_TREND
            });
        }

        console.log(`Collected ${trends.length} search trends for ${defendant}`);
        return trends;
    } catch (error) {
        console.error('collectSearchTrendsHelper error:', error);
        return [];
    }
};

// 사법 증거 수집 (HTTP)
exports.collectJudicialEvidence = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        // CORS 헤더
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        if (!(await verifyAdmin(req, res))) return;

        const defendant = req.query.defendant || req.body?.defendant;
        if (!defendant) {
            return res.status(400).json({ error: '피고인 이름(defendant)을 지정해주세요.' });
        }

        try {
            console.log(`Collecting judicial evidence for ${defendant}...`);

            // 3개 헬퍼 병렬 실행
            const [legalResult, newsResult, trendsResult] = await Promise.allSettled([
                collectLegalPrecedentsHelper(defendant),
                collectNewsEvidenceHelper(defendant),
                collectSearchTrendsHelper(defendant)
            ]);

            const legalPrecedents = legalResult.status === 'fulfilled' ? legalResult.value : [];
            const newsArticles = newsResult.status === 'fulfilled' ? newsResult.value : [];
            const searchTrends = trendsResult.status === 'fulfilled' ? trendsResult.value : [];

            const totalEvidenceCount = legalPrecedents.length + newsArticles.length + searchTrends.length;

            const evidence = {
                legalPrecedents,
                newsArticles,
                searchTrends,
                collectedAt: admin.firestore.FieldValue.serverTimestamp(),
                summary: {
                    totalEvidenceCount,
                    byType: {
                        [EVIDENCE_TYPES.LEGAL_PRECEDENT]: legalPrecedents.length,
                        [EVIDENCE_TYPES.NEWS_ARTICLE]: newsArticles.length,
                        [EVIDENCE_TYPES.SEARCH_TREND]: searchTrends.length
                    },
                    lastCollectionStatus: {
                        legalPrecedents: legalResult.status,
                        newsArticles: newsResult.status,
                        searchTrends: trendsResult.status
                    }
                }
            };

            // Firestore 저장
            await db.collection('judicialEvidence').doc(defendant).set(evidence, { merge: true });

            console.log(`Evidence collection complete for ${defendant}: ${totalEvidenceCount} items`);
            return res.json({
                success: true,
                defendant,
                evidence,
                summary: evidence.summary
            });
        } catch (error) {
            console.error('collectJudicialEvidence error:', error);
            console.error('Internal error:', error.message); return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 여론조사 관리 (HTTP)
exports.manageOpinionPolls = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
        // CORS 헤더
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        if (!(await verifyAdmin(req, res))) return;

        const defendant = req.query.defendant || req.body?.defendant;
        if (!defendant) {
            return res.status(400).json({ error: '피고인 이름(defendant)을 지정해주세요.' });
        }

        try {
            if (req.method === 'GET') {
                // 저장된 여론조사 조회
                const doc = await db.collection('judicialEvidence').doc(defendant).get();
                const data = doc.exists ? doc.data() : {};
                const opinionPolls = data.evidence?.opinionPolls || data.opinionPolls || [];
                return res.json({ defendant, opinionPolls });
            }

            if (req.method === 'POST') {
                // 여론조사 데이터 추가
                const { pollster, date, question, result, url } = req.body || {};
                if (!pollster || !question || !result) {
                    return res.status(400).json({ error: 'pollster, question, result 필드가 필요합니다.' });
                }

                const pollData = {
                    pollster,
                    date: date || new Date().toISOString().split('T')[0],
                    question,
                    result,
                    url: url || '',
                    addedAt: new Date().toISOString(),
                    type: EVIDENCE_TYPES.OPINION_POLL
                };

                await db.collection('judicialEvidence').doc(defendant).set({
                    opinionPolls: admin.firestore.FieldValue.arrayUnion(pollData)
                }, { merge: true });

                return res.json({ success: true, defendant, poll: pollData });
            }

            return res.status(405).json({ error: '허용되지 않는 메서드입니다.' });
        } catch (error) {
            console.error('manageOpinionPolls error:', error);
            console.error('Internal error:', error.message); return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 사법 공정성 평가 (HTTP)
exports.evaluateJudicialIntegrity = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        // CORS 헤더
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }
        if (!(await verifyAdmin(req, res))) return;
        if (!checkRateLimit(req, res, 5)) return;

        const defendant = safeDecodeKorean(req.query.defendant || req.body?.defendant);
        if (!defendant) {
            return res.status(400).json({ error: '피고인 이름(defendant)을 지정해주세요.' });
        }

        const collectFirst = req.query.collectFirst === 'true' || req.body?.collectFirst === true;

        try {
            // 필요 시 증거 수집 먼저 수행
            if (collectFirst) {
                console.log(`Collecting evidence first for ${defendant}...`);
                const [legalResult, newsResult, trendsResult] = await Promise.allSettled([
                    collectLegalPrecedentsHelper(defendant),
                    collectNewsEvidenceHelper(defendant),
                    collectSearchTrendsHelper(defendant)
                ]);

                const legalPrecedents = legalResult.status === 'fulfilled' ? legalResult.value : [];
                const newsArticles = newsResult.status === 'fulfilled' ? newsResult.value : [];
                const searchTrends = trendsResult.status === 'fulfilled' ? trendsResult.value : [];

                await db.collection('judicialEvidence').doc(defendant).set({
                    legalPrecedents,
                    newsArticles,
                    searchTrends,
                    collectedAt: admin.firestore.FieldValue.serverTimestamp(),
                    summary: {
                        totalEvidenceCount: legalPrecedents.length + newsArticles.length + searchTrends.length,
                        byType: {
                            [EVIDENCE_TYPES.LEGAL_PRECEDENT]: legalPrecedents.length,
                            [EVIDENCE_TYPES.NEWS_ARTICLE]: newsArticles.length,
                            [EVIDENCE_TYPES.SEARCH_TREND]: searchTrends.length
                        }
                    }
                }, { merge: true });
            }

            // Firestore에서 증거 로드
            const evidenceDoc = await db.collection('judicialEvidence').doc(defendant).get();
            if (!evidenceDoc.exists) {
                return res.status(404).json({ error: `${defendant}의 증거 데이터가 없습니다. collectFirst=true로 먼저 수집하세요.` });
            }
            const evidenceData = evidenceDoc.data();

            // 기존 양형 데이터 로드
            const sentencingDoc = await db.collection('sentencingData').doc(defendant).get();
            const sentencingData = sentencingDoc.exists ? sentencingDoc.data() : {};

            const legalPrecedents = evidenceData.legalPrecedents || [];
            const newsArticles = evidenceData.newsArticles || [];
            const searchTrends = evidenceData.searchTrends || [];
            const opinionPolls = evidenceData.opinionPolls || [];

            // 뉴스 감정 통계
            const sentimentStats = { positive: 0, negative: 0, neutral: 0 };
            for (const article of newsArticles) {
                if (article.sentiment === 'positive') sentimentStats.positive++;
                else if (article.sentiment === 'negative') sentimentStats.negative++;
                else sentimentStats.neutral++;
            }

            // 판례 포맷팅
            const formattedPrecedents = legalPrecedents.map((p, i) =>
                `${i + 1}. [${p.caseName}] (${p.court}, ${p.date})\n   요지: ${p.summary}\n   출처: ${p.url}`
            ).join('\n\n');

            // 뉴스 포맷팅
            const formattedNews = newsArticles.map((n, i) =>
                `${i + 1}. [${n.title}] (${n.source}, ${n.date})\n   감정: ${n.sentiment} | ${n.relevance}\n   내용: ${n.content}\n   출처: ${n.url}`
            ).join('\n\n');

            // 트렌드 포맷팅
            const formattedTrends = searchTrends.map(t =>
                `- ${t.keyword}: 평균 ${t.avgRatio}, 피크 ${t.peakDate}, 방향 ${t.trendDirection}`
            ).join('\n');

            // 여론조사 포맷팅
            const formattedPolls = opinionPolls.length > 0
                ? opinionPolls.map((p, i) =>
                    `${i + 1}. [${p.pollster}] (${p.date})\n   질문: ${p.question}\n   결과: ${p.result}\n   출처: ${p.url}`
                ).join('\n\n')
                : '수집된 여론조사 없음';

            // 피고인 정보
            const charges = sentencingData.charges
                ? sentencingData.charges.map(c => `${c.name} (${c.law})`).join(', ')
                : sentencingData.summary?.mainCharge || '내란 관련 혐의';
            const verdict = sentencingData.summary?.verdict || sentencingData.verdict || '미선고';

            // Gemini 2-Step Pipeline
            if (!genAI) {
                return res.status(500).json({ error: 'Gemini AI가 설정되지 않았습니다.' });
            }
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            // === Step A: 이슈 분석 ===
            const stepAPrompt = `당신은 대한민국 사법 절차 분석 전문가입니다.
다음 증거 자료를 분석하여 ${defendant}의 재판에 대한 사법 정의 평가를 수행하세요.

## 피고인 정보
이름: ${defendant}
혐의: ${charges}
판결: ${verdict}

## 수집된 증거 자료

### 1. 관련 판례 (${legalPrecedents.length}건)
${formattedPrecedents || '수집된 판례 없음'}

### 2. 뉴스 보도 (${newsArticles.length}건)
${formattedNews || '수집된 뉴스 없음'}

### 3. 검색 트렌드
${formattedTrends || '수집된 트렌드 없음'}

### 4. 여론조사
${formattedPolls}

## 검찰(특검·공수처) 평가 시 반드시 검토할 항목
1. **미기소 혐의**: 피고인의 행위에 비해 기소하지 않은 중대 혐의가 있는지 (예: 외환유치, 내란목적살인, 내란수괴 방조 등)
2. **수사 범위 축소**: 공범 관계, 지시-실행 체계, 배후 관계 등 수사가 충분했는지
3. **구형 적정성**: 혐의의 중대성과 피고인의 역할에 비해 구형량이 적절한지
4. **공소사실 범위**: 실제 범죄 행위를 충분히 포괄하는 공소사실인지
5. **증거 수집 충실성**: 핵심 증거를 확보했는지, 수사 과정에서 누락된 것은 없는지

## 재판부 평가 시 반드시 검토할 항목
1. 양형 기준 및 판례와의 일관성
2. 구형 대비 선고량의 적정성
3. 피고인의 직위·역할에 상응하는 책임 부과 여부
4. 증거 판단과 법리 해석의 합리성

## 평가 지침
- 가능한 한 근거 자료의 출처를 sources 배열에 포함하세요
- 출처가 직접적으로 없더라도, 수집된 증거에서 추론 가능한 쟁점은 가장 관련성 높은 출처를 연결하여 포함하세요
- severity는 critical/major/minor 중 선택
- **중요**: prosecutorialIssues와 judicialIssues 모두 빈 배열이 되지 않도록 최소 1개 이상의 쟁점을 도출하세요. 완벽한 수사나 재판은 없습니다.

다음 JSON 형식으로 응답:
{
    "prosecutorialIssues": [{
        "title": "이슈 제목",
        "description": "구체적 설명 (증거 기반)",
        "severity": "critical|major|minor",
        "impact": "양형/재판에 미친 영향",
        "sources": [{"title": "출처 제목", "url": "URL", "date": "날짜", "type": "news_article|legal_precedent|opinion_poll|search_trend"}]
    }],
    "judicialIssues": [{
        "title": "이슈 제목",
        "description": "구체적 설명 (증거 기반)",
        "severity": "critical|major|minor",
        "impact": "양형/재판에 미친 영향",
        "sources": [{"title": "출처 제목", "url": "URL", "date": "날짜", "type": "news_article|legal_precedent|opinion_poll|search_trend"}]
    }],
    "omittedEvidence": [{"title": "누락된 증거", "description": "설명", "status": "미반영|일부반영|배척", "sources": [{"title": "출처 제목", "url": "URL", "date": "날짜", "type": "news_article|legal_precedent|opinion_poll|search_trend"}]}]
}`;

            console.log(`Running Step A analysis for ${defendant}...`);
            const stepAResult = await model.generateContent(stepAPrompt);
            const stepAText = stepAResult.response.text();
            let stepAData;
            try {
                const jsonA = stepAText.match(/\{[\s\S]*\}/);
                stepAData = jsonA ? JSON.parse(jsonA[0]) : JSON.parse(stepAText);
            } catch (e) {
                console.error('Step A JSON parse error:', e.message);
                stepAData = { prosecutorialIssues: [], judicialIssues: [], omittedEvidence: [] };
            }

            // === Step B: 정량 평가 ===
            const totalCount = legalPrecedents.length + newsArticles.length + searchTrends.length + opinionPolls.length;
            const stepBPrompt = `Step A의 분석 결과를 바탕으로 정량적 점수를 산출하세요.

## Step A 분석 결과
${JSON.stringify(stepAData, null, 2)}

## 증거 통계
- 총 수집 증거: ${totalCount}건
- 판례: ${legalPrecedents.length}건, 뉴스: ${newsArticles.length}건, 트렌드: ${searchTrends.length}건, 여론: ${opinionPolls.length}건
- 뉴스 감정 분석: 긍정 ${sentimentStats.positive}, 부정 ${sentimentStats.negative}, 중립 ${sentimentStats.neutral}

## 점수 산출 기준
- 검찰 공정성 (0-100): 기소 완결성, 증거 확보, 구형 적정성, 법리 적용
- 재판부 공정성 (0-100): 판례 일관성, 양형 기준 준수, 증거 판단, 법리 해석
- 종합 평가 (0-100): 가중 평균 (검찰 40%, 재판부 40%, 여론·공적 관심 20%)

## 점수 산출 시 주의사항 (필수)
- **검찰 공정성 100점은 절대 부여하지 마세요.** 어떤 수사도 완벽할 수 없으며, 미기소 혐의·수사 범위 축소·증거 누락 등 구조적 한계가 항상 존재합니다.
- prosecutorialIssues가 빈 배열이라면 이는 "이슈가 없다"가 아니라 "이슈를 찾지 못했다"를 의미합니다. 이 경우 검찰 공정성은 최대 75점으로 제한하세요.
- judicialIssues가 빈 배열인 경우에도 동일하게 재판부 공정성 최대 75점으로 제한하세요.
- 각 이슈의 severity에 따른 감점: critical = -20~30점, major = -10~20점, minor = -5~10점

다음 JSON 형식으로 응답:
{
    "integrityScore": {
        "prosecution": 0,
        "judiciary": 0,
        "overall": 0,
        "reasoning": "4-6문장의 종합 평가 (모든 주장에 증거 출처 포함)",
        "methodology": "점수 산출 방법론 설명"
    },
    "evidenceSummary": {
        "totalCount": 0,
        "byType": {"legal_precedent": 0, "news_article": 0, "search_trend": 0, "opinion_poll": 0},
        "keyFindings": ["핵심 발견사항 3-5개 (각각 1문장)"]
    },
    "trendInsight": "검색 트렌드 기반 공적 관심도 분석 (2-3문장)"
}`;

            console.log(`Running Step B scoring for ${defendant}...`);
            const stepBResult = await model.generateContent(stepBPrompt);
            const stepBText = stepBResult.response.text();
            let stepBData;
            try {
                const jsonB = stepBText.match(/\{[\s\S]*\}/);
                stepBData = jsonB ? JSON.parse(jsonB[0]) : JSON.parse(stepBText);
            } catch (e) {
                console.error('Step B JSON parse error:', e.message);
                stepBData = {
                    integrityScore: { prosecution: 0, judiciary: 0, overall: 0, reasoning: '분석 실패', methodology: '' },
                    evidenceSummary: { totalCount, byType: {}, keyFindings: [] },
                    trendInsight: ''
                };
            }

            // === AI 점수 코드 레벨 클램핑 (프롬프트 무시 방어) ===
            if (stepBData.integrityScore) {
                const score = stepBData.integrityScore;
                // 빈 이슈 배열이면 최대 75점 제한
                if (!stepAData.prosecutorialIssues || stepAData.prosecutorialIssues.length === 0) {
                    score.prosecution = Math.min(score.prosecution, 75);
                }
                if (!stepAData.judicialIssues || stepAData.judicialIssues.length === 0) {
                    score.judiciary = Math.min(score.judiciary, 75);
                }
                // 100점 절대 금지 + 음수 방지
                score.prosecution = Math.min(Math.max(score.prosecution, 0), 99);
                score.judiciary = Math.min(Math.max(score.judiciary, 0), 99);
                score.overall = Math.min(Math.max(score.overall, 0), 99);
                console.log(`Score clamped for ${defendant}: prosecution=${score.prosecution}, judiciary=${score.judiciary}, overall=${score.overall}`);
            }

            // 결과 병합
            const judicialIntegrity = {
                ...stepAData,
                ...stepBData,
                evaluatedAt: new Date().toISOString(),
                defendant,
                evidenceSnapshot: {
                    legalPrecedentsCount: legalPrecedents.length,
                    newsArticlesCount: newsArticles.length,
                    searchTrendsCount: searchTrends.length,
                    opinionPollsCount: opinionPolls.length,
                    sentimentStats
                }
            };

            // === Step C: 양형 예측 (predictedSentence, legalAnalysis 등) ===
            const staticData = FRONTEND_SENTENCING_DATA[defendant];
            let sentencingPred = {};
            try {
                const stepCPrompt = `당신은 대한민국 형사법 양형 전문가입니다.
다음 피고인에 대해 Claude AI 관점의 양형 예측을 수행하세요.

## 피고인 정보
이름: ${defendant}
혐의: ${charges}
실제 판결: ${verdict}
${staticData ? `구형: ${staticData.prosecutionRequest}
실제 선고: ${staticData.verdict}
비율: ${staticData.ratio}` : ''}

## 사법 정의 평가 결과
${JSON.stringify(stepAData, null, 2)}

## 공범 선고 현황
${Object.entries(FRONTEND_SENTENCING_DATA).filter(([name]) => name !== defendant && FRONTEND_SENTENCING_DATA[name].verdict && !FRONTEND_SENTENCING_DATA[name].verdict.includes('진행')).map(([name, data]) => `- ${name} (${data.position}): ${data.charges} → 구형: ${data.prosecutionRequest} → 판결: ${data.verdict}`).join('\n')}

다음 JSON 형식으로 응답:
{
    "predictedSentence": {
        "range": "예: 징역 5년 ~ 징역 8년",
        "mostLikely": "예: 징역 6년",
        "confidence": "high|medium|low"
    },
    "legalAnalysis": {
        "applicableLaws": ["적용 법률 1", "적용 법률 2"],
        "aggravatingFactors": ["가중 사유 1", "가중 사유 2"],
        "mitigatingFactors": ["감경 사유 1", "감경 사유 2"]
    },
    "codefendantComparison": [
        {"name": "공범명", "sentence": "선고형", "comparedToDefendant": "비교 분석"}
    ],
    "sentencingReasoning": "3-5문장의 양형 근거 분석"
}`;

                console.log(`Running Step C sentencing prediction for ${defendant}...`);
                const stepCResult = await model.generateContent(stepCPrompt);
                const stepCText = stepCResult.response.text();
                const jsonC = stepCText.match(/\{[\s\S]*\}/);
                sentencingPred = jsonC ? JSON.parse(jsonC[0]) : JSON.parse(stepCText);
            } catch (e) {
                console.error('Step C sentencing prediction error:', e.message);
                sentencingPred = {};
            }

            // Firestore 업데이트 (judicialIntegrity + 양형예측 통합)
            await db.collection('sentencingData').doc(defendant).set({
                claudePrediction: {
                    judicialIntegrity,
                    ...sentencingPred,
                    generatedAt: new Date().toISOString(),
                    model: 'gemini-2.5-flash (claude-evaluation)',
                    version: 'v2.0'
                }
            }, { merge: true });

            console.log(`Judicial integrity evaluation complete for ${defendant}`);
            return res.json({
                success: true,
                defendant,
                judicialIntegrity
            });
        } catch (error) {
            console.error('evaluateJudicialIntegrity error:', error);
            console.error('Internal error:', error.message); return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
    });

// 전체 피고인 자동 평가 (매주 월요일 새벽 3시)
exports.evaluateAllDefendants = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .pubsub.schedule('0 3 1,15 * *')
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        console.log('Starting scheduled judicial evaluation for all defendants...');

        const results = [];
        for (const defendant of INSURRECTION_DEFENDANTS) {
            try {
                console.log(`Processing ${defendant}...`);

                // 1. 증거 수집
                const [legalResult, newsResult, trendsResult] = await Promise.allSettled([
                    collectLegalPrecedentsHelper(defendant),
                    collectNewsEvidenceHelper(defendant),
                    collectSearchTrendsHelper(defendant)
                ]);

                const legalPrecedents = legalResult.status === 'fulfilled' ? legalResult.value : [];
                const newsArticles = newsResult.status === 'fulfilled' ? newsResult.value : [];
                const searchTrends = trendsResult.status === 'fulfilled' ? trendsResult.value : [];

                await db.collection('judicialEvidence').doc(defendant).set({
                    legalPrecedents,
                    newsArticles,
                    searchTrends,
                    collectedAt: admin.firestore.FieldValue.serverTimestamp(),
                    summary: {
                        totalEvidenceCount: legalPrecedents.length + newsArticles.length + searchTrends.length,
                        byType: {
                            [EVIDENCE_TYPES.LEGAL_PRECEDENT]: legalPrecedents.length,
                            [EVIDENCE_TYPES.NEWS_ARTICLE]: newsArticles.length,
                            [EVIDENCE_TYPES.SEARCH_TREND]: searchTrends.length
                        }
                    }
                }, { merge: true });

                // 2. 평가 수행
                const evidenceDoc = await db.collection('judicialEvidence').doc(defendant).get();
                const evidenceData = evidenceDoc.exists ? evidenceDoc.data() : {};
                const sentencingDoc = await db.collection('sentencingData').doc(defendant).get();
                const sentencingData = sentencingDoc.exists ? sentencingDoc.data() : {};

                const opinionPolls = evidenceData.opinionPolls || [];
                const sentimentStats = { positive: 0, negative: 0, neutral: 0 };
                for (const article of newsArticles) {
                    if (article.sentiment === 'positive') sentimentStats.positive++;
                    else if (article.sentiment === 'negative') sentimentStats.negative++;
                    else sentimentStats.neutral++;
                }

                if (genAI) {
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

                    const charges = sentencingData.charges
                        ? sentencingData.charges.map(c => `${c.name} (${c.law})`).join(', ')
                        : sentencingData.summary?.mainCharge || '내란 관련 혐의';
                    const verdict = sentencingData.summary?.verdict || sentencingData.verdict || '미선고';

                    // Step A (간소화 버전)
                    const stepAPrompt = `대한민국 사법 절차 분석 전문가로서 ${defendant}의 재판에 대한 사법 정의 평가를 수행하세요.

피고인: ${defendant}, 혐의: ${charges}, 판결: ${verdict}
판례: ${legalPrecedents.length}건, 뉴스: ${newsArticles.length}건 (긍정${sentimentStats.positive}/부정${sentimentStats.negative}/중립${sentimentStats.neutral}), 트렌드: ${searchTrends.length}건, 여론: ${opinionPolls.length}건

주요 판례: ${legalPrecedents.slice(0, 3).map(p => p.caseName).join(', ') || '없음'}
주요 뉴스: ${newsArticles.slice(0, 3).map(n => `${n.title}(${n.sentiment})`).join(', ') || '없음'}

검찰 평가 시 필수 검토: 미기소 혐의(외환유치, 내란목적살인 등), 수사범위 축소, 구형 적정성, 공소사실 범위, 증거수집 충실성
재판부 평가 시 필수 검토: 양형 일관성, 구형대비 선고량, 직위·역할 상응 책임, 법리해석 합리성
중요: prosecutorialIssues와 judicialIssues 모두 최소 1개 이상 도출하세요. 완벽한 수사나 재판은 없습니다.

다음 JSON 형식으로 응답:
{
    "prosecutorialIssues": [{"title": "string", "description": "string", "severity": "critical|major|minor", "impact": "string", "sources": [{"title": "string", "url": "string", "date": "string", "type": "string"}]}],
    "judicialIssues": [{"title": "string", "description": "string", "severity": "critical|major|minor", "impact": "string", "sources": [{"title": "string", "url": "string", "date": "string", "type": "string"}]}],
    "omittedEvidence": [{"title": "string", "description": "string", "status": "string", "sources": [{"title": "string", "url": "string", "date": "string", "type": "string"}]}]
}`;

                    const stepAResult = await model.generateContent(stepAPrompt);
                    const stepAText = stepAResult.response.text();
                    let stepAData;
                    try {
                        const jsonA = stepAText.match(/\{[\s\S]*\}/);
                        stepAData = jsonA ? JSON.parse(jsonA[0]) : JSON.parse(stepAText);
                    } catch (e) {
                        stepAData = { prosecutorialIssues: [], judicialIssues: [], omittedEvidence: [] };
                    }

                    // Step B
                    const totalCount = legalPrecedents.length + newsArticles.length + searchTrends.length + opinionPolls.length;
                    const stepBPrompt = `Step A 결과를 바탕으로 정량적 점수를 산출하세요.

Step A: ${JSON.stringify(stepAData)}
증거: 총 ${totalCount}건 (판례${legalPrecedents.length}, 뉴스${newsArticles.length}, 트렌드${searchTrends.length}, 여론${opinionPolls.length})
감정: 긍정${sentimentStats.positive}, 부정${sentimentStats.negative}, 중립${sentimentStats.neutral}

점수 기준: 검찰 공정성(0-100), 재판부 공정성(0-100), 종합(검찰40%+재판부40%+여론20%)
주의: 100점은 절대 부여 금지. prosecutorialIssues/judicialIssues가 빈 배열이면 해당 점수 최대 75점. 감점: critical=-20~30, major=-10~20, minor=-5~10

다음 JSON 형식으로 응답:
{
    "integrityScore": {"prosecution": 0, "judiciary": 0, "overall": 0, "reasoning": "종합평가", "methodology": "방법론"},
    "evidenceSummary": {"totalCount": 0, "byType": {}, "keyFindings": ["발견1", "발견2"]},
    "trendInsight": "트렌드 분석"
}`;

                    const stepBResult = await model.generateContent(stepBPrompt);
                    const stepBText = stepBResult.response.text();
                    let stepBData;
                    try {
                        const jsonB = stepBText.match(/\{[\s\S]*\}/);
                        stepBData = jsonB ? JSON.parse(jsonB[0]) : JSON.parse(stepBText);
                    } catch (e) {
                        stepBData = {
                            integrityScore: { prosecution: 0, judiciary: 0, overall: 0, reasoning: '분석 실패', methodology: '' },
                            evidenceSummary: { totalCount, byType: {}, keyFindings: [] },
                            trendInsight: ''
                        };
                    }

                    // === AI 점수 코드 레벨 클램핑 (프롬프트 무시 방어) ===
                    if (stepBData.integrityScore) {
                        const score = stepBData.integrityScore;
                        // 빈 이슈 배열이면 최대 75점 제한
                        if (!stepAData.prosecutorialIssues || stepAData.prosecutorialIssues.length === 0) {
                            score.prosecution = Math.min(score.prosecution, 75);
                        }
                        if (!stepAData.judicialIssues || stepAData.judicialIssues.length === 0) {
                            score.judiciary = Math.min(score.judiciary, 75);
                        }
                        // 100점 절대 금지 + 음수 방지
                        score.prosecution = Math.min(Math.max(score.prosecution, 0), 99);
                        score.judiciary = Math.min(Math.max(score.judiciary, 0), 99);
                        score.overall = Math.min(Math.max(score.overall, 0), 99);
                        console.log(`Score clamped for ${defendant}: prosecution=${score.prosecution}, judiciary=${score.judiciary}, overall=${score.overall}`);
                    }

                    const judicialIntegrity = {
                        ...stepAData,
                        ...stepBData,
                        evaluatedAt: new Date().toISOString(),
                        defendant,
                        evidenceSnapshot: {
                            legalPrecedentsCount: legalPrecedents.length,
                            newsArticlesCount: newsArticles.length,
                            searchTrendsCount: searchTrends.length,
                            opinionPollsCount: opinionPolls.length,
                            sentimentStats
                        }
                    };

                    await db.collection('sentencingData').doc(defendant).set({
                        claudePrediction: { judicialIntegrity }
                    }, { merge: true });
                }

                results.push({ defendant, success: true });
            } catch (error) {
                console.error(`Error evaluating ${defendant}:`, error);
                results.push({ defendant, success: false, error: error.message });
            }

            // 피고인 간 30초 딜레이
            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        // 메타 데이터 저장
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        await db.collection('judicialEvidence').doc('_meta').set({
            lastRun: {
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                totalProcessed: results.length,
                successCount,
                failCount,
                results
            }
        }, { merge: true });

        // 텔레그램 알림
        try {
            const now = new Date();
            const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
            const telegramMsg = `⚖️ <b>[사법평가] ${dateStr} 주간 자동 평가 완료</b>\n\n✅ 성공: ${successCount}명\n❌ 실패: ${failCount}명\n📊 총 ${results.length}명 피고인 처리\n\n👉 https://siminbupjung-blog.web.app/sentencing-analysis`;
            await sendTelegramMessage(GROUP_CHAT_ID, telegramMsg);
        } catch (e) {
            console.error('Telegram notification failed:', e);
        }

        console.log(`Scheduled evaluation completed: ${successCount}/${results.length} successful`);
        return null;
    });
