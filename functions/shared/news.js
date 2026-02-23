const { fetch } = require('./firebase');

// Bing 뉴스 RSS 검색 함수 (Google이 서버 IP 차단하므로 Bing 사용)
const searchNews = async (query, display = 10) => {
    try {
        const bingNewsUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=RSS&mkt=ko-KR`;

        const response = await fetch(bingNewsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            }
        });

        if (!response.ok) {
            console.error('Bing News RSS response not OK:', response.status);
            return [];
        }

        const xmlText = await response.text();

        // XML 파싱: <item>...</item> 추출
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        const items = [];
        let match;

        while ((match = itemRegex.exec(xmlText)) !== null && items.length < display) {
            const itemContent = match[1];

            const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s);
            const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/);
            const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
            const descriptionMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);

            if (titleMatch && linkMatch) {
                items.push({
                    title: titleMatch[1].trim().replace(/<[^>]*>/g, ''),
                    link: linkMatch[1].trim().replace(/&amp;/g, '&'),
                    pubDate: pubDateMatch ? pubDateMatch[1] : '',
                    description: descriptionMatch ? descriptionMatch[1].replace(/<[^>]*>/g, '').trim() : ''
                });
            }
        }

        return items;
    } catch (error) {
        console.error('Bing News RSS search error:', error);
        return [];
    }
};

// Bing 리다이렉트 URL에서 실제 기사 URL 추출
const extractRealUrl = (bingUrl) => {
    if (bingUrl.includes('bing.com/news/apiclick.aspx')) {
        const urlMatch = bingUrl.match(/[?&]url=([^&]+)/);
        if (urlMatch) {
            return decodeURIComponent(urlMatch[1]);
        }
    }
    return bingUrl;
};

// 뉴스 기사 본문 가져오기
const fetchArticleContent = async (url) => {
    try {
        const actualUrl = extractRealUrl(url);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(actualUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9'
            },
            redirect: 'follow',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return null;
        }

        const html = await response.text();

        // 1. JSON-LD 구조화 데이터에서 기사 본문 추출 (가장 정확)
        let content = '';
        const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
        for (const jsonLdTag of jsonLdMatches) {
            try {
                const jsonStr = jsonLdTag.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
                const jsonData = JSON.parse(jsonStr);
                const articleData = Array.isArray(jsonData) ? jsonData.find(d => d['@type'] && d['@type'].includes('Article')) : jsonData;
                if (articleData && articleData.articleBody) {
                    content = articleData.articleBody;
                    break;
                }
            } catch (e) {
                // JSON 파싱 실패 무시
            }
        }

        // 2. <meta> og:description 추출
        if (!content || content.length < 100) {
            const ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i) ||
                                html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i);
            if (ogDescMatch && ogDescMatch[1].length > 50) {
                content = ogDescMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            }
        }

        // 3. <article> 태그 내용
        if (!content || content.length < 100) {
            const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
            if (articleMatch) {
                content = articleMatch[1];
            }
        }

        // 4. 본문 영역 클래스/ID 기반 추출
        if (!content || content.length < 100) {
            const bodyPatterns = [
                /<div[^>]*class="[^"]*article[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*news[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*content[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*news[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*article[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*id="[^"]*article[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*id="[^"]*news[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*body-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
            ];

            for (const pattern of bodyPatterns) {
                const match = html.match(pattern);
                if (match && match[1].length > 200) {
                    content = match[1];
                    break;
                }
            }
        }

        // 5. <p> 태그 추출 (최후의 수단)
        if (!content || content.length < 100) {
            const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
            const meaningfulPs = pMatches.filter(p => {
                const text = p.replace(/<[^>]+>/g, '').trim();
                return text.length > 30;
            });
            if (meaningfulPs.length > 0) {
                content = meaningfulPs.slice(0, 20).join(' ');
            }
        }

        // HTML 태그 제거 및 정제
        content = content
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#\d+;/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (content.length > 100) {
            return content.substring(0, 5000);
        }

        return null;
    } catch (error) {
        console.error('Article fetch error:', error.message);
        return null;
    }
};

module.exports = { searchNews, extractRealUrl, fetchArticleContent };
