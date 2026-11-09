// INV-01 監看夾具（005、006、007 重用）：記錄 localStorage 寫入、fetch、XHR、sendBeacon、cookie 寫入。
// 沒有 DOM 的單元環境以記錄用替身取代缺少的全域；真實瀏覽器由 e2e（Playwright，未核准）驗。
export type PrivacyCall = { api: string; detail: string };

const KEYS = ['localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest', 'navigator'] as const;

export function watchPrivacy() {
  const g = globalThis as Record<string, unknown>;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const key of KEYS) saved.set(key, Object.getOwnPropertyDescriptor(g, key));
  const log: PrivacyCall[] = [];
  const record = (api: string, detail: unknown) => log.push({ api, detail: String(detail) });
  const define = (key: string, value: unknown) =>
    Object.defineProperty(g, key, { value, configurable: true, writable: true });

  const storage = (name: string) => ({
    setItem: (k: string, v: string) => record(`${name}.setItem`, `${k}=${v}`),
    removeItem: () => {},
    getItem: () => null,
    clear: () => {},
  });
  define('localStorage', storage('localStorage'));
  define('sessionStorage', storage('sessionStorage'));
  define('fetch', (input: unknown) => {
    record('fetch', input);
    return Promise.reject(new Error('network blocked by privacy watch'));
  });
  define(
    'XMLHttpRequest',
    class {
      open(_method: string, url: string) {
        record('XMLHttpRequest.open', url);
      }
      send(body: unknown) {
        record('XMLHttpRequest.send', body);
      }
    },
  );
  define('navigator', {
    sendBeacon: (url: string, data: unknown) => {
      record('sendBeacon', `${url} ${String(data)}`);
      return true;
    },
  });

  return {
    calls: () => [...log],
    restore() {
      for (const [key, descriptor] of saved) {
        if (descriptor) Object.defineProperty(g, key, descriptor);
        else delete g[key];
      }
    },
  };
}
