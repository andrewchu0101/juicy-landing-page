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
  { locale: 'zh-TW', file: 'trial-zh-TW.png', ogFile: 'og-zh-TW.png' },
  { locale: 'en-US', file: 'trial-en.png', ogFile: 'og-en.png' },
] as const;
// 分享圖（issue 013）：社群平台建議 1.91:1。同一個畫面（不是另外畫的圖）：試用區是 640×400 CSS 像素、置中，
// 視窗寬 800、scale 1.5，取 800×420 CSS 像素（試用區上下各留 10px）→ 剛好 1200×630，試用區約佔 80% 寬。
// （試過 fullPage 加 clip：試用區超出頁面內容欄，被截成 920 寬；所以視窗要夠大、不用 fullPage，直接以視窗座標裁切。）
const OG = { viewport: { width: 800, height: 1400 }, scale: 1.5, margin: 10, width: 800, height: 420 } as const;

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  async function capture(locale: string, viewport: { width: number; height: number }, scale: number, output: (app: import('@playwright/test').Locator, page: import('@playwright/test').Page) => Promise<void>) {
    const context = await browser.newContext({ locale, viewport, deviceScaleFactor: scale });
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
    await output(app, page);
    await context.close();
  }
  for (const { locale, file, ogFile } of LANGUAGES) {
    await capture(locale, { width: 1280, height: 800 }, 2, (app) => app.screenshot({ path: `${OUT}/${file}`, animations: 'disabled' }).then(() => undefined));
    await capture(locale, OG.viewport, OG.scale, async (app, page) => {
      const box = await app.boundingBox();
      if (!box) throw new Error('trial app not visible');
      const clip = { x: box.x + box.width / 2 - OG.width / 2, y: box.y - OG.margin, width: OG.width, height: OG.height };
      if (clip.x < 0 || clip.y < 0 || clip.y + clip.height > OG.viewport.height) throw new Error(`share image clip outside the viewport: ${JSON.stringify(clip)}`);
      await page.screenshot({ path: `${OUT}/${ogFile}`, animations: 'disabled', clip });
    });
  }
} finally {
  await browser.close();
}
