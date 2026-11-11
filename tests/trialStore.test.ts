import { describe, expect, it, vi } from 'vitest';
import { buildTrialWorkspace } from '../src/trial/buildTrialWorkspace';
import { createTrialStore } from '../src/trial/store';

// 試用區的記憶體資料（FR-07）：只存在這個物件裡，不碰 localStorage 或網路。
// 預期值：建立長度 120 分鐘、標題複製球名稱、顏色為球色（REUSE-02）；一次手勢一次變更（REUSE-05）。
const NOW = new Date(2026, 10, 11, 9, 41);
const at = (h: number, m = 0) => new Date(2026, 10, 11, h, m);

function ready() {
  const store = createTrialStore({ now: () => NOW });
  store.hydrate(buildTrialWorkspace(NOW), 'memory:trial');
  store.goToday();
  return store;
}

describe('trial store', () => {
  it('starts empty: three seed balls, no events, 10:00–15:00 each day (FR-01)', () => {
    const state = ready().getState();
    expect(Object.keys(state.templates)).toEqual(['focus', 'rest', 'chore']);
    expect(state.events).toEqual({});
    expect(state.settings).toMatchObject({ startHour: 10, endHour: 15, pixelsPerMinute: 1, visibleDays: 3, magnetEnabled: true });
  });

  it('goToday sets the demo day to the local today from the injected clock', () => {
    const state = ready().getState();
    expect(new Date(state.anchor).getTime()).toBe(NOW.getTime());
  });

  it('creating from a ball makes a 120-minute block titled with the ball name and coloured like it', () => {
    const store = ready();
    const id = store.createEventFromTemplate('focus', at(12, 30));
    expect(id).not.toBeNull();
    expect(store.getState().events[id!]).toEqual({
      id,
      templateId: 'focus',
      title: '專注 Focus',
      color: '#3B82F6',
      startAt: at(12, 30).toISOString(),
      endAt: at(14, 30).toISOString(),
    });
  });

  it('marks the new block as just dropped and clears the selection (REUSE-06)', () => {
    const store = ready();
    const first = store.createEventFromTemplate('focus', at(10))!;
    store.select(first);
    const second = store.createEventFromTemplate('rest', at(13))!;
    expect(store.getState().droppedEventId).toBe(second);
    expect(store.getState().selectedEventId).toBeNull();
    store.clearDropped();
    expect(store.getState().droppedEventId).toBeNull();
  });

  it('rejects an unknown ball without changing anything', () => {
    const store = ready();
    expect(store.createEventFromTemplate('nope', at(10))).toBeNull();
    expect(store.getState().events).toEqual({});
  });

  it('keeps balls unlimited: the same ball can make many blocks', () => {
    const store = ready();
    store.createEventFromTemplate('focus', at(10));
    store.createEventFromTemplate('focus', at(10));
    expect(Object.keys(store.getState().events)).toHaveLength(2);
  });

  it('updateEvent changes only the times and returns false for an unknown id', () => {
    const store = ready();
    const id = store.createEventFromTemplate('chore', at(10))!;
    expect(store.updateEvent(id, { startAt: at(11).toISOString(), endAt: at(13).toISOString() })).toBe(true);
    expect(store.getState().events[id]).toMatchObject({ title: '雜事 Chore', startAt: at(11).toISOString() });
    expect(store.updateEvent('missing', { startAt: at(11).toISOString(), endAt: at(13).toISOString() })).toBe(false);
  });

  it('does not notify when an update changes nothing', () => {
    const store = ready();
    const id = store.createEventFromTemplate('chore', at(10))!;
    const listener = vi.fn();
    store.subscribe(listener);
    store.updateEvent(id, { startAt: at(10).toISOString(), endAt: at(12).toISOString() });
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies subscribers on change and stops after unsubscribe', () => {
    const store = ready();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.createEventFromTemplate('focus', at(10));
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.createEventFromTemplate('focus', at(11));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('select picks one block, and null clears it', () => {
    const store = ready();
    const id = store.createEventFromTemplate('focus', at(10))!;
    store.select(id);
    expect(store.getState().selectedEventId).toBe(id);
    store.select(null);
    expect(store.getState().selectedEventId).toBeNull();
  });

  it('a fresh store has no data from another store (FR-07: nothing is shared or persisted)', () => {
    const a = ready();
    a.createEventFromTemplate('focus', at(10));
    expect(ready().getState().events).toEqual({});
  });
});
