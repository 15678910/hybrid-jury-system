/**
 * 국회 심사보고서·검토보고서 수집기
 * 설계: docs/analysis/수사기소분리_쟁점분석_설계.md 후속 — 위원회 심사자료 확보
 *
 * 목적: 의안정보시스템(likms.assembly.go.kr)에서 대상 법안의 **심사보고서·검토보고서**
 *       PDF 를 받아 docs/bills/reports/ 에 원문 PDF + 추출 텍스트로 저장한다.
 *
 * 원칙 (CLAUDE.md 2026-03-18 「법률 정보 부정확」 사건 재발 방지):
 *   - bookId·문서명을 추측하지 않는다. 응답 HTML 에서 파싱한 값만 쓴다.
 *   - 위원장 대안은 자체 심사보고서를 갖지 않는다. 그 안에 병합된 원안들의
 *     보고서를 받아야 한다 (walkRelated). 대안 자체만 보고 끝내지 않는다.
 *   - 받지 못한 문서는 사유를 기록하고 건너뛴다. 채우지 않는다.
 *
 * billId 는 --list 로 확인한 값이다 (탐침 기록: docs/bills/reports/_수집로그.json).
 *
 * 사용법:
 *   cd functions
 *   node collect_bill_reports.cjs --list       # 대상 법안과 붙어 있는 문서 목록만 출력, 다운로드 안 함
 *   node collect_bill_reports.cjs --fetch      # 심사보고서/검토보고서 PDF 수집 + 텍스트 추출
 *   node collect_bill_reports.cjs --originals  # 대안·원안의 의안원문/위원회제출안 등 원문 문서 + 회의록 수집
 *                                               (심사보고서는 대안 자체 내용을 담지 않는다 — 원문·회의록으로 보완)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = process.env.REPORT_OUT_DIR || path.join(__dirname, '..', 'docs', 'bills', 'reports');
const ORIGINAL_OUT_DIR = process.env.ORIGINAL_OUT_DIR || path.join(__dirname, '..', 'docs', 'bills', 'originals');
const BASE = 'https://likms.assembly.go.kr';
const RECORD_BASE = 'https://record.assembly.go.kr';

/**
 * 수집 대상. billId/billNo 는 상세 페이지에서 실제로 확인한 값이다.
 * walkRelated=true 인 대안은 자체 문서 목록과 별개로, 대안에 병합된
 * 원안(관련법안)들의 문서 목록도 함께 받는다.
 */
const TARGETS = [
    {
        billNo: '2217594', billId: 'PRC_V2X6E0Z3G1E7L2P0N0A0B4W9O2W3V3', label: '공소청법안(대안)', walkRelated: true,
        why: '공포된 공소청법의 본체. 대안 자체에는 보고서가 없고 원안 쪽에 있다',
    },
    {
        billNo: '2217595', billId: 'PRC_E2O6I0Q3W1N7J1E9W3M8D5N2U3W8V6', label: '중대범죄수사청법안(대안)', walkRelated: true,
        why: '공포된 중수청법의 본체',
    },
    {
        billNo: '2220257', billId: 'PRC_N2W6S0L7W2J9D1I8A1B1I5I1G6H8F5', label: '형사소송법 일부개정법률안(대안)', walkRelated: true,
        why: '2026-07-31 통과. 의안원문은 이미 보관 중이고 여기서는 보고서를 받는다',
    },
    {
        billNo: '2213247', billId: 'PRC_Y2N5I0A9B1L9R1Q7D4R2I5T8O7H1H3', label: '정부조직법 일부개정법률안(대안)', walkRelated: true,
        why: '검찰청 폐지와 공소청·중수청 신설의 근거인 법률 제21065호. 조직 개편의 출발점이다',
    },
];

/** 받을 문서명. 그 외(의안원문, 위원회제출안 등)는 이미 별도로 보관 중이라 건너뛴다. */
const WANTED_DOC_NAMES = new Set(['심사보고서', '검토보고서']);

