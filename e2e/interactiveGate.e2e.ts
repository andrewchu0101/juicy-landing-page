import { expect, test, type Page } from '@playwright/test';

// TC-07b／07c／07d（AC-01.13 等）：互動資格閘門的瀏覽器層驗證。
// 判定只看 pointer: fine 與 hover: hover，不看寬度或裝置（INV-02）。
const TRIAL_CHUNK = /trialModule/;
const PREVIEW_LABEL = '產品預覽';

// 預設語言跟瀏覽器走（FR-14）；固定繁中，否則斷言字串會因測試瀏覽器的語言而失效。
test.use({ locale: 'zh-TW' });

function watchTrialRequests(page: Page) {
  const urls: string[] = [];
  page.on('request', (request) => {
    if (TRIAL_CHUNK.test(request.url())) urls.push(request.url());
  });
  return urls;
}

test.describe('TC-07b touch / non-qualifying environment', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('shows the static preview, loads no trial module, and keeps the download section', async ({ page }) => {
    const trialRequests = watchTrialRequests(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(await page.evaluate(() => matchMedia('(pointer: fine) and (hover: hover)').matches)).toBe(false);
    await expect(page.getByText(PREVIEW_LABEL)).toBeVisible();
    expect(trialRequests).toEqual([]);
    await expect(page.locator('#download')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe('TC-07c mouse environment', () => {
  test('requests the trial module and drops the static preview', async ({ page }) => {
    const trialRequests = watchTrialRequests(page);
    await page.goto('/');

    expect(await page.evaluate(() => matchMedia('(pointer: fine) and (hover: hover)').matches)).toBe(true);
    await expect.poll(() => trialRequests.length).toBeGreaterThan(0);
    await expect(page.getByText(PREVIEW_LABEL)).toHaveCount(0);
  });
});

test.describe('TC-07d mouse environment at phone width', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('stays interactive: width is not part of the eligibility check', async ({ page }) => {
    const trialRequests = watchTrialRequests(page);
    await page.goto('/');

    await expect.poll(() => trialRequests.length).toBeGreaterThan(0);
    await expect(page.getByText(PREVIEW_LABEL)).toHaveCount(0);
  });
});
