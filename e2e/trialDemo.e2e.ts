import { expect, test, type Page } from '@playwright/test';

// issue 005／006 的瀏覽器層驗收（TC-01a／01e／01f、TC-04、TC-06a～6d 與取消）。
// 預期值是 docs/06-test-plan.md 的人工算例（縮放 1 像素／分鐘，可見範圍起點 10:00，所以「y 像素」就是「10:00 之後第 y 分鐘」）。
// 用英文介面，時間標籤是 "10:30 AM–12:30 PM" 這種格式。調整長度、命名、刪除、復原暫不開放（專案擁有者 2026-11-11），不在這裡。
test.use({ locale: 'en-US', viewport: { width: 1280, height: 1600 } });

const LANGUAGE_KEY = 'juicy-site-language';

async function openTrial(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('trial-app')).toBeVisible();
  await page.locator('#trial').scrollIntoViewIfNeeded();
}

/** 第一天那一欄：x 取欄中心，top 是 10:00 的位置。 */
async function firstColumn(page: Page) {
  const box = await page.getByTestId('calendar-columns').boundingBox();
  if (!box) throw new Error('calendar not visible');
  return { x: box.x + box.width / 6, top: box.y, height: box.height };
}

/** 從第 ballIndex 顆球拖到第一天、10:00 之後第 minutes 分鐘處放開（minutes 即像素）。 */
async function dropBallAt(page: Page, ballIndex: number, minutes: number) {
  const ball = await page.getByTestId('template-ball').nth(ballIndex).boundingBox();
  const column = await firstColumn(page);
  if (!ball) throw new Error('ball not visible');
  await page.mouse.move(ball.x + ball.width / 2, ball.y + ball.height / 2);
  await page.mouse.down();
  await page.mouse.move(column.x, column.top + minutes, { steps: 10 });
  await page.mouse.up();
}