/**
 * --originals 대상. 공포된 법(대안)과 그 내용의 뿌리인 원안(정부안/의원안)을 나란히 둔다.
 * 대안은 심사보고서를 갖지 않고(WANTED_DOC_NAMES 문서가 없음), 실제 조문은
 * 의안원문/위원회제출안/위원회의결안/본회의수정안에만 있다. role 로 대안·원안을 구분해
 * 텍스트 헤더에 남긴다 — 둘을 혼동하는 것이 이 수집의 실패 지점이다.
 */
const ORIGINAL_TARGETS = [
    { billNo: '2217594', billId: 'PRC_V2X6E0Z3G1E7L2P0N0A0B4W9O2W3V3', label: '공소청법안(대안)', role: '대안' },
    { billNo: '2217197', billId: 'ARC_U2N6N0X3Z0G3U1K7D3G9G5V5G0W4H1', label: '공소청법안(정부)', role: '원안' },
    { billNo: '2217595', billId: 'PRC_E2O6I0Q3W1N7J1E9W3M8D5N2U3W8V6', label: '중대범죄수사청법안(대안)', role: '대안' },
    { billNo: '2217200', billId: 'ARC_L2R6V0O3Q0N3D1H7S5B7N5M5W1X1Y8', label: '중대범죄수사청법안(정부)', role: '원안' },
    { billNo: '2220257', billId: 'PRC_N2W6S0L7W2J9D1I8A1B1I5I1G6H8F5', label: '형사소송법 일부개정법률안(대안)', role: '대안' },
    { billNo: '2213247', billId: 'PRC_Y2N5I0A9B1L9R1Q7D4R2I5T8O7H1H3', label: '정부조직법 일부개정법률안(대안)', role: '대안' },
];

/** --originals 에서 받을 문서명. */
const WANTED_ORIGINAL_DOC_NAMES = new Set(['의안원문', '위원회제출안', '위원회의결안', '본회의수정안', '체계자구검토보고서']);

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const sanitizeName = (name) => String(name || '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .trim();

/** 1단계: 세션 쿠키 + CSRF 토큰 확보 (실행당 1회) */
const openSession = async () => {
    const res = await fetch(`${BASE}/bill/bi/bill/sch/detailedSchPage.do?detailedTab=billDtl`);
    const cookies = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    const body = await res.text();

    // 속성 순서를 가정하지 않고 name= 과 content=/value= 를 각각 따로 찾는다.
    let csrf = null;
    let m = body.match(/<meta[^>]*name="_csrf"[^>]*content="([^"]*)"/)
        || body.match(/<meta[^>]*content="([^"]*)"[^>]*name="_csrf"/);
    if (m) csrf = m[1];
    if (!csrf) {
        m = body.match(/<input[^>]*name="_csrf"[^>]*value="([^"]*)"/)
            || body.match(/<input[^>]*value="([^"]*)"[^>]*name="_csrf"/);
        if (m) csrf = m[1];
    }

    return { cookies, csrf, status: res.status };
};

/** <form id="form" ...> 안의 모든 hidden input 을 이름-값 쌍으로 파싱한다. 목록을 하드코딩하지 않는다. */
const parseHiddenFields = (html) => {
    const formMatch = html.match(/<form[^>]*\bid="form"[^>]*>([\s\S]*?)<\/form>/);
    if (!formMatch) return null;
    const formHtml = formMatch[1];
    const fields = {};
    for (const tagMatch of formHtml.matchAll(/<input\b[^>]*>/g)) {
        const tag = tagMatch[0];
        const nameM = tag.match(/\bname="([^"]*)"/);
        if (!nameM) continue;
        const valueM = tag.match(/\bvalue="([^"]*)"/);
        fields[nameM[1]] = valueM ? valueM[1] : '';
    }
    return fields;
};

/** 2단계: 법안 상세 페이지 → hidden 필드 + 제목(의안번호/법안명) + 소관위원회 */
const fetchBillDetail = async (session, billId) => {
    const res = await fetch(`${BASE}/bill/bi/billDetailPage.do?billId=${billId}`, {
        headers: { Cookie: session.cookies },
    });
    const body = await res.text();
    const fields = parseHiddenFields(body);

    const h3 = body.match(/<h3[^>]*title="\[([^\]]*)\]\s*([^"]+)"/);
    const billNo = h3 ? h3[1] : null;
    const billName = h3 ? h3[2].trim() : null;

    const cm = body.match(/소관위원회<\/strong>\s*<div[^>]*>\s*([^<]+?)\s*<\/div>/);
    const committee = cm ? cm[1].trim() : null;

    return {
        status: res.status, htmlLen: body.length, fields, billNo, billName, committee,
    };
};

