import { describe, it, expect } from 'vitest';
import { TRIAL_EVENTS, EVENT_CATEGORIES, CASE_GROUPS } from './trialSchedule';

// 재판 일정 데이터 스키마 검증.
// 목적: trialSchedule.js 갱신 시 category/group 키 오타가 들어가면
//       TrialSchedule.jsx 캘린더가 런타임에 흰 화면으로 깨지므로(키→undefined.dot),
//       그 전에 CI에서 차단한다.
describe('trialSchedule 데이터 스키마', () => {
    it('TRIAL_EVENTS는 비어있지 않은 배열이어야 함', () => {
        expect(Array.isArray(TRIAL_EVENTS)).toBe(true);
        expect(TRIAL_EVENTS.length).toBeGreaterThan(0);
    });

    it('모든 이벤트의 category 키가 EVENT_CATEGORIES에 존재해야 함', () => {
        TRIAL_EVENTS.forEach((e) => {
            expect(EVENT_CATEGORIES).toHaveProperty(e.category);
        });
    });

    it('모든 이벤트의 group 키가 CASE_GROUPS에 존재해야 함', () => {
        TRIAL_EVENTS.forEach((e) => {
            expect(CASE_GROUPS).toHaveProperty(e.group);
        });
    });

    it('date는 null이거나 YYYY-MM-DD 형식이어야 함', () => {
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        TRIAL_EVENTS.forEach((e) => {
            if (e.date === null) {
                // 미정/예상 일정은 approxLabel을 가져야 함
                expect(typeof e.approxLabel).toBe('string');
            } else {
                expect(e.date).toMatch(dateRe);
                // 실제 유효한 날짜인지 (예: 2026-02-30 같은 값 차단)
                expect(Number.isNaN(new Date(e.date + 'T00:00:00').getTime())).toBe(false);
            }
        });
    });

    it('id는 모두 존재하고 유니크해야 함 (React key 충돌 방지)', () => {
        const ids = TRIAL_EVENTS.map((e) => e.id);
        ids.forEach((id) => expect(typeof id).toBe('string'));
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('필수 표시 필드(title, court, judge)가 문자열이어야 함', () => {
        TRIAL_EVENTS.forEach((e) => {
            expect(typeof e.title).toBe('string');
            expect(typeof e.court).toBe('string');
            expect(typeof e.judge).toBe('string');
        });
    });

    it('source는 name(문자열)과 url(문자열 또는 null)을 가져야 함', () => {
        TRIAL_EVENTS.forEach((e) => {
            expect(e.source).toBeTruthy();
            expect(typeof e.source.name).toBe('string');
            expect(e.source.url === null || typeof e.source.url === 'string').toBe(true);
        });
    });

    it('EVENT_CATEGORIES/CASE_GROUPS의 각 항목은 label과 색상 클래스를 가져야 함', () => {
        Object.values(EVENT_CATEGORIES).forEach((c) => {
            expect(typeof c.label).toBe('string');
            expect(typeof c.badge).toBe('string');
            expect(typeof c.dot).toBe('string');
        });
        Object.values(CASE_GROUPS).forEach((g) => {
            expect(typeof g.label).toBe('string');
            expect(typeof g.badge).toBe('string');
        });
    });
});
