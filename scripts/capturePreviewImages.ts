// issue 010：從「實際運作的互動版」截靜態預覽圖，中英各一張。不是仿真圖。
// 用法（先啟動預覽：npm run build && npm run preview，另一個終端機再跑）：
//   PLAYWRIGHT_BROWSERS_PATH=<瀏覽器位置> node scripts/capturePreviewImages.ts
// 畫面：W1 1280×800、三天（每天 10:00–15:00）、三顆種子球、第一天一個 10:00–12:00 的區塊。種子名稱與色碼若改了（OR-12），要重截。
// 英文版的種子球名稱是純英文（依初始化當下的網站語言決定）。
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/';
const OUT = 'public/preview';
const LANGUAGES = [
  { locale: 'zh-TW', file: 'trial-zh-TW.png' },
  { locale: 'en-US', file: 'trial-en.png' },
] as const;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const { locale, file } of LANGUAGES) {
    const context = await browser.newContext({ locale, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(BASE);
    const app = page.getByTestId('trial-app');
    await app.waitFor();
    await app.scrollIntoViewIfNeeded();

    const ball = await page.getByTestId('template-ball').first().boundingBox();
    const columns = await page.getByTestId('calendar-columns').boundingBox();
    if (!ball || !columns) throw new Error('trial UI not visible');
    // 放在第一天（三欄的第一欄）的最上緣：磁吸後起點 10:00，預設長度 120 分鐘 → 10:00–12:00。
    await page.mouse.move(ball.x + ball.width / 2, ball.y + ball.height / 2);
    await page.mouse.down();
    await page.mouse.move(columns.x + columns.width / 6, columns.y + 2, { steps: 12 });
    await page.mouse.up();
    await page.getByTestId('event-block').waitFor();
    await page.mouse.move(0, 0); // 移開游標，避免懸停樣式
    // 「現在」的橫線會隨截圖時間出現在不同位置，圖會因此看起來像在示範某個時刻；只在截圖時隱藏，不改產品畫面。
    await page.addStyleTag({ content: '[data-testid="now-line"]{display:none !important}' });
    await page.waitForTimeout(1200); // 落下動畫播完

    const time = await page.getByTestId('event-time').first().textContent();
    console.log(`${locale}: block time label = ${time}`);
    await app.screenshot({ path: `${OUT}/${file}`, animations: 'disabled' });
    await context.close();
  }
} finally {
  await browser.close();
}