/** 3단계: 문서 목록. FileGate 링크가 있는 <a> 태그를 통째로 파싱한다 (javascript:goDownload(...) 로 감싼 hwp 링크도 있음). */
const parseDocLinks = (html) => {
    const norm = html.replace(/&amp;/g, '&');
    const docs = [];
    for (const tagMatch of norm.matchAll(/<a\b[^>]*>/g)) {
        const tag = tagMatch[0];
        const hrefM = tag.match(/FileGate\?bookId=([0-9A-Fa-f-]+)&type=(\d)/);
        if (!hrefM) continue;
        const titleM = tag.match(/\btitle="([^"]*)"/);
        const rawTitle = titleM ? titleM[1] : '';
        const docName = rawTitle.replace(/\s*\([^()]*다운로드\)\s*$/, '').trim();
        docs.push({ docName, bookId: hrefM[1], type: hrefM[2], rawTitle });
    }
    return docs;
};

const fetchDocList = async (session, billId, fields) => {
    const params = new URLSearchParams(fields);
    const res = await fetch(`${BASE}/bill/bi/bill/detail/billInfo.do`, {
        method: 'POST',
        headers: {
            Cookie: session.cookies,
            'X-CSRF-TOKEN': session.csrf,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: `${BASE}/bill/bi/billDetailPage.do?billId=${billId}`,
        },
        body: params.toString(),
    });
    const body = await res.text();
    return {
        status: res.status, htmlLen: body.length, docs: parseDocLinks(body), html: body,
    };
};

/** 4단계: 대안에 병합된 원안(관련법안) billId 목록 */
const fetchRelatedBillIds = async (session, billId, fields) => {
    const params = new URLSearchParams(fields);
    const res = await fetch(`${BASE}/bill/bi/bill/detail/anBillInfo.do`, {
        method: 'POST',
        headers: {
            Cookie: session.cookies,
            'X-CSRF-TOKEN': session.csrf,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: `${BASE}/bill/bi/billDetailPage.do?billId=${billId}`,
        },
        body: params.toString(),
    });
    const body = await res.text();
    const ids = new Set();
    for (const m of body.matchAll(/data-bill-id="([^"]+)"/g)) {
        if (m[1] && m[1] !== billId) ids.add(m[1]);
    }
    return { status: res.status, htmlLen: body.length, relatedBillIds: [...ids] };
};

/** 5단계: PDF 다운로드. Content-Type 은 항상 application/unknown 이라 매직바이트로 검증한다. */
const downloadPdf = async (bookId) => {
    const url = `${BASE}/filegate/servlet/FileGate?bookId=${bookId}&type=1`;
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentDisposition = res.headers.get('content-disposition') || '';
    const isPdf = buf.slice(0, 5).toString('latin1') === '%PDF-';
    return {
        status: res.status, buf, contentDisposition, isPdf, url,
    };
};

/** pdftotext 우선, 실패하거나 200자 미만이면 pdf-parse 로 재시도한다 (repo-root node_modules 에서 resolve). */
const extractPdfText = async (pdfPath, txtPath) => {
    let text = '';
    let tool = 'pdftotext';
    try {
        execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, txtPath], { stdio: ['ignore', 'ignore', 'pipe'] });
        text = fs.readFileSync(txtPath, 'utf8');
    } catch {
        text = '';
    }

    if (!text || text.trim().length < 200) {
        try {
            const pdfParsePath = require.resolve('pdf-parse', { paths: [path.join(__dirname, '..')] });
            const pdfParse = require(pdfParsePath);
            const data = await pdfParse(fs.readFileSync(pdfPath));
            text = data.text || '';
            tool = 'pdf-parse';
        } catch (e) {
            return {
                ok: false, tool: 'none', text: '', reason: `pdftotext·pdf-parse 모두 실패: ${e.message}`,
            };
        }
    }

    return { ok: true, tool, text };
};

