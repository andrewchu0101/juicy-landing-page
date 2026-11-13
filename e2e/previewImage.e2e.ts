import { expect, test } from '@playwright/test';

// issue 010 / TC-07e（瀏覽器層）：觸控環境的靜態預覽圖真的載得出來、與語言一致、不可拖曳或點擊。
// 只驗證圖與語言的對應與可操作性；圖的視覺品質與觀感是人工項目（M-5），不在這裡判定。
test.use({ locale: 'zh-TW', hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

test('touch environment shows a loaded preview image that follows the page language', async ({ page }) => {
  await page.goto('/');
  const image = page.locator('#trial-step-2 figure.trial-preview img');
  const radialImage = page.locator('#trial-step-1 figure.trial-preview img'); // 步驟 1：六顆球長按選單

  await expect(image).toHaveAttribute('src', '/preview/trial-zh-TW.png');
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await image.getAttribute('alt')).toContain('試用畫面截圖');
  expect(await image.evaluate((img) => getComputedStyle(img).pointerEvents)).toBe('none');
  expect(await image.getAttribute('draggable')).toBe('false');
  expect(await page.locator('figure.trial-preview a, figure.trial-preview button').count()).toBe(0);
  await expect(radialImage).toHaveAttribute('src', '/preview/radial-zh-TW.png');
  await expect.poll(() => radialImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await radialImage.getAttribute('alt')).toContain('長按後的畫面截圖');
  expect(await radialImage.getAttribute('draggable')).toBe('false');
  // 手機寬度不橫向捲動
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await page.getByRole('button', { name: 'English' }).click();
  await expect(image).toHaveAttribute('src', '/preview/trial-en.png');
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  expect(await image.getAttribute('alt')).toContain('Screenshot of the trial');
  await expect(radialImage).toHaveAttribute('src', '/preview/radial-en.png');
  expect(await radialImage.getAttribute('alt')).toContain('Screenshot after a long press');
});
