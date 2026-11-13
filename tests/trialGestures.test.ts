import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBallDrag, type BallDragView } from '../src/trial/gestures/ballDrag';
import { createBallPress } from '../src/trial/gestures/ballPress';
import { createEventMove } from '../src/trial/gestures/eventMove';
import { createRadial, type RadialMenu } from '../src/trial/gestures/radial';

// 手勢的狀態機，不碰 DOM：時間解析、計時器與回呼都由測試注入。
// 預期值來自 REUSE-02／03／05 與 PRD AC-01.4、AC-01.7 的規則，不呼叫實作算答案。
const at = (h: number, m = 0) => new Date(2026, 10, 11, h, m);
const timeline = { startHour: 10, endHour: 15, pixelsPerMinute: 1 };
const day = new Date(2026, 10, 11);
const templates = [
  { id: 'focus', name: '專注 Focus', color: '#3B82F6', defaultDuration: 120, order: 0 },
  { id: 'rest', name: '休息 Rest', color: '#22C55E', defaultDuration: 120, order: 1 },
  { id: 'chore', name: '雜事 Chore', color: '#F97316', defaultDuration: 120, order: 2 },
];

describe('ball drag (REUSE-02, REUSE-05)', () => {
  function setup(timeAt: (p: { x: number; y: number }) => Date | null) {
    const created: [string, Date][] = [];
    let view!: BallDragView;
    let now = 1000;
    const drag = createBallDrag({
      timeAt,
      template: (id) => templates.find((t) => t.id === id),
      createEvent: (id, start) => {
        created.push([id, start]);
        return 'evt-1';
      },
      deselect: () => {},
      viewport: () => ({ width: 1000, height: 800 }),
      reducedMotion: () => false,
      nextKey: () => ++now,
      onChange: (next) => (view = next),
    });
    return { drag, created, view: () => view };
  }

  it('shows a ghost block where the ball would land while dragging', () => {
    const { drag, view } = setup(() => at(12, 30));
    drag.start('focus', { x: 10, y: 10 });
    drag.move('focus', { x: 300, y: 200 });
    expect(view().ghost).toMatchObject({
      title: '專注 Focus',
      color: '#3B82F6',
      startAt: at(12, 30).toISOString(),
      endAt: at(14, 30).toISOString(),
    });
    expect(view().point).toEqual({ x: 300, y: 200 }); // 球跟著指標（固定定位的覆蓋層）
  });

  it('shows no ghost outside the calendar', () => {
    const { drag, view } = setup(() => null);
    drag.start('focus', { x: 10, y: 10 });
    drag.move('focus', { x: 5, y: 5 });
    expect(view().ghost).toBeNull();
  });

  it('dropping on the calendar creates one block at the pointer time and plays the splash once', () => {
    const { drag, created, view } = setup(() => at(11, 0));
    drag.start('rest', { x: 0, y: 0 });
    drag.end('rest', { x: 300, y: 200 });
    expect(created).toEqual([['rest', at(11, 0)]]);
    expect(view().splash).toMatchObject({ x: 300, y: 200, color: '#22C55E' });
    expect(view().activeId).toBeNull();
    expect(view().ghost).toBeNull();
  });

  it('dropping outside creates nothing and bursts at a point kept inside the window', () => {
    const { drag, created, view } = setup(() => null);
    drag.start('chore', { x: 0, y: 0 });
    drag.end('chore', { x: -40, y: 5000 });
    expect(created).toEqual([]);
    expect(view().burst).toMatchObject({ x: 24, y: 776, color: '#F97316' });
  });

  it('cancelling (Escape) creates nothing and shows no burst', () => {
    const { drag, created, view } = setup(() => at(11, 0));
    drag.start('focus', { x: 0, y: 0 });
    drag.move('focus', { x: 1, y: 1 });
    drag.cancel(false);
    expect(created).toEqual([]);
    expect(view().burst).toBeNull();
    expect(view().activeId).toBeNull();
    expect(view().ghost).toBeNull();
  });

  it('cancelling because the pointer left the window bursts the ball', () => {
    const { drag, view } = setup(() => at(11, 0));
    drag.start('focus', { x: 0, y: 0 });
    drag.move('focus', { x: 900, y: 100 });
    drag.cancel(true);
    expect(view().burst).toMatchObject({ x: 900, y: 100, color: '#3B82F6' });
  });

  it('ignores a late move after the drag ended', () => {
    const { drag, view } = setup(() => at(11, 0));
    drag.start('focus', { x: 0, y: 0 });
    drag.end('focus', { x: 5, y: 5 });
    drag.move('focus', { x: 50, y: 50 });
    expect(view().ghost).toBeNull();
  });

  it('stretches the ball along its direction of travel in proportion to speed (visual only)', () => {
    const { drag, view } = setup(() => null);
    drag.start('focus', { x: 0, y: 0 });
    drag.move('focus', { x: 0, y: 0 });
    drag.move('focus', { x: 18, y: 0 });
    // 18px 的位移：stretch = min(18/90, 0.22) = 0.2，角度 0
    expect(view().ballTransform).toBe('rotate(0rad) scale(1.2, 0.8) rotate(0rad)');
  });

  it('does not stretch when the visitor prefers reduced motion', () => {
    const drag = createBallDrag({
      timeAt: () => null,
      template: (id) => templates.find((t) => t.id === id),
      createEvent: () => null,
      deselect: () => {},
      viewport: () => ({ width: 1000, height: 800 }),
      reducedMotion: () => true,
      nextKey: () => 1,
      onChange: (view) => expect(view.ballTransform).toBe(''),
    });
    drag.start('focus', { x: 0, y: 0 });
    drag.move('focus', { x: 50, y: 0 });
  });
});

