import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { LanguageProvider } from '../src/site/LanguageContext';
import { createSiteLanguageStore } from '../src/site/siteLanguage';
import type { SiteLanguage } from '../src/site/webLanguageBackend';
import trialModule from '../src/trial/trialModule';
import { TrialApp } from '../src/trial/ui/TrialApp';

// 試用區的靜態標記：三顆球、三天、每天 10:00–15:00 的時間軸、沒有區塊。互動（長按、拖曳）由 tests/trialGestures.test.ts 的狀態機測試
// 與瀏覽器實測（issue 005／006 的實作紀錄）驗證；這裡不模擬 DOM 事件。
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
      <TrialApp />
    </LanguageProvider>,
  );
}

describe('TrialApp markup', () => {
  beforeAll(async () => {
    await trialModule.ensureReady();
  });

  it('shows exactly three seed balls with their drag labels (zh-TW)', async () => {
    const html = await render('zh-TW');
    expect(html.match(/data-testid="template-ball"/g)).toHaveLength(3);
    expect(html).toContain('aria-label="將 專注 Focus 拖到日曆上"');
    expect(html).toContain('aria-label="將 休息 Rest 拖到日曆上"');
    expect(html).toContain('aria-label="將 雜事 Chore 拖到日曆上"');
  });

  it('has no add or edit control for balls (OR-20: excluded) and no toolbar, inspector or settings', async () => {
    const html = await render('zh-TW');
    expect(html).not.toContain('add-template');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('inspector');
    expect(html).not.toContain('toolbar');
  });

  it('labels five hours from 10:00 to 14:00 and starts with no blocks', async () => {
    const html = await render('zh-TW');
    expect(html.match(/data-testid="timeline-label"/g)).toHaveLength(5);
    expect(html).not.toContain('data-testid="event-block"');
    expect(html).toContain('data-testid="calendar-columns"');
  });

  it('writes the ball labels in English when the page language is English', async () => {
    const html = await render('en');
    expect(html).toContain('aria-label="Drag 專注 Focus onto the calendar"');
    expect(html).not.toContain('拖到日曆上');
  });

  // 契約變更（專案擁有者 2026-11-11）：三天，每天 10:00–15:00，不開放到一週。
  it('shows three days: three day headers and three day columns', async () => {
    const html = await render('zh-TW');
    expect(html.match(/data-testid="day-header"/g)).toHaveLength(3);
    expect(html.match(/data-testid="day-column"/g)).toHaveLength(3);
    expect(html.match(/data-testid="timeline-label"/g)).toHaveLength(5); // 時間軸只有一條，每天同一段 10:00–15:00
  });
});
