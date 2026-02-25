import { Helmet } from 'react-helmet-async';

const SITE_NAME = '시민법정';
const BASE_URL = 'https://xn--lg3b0kt4n41f.kr';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.jpg`;
const DEFAULT_DESC = '시민법정은 헌법 개정 없이 가능한 사법개혁, 혼합형 참심제 도입을 추진합니다. 시민법관이 직업법관과 함께 재판하는 참심제로 사법 신뢰를 회복합니다.';

export default function SEOHead({ title, description, path = '/', image, type = 'website' }) {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - 참심제 도입으로 시민이 판사가 되는 사법개혁`;
    const desc = description || DEFAULT_DESC;
    const url = `${BASE_URL}${path}`;
    const img = image || DEFAULT_IMAGE;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <link rel="canonical" href={url} />

            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:image" content={img} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content={SITE_NAME} />
            <meta property="og:locale" content="ko_KR" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={img} />
        </Helmet>
    );
}