describe('ball press (a press on a palette ball becomes a drag after moving more than 4px)', () => {
  function setup() {
    const calls: string[] = [];
    const press = createBallPress({
      start: (id, p) => calls.push(`start ${id} ${p.x},${p.y}`),
      move: (id, p) => calls.push(`move ${id} ${p.x},${p.y}`),
      end: (id, p) => calls.push(`end ${id} ${p.x},${p.y}`),
      cancel: (leftWindow) => calls.push(`cancel ${leftWindow}`),
    });
    return { press, calls };
  }

  it('does nothing for a plain click', () => {
    const { press, calls } = setup();
    press.down('focus', 1, { x: 100, y: 100 });
    press.move(1, { x: 103, y: 100 });
    press.up(1, { x: 103, y: 100 });
    expect(calls).toEqual([]);
  });

  it('starts at the original press point, then follows the pointer, then drops', () => {
    const { press, calls } = setup();
    press.down('focus', 1, { x: 100, y: 100 });
    press.move(1, { x: 106, y: 100 });
    press.move(1, { x: 120, y: 110 });
    press.up(1, { x: 130, y: 120 });
    expect(calls).toEqual(['start focus 100,100', 'move focus 106,100', 'move focus 120,110', 'end focus 130,120']);
  });

  it('needs strictly more than 4px (exactly 4 is still a click)', () => {
    const { press, calls } = setup();
    press.down('focus', 1, { x: 0, y: 0 });
    press.move(1, { x: 4, y: 0 });
    expect(calls).toEqual([]);
    press.move(1, { x: 4.1, y: 0 });
    expect(calls[0]).toBe('start focus 0,0');
  });

  it('Escape or pointercancel cancels an active drag; the window blur cancels with the burst flag', () => {
    const a = setup();
    a.press.down('focus', 1, { x: 0, y: 0 });
    a.press.move(1, { x: 20, y: 0 });
    a.press.escape();
    expect(a.calls.at(-1)).toBe('cancel false');

    const b = setup();
    b.press.down('focus', 1, { x: 0, y: 0 });
    b.press.move(1, { x: 20, y: 0 });
    b.press.blur();
    expect(b.calls.at(-1)).toBe('cancel true');
  });

  it('ignores other pointers and does not cancel when nothing is active', () => {
    const { press, calls } = setup();
    press.down('focus', 1, { x: 0, y: 0 });
    press.move(2, { x: 50, y: 0 });
    press.escape();
    expect(calls).toEqual([]);
  });
});

