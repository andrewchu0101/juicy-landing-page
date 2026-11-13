import { expect, test, type Page } from '@playwright/test';

// 試用的兩個體驗之一（專案擁有者 2026-11-13）：長按空白處叫出六顆球，hover 時果凍晃動；只展示，不建立區塊。
// 另一個體驗（側邊三顆球拖放）由 trialDemo.e2e.ts 驗證。預期色碼是 Calendar 固定 commit 預設六顆球的字面值。
test.use({ locale: 'en-US', viewport: { width: 1280, height: 1600 } });

const SIX_COLORS = ['rgb(233, 139, 135)', 'rgb(131, 185, 208)', 'rgb(169, 201, 141)', 'rgb(156, 145, 206)', 'rgb(233, 185, 110)', 'rgb(229, 165, 189)'];

async function openTrial(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('trial-app')).toBeVisible();
  await page.locator('#trial').scrollIntoViewIfNeeded();
}

async function holdOnCalendar(page: Page) {
  const box = await page.getByTestId('calendar-columns').boundingBox();
  if (!box) throw new Error('calendar not visible');
  const at = { x: box.x + box.width / 2, y: box.y + 150 };
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await expect(page.locator('.radial-palette')).toBeVisible(); // 長按 250ms 後出現
  // 等進場動畫（球從中心滑出、120ms）結束再量位置；動畫中途量到的是縮小、偏移的球，會偶爾 hover 不到。
  await page.locator('.radial-choice').last().evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)).then(() => undefined));
  return at;
}

test.describe('radial menu: six balls and hover wobble', () => {
  test('holding an empty spot shows six balls with the Calendar colors and English names', async ({ page }) => {
    await openTrial(page);
    await holdOnCalendar(page);

    const choices = page.locator('.radial-choice');
    await expect(choices).toHaveCount(6);
    await expect(choices.locator('span')).toHaveText(['Coding', 'Study', 'Exercise', 'Reading', 'Rest', 'Personal']);
    const colors = await choices.locator('.ball').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(colors).toEqual(SIX_COLORS);
    await expect(page.getByTestId('template-ball')).toHaveCount(3); // 側邊仍是三顆
    await page.mouse.up();
  });

  test('hovering a ball makes only that ball wobble, and leaving it stops the wobble', async ({ page }) => {
    await openTrial(page);
    await holdOnCalendar(page);
    const second = await page.locator('.radial-choice .ball').nth(1).boundingBox();
    if (!second) throw new Error('ball not visible');

    await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2, { steps: 6 });
    await expect(page.locator('.radial-hovered')).toHaveCount(1);
    await expect(page.locator('.radial-choice').nth(1)).toHaveClass(/radial-hovered/);
    const animation = await page.locator('.radial-hovered .ball').evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).not.toBe('none'); // 果凍晃動（clip-path 動畫）

    await page.mouse.move(second.x + 300, second.y + 300, { steps: 6 });
    await expect(page.locator('.radial-hovered')).toHaveCount(0);
    await expect(page.locator('.radial-palette')).toBeVisible(); // 離開球只是停止晃動，選單還在
    await page.mouse.up();
  });

  test('the wobble grows out of a perfect circle (no pop on hover) and the hovered ball keeps clear of its name', async ({ page }) => {
    await openTrial(page);
    await holdOnCalendar(page);
    const second = await page.locator('.radial-choice .ball').nth(1).boundingBox();
    if (!second) throw new Error('ball not visible');
    await page.mouse.move(second.x + second.width / 2, second.y + second.height / 2, { steps: 6 });
    await expect(page.locator('.radial-hovered')).toHaveCount(1);

    // 動畫順序：先 radial-wobble-in，再接 radial-wobble。
    const names = await page.locator('.radial-hovered .ball').evaluate((el) => el.getAnimations().map((a) => (a as CSSAnimation).animationName).filter(Boolean));
    expect(names).toEqual(['radial-wobble-in', 'radial-wobble']);

    // 把進場動畫停在第 0 毫秒：每個頂點都在半徑 50% 的圓上（正圓），所以從沒有 clip-path 的圓盤切入時不會跳。
    const radii = await page.locator('.radial-hovered .ball').evaluate((el) => {
      const ramp = el.getAnimations().find((a) => (a as CSSAnimation).animationName === 'radial-wobble-in')!;
      ramp.pause();
      ramp.currentTime = 0;
      const polygon = getComputedStyle(el).clipPath;
      return [...polygon.matchAll(/(-?[\d.]+)%\s+(-?[\d.]+)%/g)].map((m) => Math.hypot(Number(m[1]) - 50, Number(m[2]) - 50));
    });
    expect(radii.length).toBeGreaterThan(8);
    for (const r of radii) expect(r).toBeGreaterThan(49.5);
    for (const r of radii) expect(r).toBeLessThan(50.5);

    // 放大 1.3 倍的球（不含果凍的凸出）不壓到名字：球底在名字頂端之上。
    await page.waitForTimeout(400);
    const gap = await page.locator('.radial-hovered').evaluate((el) => el.querySelector('span')!.getBoundingClientRect().top - el.querySelector('.ball')!.getBoundingClientRect().bottom);
    expect(gap).toBeGreaterThanOrEqual(0);
    await page.mouse.up();
  });

  test('releasing closes the menu and never creates a block, even right after hovering a ball', async ({ page }) => {
    await openTrial(page);
    await holdOnCalendar(page);
    const first = await page.locator('.radial-choice .ball').first().boundingBox();
    if (!first) throw new Error('ball not visible');
    await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2, { steps: 6 });
    await page.mouse.move(first.x + 250, first.y + 250, { steps: 6 });
    await page.mouse.up();

    await expect(page.locator('.radial-palette')).toHaveCount(0);
    await expect(page.getByTestId('event-block')).toHaveCount(0);
  });

  test('Escape closes the menu', async ({ page }) => {
    await openTrial(page);
    await holdOnCalendar(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.radial-palette')).toHaveCount(0);
    await page.mouse.up();
  });

  test('the three side balls still create blocks by dragging, in the new Calendar colors', async ({ page }) => {
    await openTrial(page);
    const balls = page.getByTestId('template-ball');
    const colors = await balls.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(colors).toEqual(['rgb(131, 185, 208)', 'rgb(169, 201, 141)', 'rgb(233, 185, 110)']); // Sky、Sage、Peach

    const ball = await balls.first().boundingBox();
    const columns = await page.getByTestId('calendar-columns').boundingBox();
    if (!ball || !columns) throw new Error('trial UI not visible');
    await page.mouse.move(ball.x + ball.width / 2, ball.y + ball.height / 2);
    await page.mouse.down();
    await page.mouse.move(columns.x + columns.width / 6, columns.y + 30, { steps: 10 });
    await page.mouse.up();
    await expect(page.getByTestId('event-block')).toHaveCount(1);
  });
});
