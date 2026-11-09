import { describe, expect, it, vi } from 'vitest';
import { createTrialRuntime } from '../src/trial/trialRuntime';

const now = () => new Date(2026, 10, 10, 9, 30);
function fakeStore() {
  return { hydrate: vi.fn(), goToday: vi.fn() };
}

// INV-02、MOD-03 步驟 1、3、4、5｜FR-07
describe('INV-02 TrialRuntime.ensureReady (FR-07, MOD-03)', () => {
  it('hydrates the seed once with the memory path, then goes to today', async () => {
    const store = fakeStore();
    const runtime = createTrialRuntime({ store, now });

    await runtime.ensureReady();

    expect(store.hydrate).toHaveBeenCalledTimes(1);
    expect(store.hydrate.mock.calls[0]![1]).toBe('memory:trial');
    expect(store.hydrate.mock.calls[0]![0].settings.view).toBe('day');
    expect(store.goToday).toHaveBeenCalledTimes(1);
    expect(store.hydrate.mock.invocationCallOrder[0]!).toBeLessThan(store.goToday.mock.invocationCallOrder[0]!);
  });

  it('does not hydrate again on repeated or concurrent calls', async () => {
    const store = fakeStore();
    const runtime = createTrialRuntime({ store, now });

    await Promise.all([runtime.ensureReady(), runtime.ensureReady()]);
    await runtime.ensureReady();

    expect(store.hydrate).toHaveBeenCalledTimes(1);
  });

  it('leaves no half-initialized state on failure and allows one retry', async () => {
    const store = fakeStore();
    store.goToday.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const runtime = createTrialRuntime({ store, now });

    await expect(runtime.ensureReady()).rejects.toThrow('boom');
    await runtime.ensureReady();
    await runtime.ensureReady();

    expect(store.hydrate).toHaveBeenCalledTimes(2);
    expect(store.goToday).toHaveBeenCalledTimes(2);
  });
});
