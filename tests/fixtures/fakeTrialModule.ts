// 測試夾具（issue 004，005～009 重用）：假的試用模組與「請求監看」。
// 單元測試沒有真實網路面板；試用模組只能經 loadModule 取得，所以記錄 loadModule 的呼叫就是
// 「有沒有請求試用模組」。真實網路請求由 e2e（TC-07b／07c，需 Playwright，未核准）與 M-4 驗。
import type { TrialModule } from '../../src/trial/trialLoader';

export type Deferred<T> = { promise: Promise<T>; resolve(value: T): void; reject(error: unknown): void };
export function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export type FakeTrial = {
  loadModule: () => Promise<TrialModule>;
  /** 試用模組被請求（動態載入）的次數。 */
  requestCount(): number;
  /** ensureReady 被呼叫的次數（初始化）。 */
  initCount(): number;
  /** 讓最近一次被擱置的載入完成。 */
  finishLoad(): void;
  /** 讓最近一次被擱置的載入失敗。 */
  failLoad(error?: unknown): void;
};

/** hold = true：載入停在擱置狀態，由 finishLoad／failLoad 決定（用來測載入中的競態）。 */
export function createFakeTrial(options: { hold?: boolean; failInit?: boolean } = {}): FakeTrial {
  let requests = 0;
  let inits = 0;
  const pending: Deferred<TrialModule>[] = [];
  const module: TrialModule = {
    TrialShell: () => null,
    RadialShell: () => null,
    ensureReady: async () => {
      inits += 1;
      if (options.failInit) throw new Error('init failed');
    },
  };
  return {
    loadModule: () => {
      requests += 1;
      if (!options.hold) return Promise.resolve(module);
      const d = deferred<TrialModule>();
      pending.push(d);
      return d.promise;
    },
    requestCount: () => requests,
    initCount: () => inits,
    finishLoad: () => pending[pending.length - 1]?.resolve(module),
    failLoad: (error = new Error('load failed')) => pending[pending.length - 1]?.reject(error),
  };
}

/** 等所有已排入的 microtask 跑完。 */
export const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