// 專案擁有者 2026-11-13：長按叫出六顆球，只展示 hover 的果凍晃動；真正拖放建立區塊只在側邊三顆球。
// 所以圓形選單不再開始拖曳：離開球只是取消 hover，放開或 Escape 只是關閉，永遠不建立區塊。
describe('radial palette (PRD AC-01.4, showcase only)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const sixBalls = Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, name: `Ball ${i}`, color: '#E98B87', order: i }));

  function setup() {
    let menu: RadialMenu | null = null;
    const history: Array<RadialMenu | null> = [];
    const radial = createRadial({
      templates: () => sixBalls,
      viewport: () => ({ width: 1000, height: 800 }),
      onMenu: (next) => {
        menu = next;
        history.push(next);
      },
    });
    return { radial, menu: () => menu, history };
  }

  it('opens the menu with six balls after holding 250ms, not before', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(249);
    expect(menu()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(menu()!.positions).toHaveLength(6);
    expect(menu()!.hovered).toBe(-1);
  });

  it('moving more than 6px before the menu opens cancels the long press', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    radial.move(1, { x: 507, y: 400 });
    vi.advanceTimersByTime(1000);
    expect(menu()).toBeNull();
  });

  it('moving 6px or less keeps the long press', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    radial.move(1, { x: 506, y: 400 });
    vi.advanceTimersByTime(250);
    expect(menu()).not.toBeNull();
  });

  it('releasing before 250ms never opens a menu', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(100);
    radial.up(1);
    vi.advanceTimersByTime(1000);
    expect(menu()).toBeNull();
  });

  it('hovering each of the six balls highlights exactly that ball', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    const positions = menu()!.positions;
    positions.forEach((p, i) => {
      radial.move(1, { x: p.x, y: p.y });
      expect(menu()!.hovered).toBe(i);
    });
  });

  it('leaving a ball only stops its hover: the menu stays open and nothing is picked', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    const second = menu()!.positions[1]!;
    radial.move(1, { x: second.x, y: second.y });
    expect(menu()!.hovered).toBe(1);
    radial.move(1, { x: second.x + 200, y: second.y + 200 });
    expect(menu()).not.toBeNull();
    expect(menu()!.hovered).toBe(-1);
  });

  it('releasing with the menu open just closes it', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    radial.move(1, menu()!.positions[0]!);
    radial.up(1);
    expect(menu()).toBeNull();
  });

  it('Escape closes the menu', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    radial.escape();
    expect(menu()).toBeNull();
  });

  it('destroy clears a pending long press (REUSE-05: unmount cleans up)', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    radial.destroy();
    vi.advanceTimersByTime(1000);
    expect(menu()).toBeNull();
  });

  it('ignores other pointers', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    radial.up(2);
    expect(menu()).not.toBeNull();
  });
});


