import { describe, expect, it } from 'vitest';
import vercelJson from '../vercel.json?raw';

// issue 022｜清單第 16 列：安全標頭。Vercel 讀 repository 根目錄的 vercel.json 為所有路徑加標頭。
// 預期值是字面規則（來自 OWASP 與 CSP 規格的常見做法），不呼叫實作算出來。
// 這裡只驗設定檔內容；「部署後標頭真的生效」要在預覽部署用 curl -I 確認（人工，未做前不得宣稱）。
type Header = { key: string; value: string };
type Rule = { source: string; headers: Header[] };

const config = JSON.parse(vercelJson) as { headers: Rule[] };
const rule = config.headers.find((r) => r.source === '/(.*)');
const header = (name: string): string | undefined =>
  rule?.headers.find((h) => h.key.toLowerCase() === name.toLowerCase())?.value;

/** CSP 字串 → { 指令名: [來源...] } */
function parseCsp(value: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const part of value.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) out[name] = sources;
  }
  return out;
}

describe('vercel.json security headers (checklist 16)', () => {
  it('applies one rule to every path', () => {
    expect(rule).toBeDefined();
  });

  it('stops MIME sniffing, framing and referrer leakage', () => {
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('X-Frame-Options')).toBe('DENY');
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('denies powerful browser features the site never uses', () => {
    const policy = header('Permissions-Policy') ?? '';
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
      expect(policy, feature).toContain(`${feature}=()`);
    }
  });

  describe('Content-Security-Policy', () => {
    const csp = parseCsp(header('Content-Security-Policy') ?? '');

    it('is present and defaults to same-origin only', () => {
      expect(csp['default-src']).toEqual(["'self'"]);
    });

    it('allows scripts only from the same origin, with no inline or eval escape hatch', () => {
      expect(csp['script-src']).toEqual(["'self'"]);
    });

    it('allows only same-origin styles (the built page has no inline style)', () => {
      expect(csp['style-src']).toEqual(["'self'"]);
    });

    it('closes the plugin, base-tag, form and framing vectors', () => {
      expect(csp['object-src']).toEqual(["'none'"]);
      expect(csp['base-uri']).toEqual(["'self'"]);
      expect(csp['form-action']).toEqual(["'self'"]);
      expect(csp['frame-ancestors']).toEqual(["'none'"]);
    });

    it('lets the trial upload nothing: connections stay same-origin (privacy, NFR-06)', () => {
      expect(csp['connect-src']).toEqual(["'self'"]);
    });

    it('never names a wildcard or http: source', () => {
      const all = Object.values(csp).flat();
      expect(all.filter((s) => s === '*' || s === 'http:' || s.startsWith('http://'))).toEqual([]);
    });
  });
});
