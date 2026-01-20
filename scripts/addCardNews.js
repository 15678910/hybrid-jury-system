// Firebase Admin SDK를 사용하여 카드뉴스 추가
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 서비스 계정 키 파일
const serviceAccount = JSON.parse(readFileSync(path.join(__dirname, '../serviceAccountKey.json'), 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'siminbupjung-blog.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function uploadImage(filePath, fileName) {
    const destination = `cardnews-images/${fileName}`;
    await bucket.upload(filePath, {
        destination,
        metadata: {
            contentType: 'image/png'
        }
    });

    // 공개 URL 생성
    const file = bucket.file(destination);
    await file.makePublic();
    return `https://storage.googleapis.com/siminbupjung-blog.firebasestorage.app/${destination}`;
}

async function addCardNews() {
    const publicDir = path.join(__dirname, '../public');

    const cardNewsData = [
        {
            title: '온라인 참심제 1만명 캠페인',
            description: '시민이 판사가 되는 참심제 도입을 위한 1만명 서명 캠페인에 참여해주세요!',
            category: '시민 참여',
            imagePath: path.join(publicDir, '온라인참심제!1만명.png')
        },
        {
            title: '참심제 홍보 웹자보',
            description: '참심제란 무엇인가? 시민이 직업법관과 함께 재판에 참여하는 제도입니다.',
            category: '참심제 설명',
            imagePath: path.join(publicDir, '참심제_웹자보qrcode.png')
        },
        {
            title: '참심제 포스터',
            description: '헌법 개정 없이 가능한 사법개혁, 혼합형 참심제 도입을 추진합니다.',
            category: '참심제 설명',
            imagePath: path.join(publicDir, '참심제포스터1.png')
        }
    ];

    for (const card of cardNewsData) {
        try {
            console.log(`업로드 중: ${card.title}`);

            // 이미지 업로드
            const fileName = `cardnews_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
            const imageUrl = await uploadImage(card.imagePath, fileName);
            console.log(`이미지 업로드 완료: ${imageUrl}`);

            // Firestore에 추가
            await db.collection('cardnews').add({
                title: card.title,
                description: card.description,
                category: card.category,
                images: [imageUrl],
                author: '시민법정',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`카드뉴스 추가 완료: ${card.title}\n`);
        } catch (error) {
            console.error(`오류 발생 (${card.title}):`, error.message);
        }
    }

    console.log('모든 카드뉴스 추가 완료!');
    process.exit(0);
}

addCardNews();
