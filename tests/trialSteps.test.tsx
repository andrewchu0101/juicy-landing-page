import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import radialEn from '../public/preview/radial-en.png?inline';
import radialZh from '../public/preview/radial-zh-TW.png?inline';
import { TrialSection } from '../src/components/TrialSection';
import { DICTIONARIES } from '../src/site/dictionaries';
import { LanguageProvider } from '../src/site/LanguageContext';
import { createSiteLanguageStore } from '../src/site/siteLanguage';
import type { SiteLanguage } from '../src/site/webLanguageBackend';
import { createTrialLoader, type TrialModule } from '../src/trial/trialLoader';
import { flush } from './fixtures/fakeTrialModule';

// 專案擁有者 2026-11-14：線上試用分成兩個「階段式」的區塊。
//   步驟 1：試著長按——長按出六顆球、hover 晃動（只展示）。
//   步驟 2：拖球建立時間區塊——就是原本的試用，只有三顆球。
// 這裡驗結構與文字；手勢與畫面在 tests/trialGestures.test.ts 與 e2e/trialRadial.e2e.ts。
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

const FAKE: TrialModule = {
  ensureReady: async () => {},
  TrialShell: () => <div data-fake-trial="">fake trial</div>,
  RadialShell: () => <div data-fake-radial="">fake radial</div>,
};

async function activeHtml(language: SiteLanguage) {
  const loader = createTrialLoader({ loadModule: async () => FAKE });
  loader.setInteractive(true);
  await flush();
  return render(language, <TrialSection loader={loader} />);
}

const step = (html: string, n: 1 | 2) => {
  const start = html.indexOf(`id="trial-step-${n}"`);
  const end = n === 1 ? html.indexOf('id="trial-step-2"') : html.length;
  return start < 0 ? '' : html.slice(start, end);
};

describe('two staged blocks (active)', () => {
  it('shows step 1 before step 2, each with its own heading', async () => {
    const html = await activeHtml('zh-TW');

    expect(html.indexOf('id="trial-step-1"')).toBeGreaterThan(-1);
    expect(html.indexOf('id="trial-step-1"')).toBeLessThan(html.indexOf('id="trial-step-2"'));
    expect(step(html, 1)).toContain('<h3');
    expect(step(html, 1)).toContain('步驟 1：試著長按');
    expect(step(html, 2)).toContain('步驟 2：拖球建立時間區塊');
  });

  it('puts the long-press demo (six balls) in step 1 and the original trial in step 2, never mixed', async () => {
    const html = await activeHtml('zh-TW');

    expect(step(html, 1)).toContain('data-fake-radial');
    expect(step(html, 1)).not.toContain('data-fake-trial');
    expect(step(html, 2)).toContain('data-fake-trial');
    expect(step(html, 2)).not.toContain('data-fake-radial');
  });

  it('keeps the page-level heading and the privacy note once, above both steps', async () => {
    const html = await activeHtml('zh-TW');

    expect(html.match(/<h2/g)).toHaveLength(1);
    expect(html.indexOf('試用內容不會上傳，重新整理頁面就會消失')).toBeLessThan(html.indexOf('id="trial-step-1"'));
  });

  it('has an instruction line in each step, in the page language', async () => {
    const zh = await activeHtml('zh-TW');
    const en = await activeHtml('en');

    expect(step(zh, 1)).toContain(DICTIONARIES['zh-TW'].trial.steps.one.instruction);
    expect(step(zh, 2)).toContain(DICTIONARIES['zh-TW'].trial.steps.two.instruction);
    expect(step(en, 1)).toContain(DICTIONARIES.en.trial.steps.one.instruction);
    expect(step(en, 2)).toContain('Step 2: Drag a ball to make a time block');
  });
});

describe('two staged blocks (static preview, e.g. touch devices)', () => {
  it('shows one static image per step: step 1 the six-ball menu, step 2 the trial', async () => {
    const zh = await render('zh-TW', <TrialSection />);

    expect(step(zh, 1)).toContain('src="/preview/radial-zh-TW.png"');
    expect(step(zh, 2)).toContain('src="/preview/trial-zh-TW.png"');
    expect(step(zh, 1).match(/<img\b/g)).toHaveLength(1);
    expect(step(zh, 2).match(/<img\b/g)).toHaveLength(1);
  });

  it('follows the page language and has no Chinese in the English page', async () => {
    const en = await render('en', <TrialSection />);
    const text = en.replace(/<[^>]+>/g, ' ');

    expect(step(en, 1)).toContain('src="/preview/radial-en.png"');
    expect(step(en, 2)).toContain('src="/preview/trial-en.png"');
    expect(text).not.toMatch(/[㐀-鿿]/);
    for (const alt of en.matchAll(/alt="([^"]*)"/g)) expect(alt[1]).not.toMatch(/[㐀-鿿]/);
  });

  it('the previews are not draggable or clickable', async () => {
    const zh = await render('zh-TW', <TrialSection />);

    for (const figure of zh.match(/<figure[\s\S]*?<\/figure>/g) ?? []) {
      expect(figure).toContain('draggable="false"');
      expect(figure).not.toMatch(/<(a|button)\b|draggable="true"|onclick/i);
    }
    expect(zh.match(/<figure/g)).toHaveLength(2);
  });
});

// 步驟 1 預覽圖宣告的尺寸必須等於實際檔案（讀 PNG 檔頭的寬與高，不呼叫實作），版面才不會在載入時跳動。
describe('step 1 preview image size', () => {
  it.each([['zh-TW', radialZh], ['en', radialEn]] as const)('the %s image is 1280x512 as declared in the markup', async (language, png) => {
    const file = Uint8Array.from(atob(png.replace(/^data:image\/png;base64,/, '')), (c) => c.charCodeAt(0));
    const view = new DataView(file.buffer);
    const html = await render(language, <TrialSection />);

    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1280, 512]);
    expect(step(html, 1)).toContain('width="1280" height="512"');
  });
});
