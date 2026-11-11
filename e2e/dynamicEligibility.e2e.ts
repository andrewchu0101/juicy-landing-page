import { expect, test, type Page } from '@playwright/test';

// TC-08a／08b／08c／08d（AC-01.13、INV-02、INV-03、INV-09）與 OR-24 的 N-7、N-8、N-13、N-14：
// 真實瀏覽器裡，在試用進行中動態切換互動資格。
//
// Playwright 沒有切換 pointer／hover 的功能，所以用 addInitScript 換掉 window.matchMedia：
// 只換含 pointer／hover 的查詢，其餘（例如 prefers-reduced-motion）交還給瀏覽器。
// 其餘程式都是真的（閘門、載入器、試用模組、手勢、DOM）。判定仍只看 pointer／hover，與寬度無關。
// 這是模擬輸入能力的變化，不等於實機拔掉滑鼠；M-8 實機驗收仍是 Manual Pending。
const TRIAL_CHUNK = /trialModule[^/]*\.js/;
const PREVIEW_LABEL = '產品預覽';
const WATCHED_TYPES = ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'blur', 'keydown'];

test.use({ locale: 'zh-TW', viewport: { width: 1280, height: 1600 } });

declare global {
  interface Window {
    __setCapability(pointer: string, hover: string): void;
    __windowListenerCount(): number;
  }
}

async function injectControllableInput(page: Page) {
  await page.addInitScript((watched: string[]) => {
    const state: Record<string, string> = { pointer: 'fine', hover: 'hover' };
    const evaluate = (query: string) =>
      query.split(/\s+and\s+/i).every((part) => {
        const match = /^\(\s*(pointer|hover)\s*:\s*([a-z]+)\s*\)$/i.exec(part.trim());
        return match ? state[match[1]!.toLowerCase()] === match[2]!.toLowerCase() : false;
      });
    const original = window.matchMedia.bind(window);
    const lists: { query: string; last: boolean; listeners: Set<(e: unknown) => void> }[] = [];
    window.matchMedia = ((query: string) => {
      if (!/pointer|hover/.test(query)) return original(query);
      const entry = { query, last: evaluate(query), listeners: new Set<(e: unknown) => void>() };
      lists.push(entry);
      return {
        media: query,
        get matches() {
          return evaluate(query);
        },
        addEventListener: (type: string, listener: (e: unknown) => void) => {
          if (type === 'change') entry.listeners.add(listener);
        },
        removeEventListener: (type: string, listener: (e: unknown) => void) => {
          if (type === 'change') entry.listeners.delete(listener);
        },
      } as unknown as MediaQueryList;
    }) as typeof window.matchMedia;
    window.__setCapability = (pointer, hover) => {
      state.pointer = pointer;
      state.hover = hover;
      for (const entry of lists) {
        const now = evaluate(entry.query);
        if (now === entry.last) continue;
        entry.last = now;
        for (const listener of [...entry.listeners]) listener({ matches: now, media: entry.query });
      }
    };

    // INV-09：數試用模組掛在 window 上、目前仍在的指標、焦點與鍵盤監聽器（同一個函式與 capture 只算一次）。
    const live = new Map<string, Set<unknown>>();
    const keyOf = (type: string, capture: boolean) => `${type}|${capture}`;
    const captureOf = (options?: boolean | AddEventListenerOptions) =>
      typeof options === 'boolean' ? options : Boolean(options?.capture);
    const add = window.addEventListener.bind(window);
    const remove = window.removeEventListener.bind(window);
    window.addEventListener = ((type: string, listener: unknown, options?: boolean | AddEventListenerOptions) => {
      // 只數試用模組自己掛上的（Playwright 注入的偵測腳本也會在 window 上掛監聽器，不算）。
      if (watched.includes(type) && listener && /trialModule/.test(new Error().stack ?? '')) {
        const key = keyOf(type, captureOf(options));
        if (!live.has(key)) live.set(key, new Set());
        live.get(key)!.add(listener);
      }
      return add(type, listener as EventListener, options);
    }) as typeof window.addEventListener;
    window.removeEventListener = ((type: string, listener: unknown, options?: boolean | EventListenerOptions) => {
      live.get(keyOf(type, captureOf(options)))?.delete(listener);
      return remove(type, listener as EventListener, options);
    }) as typeof window.removeEventListener;
    window.__windowListenerCount = () => [...live.values()].reduce((sum, set) => sum + set.size, 0);
  }, WATCHED_TYPES);
}

function watchTrialRequests(page: Page) {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (TRIAL_CHUNK.test(request.url())) urls.push(request.url());
  });
  return urls;
}

const setMouse = (page: Page) => page.evaluate(() => window.__setCapability('fine', 'hover'));
const setTouch = (page: Page) => page.evaluate(() => window.__setCapability('coarse', 'none'));
const listenerCount = (page: Page) => page.evaluate(() => window.__windowListenerCount());
const bodyClasses = (page: Page) => page.evaluate(() => [...document.body.classList]);

