// UI-06：把網站語言狀態接到 React。元件讀目前語言與字典，不直接碰儲存。
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { DICTIONARIES, type SiteDictionary } from './dictionaries';
import { applyPageMetadata } from './pageMetadata';
import type { SiteLanguageStore } from './siteLanguage';
import type { SiteLanguage } from './webLanguageBackend';

type LanguageValue = {
  language: SiteLanguage;
  copy: SiteDictionary;
  setLanguage(language: SiteLanguage): void;
};

// 沒有 Provider 時（例如單獨渲染 App 的測試）固定為繁體中文，切換不做事。
const FALLBACK: LanguageValue = { language: 'zh-TW', copy: DICTIONARIES['zh-TW'], setLanguage() {} };

const LanguageContext = createContext<LanguageValue>(FALLBACK);

export function LanguageProvider({ store, children }: { store: SiteLanguageStore; children: ReactNode }) {
  // 第三個參數是伺服端／靜態渲染用的快照。
  const language = useSyncExternalStore(store.subscribe, store.get, store.get);

  useEffect(() => {
    applyPageMetadata(language);
  }, [language]);

  const value: LanguageValue = {
    language,
    copy: DICTIONARIES[language],
    // 儲存失敗已在後端降級；這裡不再有可顯示給訪客的錯誤。
    setLanguage: (next) => void store.set(next),
  };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useSiteLanguage(): LanguageValue {
  return useContext(LanguageContext);
}