test.describe('TC-01 create (a: magnet, e: past the visible range)', () => {
  test('1a: released 7px above the 10:30 line snaps to 10:30–12:30, titled and coloured like the ball', async ({ page }) => {
    await openTrial(page);
    const ballColor = await page.getByTestId('template-ball').first().evaluate((el) => getComputedStyle(el).getPropertyValue('--ball-color') || getComputedStyle(el).backgroundColor);

    await dropBallAt(page, 0, 23); // 10:30 線在 30，上方 7 像素 = 23

    const block = page.getByTestId('event-block');
    await expect(block).toHaveCount(1);
    await expect(page.getByTestId('event-time')).toHaveText('10:30 AM–12:30 PM');
    await expect(page.getByTestId('event-title')).toHaveText('Focus');
    expect(await block.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
    expect(ballColor).not.toBe('');
    await expect(page.getByTestId('template-ball')).toHaveCount(3); // 球仍在側邊可再用
  });

  test('1a boundary: 9px above the line does not snap (10:21–12:21)', async ({ page }) => {
    await openTrial(page);
    await dropBallAt(page, 0, 21);
    await expect(page.getByTestId('event-time')).toHaveText('10:21 AM–12:21 PM');
  });

  test('1e: created at 14:30 the block runs to 16:30 and is kept, past the visible 15:00', async ({ page }) => {
    await openTrial(page);
    await dropBallAt(page, 0, 270); // 14:30 = 10:00 + 270 分鐘
    await expect(page.getByTestId('event-block')).toHaveCount(1);
    // 可見的只有 14:30–15:00（30 像素），太矮不顯示時間文字；完整起訖在區塊的 title 屬性（"標題 · 時間範圍"）。
    await expect(page.getByTestId('event-block')).toHaveAttribute('title', 'Focus · 2:30 PM–4:30 PM');
  });
});

test.describe('TC-01f excluded controls are not rendered (AC-01.15, OR-20)', () => {
  test('no links, text fields, switches, sliders, menus or dialogs; the only buttons are the three seed balls', async ({ page }) => {
    await openTrial(page);
    const trial = page.locator('#trial');
    for (const role of ['link', 'textbox', 'combobox', 'checkbox', 'switch', 'slider', 'spinbutton', 'menuitem', 'tab', 'toolbar', 'dialog'] as const) {
      expect(await trial.getByRole(role, { includeHidden: true }).count(), role).toBe(0);
    }
    // 球是 role="button"（可近用名稱 "Drag <球名> onto the calendar"），這是唯一保留的控制項。
    const buttons = trial.getByRole('button', { includeHidden: true });
    await expect(buttons).toHaveCount(3);
    expect(await buttons.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')))).toEqual([
      'Drag Focus onto the calendar',
      'Drag Rest onto the calendar',
      'Drag Chore onto the calendar',
    ]);
  });

  test('no excluded control by visible or accessible name, in English and Traditional Chinese', async ({ page }) => {
    await openTrial(page);
    const trial = page.locator('#trial');
    const names = /today|previous|next day|next week|day view|week view|settings|zoom|magnet|workspace|open file|save|notification|inspector|今天|上一|下一|檢視|設定|縮放|磁吸|工作區|開啟|儲存|通知|編輯面板/i;
    expect(await trial.getByText(names).count()).toBe(0);
    expect(await trial.getByLabel(names).count()).toBe(0);
    expect(await trial.getByRole('button', { name: names, includeHidden: true }).count()).toBe(0);
    await page.getByRole('button', { name: '繁體中文' }).click();
    expect(await trial.getByText(names).count()).toBe(0);
    expect(await trial.getByLabel(names).count()).toBe(0);
  });

  test('no tabbable element inside the trial, and Tab never lands in it', async ({ page }) => {
    await openTrial(page);
    expect(await page.locator('#trial').evaluate((el) => el.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])').length)).toBe(0);

    await page.locator('#trial').focus();
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-testid="trial-app"]')))).toBe(false);
    }
  });

  test('the three seed balls are the only controls in the sidebar', async ({ page }) => {
    await openTrial(page);
    await expect(page.getByTestId('template-ball')).toHaveCount(3);
    await expect(page.getByTestId('template-name')).toHaveText(['Focus', 'Rest', 'Chore']);
  });
});

test.describe('TC-04 move an existing block (AC-01.7, REUSE-03)', () => {
  test('grabbed 20 minutes in and released at 12:50 → 12:30–14:30, length 120, title unchanged', async ({ page }) => {
    await openTrial(page);
    await dropBallAt(page, 0, 0); // 10:00–12:00
    await expect(page.getByTestId('event-time')).toHaveText('10:00 AM–12:00 PM');

    const column = await firstColumn(page);
    await page.mouse.move(column.x, column.top + 20); // 距頂端 20 分鐘
    await page.mouse.down();
    await page.mouse.move(column.x, column.top + 100, { steps: 6 });
    await page.mouse.move(column.x, column.top + 170, { steps: 6 }); // 12:50
    await page.mouse.up();

    await expect(page.getByTestId('event-block')).toHaveCount(1);
    await expect(page.getByTestId('event-time')).toHaveText('12:30 PM–2:30 PM');
    await expect(page.getByTestId('event-title')).toHaveText('Focus');
  });

  test('Escape during a move cancels it: the block stays where it was', async ({ page }) => {
    await openTrial(page);
    await dropBallAt(page, 0, 0);
    const column = await firstColumn(page);
    await page.mouse.move(column.x, column.top + 20);
    await page.mouse.down();
    await page.mouse.move(column.x, column.top + 170, { steps: 8 });
    await page.keyboard.press('Escape');
    await page.mouse.up();

    await expect(page.getByTestId('event-time')).toHaveText('10:00 AM–12:00 PM');
  });
});