async function centerOf(page: Page, selector: string, index = 0) {
  const box = await page.locator(selector).nth(index).boundingBox();
  if (!box) throw new Error(`${selector} not visible`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

async function columnPoint(page: Page, fraction: number) {
  const { box } = await centerOf(page, '[data-testid="calendar-columns"]');
  return { x: box.x + box.width / 2, y: box.y + box.height * fraction };
}

/** 從第 ballIndex 顆球拖到日曆欄的 fraction 高度並放開。 */
async function dropBall(page: Page, ballIndex: number, fraction: number) {
  const from = await centerOf(page, '[data-testid="template-ball"]', ballIndex);
  const to = await columnPoint(page, fraction);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await page.mouse.up();
}

async function openTrial(page: Page) {
  await injectControllableInput(page);
  await page.goto('/');
  await expect(page.getByTestId('trial-app')).toBeVisible();
  await page.locator('#trial').scrollIntoViewIfNeeded();
}

test.describe('TC-08 dynamic eligibility (real browser, simulated input capability)', () => {
  test('8a／8b: losing eligibility mid-drag creates no block; regaining it restores the two blocks', async ({ page }) => {
    const requests = watchTrialRequests(page);
    await openTrial(page);

    await dropBall(page, 0, 0.2);
    await dropBall(page, 1, 0.7);
    await expect(page.getByTestId('event-block')).toHaveCount(2);

    // 拖第三顆球，球已在日曆上空時失去資格。
    const from = await centerOf(page, '[data-testid="template-ball"]', 2);
    const over = await columnPoint(page, 0.45);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(over.x, over.y, { steps: 10 });
    await expect(page.getByTestId('ball-overlay')).toBeVisible();
    await setTouch(page);

    // 8a：改顯示靜態預覽；N-8：跟著指標的球、落點預覽不殘留。
    await expect(page.getByText(PREVIEW_LABEL)).toBeVisible();
    await expect(page.getByTestId('trial-app')).toHaveCount(0);
    await expect(page.getByTestId('ball-overlay')).toHaveCount(0);
    await expect(page.getByTestId('drop-ghost')).toHaveCount(0);
    await page.mouse.up(); // 此時沒有手勢在聽，不該產生區塊
    expect(await listenerCount(page)).toBe(0);
    expect(await bodyClasses(page)).toEqual([]);

    // 8b：恢復後仍是原本 2 個區塊，沒有第三個；chunk 仍只請求一次。
    await setMouse(page);
    await expect(page.getByTestId('trial-app')).toBeVisible();
    await expect(page.getByTestId('event-block')).toHaveCount(2);
    await expect(page.getByText(PREVIEW_LABEL)).toHaveCount(0);
    expect(requests).toHaveLength(1);
  });

  test('8c／N-13: toggling ten times requests the chunk once and does not accumulate listeners', async ({ page }) => {
    const requests = watchTrialRequests(page);
    await openTrial(page);
    await dropBall(page, 0, 0.3);
    await expect(page.getByTestId('event-block')).toHaveCount(1);

    const activeListeners = await listenerCount(page);
    expect(activeListeners).toBeGreaterThan(0);

    for (let i = 0; i < 10; i += 1) {
      await setTouch(page);
      await expect(page.getByTestId('trial-app')).toHaveCount(0);
      expect(await listenerCount(page)).toBe(0);
      await setMouse(page);
      await expect(page.getByTestId('trial-app')).toBeVisible();
      expect(await listenerCount(page)).toBe(activeListeners);
    }

    expect(requests).toHaveLength(1);
    await expect(page.getByTestId('event-block')).toHaveCount(1);
    expect(await bodyClasses(page)).toEqual([]);
  });

  test('N-7: losing eligibility while moving a block leaves the block unchanged and clears body classes', async ({ page }) => {
    await openTrial(page);
    await dropBall(page, 0, 0.3);
    await expect(page.getByTestId('event-block')).toHaveCount(1);
    const timeBefore = await page.getByTestId('event-time').first().textContent();

    const block = await centerOf(page, '[data-testid="event-block"]');
    const away = await columnPoint(page, 0.7);
    await page.mouse.move(block.x, block.y);
    await page.mouse.down();
    await page.mouse.move(away.x, away.y, { steps: 10 });
    await expect(page.locator('body.trial-interacting')).toHaveCount(1);
    await setTouch(page);

    await expect(page.getByTestId('trial-app')).toHaveCount(0);
    expect(await bodyClasses(page)).toEqual([]);
    expect(await listenerCount(page)).toBe(0);
    await page.mouse.up();

    await setMouse(page);
    await expect(page.getByTestId('event-block')).toHaveCount(1);
    await expect(page.getByTestId('event-time').first()).toHaveText(timeBefore ?? '');
  });

  test('8d／N-14: losing eligibility while the chunk is still loading mounts nothing', async ({ page }) => {
    const requests = watchTrialRequests(page);
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route(TRIAL_CHUNK, async (route) => {
      await gate;
      await route.continue();
    });
    await injectControllableInput(page);
    await page.goto('/');
    await expect.poll(() => requests.length).toBe(1);

    await setTouch(page);
    release();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('trial-app')).toHaveCount(0);
    await expect(page.getByText(PREVIEW_LABEL)).toBeVisible();

    await setMouse(page);
    await expect(page.getByTestId('trial-app')).toBeVisible();
    expect(requests).toHaveLength(1);
  });
});
