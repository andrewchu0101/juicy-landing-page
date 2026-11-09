// MOD-04：網站語言狀態（DATA-04）。擁有目前語言；初始值 = 保存值，否則偵測結果。
// 偵測函式由外部注入：REUSE-12 的實作來源（issue 016 或另案批准複製）尚未決定。
import type { LanguageBackend, SiteLanguage } from './webLanguageBackend';

export type SiteLanguageDeps = {
  backend: LanguageBackend;
  /** 無保存值時使用，輸入為 `navigator.languages`（REUSE-12）。 */
  detectLanguage(candidates: readonly string[]): SiteLanguage;
  candidates: readonly string[];
};

export type SiteLanguageStore = {
  load(): Promise<void>;
  get(): SiteLanguage;
  set(language: SiteLanguage): Promise<void>;
  subscribe(listener: () => void): () => void;
};

export function createSiteLanguageStore(deps: SiteLanguageDeps): SiteLanguageStore {
  // 載入保存值前先用瀏覽器語言，避免讀取期間沒有語言可用。
  let current = deps.detectLanguage(deps.candidates);
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  return {
    async load() {
      const { language } = await deps.backend.readAppSettings();
      current = language ?? deps.detectLanguage(deps.candidates);
      notify();
    },
    get: () => current,
    async set(language) {
      current = language;
      notify();
      await deps.backend.writeAppSettings({ language });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
