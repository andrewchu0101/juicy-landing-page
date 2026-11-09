import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { LanguageProvider } from '../src/site/LanguageContext';
import { createSiteLanguageStore } from '../src/site/siteLanguage';
import type { SiteLanguage } from '../src/site/webLanguageBackend';

// 以 react-dom/server 輸出靜態標記（專案沒有 DOM 環境套件）。點擊行為由 siteLanguage 的狀態測試與人工流程涵蓋。
async function render(language: SiteLanguage): Promise<string> {
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
  return renderToStaticMarkup(
    <LanguageProvider store={store}>
      <App />
    </LanguageProvider>,
  );
}

// TC-09、UI-06｜語言切換控制項與整頁文字（AC-03.1、FR-10、NFR-02）
describe('TC-09 language switch control and page text (UI-06, NFR-02)', () => {
  it('shows English page text when the language is en', async () => {
    const html = await render('en');

    expect(html).toContain('Download for Windows');
    expect(html).not.toContain('下載 Windows 版');
  });

  it('shows Traditional Chinese page text when the language is zh-TW', async () => {
    const html = await render('zh-TW');

    expect(html).toContain('下載 Windows 版');
    expect(html).not.toContain('Download for Windows');
  });

  it('has a named, keyboard-operable switch with both options, marking the current one', async () => {
    const html = await render('en');

    expect(html).toMatch(/<button[^>]*type="button"[^>]*>繁體中文<\/button>/);
    expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>English<\/button>/);
    expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>繁體中文<\/button>/);
    expect(html).toMatch(/role="group"[^>]*aria-label="[^"]+"|aria-label="[^"]+"[^>]*role="group"/);
  });

  it('leaves no Chinese text in the English page except the language option label (NFR-02)', async () => {
    const html = await render('en');
    const text = html.replace(/<button[^>]*>繁體中文<\/button>/g, '').replace(/<[^>]+>/g, ' ');

    expect(text).not.toMatch(/[㐀-鿿]/);
  });

  it('sets the page language attribute target on the switch options (lang on each option)', async () => {
    const html = await render('zh-TW');

    expect(html).toContain('lang="zh-TW"');
    expect(html).toContain('lang="en"');
  });
});
