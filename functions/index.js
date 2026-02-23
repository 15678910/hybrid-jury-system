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

// CORS 허용 도메인 설정
const ALLOWED_ORIGINS = [
    'https://siminbupjung-blog.web.app',
    'https://xn--lg3b0kt4n41f.kr',
    'https://시민법정.kr',
    'http://localhost:5173',
    'http://localhost:3000'
];

const setCorsHeaders = (req, res) => {
    const origin = req.get('Origin');
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key, X-Telegram-Bot-Api-Secret-Token');
};

// 텔레그램 봇 설정 (환경변수에서 가져옴)
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || '-1003615735371';

// 투표 설정
const DEFAULT_POLL_DURATION_HOURS = 24; // 기본 투표 기간 (시간)

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

    functions.logger.info(`Custom poll created: ${pollRef.id} by ${userName}`);
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

    functions.logger.info(`Multi poll created: ${pollRef.id} by ${userName}`);
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

    functions.logger.info(`Survey created: ${surveyRef.id} by ${userName}`);
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

    functions.logger.info(`Proposal created: ${proposalRef.id} by ${userName}`);
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
        return;
    }

    const proposalDoc = snapshot.docs[0];
    const proposal = proposalDoc.data();

    // 이미 처리된 제안인지 확인
    if (proposal.status !== 'voting') {
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
    functions.logger.info(`Poll result processed: ${proposalDoc.id} - ${proposal.type}`);
};

