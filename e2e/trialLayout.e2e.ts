import { expect, test } from '@playwright/test';

// 專案擁有者 2026-11-11：試用是三天（每天 10:00–15:00，共 15 小時），不開放到一週；
// 種子球名稱依初始化當下的網站語言：英文版純英文，中文版中英並列；初始化後切換語言不改名（FR-10）。
test.describe('trial layout and seed names', () => {
  test.use({ locale: 'en-US', viewport: { width: 1280, height: 900 } });

  test('English site: three days, five hour labels, plain English ball names that stay after switching language', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('trial-app')).toBeVisible();

    await expect(page.getByTestId('day-header')).toHaveCount(3);
    await expect(page.getByTestId('day-column')).toHaveCount(3);
    await expect(page.getByTestId('timeline-label')).toHaveCount(5);
    await expect(page.getByTestId('template-name')).toHaveText(['Focus', 'Rest', 'Chore']);

    await page.getByRole('button', { name: '繁體中文' }).click();
    await expect(page.getByTestId('template-name')).toHaveText(['Focus', 'Rest', 'Chore']);
  });
});

test.describe('Traditional Chinese site', () => {
  test.use({ locale: 'zh-TW', viewport: { width: 1280, height: 900 } });

  test('bilingual ball names', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('trial-app')).toBeVisible();
    await expect(page.getByTestId('template-name')).toHaveText(['專注 Focus', '休息 Rest', '雜事 Chore']);
  });
});
