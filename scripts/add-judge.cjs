#!/usr/bin/env node
'use strict';

/**
 * add-judge.cjs
 * Automates adding a new judge entry to src/data/judges.js
 *
 * Usage:
 *   node scripts/add-judge.cjs --name "백대현" --category "내란전담재판부" \
 *     --court "서울중앙지방법원" --position "형사합의35부 부장판사"
 *
 *   Or run without arguments for interactive prompts.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Korean romanization lookup tables
// ---------------------------------------------------------------------------

// Common Korean family names → romanized form
const SURNAME_MAP = {
    '가': 'ga', '강': 'kang', '고': 'ko', '곽': 'kwak', '구': 'ku',
    '권': 'kwon', '김': 'kim', '나': 'na', '남': 'nam', '노': 'no',
    '도': 'do', '류': 'ryu', '문': 'moon', '민': 'min', '박': 'park',
    '방': 'bang', '배': 'bae', '백': 'baek', '변': 'byun', '서': 'seo',
    '석': 'seok', '성': 'sung', '손': 'son', '송': 'song', '신': 'shin',
    '심': 'shim', '안': 'ahn', '양': 'yang', '여': 'yeo', '오': 'oh',
    '우': 'woo', '원': 'won', '유': 'yoo', '윤': 'yoon', '이': 'lee',
    '임': 'lim', '장': 'jang', '전': 'jeon', '정': 'jung', '조': 'jo',
    '주': 'joo', '지': 'ji', '진': 'jin', '차': 'cha', '채': 'chae',
    '천': 'cheon', '최': 'choi', '추': 'chu', '탁': 'tak', '한': 'han',
    '허': 'heo', '홍': 'hong', '황': 'hwang', '함': 'ham', '형': 'hyung',
    '호': 'ho', '화': 'hwa', '희': 'hee',
};

// Syllable-level romanization for given names (Revised Romanization)
const SYLLABLE_MAP = {
    // ㄱ onset
    '가': 'ga', '각': 'gak', '간': 'gan', '갈': 'gal', '감': 'gam', '강': 'gang',
    '개': 'gae', '거': 'geo', '건': 'geon', '걸': 'geol', '검': 'geom', '겸': 'gyeom',
    '경': 'gyeong', '계': 'gye', '고': 'go', '곤': 'gon', '공': 'gong', '관': 'gwan',
    '광': 'gwang', '교': 'gyo', '구': 'gu', '국': 'guk', '군': 'gun', '권': 'gwon',
    '규': 'gyu', '근': 'geun', '기': 'gi', '길': 'gil', '김': 'gim',
    // ㄴ onset
    '나': 'na', '남': 'nam', '내': 'nae', '녀': 'nyeo', '년': 'nyeon', '노': 'no',
    '녹': 'nok', '농': 'nong', '누': 'nu', '는': 'neun',
    // ㄷ onset
    '다': 'da', '단': 'dan', '달': 'dal', '담': 'dam', '대': 'dae', '덕': 'deok',
    '도': 'do', '동': 'dong', '두': 'du', '득': 'deuk',
    // ㄹ onset (treated as r at onset)
    '라': 'ra', '래': 'rae', '랑': 'rang', '령': 'ryeong', '로': 'ro', '록': 'rok',
    '롱': 'rong', '류': 'ryu', '륜': 'ryun', '르': 're', '리': 'ri',
    // ㅁ onset
    '마': 'ma', '만': 'man', '명': 'myeong', '모': 'mo', '목': 'mok', '몽': 'mong',
    '무': 'mu', '문': 'mun', '미': 'mi', '민': 'min',
    // ㅂ onset
    '바': 'ba', '박': 'bak', '반': 'ban', '방': 'bang', '배': 'bae', '백': 'baek',
    '범': 'beom', '보': 'bo', '복': 'bok', '봉': 'bong', '부': 'bu', '북': 'buk',
    '분': 'bun', '비': 'bi', '빈': 'bin',
    // ㅅ onset
    '사': 'sa', '삼': 'sam', '상': 'sang', '새': 'sae', '선': 'seon', '성': 'seong',
    '세': 'se', '소': 'so', '속': 'sok', '송': 'song', '수': 'su', '순': 'sun',
    '숙': 'suk', '승': 'seung', '시': 'si', '식': 'sik', '신': 'sin', '심': 'sim',
    // ㅇ onset (vowel-initial)
    '아': 'a', '안': 'an', '앙': 'ang', '애': 'ae', '야': 'ya', '양': 'yang',
    '어': 'eo', '언': 'eon', '여': 'yeo', '연': 'yeon', '영': 'yeong', '예': 'ye',
    '오': 'o', '온': 'on', '완': 'wan', '왕': 'wang', '요': 'yo', '용': 'yong',
    '우': 'u', '욱': 'uk', '운': 'un', '원': 'won', '월': 'wol', '위': 'wi',
    '유': 'yu', '육': 'yuk', '윤': 'yun', '은': 'eun', '음': 'eum', '의': 'ui',
    '이': 'i', '익': 'ik', '인': 'in', '일': 'il', '임': 'im',
    // ㅈ onset
    '자': 'ja', '재': 'jae', '전': 'jeon', '정': 'jeong', '제': 'je', '조': 'jo',
    '종': 'jong', '주': 'ju', '준': 'jun', '중': 'jung', '지': 'ji', '진': 'jin',
    '집': 'jip',
    // ㅊ onset
    '차': 'cha', '찬': 'chan', '창': 'chang', '채': 'chae', '철': 'cheol',
    '청': 'cheong', '초': 'cho', '총': 'chong', '최': 'choe', '추': 'chu',
    '춘': 'chun', '충': 'chung', '치': 'chi',
    // ㅎ onset
    '하': 'ha', '학': 'hak', '한': 'han', '해': 'hae', '혁': 'hyeok', '현': 'hyeon',
    '형': 'hyeong', '호': 'ho', '홍': 'hong', '화': 'hwa', '환': 'hwan', '황': 'hwang',
    '효': 'hyo', '후': 'hu', '훈': 'hun', '희': 'hui',
    // ㅋ onset
    '카': 'ka', '쾌': 'kwae',
    // ㅌ onset
    '타': 'ta', '탁': 'tak', '태': 'tae', '통': 'tong', '특': 'teuk',
    // ㅍ onset
    '파': 'pa', '팔': 'pal', '평': 'pyeong', '포': 'po', '풍': 'pung',
};

/**
 * Romanize a Korean name.
 * The first syllable is the family name (SURNAME_MAP), the rest is the given
 * name (SYLLABLE_MAP). Unknown syllables fall back to u#### hex placeholders.
 *
 * @param {string} koreanName  Full Korean name, e.g. "백대현"
 * @returns {string}           Romanized slug, e.g. "baek-daehyeon"
 */