// 텔레그램 Webhook 처리 (새 멤버 감지 + #제안 처리 + 투표 결과 처리)
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    try {
        // 텔레그램 secret token 검증 (환경변수 설정 시 필수, 미설정 시 경고 후 허용)
        const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (secretToken) {
            if (req.get('X-Telegram-Bot-Api-Secret-Token') !== secretToken) {
                console.error('Unauthorized webhook request');
                return res.status(403).send('Forbidden');
            }
        } else {
            functions.logger.warn('TELEGRAM_WEBHOOK_SECRET not configured - webhook verification disabled');
        }

        functions.logger.info('Received webhook update_id:', req.body?.update_id);

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
                functions.logger.info(`Welcomed new member: ${userName}`);
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
                functions.logger.info('참여하기 poster sent');
            }

            // #제안 처리
            if (!handled) {
                handled = await handleProposal(update.message);
                if (handled) functions.logger.info('Proposal handled');
            }

            // #설문 처리
            if (!handled) {
                handled = await handleSurvey(update.message);
                if (handled) functions.logger.info('Survey handled');
            }

            // #투표 처리 (커스텀 선택지)
            if (!handled) {
                handled = await handleCustomPoll(update.message);
                if (handled) functions.logger.info('Custom poll handled');
            }

            // #복수투표 처리 (복수 선택 가능)
            if (!handled) {
                handled = await handleMultiPoll(update.message);
                if (handled) functions.logger.info('Multi poll handled');
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
    // 관리자 API 키 검증 (환경변수 설정 시 필수, 미설정 시 경고 후 허용)
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
        if (req.get('X-Admin-Key') !== adminKey) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    } else {
        functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for setWebhook');
    }
    const webhookUrl = `https://us-central1-siminbupjung-blog.cloudfunctions.net/telegramWebhook`;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                allowed_updates: ['message', 'poll', 'chat_member', 'my_chat_member'],
                secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined
            })
        });
        const result = await response.json();
        functions.logger.info('Webhook set result:', result);
        res.json(result);
    } catch (error) {
        console.error('Error setting webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook 삭제 함수 (필요 시)
exports.deleteWebhook = functions.https.onRequest(async (req, res) => {
    // 관리자 API 키 검증 (환경변수 설정 시 필수, 미설정 시 경고 후 허용)
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
        if (req.get('X-Admin-Key') !== adminKey) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    } else {
        functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for deleteWebhook');
    }
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 참여하기 포스터 수동 전송 (HTTP 트리거)
exports.sendPosterToGroup = functions.https.onRequest(async (req, res) => {
    // 관리자 API 키 검증
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
        if (req.get('X-Admin-Key') !== adminKey) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    } else {
        functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for sendPosterToGroup');
    }

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
        res.status(500).json({ error: error.message });
    }
});

// Webhook 정보 확인
exports.getWebhookInfo = functions.https.onRequest(async (req, res) => {
    // 관리자 API 키 검증
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
        if (req.get('X-Admin-Key') !== adminKey) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    } else {
        functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for getWebhookInfo');
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 투표 마감 확인 스케줄러 (5분마다 실행)
// ============================================

exports.checkExpiredPolls = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
    functions.logger.info('Checking for expired polls...');

    const now = new Date();
    const proposalsRef = db.collection('telegram_proposals');

    // 투표 중인 제안들 조회
    const snapshot = await proposalsRef.where('status', '==', 'voting').get();

    if (snapshot.empty) {
        return null;
    }

    for (const doc of snapshot.docs) {
        const proposal = doc.data();
        const createdAt = proposal.createdAt?.toDate ? proposal.createdAt.toDate() : new Date(proposal.createdAt);
        const durationHours = proposal.pollDurationHours || 24;
        const expiresAt = new Date(createdAt.getTime() + durationHours * 60 * 60 * 1000);

        // 마감 시간이 지났는지 확인
        if (now >= expiresAt) {
            functions.logger.info(`Poll expired: ${doc.id}`);

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
                        functions.logger.info(`Poll result sent: ${doc.id}`);
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
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

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
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 서명 등록 API (백엔드 검증 포함)
// ============================================

exports.registerSignature = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    setCorsHeaders(req, res);
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

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
            functions.logger.info('Admin notification sent for signature:', signatureId);
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
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // 관리자 API 키 검증
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
        if (req.get('X-Admin-Key') !== adminKey) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    } else {
        functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for sendBlogNotification');
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
        res.status(500).json({ error: error.message });
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
            const safeBlogId = encodeURIComponent(blogId || '');
            const redirectUrl = safeBlogId && safeBlogId !== 'blog' ? `/?r=/blog/${safeBlogId}` : '/';

            return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}"><script>window.location.replace("${escapeHtml(redirectUrl)}")</script></head>
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
    ${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": description,
      "image": imageUrl,
      "url": postUrl,
      "publisher": {
        "@type": "Organization",
        "name": "시민법정",
        "url": "https://xn--lg3b0kt4n41f.kr"
      }
    }).replace(/</g, '\\u003c')}
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
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

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

        functions.logger.info('Kakao token response:', tokenData.error ? tokenData.error : 'success');

        res.json(tokenData);
    } catch (error) {
        console.error('Kakao token error:', error);
        res.status(500).json({ error: error.message });
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
    functions.logger.info('Crawling Supreme Court press releases...');

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

        functions.logger.info(`Found ${pressReleases.length} Supreme Court press releases`);
        return pressReleases;
    } catch (error) {
        console.error('Supreme Court crawl error:', error);
        return [];
    }
};

