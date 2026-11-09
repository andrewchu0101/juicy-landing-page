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
});
