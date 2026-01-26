const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();

// 텔레그램 봇 설정 (환경변수에서 가져옴)
const BOT_TOKEN = functions.config().telegram?.bot_token || process.env.TELEGRAM_BOT_TOKEN;
const GROUP_CHAT_ID = functions.config().telegram?.group_chat_id || process.env.TELEGRAM_GROUP_CHAT_ID || '-1003615735371';

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

        // 일일 제한 확인
        const signaturesRef = db.collection('signatures');
        const todaySignatures = await signaturesRef
            .where('timestamp', '>=', todayStart)
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
            timestamp: new Date()
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
    '중수청', '공소청', '대법관', '헌법재판소'
];

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';

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

// 뉴스 수집 및 블로그 포스트 생성 (공통 로직)
const collectAndPostNews = async () => {
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

    if (alreadyCollected) {
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

    // 중복 제거
    allNews = deduplicateNews(allNews);

    if (allNews.length === 0) {
        console.log('No news found');
        return { skipped: true, message: '수집된 뉴스가 없습니다.' };
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

    // 요약 생성
    const activeKeywords = Object.keys(grouped).slice(0, 5).join(', ');
    const summary = `${dateStr} 사법 관련 주요 뉴스입니다. ${activeKeywords} 등 ${allNews.length}건의 뉴스를 수집했습니다.`;

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
        const telegramMsg = `📰 <b>[사법뉴스] ${dateStr} 주요 소식</b>\n\n${allNews.length}건의 사법 관련 뉴스가 자동 수집되었습니다.\n\n👉 https://siminbupjung-blog.web.app/blog/${postRef.id}`;
        await sendTelegramMessage(GROUP_CHAT_ID, telegramMsg);
    } catch (e) {
        console.error('Telegram notification failed:', e);
    }

    return { success: true, postId: postRef.id, newsCount: allNews.length };
};

// 매일 오전 9시(한국시간) 자동 실행
exports.autoCollectNews = functions
    .runWith({ timeoutSeconds: 120, memory: '256MB' })
    .pubsub.schedule('0 9 * * *')
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
exports.collectNewsManual = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const result = await collectAndPostNews();
        res.json(result);
    } catch (error) {
        console.error('Manual news collection error:', error);
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
