import { describe, expect, it } from 'vitest';
import { MAGNET_ROWS } from './fixtures/magnetTable';
import {
  EVENT_MIN_MINUTES,
  NEW_EVENT_MINUTES,
  RADIAL_ENTER_MS,
  RADIAL_LONG_PRESS_MS,
  RADIAL_MOVE_TOLERANCE_PX,
} from '../src/trial/engine/limits';
import { formatDuration, moveEvent, newEventTimes } from '../src/trial/engine/mutations';
import {
  columnIndexAt,
  magnetMinutes,
  pointerToTime,
  radialBalls,
  radialHit,
  radialRing,
  radialStep,
  splitParticles,
  visibleFeedbackPoint,
} from '../src/trial/engine/pointer';
import { hiddenEventCounts, layoutSegments } from '../src/trial/engine/layout';
import { columnMinutesToDate, hourMarks, minutesFromColumnStart, timelineSpanMinutes } from '../src/trial/engine/timeline';

// 預期值來自 SRS 沿用登記表 REUSE-01～04、REUSE-11 與人工算例（見各案例註解），不呼叫實作去算答案。
// 規則的出處是 Calendar v0.2.0-beta.3（固定 commit 102ae19…）的純函式；這裡驗網站自己的實作與規格一致。
const timeline = { startHour: 10, endHour: 15, pixelsPerMinute: 1 };
const day = new Date(2026, 10, 11); // 本地 2026-11-11 00:00
const at = (h: number, m = 0) => new Date(2026, 10, 11, h, m);

describe('constants (limits.ts is the single source)', () => {
  it('uses the Calendar values', () => {
    expect(NEW_EVENT_MINUTES).toBe(120);
    expect(EVENT_MIN_MINUTES).toBe(1);
    expect(RADIAL_LONG_PRESS_MS).toBe(250);
    expect(RADIAL_MOVE_TOLERANCE_PX).toBe(6);
    expect(RADIAL_ENTER_MS).toBe(120);
  });
});

describe('timeline (REUSE-11: visible range 10:00–15:00)', () => {
  it('spans 300 minutes and labels 5 hours', () => {
    expect(timelineSpanMinutes(timeline)).toBe(300);
    expect(hourMarks(timeline).map((mark) => mark.label)).toEqual(['10:00', '11:00', '12:00', '13:00', '14:00']);
  });

  it('wraps past midnight and treats equal hours as 24h', () => {
    expect(timelineSpanMinutes({ startHour: 22, endHour: 2, pixelsPerMinute: 1 })).toBe(240);
    expect(timelineSpanMinutes({ startHour: 8, endHour: 8, pixelsPerMinute: 1 })).toBe(1440);
  });

  it('measures minutes from the column start and converts back', () => {
    expect(minutesFromColumnStart(at(12, 30), day, timeline)).toBe(150);
    expect(minutesFromColumnStart(at(9, 0), day, timeline)).toBe(-60);
    expect(columnMinutesToDate(day, 150, timeline).getTime()).toBe(at(12, 30).getTime());
    expect(columnMinutesToDate(day, 400, timeline).getTime()).toBe(at(16, 40).getTime());
  });
});

describe('REUSE-01 magnet: within 8 screen pixels of a half hour', () => {
  it.each([
    // [minutes, pixelsPerMinute, enabled, expected]
    [123, 1, true, 120], // 離 120 差 3 分鐘 ≤ 8
    [128, 1, true, 120], // 差 8，剛好吸附
    [129, 1, true, 129], // 差 9 > 8，不吸附
    [135, 1, true, 135], // 135/30 = 4.5 進位到 150，差 15 > 8
    [124, 2, true, 120], // 每分鐘 2 像素：差 4 分鐘 = 8 像素
    [125, 2, true, 125], // 差 5 分鐘 = 10 像素
    [123, 1, false, 123], // 關閉磁吸
  ])('magnetMinutes(%f, ppm %f, %s) = %f', (minutes, ppm, enabled, expected) => {
    expect(magnetMinutes(minutes, ppm, enabled)).toBe(expected);
  });
});

