// MOD-02：TrialLoader（FR-08、NFR-05）。不依賴 DOM 的狀態機；React 只負責顯示（TrialSection）。
import type { ComponentType } from 'react';
import type { SiteLanguage } from '../site/webLanguageBackend';

export type TrialPhase = 'preview' | 'loading' | 'active' | 'dormant';

export type TrialModule = {
  /** 初始化試用（只在第一次成功；之後再呼叫應直接返回）。 */
  ensureReady(options?: { language?: SiteLanguage }): Promise<void>;
  TrialShell: ComponentType;
};

export type TrialLoader = {
  getPhase(): TrialPhase;
  getModule(): TrialModule | null;
  subscribe(listener: () => void): () => void;
  setInteractive(value: boolean): void;
};

export function createTrialLoader(deps: {
  loadModule: () => Promise<TrialModule>;
  /** 初始化當下的網站語言（決定種子球名稱）；沒給就用預設。 */
  getLanguage?: () => SiteLanguage;
}): TrialLoader {
  let phase: TrialPhase = 'preview';
  let module: TrialModule | null = null;
  const listeners = new Set<() => void>();

  const setPhase = (next: TrialPhase) => {
    phase = next;
    for (const listener of [...listeners]) listener();
  };

  let interactive = false;
  let imported: TrialModule | null = null; // 已取得的模組：chunk 只請求一次
  let loading = false; // INV-02：同一時間最多一個進行中的載入

  async function load() {
    if (loading) return;
    loading = true;
    setPhase('loading');
    try {
      const loaded = imported ?? (imported = await deps.loadModule());
      // 載入中資格又變假：不初始化、不掛載。
      if (!interactive) return;
      await loaded.ensureReady(deps.getLanguage ? { language: deps.getLanguage() } : undefined);
      if (!interactive) return;
      module = loaded;
      setPhase('active');
    } catch {
      // 失敗：回到預覽，不自動重試；失敗專用文案待確認（MOD-02）。
    } finally {
      loading = false;
      if (phase === 'loading') setPhase('preview');
    }
  }

  return {
    getPhase: () => phase,
    getModule: () => module,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setInteractive(value) {
      interactive = value;
      if (!value) {
        if (phase === 'active') setPhase('dormant');
        else if (phase === 'loading') setPhase('preview');
        return;
      }
      if (module) {
        // 已載入且初始化過：直接恢復，不再請求、不再 ensureReady（INV-02）。
        if (phase !== 'active') setPhase('active');
        return;
      }
      void load();
    },
  };
}