// 대법원 인사발령 크롤링 (사법정보공개포털)
const crawlJudgePersonnelChanges = async () => {
    functions.logger.info('Crawling judge personnel changes...');

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
            console.error('Personnel portal fetch failed:', response.status);
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

        functions.logger.info(`Found ${personnelNews.length} personnel items`);
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
    functions.logger.info('Starting news collection...');

    // 오늘 이미 수집했는지 확인 (최근 포스트 중 자동뉴스 확인)
    const now = new Date();
    const koreaOffset = 9 * 60 * 60 * 1000;
    const koreaTime = new Date(now.getTime() + koreaOffset);
    const todayStart = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    todayStart.setTime(todayStart.getTime() - koreaOffset);

    const recentPosts = await db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

    const alreadyCollected = recentPosts.docs.some(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : null;
        return data.isAutoNews === true && createdAt && createdAt >= todayStart;
    });

    if (alreadyCollected && !force) {
        return { skipped: true, message: '오늘 이미 뉴스가 수집되었습니다.' };
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
            allNews = allNews.concat(supremeCourtNews);
        }
    } catch (error) {
        console.error('Supreme Court news fetch error:', error);
    }

    // 중복 제거
    allNews = deduplicateNews(allNews);

    // 최근 24시간 내 뉴스만 필터링
    allNews = filterRecentNews(allNews);
    functions.logger.info(`Filtered to ${allNews.length} news items from last 24 hours`);

    if (allNews.length === 0) {
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
    functions.logger.info(`News post created: ${postRef.id} with ${allNews.length} articles`);

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
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // 관리자 API 키 검증
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
        if (req.get('X-Admin-Key') !== adminKey) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    } else {
        functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for collectNewsManual');
    }

    try {
        const force = req.query.force === 'true';
        const result = await collectAndPostNews(force);
        res.json(result);
    } catch (error) {
        console.error('Manual news collection error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 대법원 보도자료 수동 수집 (테스트용)
exports.collectSupremeCourtNews = functions.https.onRequest(async (req, res) => {
    setCorsHeaders(req, res);
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // 관리자 API 키 검증
    const adminKey = process.env.ADMIN_API_KEY;
    if (adminKey) {
        if (req.get('X-Admin-Key') !== adminKey) {
            return res.status(403).json({ error: 'Forbidden' });
        }
    } else {
        functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for collectSupremeCourtNews');
    }

    try {
        functions.logger.info('Manual Supreme Court news collection started');

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
        res.status(500).json({ error: error.message });
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
            return null;
        }

        const html = await response.text();

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
            }
        }

        // 3. <article> 태그 내용
        if (!content || content.length < 100) {
            const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
            if (articleMatch) {
                content = articleMatch[1];
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
            return content.substring(0, 5000);
        }

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
        } else {
            // 폴백: RSS의 제목과 설명 사용
            newsText = newsItems.map(item => {
                const title = item.title.replace(/<[^>]*>/g, '');
                const desc = item.description.replace(/<[^>]*>/g, '');
                return `제목: ${title}\n내용: ${desc}`;
            }).join('\n\n');
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
    functions.logger.info(`Crawling sentencing data for: ${person.name}`);

    // 뉴스 검색 (판결, 선고 관련)
    const newsItems = await searchNews(`${person.name} 판결 선고 재판`, 15);

    if (newsItems.length === 0) {
        return null;
    }

    // AI로 정보 추출 시도
    let verdictInfo = await extractVerdictInfo(person.name, newsItems);

    // AI 추출 실패 시 기본 데이터로 저장
    if (!verdictInfo) {

        // 뉴스 제목에서 판결 관련 키워드 확인
        const titles = newsItems.map(n => n.title).join(' ');
        const hasVerdictKeyword = /선고|판결|징역|무죄|유죄|구속|석방/.test(titles);

        verdictInfo = {
            hasVerdict: hasVerdictKeyword,
            verdictDate: null,
            status: null,
            verdict: '재판 진행 중',
            charges: [],
            summary: newsItems.slice(0, 3).map(n => n.title).join(' | '),
            keyFacts: newsItems.slice(0, 5).map(n => n.title),
            trialStatus: hasVerdictKeyword ? '최근 재판 관련 뉴스 있음' : '재판 진행 중'
        };
    }

    // Firestore에 저장
    const docRef = db.collection('sentencingData').doc(person.name);
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
    functions.logger.info(`Saved sentencing data for ${person.name}`);

    return data;
};

// 모든 인물 데이터 크롤링 (스케줄 함수)
exports.crawlAllSentencingData = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .pubsub.schedule('0 6,18 * * *') // 매일 오전 6시, 오후 6시
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        functions.logger.info('Starting scheduled sentencing data crawl...');

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

        functions.logger.info('Sentencing data crawl completed:', results);

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
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=/?r=/sentencing-analysis"><script>window.location.replace("/?r=/sentencing-analysis")</script></head>
<body>Loading...</body>
</html>`);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
    const title = `[내란재판분석] ${dateStr} 소식`;
    const description = '내란 관련 인물 재판 현황 및 판결 분석 - 시민법정';
    const imageUrl = 'https://siminbupjung-blog.web.app/%EB%82%B4%EB%9E%80%EC%9E%AC%ED%8C%90%EB%B6%84%EC%84%9D.png?v=3';
    const pageUrl = 'https://siminbupjung-blog.web.app/sentencing-analysis';

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
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=/?r=/reform-analysis"><script>window.location.replace("/?r=/reform-analysis")</script></head>
<body>Loading...</body>
</html>`);
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' });
    const title = `[개혁안 비교] ${dateStr} 주요 소식`;
    const description = '사법개혁 7대 영역별 정당·시민사회 입장 비교 및 관련 뉴스 - 시민법정';
    const imageUrl = 'https://siminbupjung-blog.web.app/%EA%B0%9C%ED%98%81%EC%95%88%EB%B9%84%EA%B5%90.png?v=4';
    const pageUrl = 'https://siminbupjung-blog.web.app/reform-analysis';

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
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=/?r=/judge-evaluation"><script>window.location.replace("/?r=/judge-evaluation")</script></head>
<body>Loading...</body>
</html>`);
    }

    const title = '판사 평가 - 시민법정';
    const description = '내란 재판 담당 판사들의 판결 성향 및 시민 평가 - 시민법정';
    const imageUrl = 'https://siminbupjung-blog.web.app/og-image.png';
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

// 개별 판사 페이지 SSR (OG 태그)
exports.judgeDetailPage = functions.https.onRequest(async (req, res) => {
    const userAgent = req.get('User-Agent') || '';
    const isCrawler = /facebookexternalhit|Twitterbot|TelegramBot|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

    // URL에서 판사 이름 추출 (/judge/홍길동 -> 홍길동)
    const judgeName = decodeURIComponent(req.path.split('/').pop() || '');

    if (!isCrawler) {
        const safeJudgeName = encodeURIComponent(judgeName);
        const redirectUrl = `/?r=/judge/${safeJudgeName}`;
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=${escapeHtml(redirectUrl)}"><script>window.location.replace("${escapeHtml(redirectUrl)}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const safeJudgeName = escapeHtml(judgeName);
    const title = `${safeJudgeName} 판사 평가 - 시민법정`;
    const description = `${safeJudgeName} 판사의 판결 성향 및 시민 평가 - 시민법정`;
    const imageUrl = 'https://siminbupjung-blog.web.app/og-image.png';
    const pageUrl = `https://siminbupjung-blog.web.app/judge/${encodeURIComponent(judgeName)}`;

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

// 수동 트리거 (HTTP)
exports.triggerSentencingCrawl = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        // CORS 설정
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).send('');
            return;
        }

        // 관리자 API 키 검증
        const adminKey = process.env.ADMIN_API_KEY;
        if (adminKey) {
            if (req.get('X-Admin-Key') !== adminKey) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else {
            functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for triggerSentencingCrawl');
        }

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
            res.status(500).json({ error: error.message });
        }
    });

