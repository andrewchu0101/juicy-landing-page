import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { TrialSection } from '../src/components/TrialSection';
import { LanguageProvider } from '../src/site/LanguageContext';
import { createSiteLanguageStore } from '../src/site/siteLanguage';
import type { SiteLanguage } from '../src/site/webLanguageBackend';
import { createTrialLoader, type TrialModule } from '../src/trial/trialLoader';
import { flush } from './fixtures/fakeTrialModule';

async function render(language: SiteLanguage, ui: React.ReactElement): Promise<string> {
  const store = createSiteLanguageStore({
    backend: {
      readAppSettings: async () => ({ language }),
      writeAppSettings: async () => {},
      systemInfo: async () => ({ locale: null, hour12: null }),
    },
    detectLanguage: () => 'zh-TW',
    candidates: [],
  });
  await store.load();
  return renderToStaticMarkup(<LanguageProvider store={store}>{ui}</LanguageProvider>);
}

const FAKE_MODULE: TrialModule = {
  ensureReady: async () => {},
  TrialShell: () => <div data-fake-trial="">fake trial</div>,
  RadialShell: () => <div data-fake-radial="">fake radial</div>,
};

// TC-07b（靜態標記層）｜不符合資格時的靜態預覽容器（AC-01.6、FR-08、UI-03）
describe('TC-07b static preview shell (UI-03, FR-08)', () => {
  it('shows the product-preview label and the caption below it in Traditional Chinese', async () => {
    const html = await render('zh-TW', <TrialSection />);

    expect(html).toContain('產品預覽');
    expect(html).toContain('將球拖進日曆，即可建立時間區塊。請使用電腦及滑鼠體驗互動試用。');
    expect(html).not.toContain('data-fake-trial');
  });

  it('shows the English label and caption in English with no Chinese text (NFR-02)', async () => {
    const html = await render('en', <TrialSection />);
    const text = html.replace(/<[^>]+>/g, ' ');

    expect(text).toContain('Product preview');
    expect(text).not.toMatch(/[㐀-鿿]/);
  });

  // 契約變更（issue 010，2026-11-11）：預覽先前只有占位文字，現在放入實際截圖，所以「不得有 img」改為
  // 「只能有一張不可拖曳的靜態圖，且沒有連結、按鈕或點擊處理」。不可拖曳、不可點擊的要求本身沒有放寬。
  it('is not draggable or clickable: one static image, no link, button, draggable element or click handler', async () => {
    const html = await render('zh-TW', <TrialSection />);
    const preview = /<figure[\s\S]*?<\/figure>/.exec(html)?.[0] ?? '';

    expect(preview).not.toBe('');
    expect(preview.match(/<img\b/g)).toHaveLength(1);
    expect(preview).toContain('draggable="false"');
    expect(preview).not.toMatch(/<(a|button)\b|draggable="true"|onclick/i);
  });

  it('shows the screenshot and alt text that match the page language (UI-03, NFR-02)', async () => {
    const zh = await render('zh-TW', <TrialSection />);
    const en = await render('en', <TrialSection />);

    expect(zh).toContain('src="/preview/trial-zh-TW.png"');
    expect(zh).toContain('alt="試用畫面截圖');
    expect(en).toContain('src="/preview/trial-en.png"');
    expect(en).toContain('alt="Screenshot of the trial');
    expect(en).not.toContain('trial-zh-TW');
    expect(zh).not.toContain('trial-en.png');
    expect(/alt="([^"]*)"/.exec(en)![1]).not.toMatch(/[㐀-鿿]/);
  });

  it('keeps the download section visible on the page when the preview is shown (AC-02.1)', async () => {
    const html = await render('zh-TW', <App />);

    expect(html).toContain('下載 Windows 版');
  });
});

describe('TC-08 trial section by phase (MOD-02)', () => {
  it('renders the mounted trial and hides the preview only while active', async () => {
    const loader = createTrialLoader({ loadModule: async () => FAKE_MODULE });
    loader.setInteractive(true);
    await flush();

    const html = await render('zh-TW', <TrialSection loader={loader} />);

    expect(html).toContain('data-fake-trial');
    expect(html).not.toContain('產品預覽');
  });

  it('shows the preview again once dormant, without the trial shell', async () => {
    const loader = createTrialLoader({ loadModule: async () => FAKE_MODULE });
    loader.setInteractive(true);
    await flush();
    loader.setInteractive(false);

    const html = await render('zh-TW', <TrialSection loader={loader} />);

    expect(html).toContain('產品預覽');
    expect(html).not.toContain('data-fake-trial');
  });
});
