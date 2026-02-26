import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { KakaoIcon, FacebookIcon, XIcon, InstagramIcon, TelegramIcon, ThreadsIcon, LinkedInIcon } from './icons';

export default function SNSShareBar() {
    const location = useLocation();

    // 자체 공유 바가 있는 페이지에서는 글로벌 공유 바를 숨김
    const PAGES_WITH_OWN_SHARE = ['/sentencing-analysis'];
    if (PAGES_WITH_OWN_SHARE.some(path => location.pathname.startsWith(path))) {
        return null;
    }

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

    const shareToKakao = () => {
        const url = getShareUrl();
        if (kakaoReady && window.Kakao?.isInitialized()) {
            try {
                window.Kakao.Share.sendDefault({
                    objectType: 'feed',
                    content: {
                        title: document.title,
                        description: '시민법정 - 참심제 도입으로 시민이 판사가 되는 사법개혁',
                        imageUrl: 'https://xn--lg3b0kt4n41f.kr/og-image.jpg',
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
        window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(getShareText())}&url=${encodeURIComponent(getShareUrl())}`, '_blank', 'width=600,height=400');
    };

    const shareToTelegram = () => {
        const baseUrl = getShareUrl();
        const separator = baseUrl.includes('?') ? '&' : '?';
        const url = `${baseUrl}${separator}t=${Date.now()}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(getShareText())}`, '_blank', 'width=600,height=400');
    };

    const shareToInstagram = () => {
        navigator.clipboard.writeText(`${getShareText()} ${getShareUrl()}`);
        alert('텍스트가 복사되었습니다! 인스타그램 스토리나 게시물에 붙여넣기 해주세요.');
    };

    const shareToThreads = async () => {
        try {
            await navigator.clipboard.writeText(`${document.title}\n\n${getShareUrl()}\n\n#시민법정 #참심제 #사법개혁`);
            alert('텍스트가 복사되었습니다!\nThreads에서 붙여넣기 해주세요.');
            window.open('https://www.threads.net/', '_blank');
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
            </div>
        </div>
    );
}