function romanizeName(koreanName) {
    const trimmed = koreanName.trim();
    if (!trimmed) return 'unknown';

    const chars = [...trimmed]; // split by Unicode code point
    if (chars.length === 0) return 'unknown';

    const surnameSyllable = chars[0];
    const surnameRoman = SURNAME_MAP[surnameSyllable]
        || SYLLABLE_MAP[surnameSyllable]
        || `u${surnameSyllable.codePointAt(0).toString(16)}`;

    const givenSyllables = chars.slice(1);
    const givenRoman = givenSyllables
        .map(ch => SYLLABLE_MAP[ch] || `u${ch.codePointAt(0).toString(16)}`)
        .join('');

    if (!givenRoman) return surnameRoman;
    return `${surnameRoman}-${givenRoman}`;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith('--')) {
            const key = argv[i].slice(2);
            const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : '';
            args[key] = value;
            if (value) i++;
        }
    }
    return args;
}

// ---------------------------------------------------------------------------
// Interactive prompting
// ---------------------------------------------------------------------------

async function prompt(rl, question, defaultValue) {
    return new Promise(resolve => {
        const suffix = defaultValue ? ` [${defaultValue}]: ` : ': ';
        rl.question(question + suffix, answer => {
            resolve(answer.trim() || defaultValue || '');
        });
    });
}

async function collectInteractive(existing) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\n=== 새 판사 추가 (대화형 입력) ===\n');

    const name        = existing.name        || await prompt(rl, '판사 이름 (한국어)', '');
    const category    = existing.category    || await prompt(rl, '카테고리 (예: 내란전담재판부)', '내란전담재판부');
    const court       = existing.court       || await prompt(rl, '법원 (예: 서울중앙지방법원)', '서울중앙지방법원');
    const position    = existing.position    || await prompt(rl, '직위 (예: 형사합의35부 부장판사)', '');
    const appointedBy = existing.appointedBy || await prompt(rl, '임명권자 (비워두면 빈 문자열)', '');

    rl.close();
    return { name, category, court, position, appointedBy };
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