describe('pointerToTime (REUSE-01, REUSE-02)', () => {
  const geometry = { left: 0, top: 100, columnWidth: 300, columnCount: 1 };

  it('snaps to 12:30 when the pointer is 3 minutes away', () => {
    expect(pointerToTime({ x: 50, y: 247 }, geometry, [day], timeline, { magnetEnabled: true }).getTime()).toBe(at(12, 30).getTime());
  });

  it('keeps the exact minute when farther than 8 minutes from a half hour', () => {
    expect(pointerToTime({ x: 50, y: 240 }, geometry, [day], timeline, { magnetEnabled: true }).getTime()).toBe(at(12, 20).getTime());
  });

  it('rounds .5 up to a whole minute when not snapped', () => {
    expect(pointerToTime({ x: 50, y: 100.5 + 16 }, geometry, [day], timeline).getTime()).toBe(at(10, 17).getTime());
  });

  it('clamps to the visible range unless overflow is allowed', () => {
    expect(pointerToTime({ x: 50, y: 50 }, geometry, [day], timeline).getTime()).toBe(at(10, 0).getTime());
    expect(pointerToTime({ x: 50, y: 500 }, geometry, [day], timeline).getTime()).toBe(at(15, 0).getTime());
    expect(pointerToTime({ x: 50, y: 500 }, geometry, [day], timeline, { allowOverflow: true }).getTime()).toBe(at(16, 40).getTime());
  });

  it('picks the column by x and clamps it', () => {
    const two = { left: 100, top: 0, columnWidth: 50, columnCount: 2 };
    expect(columnIndexAt(110, two)).toBe(0);
    expect(columnIndexAt(160, two)).toBe(1);
    expect(columnIndexAt(10, two)).toBe(0);
    expect(columnIndexAt(999, two)).toBe(1);
  });
});

describe('REUSE-02 create / REUSE-03 move', () => {
  it('a new block is 120 minutes long from the start', () => {
    expect(newEventTimes(at(12, 30))).toEqual({ startAt: at(12, 30).toISOString(), endAt: at(14, 30).toISOString() });
  });

  it('AC-01.7: 10:00–12:00 grabbed 20 minutes in, released at 12:50 → 12:30–14:30 (length unchanged)', () => {
    const event = { startAt: at(10, 0).toISOString(), endAt: at(12, 0).toISOString() };
    const grabOffsetMs = 20 * 60_000;
    const edge = new Date(at(12, 50).getTime() - grabOffsetMs); // 12:30
    expect(moveEvent(event, edge, 0)).toEqual({ startAt: at(12, 30).toISOString(), endAt: at(14, 30).toISOString() });
  });

  it('formats durations like the drag chip', () => {
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(150)).toBe('2h 30m');
    expect(formatDuration(45)).toBe('45m');
  });
});

describe('layoutSegments (REUSE-11: blocks may run past the visible range)', () => {
  const ev = (id: string, from: Date, to: Date) => ({ id, startAt: from.toISOString(), endAt: to.toISOString() });

  it('places 10:00–12:00 at the top, 120px tall, with both resize ends', () => {
    expect(layoutSegments([ev('a', at(10), at(12))], [day], timeline)).toEqual([
      { key: 'a:0', eventId: 'a', columnIndex: 0, top: 0, height: 120, lane: 0, laneCount: 1, isStart: true, isEnd: true },
    ]);
  });

  it('clips a block that runs past 15:00 and marks it as continuing', () => {
    const [segment] = layoutSegments([ev('a', at(14, 30), at(16, 30))], [day], timeline);
    expect(segment).toMatchObject({ top: 270, height: 30, isStart: true, isEnd: false });
  });

  it('puts overlapping blocks side by side without changing their times', () => {
    const segments = layoutSegments([ev('a', at(10), at(12)), ev('b', at(11), at(13))], [day], timeline);
    expect(segments.map((segment) => [segment.eventId, segment.lane, segment.laneCount])).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
    ]);
  });

  it('counts a block that starts at 15:00 as hidden (outside the visible hours)', () => {
    expect(hiddenEventCounts([ev('a', at(15), at(17))], [day], timeline)).toEqual([1]);
    expect(hiddenEventCounts([ev('a', at(14), at(16))], [day], timeline)).toEqual([0]);
  });
});

