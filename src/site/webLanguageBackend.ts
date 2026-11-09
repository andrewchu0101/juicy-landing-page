// MOD-04：網站的語言偏好後端（DATA-04、DATA-05）。
// 職責：把語言偏好存取到單一 localStorage 鍵；儲存不可用時降級，不顯示訊息。
// 這是網站唯一寫入瀏覽器儲存的資料（INV-01）。

export type SiteLanguage = 'zh-TW' | 'en';

// 鍵名占位，待專案擁有者確認（SDS DATA-05）。
export const LANGUAGE_STORAGE_KEY = 'juicy-site-language';

// 只要求 localStorage 的最小介面，測試可注入假儲存。
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type LanguageBackend = {
  readAppSettings(): Promise<{ language: SiteLanguage | null }>;
  writeAppSettings(settings: { language: SiteLanguage }): Promise<void>;
  systemInfo(): Promise<{ locale: null; hour12: null }>;
};

export function isSiteLanguage(value: unknown): value is SiteLanguage {
  return value === 'zh-TW' || value === 'en';
}

export function createWebLanguageBackend(getStorage: () => KeyValueStorage): LanguageBackend {
  return {
    async readAppSettings() {
      // 儲存內容屬外部輸入：不是合法語言就視為未設定。
      // 取得或讀取儲存拋例外（隱私模式、封鎖網站資料）→ 視為未設定。
      try {
        const saved = getStorage().getItem(LANGUAGE_STORAGE_KEY);
        return { language: isSiteLanguage(saved) ? saved : null };
      } catch {
        return { language: null };
      }
    },
    async writeAppSettings({ language }) {
      // SDS MOD-04：寫入失敗刻意吞掉、不顯示訊息；本次工作階段的語言由網站狀態維持，只是不保存。
      try {
        getStorage().setItem(LANGUAGE_STORAGE_KEY, language);
      } catch {
        return;
      }
    },
    async systemInfo() {
      return { locale: null, hour12: null };
    },
  };
}