/**
 * Generate the JS source text for a single judge entry (4-space indent, matching
 * the existing file style exactly).
 */
function generateJudgeEntry(fields) {
    const { id, name, category, court, position, appointedBy } = fields;
    const photo = `/${name}.png`;

    return `    {
        id: '${id}',
        name: '${name}',
        category: '${category}',
        court: '${court}',
        position: '${position}',
        appointedBy: '${appointedBy}',
        photo: '${photo}',
        rating: 0,
        reviewCount: 0,
        career: [
            // TODO: 경력 정보 추가
        ],
        cases: [
            // TODO: 주요 판결 추가
        ],
        justiceEvaluation: {
            prosecutionScore: 0,
            courtScore: 0,
            overallScore: 0,
            summary: '',
            issues: []
        }
    }`;
}

// ---------------------------------------------------------------------------
// Insertion logic
// ---------------------------------------------------------------------------

/**
 * Find the 0-based line index at which to insert the new judge entry.
 *
 * Approach:
 *   Top-level judge object fields use exactly 8-space indentation:
 *     "        category: 'XXX',"
 *   Fields nested inside issues[] objects use 16-space indentation:
 *     "                    category: 'XXX',"
 *   So we only match lines whose leading whitespace is exactly 8 spaces.
 *
 *   Algorithm:
 *     1. Scan every line for the pattern /^        category: 'TARGET',/.
 *     2. When found, record the line index; mark that we are in a target entry.
 *     3. When we exit the target entry (detect the next top-level object open
 *        at 4-space indent, OR the category line changes to a different category
 *        at 8-space indent), record the end of the last seen target entry.
 *
 *   "End of entry" = the line `    },` or `    }` that closes the top-level
 *   object. We find it by scanning forward from the category line until we hit
 *   a line matching /^    \}[,]?\s*$/.
 *
 *   The insertion point is the line AFTER that closing line.
 *
 * @param {string[]} lines
 * @param {string}   targetCategory
 * @returns {number}  0-based insertion line index
 */
