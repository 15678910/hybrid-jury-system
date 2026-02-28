import { useEffect, useState } from 'react';
import { KakaoIcon, FacebookIcon, XIcon, InstagramIcon, TelegramIcon, ThreadsIcon, TikTokIcon, LinkedInIcon } from './icons';

export default function SNSShareBar() {
    const [kakaoReady, setKakaoReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.Kakao && !window.Kakao.isInitialized()) {
                try {
                    window.Kakao.init('83e843186c1251b9b5a8013fd5f29798');
                    setKakaoReady(true);
                } catch (e) {
                    if (window.Kakao?.isInitialized()) setKakaoReady(true);
                }
            } else if (window.Kakao?.isInitialized()) {
                setKakaoReady(true);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const getShareUrl = () => window.location.href;
    const getShareText = () => document.title + ' #시민법정 #참심제 #사법개혁';
    const getFullShareText = () => {
        const desc = getOgDescription();
        return `${document.title}\n\n${desc}\n\n#시민법정 #참심제 #사법개혁`;
    };

    // 페이지별 OG 메타 태그에서 동적으로 설명/이미지 가져오기
    // react-helmet-async가 관리하는 태그(data-rh)를 우선 읽고, 없으면 마지막 매칭 태그 사용
    const getOgDescription = () => {
        const helmetMeta = document.querySelector('meta[property="og:description"][data-rh="true"]')
            || document.querySelector('meta[name="description"][data-rh="true"]');
        if (helmetMeta) return helmetMeta.content;
        const allMetas = document.querySelectorAll('meta[property="og:description"]');
        if (allMetas.length > 0) return allMetas[allMetas.length - 1].content;
        return '시민법정 - 참심제 도입으로 시민이 판사가 되는 사법개혁';
    };

    const getOgImage = () => {
        const helmetMeta = document.querySelector('meta[property="og:image"][data-rh="true"]');
        if (helmetMeta) return helmetMeta.content;
        const allMetas = document.querySelectorAll('meta[property="og:image"]');
        if (allMetas.length > 0) return allMetas[allMetas.length - 1].content;
        return 'https://xn--lg3b0kt4n41f.kr/og-image.jpg';
    };

    const shareToKakao = () => {
        const url = getShareUrl();
        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: document.title,
                        description: getOgDescription(),
                        imageUrl: getOgImage(),
                        link: { mobileWebUrl: url, webUrl: url },
                    },
                    buttons: [{ title: '자세히 보기', link: { mobileWebUrl: url, webUrl: url } }],
                });
            } catch (e) {
                fallbackShare();
            }
        } else {
            fallbackShare();
        }
    };

    const fallbackShare = () => {
        navigator.clipboard.writeText(`${document.title}\n${getShareUrl()}`);
        alert('링크가 복사되었습니다!\n카카오톡에 붙여넣기 해주세요.');
    };

    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank', 'width=600,height=400');
    };

    const shareToTwitter = () => {
        const text = `${document.title} #시민법정 #참심제 #사법개혁`;
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getShareUrl())}`, '_blank', 'width=600,height=400');
    };

    const shareToTelegram = () => {
        const baseUrl = getShareUrl();
        const separator = baseUrl.includes('?') ? '&' : '?';
        const url = `${baseUrl}${separator}t=${Date.now()}`;
        const text = getFullShareText();
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
    };

    const shareToInstagram = () => {
        navigator.clipboard.writeText(`${getFullShareText()}\n\n${getShareUrl()}`);
        alert('텍스트가 복사되었습니다! 인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    const shareToThreads = async () => {
        try {
            await navigator.clipboard.writeText(`${getFullShareText()}\n\n${getShareUrl()}`);
            alert('텍스트가 복사되었습니다!\nThreads에서 붙여넣기 해주세요.');
            window.open('https://www.threads.net/', '_blank');
        } catch (err) {
            alert('복사에 실패했습니다.');
        }
    };

    const shareToTikTok = async () => {
        try {
            await navigator.clipboard.writeText(`${getFullShareText()}\n\n${getShareUrl()}`);
            alert('텍스트가 복사되었습니다!\nTikTok에서 붙여넣기 해주세요.');
            window.open('https://www.tiktok.com/', '_blank');
        } catch (err) {
            alert('복사에 실패했습니다.');
        }
    };

    const shareToLinkedIn = () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}`, '_blank', 'width=600,height=400');
    };

    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 mx-4 my-6 max-w-6xl lg:mx-auto">
            <p className="text-white text-center mb-4 font-medium">이 페이지를 공유해주세요</p>
            <div className="flex justify-center gap-4 flex-wrap">
                <button onClick={shareToKakao} className="w-12 h-12 flex items-center justify-center bg-[#FEE500] rounded-full hover:scale-110 transition-transform" title="카카오톡">
                    <KakaoIcon className="w-6 h-6 text-[#391B1B]" />
                </button>
                <button onClick={shareToFacebook} className="w-12 h-12 flex items-center justify-center bg-[#1877F2] rounded-full hover:scale-110 transition-transform" title="페이스북">
                    <FacebookIcon className="w-6 h-6 text-white" />
                </button>
                <button onClick={shareToTwitter} className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform" title="X">
                    <XIcon className="w-5 h-5 text-white" />
                </button>
                <button onClick={shareToInstagram} className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#515BD4] rounded-full hover:scale-110 transition-transform" title="인스타그램">
                    <InstagramIcon className="w-6 h-6 text-white" />
                </button>
                <button onClick={shareToTelegram} className="w-12 h-12 flex items-center justify-center bg-[#0088cc] rounded-full hover:scale-110 transition-transform" title="텔레그램">
                    <TelegramIcon className="w-6 h-6 text-white" />
                </button>
                <button onClick={shareToThreads} className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform" title="Threads">
                    <ThreadsIcon className="w-6 h-6 text-white" />
                </button>
                <button onClick={shareToLinkedIn} className="w-12 h-12 flex items-center justify-center bg-[#0A66C2] rounded-full hover:scale-110 transition-transform" title="LinkedIn">
                    <LinkedInIcon className="w-6 h-6 text-white" />
                </button>
                <button onClick={shareToTikTok} className="w-12 h-12 flex items-center justify-center bg-black rounded-full hover:scale-110 transition-transform" title="TikTok">
                    <TikTokIcon className="w-6 h-6 text-white" />
                </button>
            </div>
        </div>
    );
}