// 특정 인물 데이터 조회 API
exports.getSentencingData = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
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
            res.status(500).json({ error: error.message });
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
    functions.logger.info(`Collecting reform news for: ${areaConfig.title}`);

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
    functions.logger.info(`Saved ${topNews.length} news for ${areaConfig.title} (total found: ${allNews.length})`);

    return data;
};

// 매일 오전 9:10 (한국시간) 자동 실행
exports.collectReformNews = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .pubsub.schedule('10 6,18 * * *')
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        functions.logger.info('Starting reform news collection...');

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

        functions.logger.info('Reform news collection completed:', results);

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
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        // 관리자 API 키 검증
        const adminKey = process.env.ADMIN_API_KEY;
        if (adminKey) {
            if (req.get('X-Admin-Key') !== adminKey) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else {
            functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for collectReformNewsManual');
        }

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
            res.status(500).json({ error: error.message });
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
    functions.logger.info(`Crawling judge data for: ${judge.name}`);

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

    functions.logger.info(`Found ${allNewsItems.length} unique news items for judge ${judge.name}`);

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
    functions.logger.info(`Saved judge data for ${judge.name}`);
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
                // ytInitialData JSON 파싱 실패 무시
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

        functions.logger.info(`Found ${videoIds.size} YouTube videos for: ${query}`);
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
            // oEmbed 요청 실패 무시
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
            // 페이지 fetch 실패 (AbortError 포함) 무시
        }

        if (!title) {
            return null;
        }

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
    functions.logger.info(`Crawling YouTube for judge: ${judgeName}`);

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

    functions.logger.info(`Total unique YouTube videos found: ${allVideoIds.size}`);

    const videoInfos = [];
    for (const videoId of allVideoIds) {
        const info = await fetchYouTubeVideoInfo(videoId);
        if (info) {
            videoInfos.push(info);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    functions.logger.info(`Got ${videoInfos.length} video infos out of ${allVideoIds.size} videos`);

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

            functions.logger.info(`Saved YouTube data for judge ${judgeName}`);
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
    functions.logger.info(`Crawling court cases for judge: ${judgeName}`);

    try {
        // 국가법령정보 판례 검색 API
        // API 키가 없으면 스킵
        const courtApiKey = process.env.COURT_API_KEY;
        if (!courtApiKey) {
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

        functions.logger.info(`Saved ${parsedCases.length} court cases for judge ${judgeName}`);
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
        functions.logger.info('Starting scheduled judge data crawl...');

        for (const judge of JUDGES_TO_CRAWL) {
            try {
                // 1. 뉴스 크롤링
                await crawlJudgeNews(judge);

                // 2. YouTube 크롤링
                await crawlYouTubeForJudge(judge.name);

                // 3. 법원 판결문 크롤링
                await crawlCourtCases(judge.name);

                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.error(`Error crawling judge ${judge.name}:`, error);
            }
        }

        functions.logger.info('Judge data crawl completed');
        return null;
    });

// 수동 트리거 (HTTP)
exports.triggerJudgeCrawl = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
            res.status(204).send('');
            return;
        }

        // 관리자 API 키 검증
        const adminKey = process.env.ADMIN_API_KEY;
        if (adminKey) {
            if (req.get('X-Admin-Key') !== adminKey) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else {
            functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for triggerJudgeCrawl');
        }

        const judgeName = req.query.judge || '우인성';
        const source = req.query.source; // 'news', 'youtube', 'court', or all

        try {
            const results = {};
            const judge = JUDGES_TO_CRAWL.find(j => j.name === judgeName) || { name: judgeName, position: '' };

            if (!source || source === 'news') {
                results.news = await crawlJudgeNews(judge);
            }

            if (!source || source === 'youtube') {
                results.youtube = await crawlYouTubeForJudge(judgeName);
            }

            if (!source || source === 'court') {
                results.court = await crawlCourtCases(judgeName);
            }

            res.json({ success: true, judge: judgeName, results });
        } catch (error) {
            console.error('Judge crawl error:', error);
            res.status(500).json({ error: error.message });
        }
    });