function findInsertionLine(lines, targetCategory) {
    // Regex for a TOP-LEVEL (8-space) category field
    const topCatRe = /^        category: '(.+)',\s*$/;

    let lastInsertionIdx = -1; // line index AFTER the last matching entry's closing brace

    let i = 0;
    while (i < lines.length) {
        const m = lines[i].match(topCatRe);
        if (m && m[1] === targetCategory) {
            // We're inside an entry that belongs to our target category.
            // Scan forward to find the closing brace of THIS entry.
            // The closing brace is the next line matching /^    \}[,]?\s*$/ after
            // we have descended at least one level (i.e., after we pass the opening
            // `    {` that started this entry, which is somewhere BEFORE line i).
            //
            // Because the file is well-structured we can simply scan upward to
            // find the opening `    {` of this entry, then scan forward to its
            // matching `    },` by counting only LINES that start a top-level
            // object or close a top-level object.

            // Find the opening `    {` at or before line i
            let entryOpen = i;
            while (entryOpen > 0 && !/^    \{/.test(lines[entryOpen])) {
                entryOpen--;
            }

            // Now scan forward from entryOpen to find the matching close.
            // We count only top-level braces (lines starting with exactly 4 spaces
            // followed by `{` or `}`), since inner braces are deeper-indented.
            let depth = 0;
            let closeIdx = -1;
            for (let j = entryOpen; j < lines.length; j++) {
                if (/^    \{/.test(lines[j])) {
                    depth++;
                } else if (/^    \}/.test(lines[j])) {
                    depth--;
                    if (depth === 0) {
                        closeIdx = j;
                        break;
                    }
                }
            }

            if (closeIdx !== -1) {
                // The new entry should be inserted AFTER this closing line
                lastInsertionIdx = closeIdx + 1;
            }
        }
        i++;
    }

    if (lastInsertionIdx !== -1) {
        return lastInsertionIdx;
    }

    // Category not found: insert before the closing `];` of the array
    for (let k = lines.length - 1; k >= 0; k--) {
        if (lines[k].trimEnd() === '];') {
            return k;
        }
    }

    return lines.length - 1;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    const cliArgs = parseArgs(process.argv.slice(2));

    // Determine if we need interactive mode
    const needsInteractive = !cliArgs.name;

    let fields;
    if (needsInteractive) {
        fields = await collectInteractive(cliArgs);
    } else {
        fields = {
            name:        cliArgs.name        || '',
            category:    cliArgs.category    || '내란전담재판부',
            court:       cliArgs.court       || '',
            position:    cliArgs.position    || '',
            appointedBy: cliArgs.appointedBy || '',
        };
    }

    const { name, category, court, position, appointedBy } = fields;

    if (!name) {
        console.error('오류: 판사 이름(--name)은 필수입니다.');
        process.exit(1);
    }

    // Generate romanized ID
    const id = romanizeName(name);

    console.log(`\n생성될 ID: ${id}`);
    console.log(`이름: ${name}`);
    console.log(`카테고리: ${category}`);
    console.log(`법원: ${court}`);
    console.log(`직위: ${position}`);
    console.log(`임명권자: ${appointedBy || '(없음)'}`);

    // Resolve path to judges.js
    const judgesPath = path.resolve(__dirname, '../src/data/judges.js');

    if (!fs.existsSync(judgesPath)) {
        console.error(`\n오류: judges.js 파일을 찾을 수 없습니다.\n경로: ${judgesPath}`);
        process.exit(1);
    }

    const original = fs.readFileSync(judgesPath, 'utf8');
    const lines = original.split('\n');

    // Check for duplicate ID
    const dupIdRe = new RegExp(`\\bid:\\s*'${id}'`);
    if (dupIdRe.test(original)) {
        console.error(`\n오류: 이미 동일한 ID('${id}')를 가진 판사가 있습니다.`);
        console.error('이름 중복 또는 romanization 충돌을 확인하세요.');
        process.exit(1);
    }

    // Check for duplicate Korean name
    const dupNameRe = new RegExp(`\\bname:\\s*'${name}'`);
    if (dupNameRe.test(original)) {
        console.warn(`\n경고: 이미 동일한 이름('${name}')을 가진 판사가 있습니다.`);
        console.warn('동명이인일 경우 --id 옵션으로 별도 ID를 지정하는 것을 권장합니다.\n');
    }

    // Generate the entry source text
    const entrySource = generateJudgeEntry({ id, name, category, court, position, appointedBy });

    // Find insertion point
    const insertAt = findInsertionLine(lines, category);

    // Determine whether the line just before insertAt is a no-comma closing brace
    // (i.e., the current last array element `    }` without a trailing comma).
    // If so, we must add a comma to that line and NOT add a trailing comma to
    // our new entry (it becomes the new last element).
    // Otherwise we add a trailing comma to our new entry.
    const prevLine = lines[insertAt - 1] !== undefined ? lines[insertAt - 1] : '';
    const prevIsNakedClose = /^    \}\s*$/.test(prevLine);

    let blockText;
    if (prevIsNakedClose) {
        // Patch the previous closing brace to have a comma
        lines[insertAt - 1] = '    },';
        // New entry is the new last element — no trailing comma
        blockText = entrySource;
    } else {
        // Inserting in the middle: trailing comma required
        blockText = entrySource + ',';
    }

    const insertLines = blockText.split('\n');

    // Insert into the lines array
    lines.splice(insertAt, 0, ...insertLines);

    // Write back (preserve original line ending style)
    const updated = lines.join('\n');
    fs.writeFileSync(judgesPath, updated, 'utf8');

    console.log(`\n완료! ${judgesPath} 에 새 항목이 삽입되었습니다.`);
    console.log(`삽입 위치: 줄 ${insertAt + 1} (카테고리: ${category})\n`);

    // Reminder checklist
    console.log('='.repeat(60));
    console.log('  다음 항목을 수동으로 채워야 합니다:');
    console.log('='.repeat(60));
    console.log(`  [ ] career  경력 정보 추가`);
    console.log(`  [ ] cases   주요 판결 추가`);
    console.log(`  [ ] justiceEvaluation  사법정의평가 작성`);
    console.log(`        - prosecutionScore`);
    console.log(`        - courtScore`);
    console.log(`        - overallScore`);
    console.log(`        - summary`);
    console.log(`        - issues[]`);
    console.log(`  [ ] photo   이미지 파일을 public/${name}.png 에 추가`);
    console.log('='.repeat(60));
    console.log(`\n  ID: '${id}'  →  src/data/judges.js 에서 검색하세요.\n`);
}

main().catch(err => {
    console.error('예기치 않은 오류:', err);
    process.exit(1);
});
