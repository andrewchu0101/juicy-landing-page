import { describe, expect, it } from 'vitest';
import { formatTime, formatTimeRange, formatWeekday, fillTemplate, resolveHour12 } from '../src/trial/format';

// 時間與日期的顯示（FR-10、SRS R-7）。預期值來自 formatTime 的規格註解與人工算例，不呼叫實作算答案：
// 12 小時制只在 12 小時時才有上午／下午；繁體 `下午 1:05`、英文 `1:05 PM`；午夜繁體 `上午 12:00`、正午 `下午 12:00`；24 小時制補零。
const at = (h: number, m = 0) => new Date(2026, 10, 11, h, m);

describe('formatTime', () => {
  it.each([
    [at(13, 5), 'zh-TW', true, '下午 1:05'],
    [at(13, 5), 'en', true, '1:05 PM'],
    [at(0, 0), 'zh-TW', true, '上午 12:00'],
    [at(12, 0), 'zh-TW', true, '下午 12:00'],
    [at(0, 0), 'en', true, '12:00 AM'],
    [at(12, 0), 'en', true, '12:00 PM'],
    [at(9, 7), 'zh-TW', false, '09:07'],
    [at(9, 7), 'en', false, '09:07'],
    [at(15, 0), 'en', false, '15:00'],
  ] as const)('%s in %s (hour12 %s) → %s', (date, language, hour12, expected) => {
    expect(formatTime(date, { language, hour12 })).toBe(expected);
  });
});

describe('formatTimeRange', () => {
  const event = { startAt: at(10, 30).toISOString(), endAt: at(12, 30).toISOString() };
  it('joins both ends with an en dash', () => {
    expect(formatTimeRange(event, { language: 'en', hour12: false })).toBe('10:30–12:30');
    expect(formatTimeRange(event, { language: 'en', hour12: true })).toBe('10:30 AM–12:30 PM');
    expect(formatTimeRange(event, { language: 'zh-TW', hour12: true })).toBe('上午 10:30–下午 12:30');
  });
});

describe('resolveHour12', () => {
  it('follows the system setting when known, else the browser hour cycle, else 24h', () => {
    expect(resolveHour12(true, 'h23')).toBe(true);
    expect(resolveHour12(false, 'h12')).toBe(false);
    expect(resolveHour12(null, 'h12')).toBe(true);
    expect(resolveHour12(null, 'h11')).toBe(true);
    expect(resolveHour12(null, 'h23')).toBe(false);
    expect(resolveHour12(null, undefined)).toBe(false);
  });
});

describe('formatWeekday', () => {
  it('writes the day header weekday in the page language (2026-11-11 is a Wednesday)', () => {
    expect(formatWeekday(at(0), 'zh-TW')).toBe('週三');
    expect(formatWeekday(at(0), 'en')).toBe('Wed');
  });
});

describe('fillTemplate', () => {
  it('replaces {name} style placeholders and leaves unknown ones alone', () => {
    expect(fillTemplate('Drag {name} onto {where}', { name: 'Focus' })).toBe('Drag Focus onto {where}');
    expect(fillTemplate('有 {count} 個事件', { count: 3 })).toBe('有 3 個事件');
  });
});