// 판사 데이터 조회 API
exports.getJudgeData = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
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
            res.status(500).json({ error: error.message });
        }
    });

// ============================================
// 국가법령정보 OPEN API 프록시
// ============================================

exports.lawApi = functions.https.onRequest(async (req, res) => {
    setCorsHeaders(req, res);
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    const OC = process.env.LAWAPI_OC || 'test';
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
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 네이버 뉴스 검색 API
// ============================================

exports.searchNaverNews = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    setCorsHeaders(req, res);
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

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

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
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

        const result = await model.generateContent(prompt);
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
    .pubsub.schedule('0 6,12,18 * * *')
    .timeZone('Asia/Seoul')
    .onRun(async (context) => {
        functions.logger.info('Starting scheduled verdict data crawl...');

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

        functions.logger.info(`Found ${uniqueNews.length} unique news items`);

        if (uniqueNews.length === 0) {
            return null;
        }

        // AI로 구조화된 판결 데이터 추출
        const verdicts = await extractStructuredVerdict(uniqueNews);
        functions.logger.info(`Extracted ${verdicts.length} verdicts`);

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
                functions.logger.info(`Saved new verdict: ${verdict.defendant} ${verdict.date}`);
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

        functions.logger.info(`Verdict crawl completed. Saved ${savedCount} new verdicts.`);
        return null;
    });

// 판결 수동 크롤링 트리거
exports.triggerVerdictCrawl = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
            res.status(204).send('');
            return;
        }

        // 관리자 API 키 검증
        const adminKey = process.env.ADMIN_API_KEY;
        if (adminKey) {
            if (req.get('X-Admin-Key') !== adminKey) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else {
            functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for triggerVerdictCrawl');
        }

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
            res.status(500).json({ error: error.message });
        }
    });

