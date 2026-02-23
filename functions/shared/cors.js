const ALLOWED_ORIGINS = [
    'https://siminbupjung-blog.web.app',
    'https://xn--lg3b0kt4n41f.kr',
    'https://시민법정.kr',
    'http://localhost:5173',
    'http://localhost:3000'
];

const setCorsHeaders = (req, res) => {
    const origin = req.get('Origin');
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key, X-Telegram-Bot-Api-Secret-Token');
};

module.exports = { ALLOWED_ORIGINS, setCorsHeaders };
