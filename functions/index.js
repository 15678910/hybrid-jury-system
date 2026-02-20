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
        res.status(500).json({ error: error.message });
    }
});

// Webhook 삭제 함수 (필요 시)
exports.deleteWebhook = functions.https.onRequest(async (req, res) => {
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
    res.set('Access-Control-Allow-Origin', '*');
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
    res.set('Access-Control-Allow-Origin', '*');
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
    res.set('Access-Control-Allow-Origin', '*');
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
    res.set('Access-Control-Allow-Origin', '*');
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

        console.log('Kakao token response:', tokenData.error ? tokenData : 'success');

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
        console.log('News already collected today, skipping');
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
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
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
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

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
        return res.send(`<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="0;url=/?r=/judge/${encodeURIComponent(judgeName)}"><script>window.location.replace("/?r=/judge/${encodeURIComponent(judgeName)}")</script></head>
<body>Loading...</body>
</html>`);
    }

    const title = `${judgeName} 판사 평가 - 시민법정`;
    const description = `${judgeName} 판사의 판결 성향 및 시민 평가 - 시민법정`;
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
        res.set('Access-Control-Allow-Origin', '*');
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).send('');
            return;
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
        res.set('Access-Control-Allow-Origin', '*');
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
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
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
        res.set('Access-Control-Allow-Origin', '*');
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).send('');
            return;
        }

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
            res.status(500).json({ error: error.message });
        }
    });

// 판사 데이터 조회 API
exports.getJudgeData = functions
    .region('asia-northeast3')
    .https.onRequest(async (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');
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
    res.set('Access-Control-Allow-Origin', '*');
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
    res.set('Access-Control-Allow-Origin', '*');
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
        return null;
    });

// 판결 수동 크롤링 트리거
exports.triggerVerdictCrawl = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 540, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).send('');
            return;
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
        res.set('Access-Control-Allow-Origin', '*');
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).send('');
            return;
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

// 3. 재판부 구성 자동 수집 (관리자 트리거)
exports.crawlCourtComposition = functions
    .region('asia-northeast3')
    .runWith({ timeoutSeconds: 300, memory: '1GB' })
    .https.onRequest(async (req, res) => {
        res.set('Access-Control-Allow-Origin', '*');
        if (req.method === 'OPTIONS') {
            res.set('Access-Control-Allow-Methods', 'GET, POST');
            res.set('Access-Control-Allow-Headers', 'Content-Type');
            res.status(204).send('');
            return;
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