describe('radial palette geometry (PRD AC-01.4)', () => {
  it('keeps the ring at radius 76 for three balls and centres it on the press', () => {
    expect(radialRing({ x: 500, y: 400 }, 3, 1000, 800)).toEqual({ center: { x: 500, y: 400 }, radius: 76 });
  });

  it('pushes the ring inside the window (radius + 28 from every edge)', () => {
    expect(radialRing({ x: 10, y: 10 }, 3, 1000, 800).center).toEqual({ x: 104, y: 104 });
    expect(radialRing({ x: 999, y: 799 }, 3, 1000, 800).center).toEqual({ x: 896, y: 696 });
  });

  it('places three balls at 12, 4 and 8 o’clock', () => {
    const [top, right, left] = radialBalls({ x: 500, y: 400 }, 3, 1000, 800);
    expect(top!.x).toBeCloseTo(500, 6);
    expect(top!.y).toBeCloseTo(324, 6);
    expect(right!.x).toBeCloseTo(565.8, 1); // 500 + 76·cos 30°
    expect(right!.y).toBeCloseTo(438, 6); // 400 + 76·sin 30°
    expect(left!.x).toBeCloseTo(434.2, 1);
    expect(left!.y).toBeCloseTo(438, 6);
  });

  const balls = [
    { x: 500, y: 324 },
    { x: 566, y: 438 },
    { x: 434, y: 438 },
  ];
  const ring = { center: { x: 500, y: 400 }, radius: 76 };

  it('hits a ball within 28px', () => {
    expect(radialHit({ x: 500, y: 300 }, balls)).toBe(0);
    expect(radialHit({ x: 500, y: 290 }, balls)).toBe(-1);
  });

  it('hovering only highlights; leaving the hit circle picks the hovered ball', () => {
    expect(radialStep(-1, { x: 566, y: 440 }, balls, ring)).toEqual({ hovered: 1, picked: null });
    expect(radialStep(1, { x: 700, y: 600 }, balls, ring)).toEqual({ hovered: -1, picked: 1 });
  });

  it('going back inside the ring centre circle (80px) cancels the hover and picks nothing', () => {
    expect(radialStep(1, { x: 500, y: 400 }, balls, ring)).toEqual({ hovered: -1, picked: null });
  });

  it('leaving without a hovered ball picks nothing', () => {
    expect(radialStep(-1, { x: 900, y: 700 }, balls, ring)).toEqual({ hovered: -1, picked: null });
  });
});

describe('feedback helpers', () => {
  it('splitParticles gives 18 particles with the documented first two', () => {
    const particles = splitParticles();
    expect(particles).toHaveLength(18);
    expect(particles[0]).toEqual({ dx: 35, dy: 0, size: 5 });
    expect(particles[1]!.dx).toBeCloseTo(-28.02, 1); // cos(2.4)·38
    expect(particles[1]!.dy).toBeCloseTo(25.67, 1); // sin(2.4)·38
    expect(particles[1]!.size).toBe(6);
  });

  it('keeps feedback at least 24px inside the window', () => {
    expect(visibleFeedbackPoint({ x: -50, y: 9999 }, 1000, 800)).toEqual({ x: 24, y: 776 });
    expect(visibleFeedbackPoint({ x: 300, y: 200 }, 1000, 800)).toEqual({ x: 300, y: 200 });
  });
});

// TC-02｜REUSE-01、AC-01.1：磁吸換算表逐列比對。預期值是 tests/fixtures/magnetTable.ts 的字面常數（人工算出），
// 不呼叫實作。raw 是相對 10:00 的分鐘數，縮放 1 像素／分鐘；走完整路徑 pointerToTime（指標 y → 起點時間）。
describe('TC-02 magnet table through pointerToTime (REUSE-01, AC-01.1)', () => {
  const geometry = { left: 0, top: 0, columnWidth: 100, columnCount: 1 };
  it.each(MAGNET_ROWS.map((row) => [row.raw, row.start] as const))('raw %f minutes after 10:00 → start %s', (raw, start) => {
    const result = pointerToTime({ x: 50, y: raw }, geometry, [day], timeline, { magnetEnabled: true });
    const hh = String(result.getHours()).padStart(2, '0');
    const mm = String(result.getMinutes()).padStart(2, '0');
    expect(`${hh}:${mm}`).toBe(start);
  });

  it('AC-01.1 examples: 9 px above the 10:30 line → 10:21 (block 10:21–12:21); 9 px below → 10:39', () => {
    const above = pointerToTime({ x: 50, y: 21 }, geometry, [day], timeline, { magnetEnabled: true });
    expect([above.getHours(), above.getMinutes()]).toEqual([10, 21]);
    expect(newEventTimes(above).endAt).toBe(new Date(2026, 10, 11, 12, 21).toISOString());
    const below = pointerToTime({ x: 50, y: 39 }, geometry, [day], timeline, { magnetEnabled: true });
    expect([below.getHours(), below.getMinutes()]).toEqual([10, 39]);
  });
});

// 基準交叉比對（issue 009，只讀不執行）：下列五組取自 Calendar 固定 commit 102ae19… 的
// src/features/calendar/engine/engine.test.ts 第 283–287 行（2026-11-11 以 git show 讀取，沒有執行 Calendar）。
// 網站的 magnetMinutes 與基準測試所寫的結果一致；若日後不一致，先記錄差異與來源，不改這裡的值去迎合實作。
describe('baseline cross-check: Calendar engine.test.ts magnetMinutes cases (read at the pinned commit)', () => {
  it.each([
    [26, 1, true, 30],
    [21, 1, true, 21],
    [26, 3, true, 26],
    [26, 1, false, 26],
    [-4, 1, true, -0],
  ])('magnetMinutes(%f, ppm %f, %s) = %f', (minutes, ppm, enabled, expected) => {
    expect(magnetMinutes(minutes, ppm, enabled)).toBe(expected);
  });
});
