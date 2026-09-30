// 인스타그램 릴스 자동 게시 — Instagram API with Instagram Login(페이스북 페이지 불필요, 프로페셔널 계정).
// GitHub Actions 「인스타그램 게시 (수동)」에서 부른다. 버튼을 누르는 것이 곧 게시 승인이다.
//
// 흐름: ① POST /<IG_USER_ID>/media (media_type=REELS, video_url, caption) → 컨테이너 id
//       ② GET /<컨테이너> ?fields=status_code 가 FINISHED 가 될 때까지 기다림(인스타 서버가 영상을 받아 처리)
//       ③ POST /<IG_USER_ID>/media_publish (creation_id) → 게시물 id
// video_url 은 인스타 서버가 직접 받아 가므로 **배포된 공개 주소**여야 한다(시민법정.kr 퓨니코드 주소).
//
// 환경변수(GitHub Secrets): IG_ACCESS_TOKEN, IG_USER_ID — 코드에 쓰지 않는다.
// 인자: --video <public/ 아래 경로 또는 https 주소> --caption-file <텍스트 파일> [--caption "<한 줄>"] [--no-feed]
// 토큰은 장기 토큰(60일). 만료 전에 앱 대시보드에서 다시 발급하거나 refresh_access_token 으로 갱신해 Secrets 를 바꾼다.
import fs from 'fs';

const API = `https://graph.instagram.com/${process.env.IG_API_VERSION || 'v23.0'}`;
const SITE = 'https://xn--lg3b0kt4n41f.kr'; // 시민법정.kr — 인스타 서버가 받을 주소는 퓨니코드로
const TOKEN = process.env.IG_ACCESS_TOKEN;
const USER = process.env.IG_USER_ID;

const args = process.argv.slice(2);
const arg = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const video = arg('--video');
const captionFile = arg('--caption-file');
let caption = arg('--caption') || '';
if (captionFile) caption = fs.readFileSync(captionFile, 'utf-8').trim();
const shareToFeed = !args.includes('--no-feed');

const fail = (msg) => { console.error(`❌ ${msg}`); process.exit(1); };
if (!TOKEN || !USER) fail('IG_ACCESS_TOKEN / IG_USER_ID 가 없습니다 — GitHub 저장소 Settings → Secrets and variables → Actions 에 넣어 주세요.');
if (!video) fail('--video 가 필요합니다 (예: cardnews/future-fund-key-2026/explainer-excerpt.mp4)');
if (caption.length > 2200) fail(`설명이 ${caption.length}자입니다 — 인스타그램 한도 2,200자를 넘습니다.`);

const videoUrl = /^https?:\/\//.test(video) ? video : `${SITE}/${video.replace(/^\/?(public\/)?/, '')}`;

async function call(method, path, params) {
  const url = new URL(`${API}${path}`);
  const body = new URLSearchParams({ ...params, access_token: TOKEN });
  const res = method === 'GET'
    ? await fetch(`${url}?${body}`)
    : await fetch(url, { method, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const e = json.error || {};
    fail(`${method} ${path} 실패 (HTTP ${res.status}) — ${e.message || JSON.stringify(json)}${e.code ? ` [code ${e.code}${e.error_subcode ? '/' + e.error_subcode : ''}]` : ''}`);
  }
  return json;
}

// 영상이 실제로 공개돼 있는지 먼저 본다 — 배포 전이면 인스타가 받아 가지 못해 한참 뒤에 ERROR 로 끝난다
{
  const head = await fetch(videoUrl, { method: 'HEAD' });
  const type = head.headers.get('content-type') || '';
  if (!head.ok || !type.includes('video')) fail(`영상 주소가 열리지 않습니다: ${videoUrl} (HTTP ${head.status}, ${type || '형식 없음'}) — 호스팅 배포가 먼저입니다.`);
  console.log(`영상 확인: ${videoUrl} (${(Number(head.headers.get('content-length')) / 1048576).toFixed(1)} MB)`);
}

console.log('① 컨테이너 만들기…');
const { id: container } = await call('POST', `/${USER}/media`, {
  media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: String(shareToFeed),
});
console.log(`   컨테이너 ${container}`);

console.log('② 인스타 서버 처리 대기…');
let status = '';
for (let i = 0; i < 60; i++) {           // 최대 10분
  await new Promise((r) => setTimeout(r, 10000));
  const s = await call('GET', `/${container}`, { fields: 'status_code,status' });
  status = s.status_code;
  console.log(`   ${i + 1}: ${status}${s.status ? ` (${s.status})` : ''}`);
  if (status === 'FINISHED') break;
  if (status === 'ERROR' || status === 'EXPIRED') fail(`처리 실패: ${status} ${s.status || ''} — 영상 형식(세로 9:16·H.264·AAC)과 길이를 확인하세요.`);
}
if (status !== 'FINISHED') fail('10분 안에 처리가 끝나지 않았습니다. 잠시 뒤 다시 실행하세요(같은 영상이 두 번 올라가지 않았는지 인스타에서 먼저 확인).');

console.log('③ 게시…');
const { id: media } = await call('POST', `/${USER}/media_publish`, { creation_id: container });
const info = await call('GET', `/${media}`, { fields: 'permalink' });
console.log(`✅ 게시 완료: ${info.permalink || media}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### ✅ 인스타그램 게시 완료\n\n- 영상: ${videoUrl}\n- 게시물: ${info.permalink || media}\n`);
}
