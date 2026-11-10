import { describe, expect, it } from 'vitest';
import { MAGNET_ROWS } from '../fixtures/magnetTable';
import { CONFORMANCE_CASES, type At, type ConformanceCase, type ExpectedState } from './cases';

// 只驗「預期值資料本身」的結構與自洽，不執行 Calendar、不呼叫實作。
// TC-11 的執行器尚未接入共用模組（受阻於 D-11），所以這不是一致性案例的執行結果。
const minutes = (a: At) => a.day * 1440 + Number(a.time.slice(0, 2)) * 60 + Number(a.time.slice(3));
const statesOf = (c: ConformanceCase): ExpectedState[] => [c.expect, ...(c.checkpoints ?? []).map((k) => k.expect)];
const byId = (id: string) => CONFORMANCE_CASES.find((c) => c.id === id)!;
const length = (id: string) => {
  const e = byId(id).expect.events[0]!;
  return minutes(e.end!) - minutes(e.start!);
};

describe('TC-11 conformance expected values (data only, not executed)', () => {
  it('covers CONF-01 to CONF-10 exactly once', () => {
    expect(CONFORMANCE_CASES.map((c) => c.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `CONF-${String(i + 1).padStart(2, '0')}`),
    );
  });

  it('gives every case a spec source and a derivation', () => {
    for (const c of CONFORMANCE_CASES) {
      expect(c.source.length, c.id).toBeGreaterThan(0);
      expect(c.source.every((s) => /^(REUSE-\d\d|AC-\d\d\.\d+|INV-\d\d|OR-\d\d)$/.test(s)), c.id).toBe(true);
      expect(c.derivation.length, c.id).toBeGreaterThan(0);
    }
  });

  it('uses well-formed times, positive durations and history lengths within 0..100', () => {
    for (const c of CONFORMANCE_CASES) {
      for (const s of statesOf(c)) {
        expect(s.pastLength, c.id).toBeGreaterThanOrEqual(0);
        expect(s.pastLength, c.id).toBeLessThanOrEqual(100);
        expect(s.futureLength, c.id).toBeGreaterThanOrEqual(0);
        for (const e of s.events) {
          for (const at of [e.start, e.end]) {
            if (at) expect(at.time, c.id).toMatch(/^([01]\d|2[0-3]):[0-5]\d$/);
          }
          if (e.start && e.end) expect(minutes(e.end) - minutes(e.start), c.id).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps the hand-calculated durations: CONF-01 = 150, CONF-07 = 1, CONF-08 = 120 minutes', () => {
    expect(length('CONF-01')).toBe(150);
    expect(length('CONF-07')).toBe(1);
    expect(length('CONF-08')).toBe(120);
  });

  it('lists spec gaps as open questions instead of guessing', () => {
    expect(CONFORMANCE_CASES.filter((c) => c.openQuestion).map((c) => c.id)).toEqual(['CONF-07', 'CONF-10']);
  });

  it('marks only CONF-06 as blocked (by 015) with 101 steps and a cap of 100', () => {
    expect(CONFORMANCE_CASES.filter((c) => c.blocked).map((c) => c.id)).toEqual(['CONF-06']);
    const c = byId('CONF-06');
    expect(c.blocked).toContain('015');
    expect(c.steps).toHaveLength(101);
    expect(c.expect.pastLength).toBe(100);
  });

  it('has the ENG-MAG table available for the same runner (REUSE-01)', () => {
    expect(MAGNET_ROWS.length).toBeGreaterThan(0);
  });
});
