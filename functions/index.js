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
const sendTelegramPoll = async (chatId, question, options, openPeriod = DEFAULT_POLL_DURATION_HOURS * 3600) => {
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
                allows_multiple_answers: false,
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

// #제안 메시지 처리 함수
const handleProposal = async (message) => {
    const chatId = message.chat.id;
    const text = message.text || '';
    const userName = message.from?.first_name || message.from?.username || '익명';

    // #제안 태그 확인 (대소문자 무관)
    const proposalMatch = text.match(/^#제안\s+(.+)/s);

    if (!proposalMatch) return false;

    const proposalContent = proposalMatch[1].trim();

    if (proposalContent.length < 5) {
        await sendTelegramMessage(chatId,
            `⚠️ @${message.from?.username || userName}님, 제안 내용이 너무 짧습니다.\n\n예시: #제안 월례회의를 토요일로 변경하자`
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
        votes: { agree: 0, disagree: 0, abstain: 0 }
    };

    const proposalRef = await db.collection('telegram_proposals').add(proposalData);

    // 제안 접수 알림
    const announcementMsg = `📣 <b>새로운 제안이 등록되었습니다!</b>

👤 제안자: ${userName}
📝 내용: ${proposalContent}

⏰ 투표 기간: ${DEFAULT_POLL_DURATION_HOURS}시간
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
        DEFAULT_POLL_DURATION_HOURS * 3600
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

    // 결과 공지
    const resultMsg = `📊 <b>투표 결과 발표</b>

📝 제안: ${proposal.content}
👤 제안자: ${proposal.proposer}

${resultEmoji} <b>결과: ${resultText}</b>

📈 투표 현황:
  ✅ 찬성: ${agreeVotes}표
  ❌ 반대: ${disagreeVotes}표
  ⏸️ 기권: ${abstainVotes}표
  📊 총 참여: ${totalVotes}명

${status === 'passed' ? '🎉 제안이 통과되었습니다! 커뮤니티 규칙에 반영됩니다.' : '제안이 부결되었습니다.'}

📋 제안번호: #${proposalDoc.id.slice(-6)}`;

    await sendTelegramMessage(proposal.chatId, resultMsg);
    console.log(`Poll result processed: ${proposalDoc.id} - ${status}`);
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

        // 2. #제안 메시지 처리
        if (update.message && update.message.text) {
            const handled = await handleProposal(update.message);
            if (handled) {
                console.log('Proposal handled');
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
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

    try {
        const response = await fetch(url);
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
