import { JUDGES_DATA } from './judges.js';

describe('JUDGES_DATA 스키마 검증', () => {
    it('JUDGES_DATA가 비어있지 않은 배열이어야 함', () => {
        expect(Array.isArray(JUDGES_DATA)).toBe(true);
        expect(JUDGES_DATA.length).toBeGreaterThan(0);
    });

    describe('모든 판사에 필수 필드 존재 확인', () => {
        it('모든 판사에 id 필드가 존재하고 문자열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('id');
                expect(typeof judge.id).toBe('string');
                expect(judge.id.length).toBeGreaterThan(0);
            });
        });

        it('모든 판사에 name 필드가 존재하고 비어있지 않아야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('name');
                expect(typeof judge.name).toBe('string');
                expect(judge.name.trim().length).toBeGreaterThan(0);
            });
        });

        it('모든 판사에 category 필드가 존재하고 문자열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('category');
                expect(typeof judge.category).toBe('string');
                expect(judge.category.length).toBeGreaterThan(0);
            });
        });

        it('모든 판사에 court 필드가 존재하고 문자열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('court');
                expect(typeof judge.court).toBe('string');
                expect(judge.court.length).toBeGreaterThan(0);
            });
        });

        it('모든 판사에 position 필드가 존재하고 문자열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('position');
                expect(typeof judge.position).toBe('string');
                expect(judge.position.length).toBeGreaterThan(0);
            });
        });

        it('모든 판사에 photo 필드가 존재하고 문자열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('photo');
                expect(typeof judge.photo).toBe('string');
            });
        });

        it('모든 판사에 rating 필드가 존재하고 숫자이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('rating');
                expect(typeof judge.rating).toBe('number');
            });
        });

        it('모든 판사에 reviewCount 필드가 존재하고 숫자이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('reviewCount');
                expect(typeof judge.reviewCount).toBe('number');
            });
        });

        it('모든 판사에 career 필드가 존재해야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('career');
            });
        });

        it('모든 판사에 cases 필드가 존재해야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('cases');
            });
        });

        it('모든 판사에 justiceEvaluation 필드가 존재해야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge).toHaveProperty('justiceEvaluation');
            });
        });
    });

    describe('id 유니크 확인', () => {
        it('중복된 id가 없어야 함', () => {
            const ids = JUDGES_DATA.map((judge) => judge.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });
    });

    describe('cases 필드 형식 검증 (핵심)', () => {
        it('cases가 배열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(Array.isArray(judge.cases)).toBe(true);
            });
        });

        it('cases의 모든 항목이 { text: string } 형식이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                judge.cases.forEach((caseItem) => {
                    expect(caseItem).toHaveProperty('text');
                    expect(typeof caseItem.text).toBe('string');
                    expect(caseItem.text.length).toBeGreaterThan(0);
                });
            });
        });

        it('cases 항목에 title 키가 없어야 함 (이전 사고 원인)', () => {
            JUDGES_DATA.forEach((judge) => {
                judge.cases.forEach((caseItem) => {
                    expect(caseItem).not.toHaveProperty('title');
                });
            });
        });

        it('cases 항목에 date 키가 없어야 함 (이전 사고 원인)', () => {
            JUDGES_DATA.forEach((judge) => {
                judge.cases.forEach((caseItem) => {
                    expect(caseItem).not.toHaveProperty('date');
                });
            });
        });

        it('cases 항목에 description 키가 없어야 함 (이전 사고 원인)', () => {
            JUDGES_DATA.forEach((judge) => {
                judge.cases.forEach((caseItem) => {
                    expect(caseItem).not.toHaveProperty('description');
                });
            });
        });

        it('cases의 source는 null이거나 문자열이거나 { name, url } 객체이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                judge.cases.forEach((caseItem) => {
                    if (!Object.prototype.hasOwnProperty.call(caseItem, 'source')) {
                        // source 필드가 없는 경우는 허용
                        return;
                    }
                    const { source } = caseItem;
                    if (source === null) {
                        expect(source).toBeNull();
                    } else if (typeof source === 'string') {
                        expect(typeof source).toBe('string');
                    } else {
                        expect(typeof source).toBe('object');
                        expect(source).toHaveProperty('name');
                        expect(source).toHaveProperty('url');
                        expect(typeof source.name).toBe('string');
                        expect(typeof source.url).toBe('string');
                    }
                });
            });
        });
    });

    describe('justiceEvaluation 검증', () => {
        it('모든 판사의 prosecutionScore가 0~100 범위이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                const { prosecutionScore } = judge.justiceEvaluation;
                expect(typeof prosecutionScore).toBe('number');
                expect(prosecutionScore).toBeGreaterThanOrEqual(0);
                expect(prosecutionScore).toBeLessThanOrEqual(100);
            });
        });

        it('모든 판사의 courtScore가 0~100 범위이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                const { courtScore } = judge.justiceEvaluation;
                expect(typeof courtScore).toBe('number');
                expect(courtScore).toBeGreaterThanOrEqual(0);
                expect(courtScore).toBeLessThanOrEqual(100);
            });
        });

        it('모든 판사의 overallScore가 0~100 범위이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                const { overallScore } = judge.justiceEvaluation;
                expect(typeof overallScore).toBe('number');
                expect(overallScore).toBeGreaterThanOrEqual(0);
                expect(overallScore).toBeLessThanOrEqual(100);
            });
        });

        it('모든 판사의 summary가 비어있지 않은 문자열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                const { summary } = judge.justiceEvaluation;
                expect(typeof summary).toBe('string');
                expect(summary.trim().length).toBeGreaterThan(0);
            });
        });

        it('모든 판사의 issues가 배열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(Array.isArray(judge.justiceEvaluation.issues)).toBe(true);
            });
        });

        it('issues의 각 항목에 category, title, description, impact가 존재해야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                judge.justiceEvaluation.issues.forEach((issue) => {
                    expect(issue).toHaveProperty('category');
                    expect(typeof issue.category).toBe('string');
                    expect(issue.category.length).toBeGreaterThan(0);

                    expect(issue).toHaveProperty('title');
                    expect(typeof issue.title).toBe('string');
                    expect(issue.title.length).toBeGreaterThan(0);

                    expect(issue).toHaveProperty('description');
                    expect(typeof issue.description).toBe('string');
                    expect(issue.description.length).toBeGreaterThan(0);

                    expect(issue).toHaveProperty('impact');
                    expect(typeof issue.impact).toBe('string');
                    expect(issue.impact.length).toBeGreaterThan(0);
                });
            });
        });

        it('issues의 category는 "검찰" 또는 "재판부"이어야 함', () => {
            const validCategories = ['검찰', '재판부'];
            JUDGES_DATA.forEach((judge) => {
                judge.justiceEvaluation.issues.forEach((issue) => {
                    expect(validCategories).toContain(issue.category);
                });
            });
        });
    });

    describe('career 배열 검증', () => {
        it('career가 배열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(Array.isArray(judge.career)).toBe(true);
            });
        });

        it('career 배열의 각 항목이 문자열이어야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                judge.career.forEach((item) => {
                    expect(typeof item).toBe('string');
                    expect(item.length).toBeGreaterThan(0);
                });
            });
        });

        it('career 배열이 비어있지 않아야 함', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge.career.length).toBeGreaterThan(0);
            });
        });
    });

    describe('100점 금지 검증', () => {
        it('prosecutionScore가 100이 아니어야 함 (99 이하)', () => {
            JUDGES_DATA.forEach((judge) => {
                expect(judge.justiceEvaluation.prosecutionScore).toBeLessThan(100);
            });
        });
    });
});
