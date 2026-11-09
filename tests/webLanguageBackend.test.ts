import { describe, expect, it } from 'vitest';
import { createWebLanguageBackend, type KeyValueStorage } from '../src/site/webLanguageBackend';

// 記憶體假儲存，每個測試各自新建；不碰真實 localStorage（測試環境為 node，本來就沒有）。
function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

// TC-09｜語言保留（AC-03.1、FR-10）
describe('TC-09 webLanguageBackend persistence (AC-03.1, FR-10, DATA-05)', () => {
  it('reads back the language the visitor chose, as if after a reload', async () => {
    const storage = memoryStorage();
    await createWebLanguageBackend(() => storage).writeAppSettings({ language: 'en' });

    // 重新整理 = 新的後端實例，共用同一份儲存
    const afterReload = createWebLanguageBackend(() => storage);

    expect(await afterReload.readAppSettings()).toEqual({ language: 'en' });
  });

  it.each(['fr', '', 'EN', 'zh'])('treats an invalid saved value %j as unset', async (saved) => {
    const storage = memoryStorage({ 'juicy-site-language': saved });

    expect(await createWebLanguageBackend(() => storage).readAppSettings()).toEqual({ language: null });
  });

  // 存取 localStorage 本身（隱私模式、封鎖網站資料）或讀寫都可能拋例外。
  const failures: Record<string, () => KeyValueStorage> = {
    'getItem/setItem throw': () => ({
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    }),
    'accessing storage throws': () => {
      throw new Error('SecurityError');
    },
  };

  describe.each(Object.entries(failures))('when %s', (_label, getStorage) => {
    it('reads as unset instead of throwing', async () => {
      expect(await createWebLanguageBackend(getStorage).readAppSettings()).toEqual({ language: null });
    });

    it('swallows write failures silently', async () => {
      await expect(createWebLanguageBackend(getStorage).writeAppSettings({ language: 'en' })).resolves.toBeUndefined();
    });
  });
});
