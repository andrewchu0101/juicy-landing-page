import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';
import packageJson from '../package.json?raw';
import vercelJson from '../vercel.json?raw';

// 頁尾寫著「本網站不使用流量統計。」（AC-03.2，專案擁有者 2026-11-13 決定不做統計），這句話必須是真的。
// 這是樣式比對：擋常見的統計工具名稱與網域，不是證明；實際請求由 e2e 與人工檢查網路面板（M-9）把關。
const source = import.meta.glob(['../src/**/*.{ts,tsx}', '!../src/**/*.test.*'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const ANALYTICS = [
  'google-analytics',
  'googletagmanager',
  'gtag(',
  'plausible',
  'umami',
  'matomo',
  'posthog',
  'mixpanel',
  'hotjar',
  'clarity.ms',
  'segment.com',
  'amplitude',
  'fathom',
  'simpleanalytics',
  '@vercel/analytics',
  '@vercel/speed-insights',
  '_vercel/insights',
];

describe('no analytics anywhere (AC-03.2)', () => {
  it('scans real files (guards against an empty glob)', () => {
    expect(Object.keys(source).length).toBeGreaterThan(20);
  });

  it('index.html, package.json, vercel.json and src/ mention no analytics tool or domain', () => {
    const haystack: Record<string, string> = { 'index.html': indexHtml, 'package.json': packageJson, 'vercel.json': vercelJson, ...source };
    const hits: string[] = [];
    for (const [file, text] of Object.entries(haystack)) {
      for (const word of ANALYTICS) if (text.toLowerCase().includes(word)) hits.push(`${file}: ${word}`);
    }
    expect(hits).toEqual([]);
  });

  it('the CSP only allows connections to the site itself, so a tracker could not call out', () => {
    expect(vercelJson).toContain("connect-src 'self'");
    expect(vercelJson).toContain("script-src 'self'");
  });
});
