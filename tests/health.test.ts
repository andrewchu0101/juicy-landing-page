import { build, preview, type PreviewServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// 骨架 smoke test（不在 docs/06-test-plan.md 的 TC-01～TC-12 內）：
// 實際建置、啟動預覽伺服器，驗證首頁回 200 並含 #root 與入口腳本。
const OUT_DIR = 'dist-test';

describe('skeleton health', () => {
  let server: PreviewServer;
  let baseUrl: string;

  beforeAll(async () => {
    await build({ logLevel: 'silent', build: { outDir: OUT_DIR, emptyOutDir: true } });
    server = await preview({ logLevel: 'silent', build: { outDir: OUT_DIR }, preview: { host: '127.0.0.1', port: 0 } });
    baseUrl = server.resolvedUrls?.local[0] ?? '';
  }, 60_000);

  afterAll(async () => {
    await server?.close();
  });

  it('serves the entry page with 200, a #root element and a bundled script', async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('id="root"');
    expect(html).toMatch(/<script[^>]+type="module"[^>]+src="\/assets\/[^"]+\.js"/);
  });

  // issue 022：vercel.json 的 CSP 是 script-src／style-src 'self'。建置產物若有內嵌 script 或 style，部署後會被擋。
  it('ships no inline script or style, so the strict Content-Security-Policy in vercel.json holds', async () => {
    const html = await (await fetch(baseUrl)).text();
    const inlineScripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(
      ([, attributes, body]) => !/\bsrc=/.test(attributes ?? '') || (body ?? '').trim() !== '',
    );
    expect(inlineScripts).toEqual([]);
    expect(html).not.toMatch(/<style\b/i);
    expect(html).not.toMatch(/\sstyle=/i);
    expect(html).not.toMatch(/\son[a-z]+=/i);
  });
});