const renderTextHeader = (meta) => {
    const L = [];
    L.push('='.repeat(70));
    L.push(`의안번호  : ${meta.billNo || ''}`);
    L.push(`법안명    : ${meta.billName || ''}`);
    L.push(`문서명    : ${meta.docName || ''}`);
    if (meta.role) L.push(`역할      : ${meta.role}`);
    L.push(`소관위원회: ${meta.committee || ''}`);
    L.push(`billId    : ${meta.billId || ''}`);
    L.push(`출처 URL  : ${meta.sourceUrl || ''}`);
    L.push(`수집일시  : ${meta.collectedAt || ''}`);
    L.push(`추출도구  : ${meta.tool || ''}`);
    L.push('='.repeat(70));
    L.push('');
    return L.join('\n');
};

const collectDocsForBill = async (session, billId, targetLabel) => {
    const detail = await fetchBillDetail(session, billId);
    if (!detail.fields) {
        return {
            billId, ok: false, reason: `상세 페이지에서 <form id="form"> 을 찾지 못함 (HTTP ${detail.status}, len ${detail.htmlLen})`,
        };
    }
    await sleep(400);

    const docRes = await fetchDocList(session, billId, detail.fields);
    return {
        billId,
        ok: true,
        billNo: detail.billNo || detail.fields.billNo || null,
        billName: detail.billName,
        committee: detail.committee,
        targetLabel,
        docs: docRes.docs,
        docListStatus: docRes.status,
        docListLen: docRes.htmlLen,
        docHtml: docRes.html,
        fields: detail.fields,
    };
};

/**
 * billInfo.do 응답 조각에서 회의록 뷰어(record.assembly.go.kr) 링크를 찾는다.
 * <a href="...">텍스트</a> 형태를 우선 파싱하고, 태그 밖에 노출된 URL(onclick 등)도 예비로 훑는다.
 * meetingId 기준으로 중복 제거한다.
 */
