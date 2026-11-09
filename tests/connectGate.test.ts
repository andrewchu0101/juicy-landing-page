import { describe, expect, it } from 'vitest';
import { connectGate } from '../src/trial/connectGate';
import { createTrialLoader } from '../src/trial/trialLoader';
import { createFakeMatchMedia, MOUSE, TOUCH } from './fixtures/fakeMatchMedia';
import { createFakeTrial, flush } from './fixtures/fakeTrialModule';

function setup(initial: typeof MOUSE, hold = false) {
  const media = createFakeMatchMedia(initial);
  const trial = createFakeTrial({ hold });
  const loader = createTrialLoader({ loadModule: trial.loadModule });
  return { media, trial, loader };
}

// TC-07b／07c 的單元層替身：觸控環境不請求試用模組、互動環境才請求（真實網路請求由 e2e／M-4 驗）
describe('TC-07 connectGate: eligibility decides whether the trial module is requested (AC-01.6, NFR-05)', () => {
  it('does not request the trial module in a touch environment and shows the preview', async () => {
    const { media, trial, loader } = setup(TOUCH);

    connectGate(loader, media.matchMedia);
    await flush();

    expect(trial.requestCount()).toBe(0);
    expect(loader.getPhase()).toBe('preview');
  });

  it('requests the trial module in an interactive environment', async () => {
    const { media, trial, loader } = setup(MOUSE);

    connectGate(loader, media.matchMedia);
    await flush();

    expect(trial.requestCount()).toBe(1);
    expect(loader.getPhase()).toBe('active');
  });

  it('does not request the module when matchMedia is missing', async () => {
    const { trial, loader } = setup(MOUSE);

    connectGate(loader, undefined);
    await flush();

    expect(trial.requestCount()).toBe(0);
    expect(loader.getPhase()).toBe('preview');
  });
});

describe('TC-08 connectGate: dynamic changes (AC-01.13, INV-02)', () => {
  it('goes dormant when the input stops being fine+hover, and resumes without a second request', async () => {
    const { media, trial, loader } = setup(MOUSE);
    connectGate(loader, media.matchMedia);
    await flush();

    media.setCapability(TOUCH);
    expect(loader.getPhase()).toBe('dormant');
    media.setCapability(MOUSE);
    await flush();

    expect(loader.getPhase()).toBe('active');
    expect(trial.requestCount()).toBe(1);
  });

  it('TC-08d: eligibility lost while loading → not mounted, not initialized', async () => {
    const { media, trial, loader } = setup(MOUSE, true);
    connectGate(loader, media.matchMedia);

    media.setCapability(TOUCH);
    trial.finishLoad();
    await flush();

    expect(trial.initCount()).toBe(0);
    expect(loader.getPhase()).toBe('preview');
  });

  it('stops listening after disconnect so no listeners accumulate', async () => {
    const { media, loader } = setup(MOUSE);
    const disconnect = connectGate(loader, media.matchMedia);
    await flush();

    disconnect();

    expect(media.activeListenerCount()).toBe(0);
  });
});
