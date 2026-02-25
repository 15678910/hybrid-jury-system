/**
 * GA4 전환 이벤트 추적 유틸리티
 * Google Analytics 4 커스텀 이벤트를 통해 사용자 행동을 추적합니다.
 */

const gtag = (...args) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag(...args);
    }
};

// 서명(참여등록) 완료
export const trackSignatureComplete = (data = {}) => {
    gtag('event', 'signature_completed', {
        event_category: 'engagement',
        event_label: data.type || 'individual',
        sns_channels: data.sns?.join(',') || '',
        total_signatures: data.total || 0,
    });
};

// SNS 공유 클릭
export const trackShare = (platform, contentType, contentTitle = '') => {
    gtag('event', 'share', {
        method: platform,
        content_type: contentType,
        item_id: contentTitle.slice(0, 100),
    });
};

// 투표 참여
export const trackVote = (proposalTitle = '') => {
    gtag('event', 'vote_cast', {
        event_category: 'engagement',
        event_label: proposalTitle.slice(0, 100),
    });
};

// 블로그 글 조회
export const trackBlogView = (postTitle = '', postId = '') => {
    gtag('event', 'blog_post_view', {
        event_category: 'content',
        event_label: postTitle.slice(0, 100),
        post_id: postId,
    });
};

// 텔레그램 참여 클릭
export const trackTelegramJoin = () => {
    gtag('event', 'telegram_join_click', {
        event_category: 'engagement',
        event_label: 'telegram',
    });
};

// 페이지 체류 시간 (30초, 60초, 120초 등)
export const trackTimeOnPage = (seconds, pageName = '') => {
    gtag('event', 'time_on_page', {
        event_category: 'engagement',
        event_label: pageName || window.location.pathname,
        value: seconds,
    });
};

// 이메일 구독
export const trackEmailSubscribe = () => {
    gtag('event', 'email_subscribe', {
        event_category: 'engagement',
        event_label: 'newsletter',
    });
};

// 친구 초대 링크 생성
export const trackReferralCreate = () => {
    gtag('event', 'referral_link_created', {
        event_category: 'viral',
        event_label: 'invite',
    });
};

// 친구 초대 통한 방문
export const trackReferralVisit = (referrerId = '') => {
    gtag('event', 'referral_visit', {
        event_category: 'viral',
        event_label: referrerId,
    });
};

// 푸시 알림 구독
export const trackPushSubscribe = () => {
    gtag('event', 'push_subscribe', {
        event_category: 'engagement',
        event_label: 'fcm',
    });
};

// 동영상 시청
export const trackVideoView = (videoTitle = '') => {
    gtag('event', 'video_view', {
        event_category: 'content',
        event_label: videoTitle.slice(0, 100),
    });
};