const parseMeetingLinks = (html) => {
    const norm = String(html || '').replace(/&amp;/g, '&');
    const links = [];
    const seen = new Set();

    for (const tagMatch of norm.matchAll(/<a\b[^>]*href="([^"]*record\.assembly\.go\.kr[^"]*minutes\/download\/pdf\.do\?[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const href = tagMatch[1];
        const idM = href.match(/[?&]id=([^&"']+)/);
        if (!idM) continue;
        const meetingId = idM[1];
        if (seen.has(meetingId)) continue;
        seen.add(meetingId);
        const tag = tagMatch[0];
        const titleM = tag.match(/\btitle="([^"]*)"/);
        const innerText = tagMatch[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        links.push({
            meetingId, title: titleM ? titleM[1].trim() : '', text: innerText, href,
        });
    }

    for (const urlMatch of norm.matchAll(/https?:\/\/record\.assembly\.go\.kr[^\s"'()<>]*minutes\/download\/pdf\.do\?[^\s"'()<>]*/g)) {
        const href = urlMatch[0];
        const idM = href.match(/[?&]id=([^&"']+)/);
        if (!idM) continue;
        const meetingId = idM[1];
        if (seen.has(meetingId)) continue;
        seen.add(meetingId);
        links.push({
            meetingId, title: '', text: '', href,
        });
    }

    return links;
};

/** 회의록 PDF 다운로드. record.assembly.go.kr 은 세션 대상이 아니고 응답이 느릴 수 있어 타임아웃을 둔다. */
const downloadMeetingPdf = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch(url, { signal: controller.signal });
        const buf = Buffer.from(await res.arrayBuffer());
        const contentType = res.headers.get('content-type') || '';
        const isPdf = buf.slice(0, 5).toString('latin1') === '%PDF-';
        return {
            status: res.status, buf, contentType, isPdf, url, error: null,
        };
    } catch (e) {
        return {
            status: null, buf: Buffer.alloc(0), contentType: null, isPdf: false, url, error: e.message,
        };
    } finally {
        clearTimeout(timer);
    }
};

const runList = async () => {
    const session = await openSession();
    if (!session.cookies || !session.csrf) {
        console.log(`FAIL 세션: 쿠키 또는 CSRF 확보 실패 (HTTP ${session.status})`);
        return;
    }
    console.log(`OK   세션 확보 — CSRF ${session.csrf.slice(0, 8)}...`);

    for (const t of TARGETS) {
        console.log(`\n[${t.label}] billNo=${t.billNo} billId=${t.billId}`);
        const own = await collectDocsForBill(session, t.billId, t.label);
        if (!own.ok) {
            console.log(`  FAIL ${t.billId}: ${own.reason}`);
            continue;
        }
        console.log(`  대안: [${own.billNo}] ${own.billName} | 소관위 ${own.committee || '?'}`);
        own.docs.forEach((d) => console.log(`    - ${d.docName} (type=${d.type}, bookId=${d.bookId})`));

        if (!t.walkRelated) continue;

        await sleep(400);
        const rel = await fetchRelatedBillIds(session, t.billId, own.fields);
        if (!rel.relatedBillIds.length) {
            console.log(`  관련법안 없음 (HTTP ${rel.status}, len ${rel.htmlLen})`);
            continue;
        }
        console.log(`  관련법안 ${rel.relatedBillIds.length}건`);
        for (const relId of rel.relatedBillIds) {
            await sleep(400);
            const relDoc = await collectDocsForBill(session, relId, t.label);
            if (!relDoc.ok) {
                console.log(`    FAIL ${relId}: ${relDoc.reason}`);
                continue;
            }
            console.log(`    - [${relDoc.billNo}] ${relDoc.billName} | 소관위 ${relDoc.committee || '?'}`);
            relDoc.docs.forEach((d) => console.log(`        - ${d.docName} (type=${d.type}, bookId=${d.bookId})`));
        }
    }
};

/**
 * 같은 법안에 같은 문서명(예: 검토보고서)이 두 번 이상 붙는 경우가 실제로 있다
 * (여러 법안을 묶어 병합심사한 보고서가 각 법안 페이지에 별도 bookId 로 걸림).
 * bookId 가 다르면 서로 다른 문서이므로 덮어쓰지 않고 _2, _3 접미사로 구분한다.
 */
const usedBaseNames = new Map();
const resolveBaseName = (base, bookId) => {
    let list = usedBaseNames.get(base);
    if (!list) {
        list = [];
        usedBaseNames.set(base, list);
    }
    let idx = list.indexOf(bookId);
    if (idx === -1) {
        list.push(bookId);
        idx = list.length - 1;
    }
    return idx === 0 ? base : `${base}_${idx + 1}`;
};

const runFetch = async () => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const collectedAt = new Date().toISOString();
    const log = [];

    const session = await openSession();
    if (!session.cookies || !session.csrf) {
        console.log(`FAIL 세션: 쿠키 또는 CSRF 확보 실패 (HTTP ${session.status})`);
        return;
    }
    console.log(`OK   세션 확보 — CSRF ${session.csrf.slice(0, 8)}...`);

    const processBillId = async (billId, targetLabel) => {
        const bill = await collectDocsForBill(session, billId, targetLabel);
        if (!bill.ok) {
            log.push({
                의안번호: null, 법안명: null, 문서명: null, billId, bookId: null, ok: false, reason: bill.reason,
            });
            console.log(`FAIL ${billId}: ${bill.reason}`);
            return;
        }

        const wanted = bill.docs.filter((d) => WANTED_DOC_NAMES.has(d.docName) && d.type === '1');
        if (!wanted.length) {
            console.log(`SKIP [${bill.billNo}] ${bill.billName} — 심사보고서/검토보고서 없음 (문서 ${bill.docs.map((d) => d.docName).join(', ') || '없음'})`);
        }

        for (const doc of wanted) {
            await sleep(400);
            const dl = await downloadPdf(doc.bookId);
            const sourceUrl = dl.url;

            if (dl.status !== 200 || !dl.isPdf) {
                log.push({
                    의안번호: bill.billNo, 법안명: bill.billName, 문서명: doc.docName, billId, bookId: doc.bookId,
                    ok: false, reason: `PDF 아님 또는 다운로드 실패 (HTTP ${dl.status}, bytes ${dl.buf.length}, head "${dl.buf.slice(0, 5).toString('latin1')}")`,
                });
                console.log(`FAIL [${bill.billNo}] ${bill.billName} ${doc.docName}: PDF 검증 실패 (HTTP ${dl.status})`);
                continue;
            }

            const rawBaseName = `${bill.billNo}_${sanitizeName(bill.billName)}_${doc.docName}`;
            const baseName = resolveBaseName(rawBaseName, doc.bookId);
            const pdfPath = path.join(OUT_DIR, `${baseName}.pdf`);
            const txtPath = path.join(OUT_DIR, `${baseName}.txt`);
            fs.writeFileSync(pdfPath, dl.buf);

            const extracted = await extractPdfText(pdfPath, txtPath);
            if (!extracted.ok) {
                log.push({
                    의안번호: bill.billNo, 법안명: bill.billName, 문서명: doc.docName, billId, bookId: doc.bookId,
                    ok: false, pdfBytes: dl.buf.length, reason: extracted.reason, contentDisposition: dl.contentDisposition, file: pdfPath,
                });
                console.log(`FAIL [${bill.billNo}] ${bill.billName} ${doc.docName}: 텍스트 추출 실패 — ${extracted.reason}`);
                continue;
            }

            const header = renderTextHeader({
                billNo: bill.billNo,
                billName: bill.billName,
                docName: doc.docName,
                committee: bill.committee,
                billId,
                sourceUrl,
                collectedAt,
                tool: extracted.tool,
            });
            const finalText = header + extracted.text;
            fs.writeFileSync(txtPath, finalText, 'utf8');

            log.push({
                의안번호: bill.billNo,
                법안명: bill.billName,
                문서명: doc.docName,
                billId,
                bookId: doc.bookId,
                ok: true,
                pdfBytes: dl.buf.length,
                txtChars: extracted.text.length,
                추출도구: extracted.tool,
                contentDisposition: dl.contentDisposition,
                file: pdfPath,
            });
            console.log(`OK   [${bill.billNo}] ${bill.billName} — ${doc.docName} (${dl.buf.length} bytes, 텍스트 ${extracted.text.length}자, ${extracted.tool})`);
        }
    };

    for (const t of TARGETS) {
        console.log(`\n=== ${t.label} (billNo=${t.billNo}) ===`);
        await processBillId(t.billId, t.label);

        if (!t.walkRelated) continue;

        await sleep(400);
        const own = await fetchBillDetail(session, t.billId);
        if (!own.fields) {
            log.push({
                의안번호: t.billNo, 법안명: t.label, 문서명: null, billId: t.billId, bookId: null, ok: false, reason: `관련법안 조회용 hidden 필드 파싱 실패 (HTTP ${own.status})`,
            });
            console.log(`FAIL ${t.billId}: 관련법안 조회용 hidden 필드 파싱 실패`);
            continue;
        }
        await sleep(400);
        const rel = await fetchRelatedBillIds(session, t.billId, own.fields);
        if (!rel.relatedBillIds.length) {
            console.log(`  관련법안 없음 (HTTP ${rel.status}, len ${rel.htmlLen})`);
            continue;
        }
        for (const relId of rel.relatedBillIds) {
            await sleep(400);
            await processBillId(relId, t.label);
        }
    }

    fs.writeFileSync(path.join(OUT_DIR, '_수집로그.json'), JSON.stringify({ collectedAt, log }, null, 2), 'utf8');
    console.log('\n수집로그:', path.join(OUT_DIR, '_수집로그.json'));
};

/**
 * 대안은 심사보고서가 없다(위원회에서 「개정안을 반영하여 대안을 제안」이라고만 적는다).
 * 실제 조문은 대안·원안 각자의 의안원문/위원회제출안/위원회의결안/본회의수정안에 있고,
 * 찬반토론 요지는 회의록에 있다. ORIGINAL_TARGETS 는 대안·원안을 role 로 나란히 둔 목록이므로
 * TARGETS 처럼 walkRelated 로 관련법안을 추적할 필요가 없다 — 각 billId 를 그대로 훑는다.
 */
const runOriginals = async () => {
    fs.mkdirSync(ORIGINAL_OUT_DIR, { recursive: true });
    const meetingDir = path.join(ORIGINAL_OUT_DIR, '회의록');
    fs.mkdirSync(meetingDir, { recursive: true });
    const collectedAt = new Date().toISOString();
    const log = [];

    const session = await openSession();
    if (!session.cookies || !session.csrf) {
        console.log(`FAIL 세션: 쿠키 또는 CSRF 확보 실패 (HTTP ${session.status})`);
        return;
    }
    console.log(`OK   세션 확보 — CSRF ${session.csrf.slice(0, 8)}...`);

    for (const t of ORIGINAL_TARGETS) {
        console.log(`\n=== ${t.label} (billNo=${t.billNo}, 역할=${t.role}) ===`);
        const bill = await collectDocsForBill(session, t.billId, t.label);
        if (!bill.ok) {
            log.push({
                의안번호: t.billNo, 법안명: t.label, 문서명: null, billId: t.billId, bookId: null, 역할: t.role, ok: false, reason: bill.reason,
            });
            console.log(`FAIL ${t.billId}: ${bill.reason}`);
            continue;
        }
        console.log(`  [${bill.billNo}] ${bill.billName} | 소관위 ${bill.committee || '?'}`);

        // 1) 의안원문류 문서
        const wanted = bill.docs.filter((d) => WANTED_ORIGINAL_DOC_NAMES.has(d.docName) && d.type === '1');
        if (!wanted.length) {
            const present = bill.docs.map((d) => d.docName).join(', ') || '없음';
            console.log(`  SKIP [${bill.billNo}] ${bill.billName} — 대상 문서 없음 (문서 ${present})`);
            log.push({
                의안번호: bill.billNo, 법안명: bill.billName, 문서명: null, billId: t.billId, bookId: null, 역할: t.role,
                ok: false, reason: `대상 문서명(의안원문/위원회제출안/위원회의결안/본회의수정안/체계자구검토보고서) 없음. 실제 문서: ${present}`,
            });
        }

        for (const doc of wanted) {
            await sleep(400);
            const dl = await downloadPdf(doc.bookId);
            const sourceUrl = dl.url;

            if (dl.status !== 200 || !dl.isPdf) {
                log.push({
                    의안번호: bill.billNo, 법안명: bill.billName, 문서명: doc.docName, billId: t.billId, bookId: doc.bookId, 역할: t.role,
                    ok: false, reason: `PDF 아님 또는 다운로드 실패 (HTTP ${dl.status}, bytes ${dl.buf.length}, head "${dl.buf.slice(0, 5).toString('latin1')}")`,
                });
                console.log(`  FAIL [${bill.billNo}] ${bill.billName} ${doc.docName}: PDF 검증 실패 (HTTP ${dl.status})`);
                continue;
            }

            const rawBaseName = `${bill.billNo}_${sanitizeName(bill.billName)}_${doc.docName}`;
            const baseName = resolveBaseName(rawBaseName, doc.bookId);
            const pdfPath = path.join(ORIGINAL_OUT_DIR, `${baseName}.pdf`);
            const txtPath = path.join(ORIGINAL_OUT_DIR, `${baseName}.txt`);
            fs.writeFileSync(pdfPath, dl.buf);

            const extracted = await extractPdfText(pdfPath, txtPath);
            if (!extracted.ok) {
                log.push({
                    의안번호: bill.billNo, 법안명: bill.billName, 문서명: doc.docName, billId: t.billId, bookId: doc.bookId, 역할: t.role,
                    ok: false, pdfBytes: dl.buf.length, reason: extracted.reason, contentDisposition: dl.contentDisposition, file: pdfPath,
                });
                console.log(`  FAIL [${bill.billNo}] ${bill.billName} ${doc.docName}: 텍스트 추출 실패 — ${extracted.reason}`);
                continue;
            }

            const header = renderTextHeader({
                billNo: bill.billNo,
                billName: bill.billName,
                docName: doc.docName,
                role: t.role,
                committee: bill.committee,
                billId: t.billId,
                sourceUrl,
                collectedAt,
                tool: extracted.tool,
            });
            fs.writeFileSync(txtPath, header + extracted.text, 'utf8');

            log.push({
                의안번호: bill.billNo,
                법안명: bill.billName,
                문서명: doc.docName,
                billId: t.billId,
                bookId: doc.bookId,
                역할: t.role,
                ok: true,
                pdfBytes: dl.buf.length,
                txtChars: extracted.text.length,
                추출도구: extracted.tool,
                contentDisposition: dl.contentDisposition,
                file: pdfPath,
            });
            console.log(`  OK   [${bill.billNo}] ${bill.billName} — ${doc.docName} (${dl.buf.length} bytes, 텍스트 ${extracted.text.length}자, ${extracted.tool})`);
        }

        // 2) 회의록 링크
        const meetings = parseMeetingLinks(bill.docHtml);
        if (!meetings.length) {
            console.log(`  회의록 링크 없음`);
        }

        for (const meeting of meetings) {
            await sleep(400);
            const meetingName = meeting.title || meeting.text || `회의록_${meeting.meetingId}`;
            const meetingUrl = meeting.href.startsWith('http') ? meeting.href : `${RECORD_BASE}${meeting.href}`;
            const dl = await downloadMeetingPdf(meetingUrl);

            if (!dl.isPdf) {
                const reason = dl.error
                    ? `다운로드 실패: ${dl.error}`
                    : `PDF 아님 (HTTP ${dl.status}, content-type "${dl.contentType}", bytes ${dl.buf.length})`;
                log.push({
                    의안번호: bill.billNo, 법안명: bill.billName, 문서명: '회의록', billId: t.billId, bookId: null, 역할: t.role,
                    meetingId: meeting.meetingId, 회의명: meetingName, ok: false, reason, url: meetingUrl,
                });
                console.log(`  FAIL [${bill.billNo}] 회의록 ${meeting.meetingId} (${meetingName}): ${reason}`);
                continue;
            }

            const meetingBaseName = sanitizeName(`${bill.billNo}_${bill.billName}_회의록_${meeting.meetingId}`);
            const pdfPath = path.join(meetingDir, `${meetingBaseName}.pdf`);
            const txtPath = path.join(meetingDir, `${meetingBaseName}.txt`);
            fs.writeFileSync(pdfPath, dl.buf);

            const extracted = await extractPdfText(pdfPath, txtPath);
            if (!extracted.ok) {
                log.push({
                    의안번호: bill.billNo, 법안명: bill.billName, 문서명: '회의록', billId: t.billId, bookId: null, 역할: t.role,
                    meetingId: meeting.meetingId, 회의명: meetingName, ok: false, pdfBytes: dl.buf.length, reason: extracted.reason, url: meetingUrl, file: pdfPath,
                });
                console.log(`  FAIL [${bill.billNo}] 회의록 ${meeting.meetingId} (${meetingName}): 텍스트 추출 실패 — ${extracted.reason}`);
                continue;
            }

            const header = renderTextHeader({
                billNo: bill.billNo,
                billName: bill.billName,
                docName: `회의록(${meetingName})`,
                role: t.role,
                committee: bill.committee,
                billId: t.billId,
                sourceUrl: meetingUrl,
                collectedAt,
                tool: extracted.tool,
            });
            fs.writeFileSync(txtPath, header + extracted.text, 'utf8');

            log.push({
                의안번호: bill.billNo,
                법안명: bill.billName,
                문서명: '회의록',
                billId: t.billId,
                bookId: null,
                역할: t.role,
                meetingId: meeting.meetingId,
                회의명: meetingName,
                ok: true,
                pdfBytes: dl.buf.length,
                txtChars: extracted.text.length,
                추출도구: extracted.tool,
                url: meetingUrl,
                file: pdfPath,
            });
            console.log(`  OK   [${bill.billNo}] 회의록 ${meeting.meetingId} (${meetingName}) — ${dl.buf.length} bytes, 텍스트 ${extracted.text.length}자, ${extracted.tool}`);
        }
    }

    fs.writeFileSync(path.join(ORIGINAL_OUT_DIR, '_수집로그.json'), JSON.stringify({ collectedAt, log }, null, 2), 'utf8');
    console.log('\n수집로그:', path.join(ORIGINAL_OUT_DIR, '_수집로그.json'));
};

if (process.argv.includes('--fetch')) runFetch();
else if (process.argv.includes('--list')) runList();
else if (process.argv.includes('--originals')) runOriginals();
else console.log('사용법: node collect_bill_reports.cjs --list | --fetch | --originals');
