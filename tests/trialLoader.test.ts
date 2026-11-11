import { describe, expect, it } from 'vitest';
import { createTrialLoader } from '../src/trial/trialLoader';
import { createFakeTrial, flush } from './fixtures/fakeTrialModule';

// TC-07｜不符合資格時不請求試用模組；符合才請求（AC-01.6、FR-08、NFR-05）
describe('TC-07 TrialLoader request behaviour (FR-08, NFR-05, MOD-02)', () => {
  it('shows the preview and never requests the trial module while not interactive', async () => {
    const trial = createFakeTrial();
    const loader = createTrialLoader({ loadModule: trial.loadModule });

    loader.setInteractive(false);
    await flush();

    expect(loader.getPhase()).toBe('preview');
    expect(trial.requestCount()).toBe(0);
    expect(trial.initCount()).toBe(0);
  });

  it('requests the trial module once, initializes it, then becomes active when interactive', async () => {
    const trial = createFakeTrial();
    const loader = createTrialLoader({ loadModule: trial.loadModule });

    loader.setInteractive(true);
    expect(loader.getPhase()).toBe('loading');
    await flush();

    expect(loader.getPhase()).toBe('active');
    expect(trial.requestCount()).toBe(1);
    expect(trial.initCount()).toBe(1);
    expect(loader.getModule()).not.toBeNull();
  });
});

// TC-08｜動態失去與恢復資格（AC-01.13、INV-02、INV-03）
describe('TC-08 TrialLoader losing and regaining eligibility (MOD-02, INV-02)', () => {
  it('goes dormant without reinitializing when eligibility is lost while active', async () => {
    const trial = createFakeTrial();
    const loader = createTrialLoader({ loadModule: trial.loadModule });
    loader.setInteractive(true);
    await flush();

    loader.setInteractive(false);

    expect(loader.getPhase()).toBe('dormant');
    expect(trial.initCount()).toBe(1);
  });

  it('resumes from dormant without requesting the module again (8c: chunk requested once)', async () => {
    const trial = createFakeTrial();
    const loader = createTrialLoader({ loadModule: trial.loadModule });
    loader.setInteractive(true);
    await flush();

    for (let i = 0; i < 10; i += 1) {
      loader.setInteractive(false);
      loader.setInteractive(true);
      await flush();
    }

    expect(loader.getPhase()).toBe('active');
    expect(trial.requestCount()).toBe(1);
    expect(trial.initCount()).toBe(1);
  });
});

// TC-08d｜載入中資格又變為假 → 不掛載、不初始化（INV-02）
describe('TC-08d TrialLoader eligibility lost while loading (MOD-02 race)', () => {
  it('does not initialize or become active when eligibility is lost before the load finishes', async () => {
    const trial = createFakeTrial({ hold: true });
    const loader = createTrialLoader({ loadModule: trial.loadModule });
    loader.setInteractive(true);
    loader.setInteractive(false);

    trial.finishLoad();
    await flush();

    expect(trial.initCount()).toBe(0);
    expect(loader.getPhase()).toBe('preview');
    expect(loader.getModule()).toBeNull();
  });

  it('keeps at most one load in flight when eligibility flips repeatedly during loading', async () => {
    const trial = createFakeTrial({ hold: true });
    const loader = createTrialLoader({ loadModule: trial.loadModule });

    for (let i = 0; i < 5; i += 1) {
      loader.setInteractive(true);
      loader.setInteractive(false);
    }
    loader.setInteractive(true);
    trial.finishLoad();
    await flush();

    expect(trial.requestCount()).toBe(1);
    expect(trial.initCount()).toBe(1);
    expect(loader.getPhase()).toBe('active');
  });

  it('mounts after a later regain even if the first load finished while ineligible', async () => {
    const trial = createFakeTrial({ hold: true });
    const loader = createTrialLoader({ loadModule: trial.loadModule });
    loader.setInteractive(true);
    loader.setInteractive(false);
    trial.finishLoad();
    await flush();

    loader.setInteractive(true);
    await flush();

    expect(loader.getPhase()).toBe('active');
    expect(trial.initCount()).toBe(1);
  });
});

// 失敗路徑（MOD-02：不重試迴圈；再次由假變真時允許重試）。失敗專用文案待確認，這裡只驗狀態。
describe('TrialLoader failure path (MOD-02)', () => {
  it('falls back to preview when the module fails to load, without retrying in a loop', async () => {
    const trial = createFakeTrial({ hold: true });
    const loader = createTrialLoader({ loadModule: trial.loadModule });
    loader.setInteractive(true);

    trial.failLoad();
    await flush();

    expect(loader.getPhase()).toBe('preview');
    expect(trial.requestCount()).toBe(1);
  });

  it('falls back to preview when initialization fails, and does not mount', async () => {
    const trial = createFakeTrial({ failInit: true });
    const loader = createTrialLoader({ loadModule: trial.loadModule });
    loader.setInteractive(true);
    await flush();

    expect(loader.getPhase()).toBe('preview');
    expect(loader.getModule()).toBeNull();
  });

  it('allows one more attempt when eligibility turns from false to true again', async () => {
    const trial = createFakeTrial({ hold: true });
    const loader = createTrialLoader({ loadModule: trial.loadModule });
    loader.setInteractive(true);
    trial.failLoad();
    await flush();

    loader.setInteractive(false);
    loader.setInteractive(true);
    trial.finishLoad();
    await flush();

    expect(trial.requestCount()).toBe(2);
    expect(loader.getPhase()).toBe('active');
  });
});

// 專案擁有者 2026-11-11：種子球名稱依初始化當下的網站語言決定。
describe('TrialLoader passes the site language to ensureReady (seed ball names)', () => {
  it('reads the language when the module is initialized, not when the loader is created', async () => {
    let language: 'zh-TW' | 'en' = 'zh-TW';
    const seen: unknown[] = [];
    const loader = createTrialLoader({
      loadModule: async () => ({ TrialShell: () => null, ensureReady: async (options) => void seen.push(options) }),
      getLanguage: () => language,
    });

    language = 'en';
    loader.setInteractive(true);
    await flush();

    expect(seen).toEqual([{ language: 'en' }]);
  });
});
