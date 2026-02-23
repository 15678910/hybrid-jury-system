const { fetch } = require('./firebase');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_CHAT_ID || '-1003615735371';

const DEFAULT_POLL_DURATION_HOURS = 24;

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
                is_anonymous: false,
                allows_multiple_answers: allowsMultipleAnswers,
                open_period: openPeriod
            })
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending Telegram poll:', error);
        throw error;
    }
};

module.exports = {
    BOT_TOKEN,
    GROUP_CHAT_ID,
    DEFAULT_POLL_DURATION_HOURS,
    sendTelegramMessage,
    sendTelegramPhoto,
    sendTelegramPoll,
    getWelcomeMessage
};
