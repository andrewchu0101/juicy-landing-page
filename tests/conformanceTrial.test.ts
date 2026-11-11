import { describe, expect, it } from 'vitest';
import { buildTrialWorkspace } from '../src/trial/buildTrialWorkspace';
import { createTrialStore } from '../src/trial/store';
import { CONFORMANCE_CASES, type At, type ConformanceCase, type Step } from './conformance/cases';

// TC-11 網站端執行器（issue 009）：把「人工算例預期值」套到網站自己的試用 store（src/trial/store.ts）。
// 預期值來自 tests/conformance/cases.ts（規格與人工算例），這裡不呼叫實作去算答案。
// 網站只開放：建立、移動。命名、調整長度、刪除、復原、多選、剪貼簿暫不開放（專案擁有者 2026-11-11），
// 凡用到的案例標「暫不開放」，不是「已通過」。歷史長度（pastLength／futureLength）：試用沒有歷史，不比對。
// 基準交叉比對：這一輪是讀固定 commit 的 engine/mutations.ts 與 engine/limits.ts 原始碼對照，沒有執行 Calendar。
const NOW = new Date(2026, 10, 11, 9, 41);
const SEED: Record<string, string> = { 'seed-1': 'focus' }; // cases.ts 的 T1 對應試用的第一顆種子球

const at = ({ day, time }: At) => new Date(2026, 10, 11 + day, Number(time.slice(0, 2)), Number(time.slice(3)));
const OPEN_OPS: Step['op'][] = ['create'];

function openSteps(c: ConformanceCase): boolean {
  return c.preset.length === 0 && c.steps.every((step) => OPEN_OPS.includes(step.op));
}

function run(steps: Step[]) {
  const store = createTrialStore({ now: () => NOW });
  store.hydrate(buildTrialWorkspace(NOW), 'memory:trial');
  store.goToday();
  const ids: string[] = [];
  for (const step of steps) {
    if (step.op === 'create') ids.push(store.createEventFromTemplate(SEED[step.templateId]!, at(step.start))!);
    else if (step.op === 'update') {
      const id = ids[Number(step.ref.slice(1)) - 1]!;
      const current = store.getState().events[id]!;
      store.updateEvent(id, {
        startAt: (step.patch.startAt ? at(step.patch.startAt) : new Date(current.startAt)).toISOString(),
        endAt: (step.patch.endAt ? at(step.patch.endAt) : new Date(current.endAt)).toISOString(),
      });
    }
  }
  return { store, ids };
}

const byId = (id: string) => CONFORMANCE_CASES.find((c) => c.id === id)!;

describe('TC-11 conformance on the trial store (opened operations only)', () => {
  it('CONF-08 (executed): a block created at 14:30 is 120 minutes long, titled and coloured by the ball, and extends past the visible range', () => {
    const c = byId('CONF-08');
    expect(openSteps(c)).toBe(true);
    const { store, ids } = run(c.steps);
    const event = store.getState().events[ids[0]!]!;
    const expected = c.expect.events[0]!;
    expect(new Date(event.startAt).getTime()).toBe(at(expected.start!).getTime());
    expect(new Date(event.endAt).getTime()).toBe(at(expected.end!).getTime());
    expect(event.title).toBe(store.getState().templates['focus']!.name);
    expect(event.color).toBe(store.getState().templates['focus']!.color);
    expect(Object.keys(store.getState().events)).toHaveLength(c.expect.events.length);
  });

  it('CONF-02 steps 0–1 (partial, events only): create at 10:00 then move to 12:30 keeps the 120-minute length', () => {
    const c = byId('CONF-02');
    const { store, ids } = run(c.steps.slice(0, 2));
    const event = store.getState().events[ids[0]!]!;
    // 預期值：checkpoint 5 的區塊時間（移動後 12:30–14:30）。歷史、命名、刪除、復原不在網站開放範圍。
    const expected = c.checkpoints![0]!.expect.events[0]!;
    expect(new Date(event.startAt).getTime()).toBe(at(expected.start!).getTime());
    expect(new Date(event.endAt).getTime()).toBe(at(expected.end!).getTime());
  });

  it('lists which cases the website cannot run yet (not opened), with the operation that blocks each', () => {
    const notOpened = CONFORMANCE_CASES.filter((c) => !openSteps(c)).map((c) => [c.id, [...new Set([...c.preset.map(() => 'preset-with-title'), ...c.steps.map((s) => s.op).filter((op) => !OPEN_OPS.includes(op))])]]);
    expect(Object.fromEntries(notOpened)).toEqual({
      'CONF-01': ['update'],
      'CONF-02': ['update', 'select', 'deleteSelected', 'undo', 'redo'],
      'CONF-03': ['preset-with-title', 'deleteSelected'],
      'CONF-04': ['preset-with-title', 'update'],
      'CONF-05': ['preset-with-title', 'update'],
      'CONF-06': ['preset-with-title', 'update'],
      'CONF-07': ['preset-with-title', 'update'],
      'CONF-09': ['preset-with-title', 'select', 'deleteSelected', 'undo'],
      'CONF-10': ['preset-with-title', 'select', 'copy', 'paste'],
    });
  });
});
