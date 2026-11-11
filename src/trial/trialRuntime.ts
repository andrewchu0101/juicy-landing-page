// MOD-03：TrialRuntime.ensureReady（INV-02）。store 以介面注入；接入共用模組時傳入 useAppStore.getState()。
// 尚未實作的步驟 2（共用 i18n 與網站語言一致，INV-10）需要共用模組，待 016／017。
import type { SiteLanguage } from '../site/webLanguageBackend';
import { buildTrialWorkspace, type TrialWorkspace } from './buildTrialWorkspace';

export type TrialStorePort = {
  hydrate(data: TrialWorkspace, path: string): void;
  goToday(): void;
};

export function createTrialRuntime(deps: { store: TrialStorePort; now: () => Date }) {
  let ready = false;
  let inflight: Promise<void> | null = null;

  return {
    /** language：只在第一次成功初始化時使用（決定種子球名稱）；之後的呼叫直接返回。 */
    ensureReady(options: { language?: SiteLanguage } = {}): Promise<void> {
      if (ready) return Promise.resolve();
      inflight ??= Promise.resolve()
        .then(() => {
          deps.store.hydrate(buildTrialWorkspace(deps.now(), options.language), 'memory:trial');
          deps.store.goToday();
          ready = true;
        })
        .finally(() => {
          inflight = null;
        });
      return inflight;
    },
  };
}
