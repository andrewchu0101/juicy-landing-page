import { describe, expect, it } from 'vitest';
import { createSiteLanguageStore } from '../src/site/siteLanguage';
import { createWebLanguageBackend, type LanguageBackend, type SiteLanguage } from '../src/site/webLanguageBackend';

// 假後端：不碰真實 localStorage。偵測函式用固定回覆的替身，這裡不驗 REUSE-12 規則本身。
function fakeBackend(saved: SiteLanguage | null, writes: SiteLanguage[] = []): LanguageBackend {
  return {
    readAppSettings: async () => ({ language: saved }),
    writeAppSettings: async ({ language }) => void writes.push(language),
    systemInfo: async () => ({ locale: null, hour12: null }),
  };
}

// TC-09｜網站語言狀態（AC-03.1、FR-10、DATA-04）
describe('TC-09 site language store (AC-03.1, FR-10, DATA-04)', () => {
  it('starts from the saved language, ignoring the browser language', async () => {
    const store = createSiteLanguageStore({
      backend: fakeBackend('en'),
      detectLanguage: () => 'zh-TW',
      candidates: ['zh-TW'],
    });

    await store.load();

    expect(store.get()).toBe('en');
  });

  it('switches to the language the visitor picks and saves it', async () => {
    const writes: SiteLanguage[] = [];
    const store = createSiteLanguageStore({
      backend: fakeBackend(null, writes),
      detectLanguage: () => 'zh-TW',
      candidates: ['zh-TW'],
    });
    await store.load();

    await store.set('en');

    expect(store.get()).toBe('en');
    expect(writes).toEqual(['en']);
  });

  it('falls back to the detected browser language when nothing valid is saved', async () => {
    const seen: (readonly string[])[] = [];
    const store = createSiteLanguageStore({
      backend: fakeBackend(null),
      detectLanguage: (candidates) => (seen.push(candidates), 'en'),
      candidates: ['ja', 'zh-TW'],
    });

    await store.load();

    expect(store.get()).toBe('en');
    expect(seen.at(-1)).toEqual(['ja', 'zh-TW']);
  });

  it('notifies subscribers when the saved language is loaded', async () => {
    const store = createSiteLanguageStore({
      backend: fakeBackend('en'),
      detectLanguage: () => 'zh-TW',
      candidates: [],
    });
    let notified = 0;
    store.subscribe(() => void (notified += 1));

    await store.load();

    expect(notified).toBe(1);
  });

  // TC-09：localStorage 讀寫拋例外時，用真實後端確認整條路徑語言仍可切換、無例外。
  it('still switches for this session when storage throws (real backend)', async () => {
    const broken = () => {
      throw new Error('SecurityError');
    };
    const store = createSiteLanguageStore({
      backend: createWebLanguageBackend(broken),
      detectLanguage: () => 'zh-TW',
      candidates: ['zh-TW'],
    });

    await store.load();
    await expect(store.set('en')).resolves.toBeUndefined();

    expect(store.get()).toBe('en');
  });

  it('notifies subscribers once per switch, and stops after unsubscribe', async () => {
    const store = createSiteLanguageStore({
      backend: fakeBackend(null),
      detectLanguage: () => 'zh-TW',
      candidates: ['zh-TW'],
    });
    await store.load();
    let notified = 0;
    const unsubscribe = store.subscribe(() => void (notified += 1));

    await store.set('en');
    expect(notified).toBe(1);

    unsubscribe();
    await store.set('zh-TW');
    expect(notified).toBe(1);
  });
});
