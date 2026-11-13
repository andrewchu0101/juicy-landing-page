import { afterEach, describe, expect, it } from 'vitest';
import { MAGNET_ROWS } from './fixtures/magnetTable';
import { watchPrivacy } from './fixtures/privacyWatch';
import { createTrialRuntime } from '../src/trial/trialRuntime';

let watch: ReturnType<typeof watchPrivacy> | undefined;
afterEach(() => watch?.restore());

// TC-06a｜INV-01、NFR-01、FR-07：初始化試用不寫儲存、不發請求
describe('TC-06a trial initialization stays in memory (INV-01, NFR-01, FR-07)', () => {
  it('detects writes and requests (the watcher is not vacuous)', () => {
    watch = watchPrivacy();
    localStorage.setItem('k', 'v');
    void fetch('https://example.invalid/').catch(() => {});
    navigator.sendBeacon('https://example.invalid/', 'x');

    expect(watch.calls().map((c) => c.api)).toEqual(['localStorage.setItem', 'fetch', 'sendBeacon']);
  });

  it('ensureReady performs no storage write, fetch, XHR or beacon', async () => {
    watch = watchPrivacy();
    const runtime = createTrialRuntime({ store: { hydrate: () => {}, goToday: () => {} }, now: () => new Date(2026, 10, 10) });

    await runtime.ensureReady();

    expect(watch.calls()).toEqual([]);
  });
});

// TC-02 的逐列比對在 tests/trialEngine.test.ts（網站自己的 pointerToTime；2026-11-11 不再依賴共用模組）。
describe('TC-02 magnet table fixture (REUSE-01, AC-01.1)', () => {
  it('has the twelve rows of docs/06-test-plan.md TC-02 as literal constants', () => {
    expect(MAGNET_ROWS).toHaveLength(12);
  });
});