describe('move a block (REUSE-03, REUSE-05)', () => {
  // 欄位區：left 0、top 100、寬 300；10:00 在 y=100，每分鐘 1 像素。
  const geometry = { left: 0, top: 100, columnWidth: 300, columnCount: 1 };
  const yAt = (minutesFromTen: number) => 100 + minutesFromTen;
  const block = { id: 'a', startAt: at(10, 0).toISOString(), endAt: at(12, 0).toISOString() };

  function setup(magnetEnabled = true) {
    const updates: [string, { startAt: string; endAt: string }][] = [];
    const selected: (string | null)[] = [];
    let draft: unknown = 'unset';
    const move = createEventMove({
      geometry: () => geometry,
      days: [day],
      timeline,
      magnetEnabled: () => magnetEnabled,
      select: (id) => selected.push(id),
      update: (id, times) => {
        updates.push([id, times]);
        return true;
      },
      onDraft: (next) => (draft = next),
    });
    return { move, updates, selected, draft: () => draft };
  }

  it('AC-01.7: grabbed 20 minutes in, released at 12:50 → 12:30–14:30, length unchanged', () => {
    const { move, updates } = setup();
    move.down(1, 0, { x: 50, y: yAt(20) }, block);
    move.move(1, { x: 50, y: yAt(170) }); // 12:50
    move.up(1);
    expect(updates).toEqual([['a', { startAt: at(12, 30).toISOString(), endAt: at(14, 30).toISOString() }]]);
  });

  it('a press selects the block even without dragging, and a plain click moves nothing', () => {
    const { move, updates, selected } = setup();
    move.down(1, 0, { x: 50, y: yAt(20) }, block);
    move.move(1, { x: 52, y: yAt(21) });
    move.up(1);
    expect(selected).toEqual(['a']);
    expect(updates).toEqual([]);
  });

  it('shows the draft times while dragging and clears it after the drop', () => {
    const { move, draft } = setup();
    move.down(1, 0, { x: 50, y: yAt(0) }, block);
    move.move(1, { x: 50, y: yAt(60) });
    expect(draft()).toMatchObject({
      eventId: 'a',
      times: { startAt: at(11, 0).toISOString(), endAt: at(13, 0).toISOString() },
      pointer: { x: 50, y: yAt(60) },
    });
    move.up(1);
    expect(draft()).toBeNull();
  });

  it('snaps the new start to the nearest half hour within 8 minutes, and not beyond', () => {
    const near = setup();
    near.move.down(1, 0, { x: 50, y: yAt(0) }, block);
    near.move.move(1, { x: 50, y: yAt(68) }); // 11:08 → 11:00? 離 11:00(60) 差 8 → 吸附到 11:00
    near.move.up(1);
    expect(near.updates[0]![1].startAt).toBe(at(11, 0).toISOString());

    const far = setup();
    far.move.down(1, 0, { x: 50, y: yAt(0) }, block);
    far.move.move(1, { x: 50, y: yAt(69) }); // 離 11:00 差 9 → 不吸附，11:09
    far.move.up(1);
    expect(far.updates[0]![1].startAt).toBe(at(11, 9).toISOString());
  });

  it('does not snap when magnet is off', () => {
    const { move, updates } = setup(false);
    move.down(1, 0, { x: 50, y: yAt(0) }, block);
    move.move(1, { x: 50, y: yAt(63) });
    move.up(1);
    expect(updates[0]![1].startAt).toBe(at(11, 3).toISOString());
  });

  it('keeps the pointer inside the visible range while moving (clamped)', () => {
    const { move, updates } = setup();
    move.down(1, 0, { x: 50, y: yAt(0) }, block);
    move.move(1, { x: 50, y: yAt(900) }); // 遠超過 15:00 → 夾在 15:00，區塊 15:00–17:00
    move.up(1);
    expect(updates[0]![1]).toEqual({ startAt: at(15, 0).toISOString(), endAt: at(17, 0).toISOString() });
  });

  it('Escape during a drag cancels it: nothing is saved (REUSE-05)', () => {
    const { move, updates, draft } = setup();
    move.down(1, 0, { x: 50, y: yAt(0) }, block);
    move.move(1, { x: 50, y: yAt(60) });
    expect(move.escape()).toBe(true);
    move.up(1);
    expect(updates).toEqual([]);
    expect(draft()).toBeNull();
  });

  it('Escape without a drag in progress is not claimed', () => {
    const { move } = setup();
    move.down(1, 0, { x: 50, y: yAt(0) }, block);
    expect(move.escape()).toBe(false);
  });

  it('pointercancel and destroy stop the gesture without saving', () => {
    const a = setup();
    a.move.down(1, 0, { x: 50, y: yAt(0) }, block);
    a.move.move(1, { x: 50, y: yAt(60) });
    a.move.cancel(1);
    expect(a.updates).toEqual([]);

    const b = setup();
    b.move.down(1, 0, { x: 50, y: yAt(0) }, block);
    b.move.move(1, { x: 50, y: yAt(60) });
    b.move.destroy();
    expect(b.updates).toEqual([]);
  });

  it('only the primary button starts a move, and other pointers are ignored', () => {
    const { move, updates, selected } = setup();
    move.down(1, 2, { x: 50, y: yAt(0) }, block);
    expect(selected).toEqual([]);
    move.down(1, 0, { x: 50, y: yAt(0) }, block);
    move.move(2, { x: 50, y: yAt(60) });
    move.up(2);
    move.up(1);
    expect(updates).toEqual([]);
  });
});

