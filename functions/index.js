const functions = require('firebase-functions');
const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();

// 텔레그램 봇 설정
const BOT_TOKEN = '8250591807:AAElHwHcd8LFVq1lQxx5_q3PWcWibMHsiC8';
const GROUP_CHAT_ID = '-1003615735371';

// 환영 메시지 템플릿
const getWelcomeMessage = (userName) => {
    return `🎉 환영합니다, ${userName}님!

⚖️ 시민법정 참심제 텔레그램 그룹에 오신 것을 환영합니다!

이 그룹은 '주권자에 의한 시민법관 참심제' 도입을 위한 소통 공간입니다.

📌 주요 활동:
• 참심제 관련 소식 공유
• 사법개혁 논의
• 시민 참여 활동 안내

🔗 웹사이트: https://시민법정.kr

함께 민주적인 사법 개혁을 만들어가요! 💪`;
};

// 텔레그램 메시지 전송 함수
const sendTelegramMessage = async (chatId, text) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
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

// 텔레그램 Webhook 처리 (새 멤버 감지)
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    try {
        console.log('Received webhook:', JSON.stringify(req.body));

        const update = req.body;

        // 새 멤버가 그룹에 참가했을 때
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
        // User-Agent 체크 - 크롤러가 아니면 즉시 리다이렉트
        const userAgent = req.get('User-Agent') || '';
        const isCrawler = /facebookexternalhit|Twitterbot|kakaotalk|Kakao-Agent|Kakaotalk-Scrap|slackbot|linkedinbot|pinterest|googlebot|bingbot|naverbot|yeti/i.test(userAgent);

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