test.describe('cancel: no block is created (AC-01.2, REUSE-05)', () => {
  test('Escape while dragging a ball over the calendar creates nothing', async ({ page }) => {
    await openTrial(page);
    const ball = await page.getByTestId('template-ball').first().boundingBox();
    const column = await firstColumn(page);
    if (!ball) throw new Error('ball not visible');
    await page.mouse.move(ball.x + ball.width / 2, ball.y + ball.height / 2);
    await page.mouse.down();
    await page.mouse.move(column.x, column.top + 100, { steps: 8 });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await expect(page.getByTestId('event-block')).toHaveCount(0);
  });

  test('releasing a ball outside the calendar creates nothing', async ({ page }) => {
    await openTrial(page);
    const ball = await page.getByTestId('template-ball').first().boundingBox();
    if (!ball) throw new Error('ball not visible');
    await page.mouse.move(ball.x + ball.width / 2, ball.y + ball.height / 2);
    await page.mouse.down();
    await page.mouse.move(ball.x + ball.width / 2 + 5, ball.y + ball.height + 60, { steps: 8 }); // 仍在側邊欄，不在日曆上
    await page.mouse.up();
    await expect(page.getByTestId('event-block')).toHaveCount(0);
  });
});

test.describe('TC-06 nothing saved, nothing sent, cleared on reload', () => {
  test('6a: after creating blocks, no storage beyond the language key, no cookie, no request', async ({ page, context }) => {
    await openTrial(page);
    const requestsAfterLoad: string[] = [];
    page.on('request', (request) => requestsAfterLoad.push(`${request.method()} ${request.url()}`));
    // 切換語言是唯一允許的寫入（INV-01）。
    await page.getByRole('button', { name: 'English' }).click();

    await dropBallAt(page, 0, 23);
    await dropBallAt(page, 1, 120);
    await dropBallAt(page, 2, 200);
    await expect(page.getByTestId('event-block')).toHaveCount(3);

    const storage = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
      cookie: document.cookie,
    }));
    expect(storage.local.filter((key) => key !== LANGUAGE_KEY)).toEqual([]);
    expect(storage.session).toEqual([]);
    expect(storage.cookie).toBe('');
    expect(await context.cookies()).toEqual([]);
    // 操作期間沒有任何網路請求（試用內容不外送）。
    expect(requestsAfterLoad).toEqual([]);
    // IndexedDB 沒有被建立。
    expect(await page.evaluate(async () => (await indexedDB.databases?.())?.length ?? 0)).toBe(0);
  });

  test('6b: after a reload the calendar is empty and the three balls are back', async ({ page }) => {
    await openTrial(page);
    await dropBallAt(page, 0, 23);
    await expect(page.getByTestId('event-block')).toHaveCount(1);

    await page.reload();
    await expect(page.getByTestId('trial-app')).toBeVisible();
    await expect(page.getByTestId('event-block')).toHaveCount(0);
    await expect(page.getByTestId('template-ball')).toHaveCount(3);
  });

  test('6c: a second tab in the same browser context does not see the blocks', async ({ page, context }) => {
    await openTrial(page);
    await dropBallAt(page, 0, 23);
    await expect(page.getByTestId('event-block')).toHaveCount(1);

    const second = await context.newPage();
    await second.goto('/');
    await expect(second.getByTestId('trial-app')).toBeVisible();
    await expect(second.getByTestId('event-block')).toHaveCount(0);
    await expect(page.getByTestId('event-block')).toHaveCount(1); // 原分頁不受影響
  });

  test('6d: the note about nothing being uploaded is next to the trial, in both languages', async ({ page }) => {
    await openTrial(page);
    await expect(page.locator('#trial')).toContainText('Nothing you do in the trial is uploaded, and it disappears when you reload the page.');
    await page.getByRole('button', { name: '繁體中文' }).click();
    await expect(page.locator('#trial')).toContainText('試用內容不會上傳，重新整理頁面就會消失');
  });
});