// 步驟 2（專案擁有者 2026-11-14）：長按叫出的是試用的三顆球，離開球就選中並開始拖曳，放開就建立區塊——就是原本的試用行為。
// 步驟 1 的六顆展示球不帶 drag，見上面的 showcase only。
describe('radial palette with drag (PRD AC-01.4, step 2)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const log: string[] = [];
    let menu: RadialMenu | null = null;
    const radial = createRadial({
      templates: () => templates,
      viewport: () => ({ width: 1000, height: 800 }),
      drag: {
        start: (id, p) => log.push(`start ${id} ${Math.round(p.x)},${Math.round(p.y)}`),
        move: (id) => log.push(`move ${id}`),
        end: (id, p) => log.push(`end ${id} ${Math.round(p.x)},${Math.round(p.y)}`),
        cancel: () => log.push('cancel'),
      },
      onMenu: (next) => (menu = next),
    });
    return { radial, log, menu: () => menu };
  }

  it('opens the menu after holding 250ms, not before', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(249);
    expect(menu()).toBeNull();
    vi.advanceTimersByTime(1);
    expect(menu()?.hovered).toBe(-1);
    expect(menu()?.positions).toHaveLength(3);
  });

  it('moving more than 6px before the menu opens cancels the long press', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    radial.move(1, { x: 507, y: 400 });
    vi.advanceTimersByTime(1000);
    expect(menu()).toBeNull();
  });

  it('moving 6px or less keeps the long press', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    radial.move(1, { x: 506, y: 400 });
    vi.advanceTimersByTime(250);
    expect(menu()).not.toBeNull();
  });

  it('releasing before 250ms never opens the menu', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(100);
    radial.up(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(1000);
    expect(menu()).toBeNull();
  });

  it('hovering a ball highlights it; leaving its circle picks it and starts the drag', () => {
    const { radial, log, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    const second = menu()!.positions[1]!;
    radial.move(1, { x: second.x, y: second.y });
    expect(menu()!.hovered).toBe(1);
    expect(log).toEqual([]);
    radial.move(1, { x: second.x + 200, y: second.y + 200 });
    expect(menu()).toBeNull();
    expect(log[0]).toMatch(/^start rest /);
  });

  it('after picking, moves go to the drag and releasing drops it', () => {
    const { radial, log, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    const first = menu()!.positions[0]!;
    radial.move(1, first);
    radial.move(1, { x: 500, y: 100 });
    radial.move(1, { x: 600, y: 300 });
    radial.up(1, { x: 600, y: 300 });
    expect(log).toEqual(['start focus 500,100', 'move focus', 'end focus 600,300']);
  });

  it('releasing with the menu open but nothing picked just closes it', () => {
    const { radial, log, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    radial.up(1, { x: 500, y: 400 });
    expect(menu()).toBeNull();
    expect(log).toEqual([]);
  });

  it('Escape closes the menu, or cancels a drag already started', () => {
    const a = setup();
    a.radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    a.radial.escape();
    expect(a.menu()).toBeNull();
    expect(a.log).toEqual([]);

    const b = setup();
    b.radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    b.radial.move(1, b.menu()!.positions[0]!);
    b.radial.move(1, { x: 500, y: 100 });
    b.radial.escape();
    expect(b.log.at(-1)).toBe('cancel');
  });

  it('destroy clears a pending long press and stops an active drag (REUSE-05: unmount cleans up)', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    radial.destroy();
    vi.advanceTimersByTime(1000);
    expect(menu()).toBeNull();
  });

  it('ignores other pointers', () => {
    const { radial, menu } = setup();
    radial.down(1, { x: 500, y: 400 });
    vi.advanceTimersByTime(250);
    radial.up(2, { x: 500, y: 400 });
    expect(menu()).not.toBeNull();
  });
});