// 2. AI 심층 분석 (관리자 트리거)
exports.analyzeVerdictWithAI = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        setCorsHeaders(req, res);
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
            res.status(204).send('');
            return;
        }

        // 관리자 API 키 검증
        const adminKey = process.env.ADMIN_API_KEY;
        if (adminKey) {
            if (req.get('X-Admin-Key') !== adminKey) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else {
            functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for analyzeVerdictWithAI');
        }

        const { defendant } = req.query;
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
            res.status(500).json({ error: error.message });
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
    }
};

// AI 양형 예측 함수
exports.predictSentencingWithAI = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        // CORS 헤더
        setCorsHeaders(req, res);
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
        if (req.method === 'OPTIONS') {
            return res.status(204).send('');
        }

        // 관리자 API 키 검증
        const adminKey = process.env.ADMIN_API_KEY;
        if (adminKey) {
            if (req.get('X-Admin-Key') !== adminKey) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else {
            functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for predictSentencingWithAI');
        }

        const defendant = req.query.defendant || req.body?.defendant;
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

            // 3. 최신 뉴스 수집
            const newsQueries = [
                `${defendant} 내란 재판 양형`,
                `${defendant} 내란 구형 판결`,
                `${defendant} 내란 선고`
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

            // 6. 정적 양형 데이터 조회
            const staticData = FRONTEND_SENTENCING_DATA[defendant];

            // 7. 3단계 AI 분석 파이프라인
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            // === Step 1: 법률 분석 (Legal Framework) ===
            const step1Prompt = `당신은 대한민국 형사법 전문가입니다. 다음 피고인에 대한 법률 분석을 수행하세요.

## ⚖️ 내란죄 관련 법정형 체계 (반드시 준수)

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
- 내란죄 + 외환죄(일반이적) 경합 시 양형에 중대한 영향

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
    "statutoryRange": "이 피고인에게 적용되는 법정형의 정확한 범위 (예: 내란수괴 제87조 1호 → 사형/무기징역/무기금고만 가능, 유기징역 불가). 반드시 해당 조항의 최고형과 최저형을 명시할 것 (3-5문장)",
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
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
            res.status(204).send('');
            return;
        }

        // 관리자 API 키 검증
        const adminKey = process.env.ADMIN_API_KEY;
        if (adminKey) {
            if (req.get('X-Admin-Key') !== adminKey) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        } else {
            functions.logger.warn('ADMIN_API_KEY not configured - admin verification disabled for crawlCourtComposition');
        }

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
            res.status(500).json({ error: error.message });
        }
    });

// ============================================
// RAG 챗봇 API (참심제 전문 AI 상담)
// ============================================
const ragSearch = require('./shared/ragSearch');

exports.ragChat = functions.runWith({ memory: '1GB', timeoutSeconds: 60 }).https.onRequest(async (req, res) => {
    setCorsHeaders(req, res);
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { question, context: clientContext, conversationHistory } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ error: 'question is required' });
        }

        // Rate limiting (simple IP-based)
        // (skip for now, can add later with Firestore)

        // 1. 시맨틱 검색 우선, BM25 폴백
        let searchResults = [];
        let searchMode = 'bm25';

        // 1a. Gemini Embedding으로 시맨틱 검색 시도
        if (genAI) {
            try {
                const embModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
                const embResult = await embModel.embedContent(question);
                const queryEmbedding = embResult.embedding.values;
                searchResults = ragSearch.semanticSearch(queryEmbedding, 5);
                if (searchResults.length > 0) {
                    searchMode = 'semantic';
                }
            } catch (embError) {
                console.error('Semantic search failed, falling back to BM25:', embError.message);
            }
        }

        // 1b. 시맨틱 검색 실패 시 BM25 폴백
        if (searchResults.length === 0) {
            searchResults = ragSearch.search(question, 5);
            searchMode = 'bm25';
        }

        // 2. Build context from search results (or use client-provided context)
        let ragContext = '';
        let sources = [];

        if (searchResults.length > 0) {
            ragContext = searchResults.map((r, idx) =>
                `[참고자료 ${idx + 1}: ${r.sourceLabel}]\n${r.text}`
            ).join('\n\n---\n\n');

            sources = searchResults.map(r => ({
                name: r.source,
                label: r.sourceLabel,
                score: Math.round(r.score * 1000) / 1000
            }));
        } else if (clientContext) {
            ragContext = clientContext;
        }

        // 3. If no Gemini API key, return search results as fallback
        if (!genAI) {
            if (searchResults.length > 0) {
                return res.json({
                    answer: `관련 자료를 찾았습니다:\n\n${ragContext}`,
                    sources,
                    mode: 'search-only'
                });
            }
            return res.status(503).json({ error: 'AI 서비스를 사용할 수 없습니다.' });
        }

        // 4. Build conversation history context (last 3 turns)
        let historyText = '';
        if (conversationHistory && Array.isArray(conversationHistory)) {
            const recentHistory = conversationHistory.slice(-6); // 3 turns = 6 messages
            historyText = recentHistory
                .filter(m => m.role && m.content)
                .map(m => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
                .join('\n');
        }

        // 5. Generate answer with Gemini
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const systemPrompt = `당신은 대한민국 시민법관 참심제 전문 AI 상담사입니다.

## 역할
- 시민법관 참심제(혼합형 배심제)에 대한 전문적이고 정확한 답변을 제공합니다.
- 제공된 참고자료를 기반으로만 답변하며, 자료에 없는 내용은 추측하지 않습니다.
- 각국의 참심제도(독일, 핀란드, 스웨덴, 프랑스 등)를 비교 분석할 수 있습니다.

## 답변 규칙
1. **출처 인용 필수**: 답변에 사용한 참고자료의 출처를 반드시 명시하세요. 예: "(EU 사법제도 자료 참조)"
2. **환각 금지**: 참고자료에 없는 정보는 "제공된 자료에서는 해당 내용을 찾을 수 없습니다"라고 답하세요.
3. **구조화된 답변**: 복잡한 주제는 번호 목록이나 소제목으로 구분하여 읽기 쉽게 작성하세요.
4. **비교 질문 시**: 표 형식이나 국가별 구분으로 명확하게 비교하세요.
5. **한국어**: 반드시 한국어로 답변하세요.
6. **간결하되 충분히**: 핵심을 놓치지 않되, 불필요한 반복은 피하세요.

## 금지사항
- 정치적 의견이나 편향된 주장 금지
- 법률 자문 제공 금지 (일반적인 제도 설명만 가능)
- 참고자료에 없는 통계나 수치 인용 금지`;

        let userPrompt = '';

        if (ragContext) {
            userPrompt = `## 참고자료\n${ragContext}\n\n`;
        }

        if (historyText) {
            userPrompt += `## 이전 대화\n${historyText}\n\n`;
        }

        userPrompt += `## 질문\n${question}\n\n위 참고자료를 기반으로 정확하고 구조화된 답변을 작성해주세요. 반드시 출처를 인용하세요.`;

        const result = await model.generateContent(systemPrompt + '\n\n' + userPrompt);

        const answer = result.response.text();

        return res.json({
            answer,
            sources,
            mode: ragContext ? 'rag' : 'general',
            searchMode
        });

    } catch (error) {
        console.error('RAG Chat error:', error);

        // Gemini failure fallback: return search results directly
        try {
            const searchResults = ragSearch.search(req.body?.question || '', 3);
            if (searchResults.length > 0) {
                const fallbackAnswer = searchResults.map((r, idx) =>
                    `**[${r.sourceLabel}]**\n${r.text}`
                ).join('\n\n---\n\n');

                return res.json({
                    answer: `AI 요약 생성에 실패했지만, 관련 자료를 찾았습니다:\n\n${fallbackAnswer}`,
                    sources: searchResults.map(r => ({ name: r.source, label: r.sourceLabel })),
                    mode: 'fallback'
                });
            }
        } catch (fallbackError) {
            console.error('Fallback search also failed:', fallbackError);
        }

        return res.status(500).json({ error: '답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' });
    }
});
