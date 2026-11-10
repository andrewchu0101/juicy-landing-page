import { defineConfig, devices } from '@playwright/test';

// issue 004：TC-07b／07c／07d 的 e2e。瀏覽器請放在 D 槽快取：
//   PLAYWRIGHT_BROWSERS_PATH=D:\DevCache\playwright-browsers
// 這裡只跑 Chromium；Playwright 模擬 pointer／hover 的能力未驗證，失敗時以 M-4 實機結果為準。
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
