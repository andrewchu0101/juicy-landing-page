// issue 011 / TC-07f：效能基線。只記錄原始數據，不判定通過或失敗，也不宣稱達標。
// 用法（先 npm run build && npm run preview，另一個終端機再跑）：
//   PLAYWRIGHT_BROWSERS_PATH=<瀏覽器位置> node scripts/measurePerformance.ts
// 量測條件：本機 Chromium（Playwright）、對本機預覽伺服器（沒有網路延遲、沒有 CDN）、W1 1280×800、無 CPU／網路節流。
// 這些數字只能跟「同一台電腦、同一方法」的下一次比較，不代表真實訪客的體驗。
import { chromium } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BASE = process.env.PREVIEW_URL ?? 'http://127.0.0.1:4173/';
const RUNS = 7;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const round = (x: number) => Math.round(x * 10) / 10;

const browser = await chromium.launch();
try {
  const loads: Array<{ domContentLoaded: number; load: number; trialVisible: number }> = [];
  for (let i = 0; i < RUNS; i++) {
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.goto(BASE);
    await page.getByTestId('trial-app').waitFor();
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { domContentLoaded: nav.domContentLoadedEventEnd, load: nav.loadEventEnd, trialVisible: performance.now() };
    });
    loads.push({ domContentLoaded: round(timing.domContentLoaded), load: round(timing.load), trialVisible: round(timing.trialVisible) });
    await context.close();
  }

  // 拖曳流暢度：拖一顆種子球越過日曆 90 步，同時用 requestAnimationFrame 記錄每一格的間隔。
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  await page.goto(BASE);
  await page.getByTestId('trial-app').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[] };
    w.__frames = [];
    let last = performance.now();
    const tick = (now: number) => {
      w.__frames.push(now - last);
      last = now;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const ball = await page.getByTestId('template-ball').first().boundingBox();
  const columns = await page.getByTestId('calendar-columns').boundingBox();
  if (!ball || !columns) throw new Error('trial UI not visible');
  await page.mouse.move(ball.x + ball.width / 2, ball.y + ball.height / 2);
  await page.mouse.down();
  await page.evaluate(() => ((window as unknown as { __frames: number[] }).__frames.length = 0));
  await page.mouse.move(columns.x + columns.width * 0.8, columns.y + 280, { steps: 90 });
  const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames);
  await page.mouse.up();
  const sorted = [...frames].sort((a, b) => a - b);
  const drag = {
    frames: frames.length,
    meanMs: round(frames.reduce((a, b) => a + b, 0) / frames.length),
    p95Ms: round(sorted[Math.floor(sorted.length * 0.95)]!),
    maxMs: round(sorted.at(-1)!),
  };
  await context.close();

  const dir = 'dist/assets';
  const assets = readdirSync(dir)
    .filter((f) => /\.(js|css)$/.test(f))
    .map((f) => ({ file: f.replace(/-[A-Za-z0-9_]{8}\./, '-<hash>.'), bytes: statSync(`${dir}/${f}`).size, gzipBytes: gzipSync(readFileSync(`${dir}/${f}`)).length }));

  console.log(
    JSON.stringify(
      {
        env: { chromium: browser.version(), node: process.version, viewport: '1280x800', throttling: 'none', target: BASE },
        runs: RUNS,
        loadMs: { median: { domContentLoaded: median(loads.map((l) => l.domContentLoaded)), load: median(loads.map((l) => l.load)), trialVisible: median(loads.map((l) => l.trialVisible)) }, raw: loads },
        dragFrames: drag,
        assets,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
