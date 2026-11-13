import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';
import zhPng from '../public/preview/og-zh-TW.png?inline';
import enPng from '../public/preview/og-en.png?inline';
import { DICTIONARIES } from '../src/site/dictionaries';
import { applyPageMetadata, HTML_LANG, SITE_ORIGIN } from '../src/site/pageMetadata';

const content = (attr: string) => html.match(new RegExp(`<meta ${attr} content="([^"]*)"`))?.[1];

// TC-10e｜初始 HTML（不執行 JS）的 metadata（NFR-08、OR-18 M1）
describe('TC-10e initial HTML metadata (NFR-08, OR-18 M1)', () => {
  const zh = DICTIONARIES['zh-TW'].meta;

  it('declares lang="zh-Hant" and the Traditional Chinese title and description', () => {
    expect(html).toContain('<html lang="zh-Hant">');
    expect(html).toContain(`<title>${zh.title}</title>`);
    expect(content('name="description"')).toBe(zh.description);
  });

  it('has Open Graph title, description and locales matching the zh dictionary', () => {
    expect(content('property="og:title"')).toBe(zh.title);
    expect(content('property="og:description"')).toBe(zh.description);
    expect(content('property="og:locale"')).toBe('zh_TW');
    expect(content('property="og:locale:alternate"')).toBe('en_US');
  });

  // D-02 已決（專案擁有者 2026-11-13）：正式網域就是 Vercel 的網域。不再是「暫用」。
  it('has og:url, canonical and og:site_name on the official Vercel domain', () => {
    expect(content('property="og:url"')).toBe('https://juicy-landing-page-tau.vercel.app/');
    expect(html).toContain('<link rel="canonical" href="https://juicy-landing-page-tau.vercel.app/" />');
    expect(content('property="og:site_name"')).toBe('Juicy Calendar');
  });

  // issue 013：分享圖使用實際運作的試用介面截圖（繁中版），不是占位或仿真圖。og:image 必須是絕對網址。
  // 契約變更：原本的「不得有 og:image」是互動版完成前的暫時規則；現在互動版與截圖都有了。
  // 2026-11-13（013 收尾）：分享圖改用專用的 1200×630（1.91:1，社群平台建議比例），仍是同一個實際運作的試用介面的截圖。
  it('has an absolute og:image pointing at the 1200x630 zh-TW share image, with alt text and size', () => {
    const zhImage = DICTIONARIES['zh-TW'].trial.preview.image;
    expect(content('property="og:image"')).toBe('https://juicy-landing-page-tau.vercel.app/preview/og-zh-TW.png');
    expect(content('property="og:image:alt"')).toBe(zhImage.alt);
    expect(content('property="og:image:type"')).toBe('image/png');
    expect(content('property="og:image:width"')).toBe('1200');
    expect(content('property="og:image:height"')).toBe('630');
  });

  it('declares the same origin in og:url and in SITE_ORIGIN', () => {
    expect(content('property="og:url"')).toBe(`${SITE_ORIGIN}/`);
  });

  // 讀 PNG 檔頭（第 16、20 位元組是寬與高），不呼叫實作：宣告的尺寸必須等於實際檔案，兩種語言都是。
  it.each([['zh-TW', zhPng], ['en', enPng]] as const)('the %s share image is a real 1200x630 PNG (1.91:1)', (_language, png) => {
    const file = Uint8Array.from(atob(png.replace(/^data:image\/png;base64,/, '')), (c) => c.charCodeAt(0));
    const view = new DataView(file.buffer);
    expect(String.fromCharCode(...file.subarray(1, 4))).toBe('PNG');
    expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);
  });

  it('sets twitter:card to summary_large_image so the screenshot is shown large', () => {
    expect(content('name="twitter:card"')).toBe('summary_large_image');
  });
});

describe('applyPageMetadata after a language switch', () => {
  function fakeDoc() {
    const tags = new Map<string, { content: string }>();
    for (const sel of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:locale"]', 'meta[property="og:image"]', 'meta[property="og:image:alt"]']) {
      tags.set(sel, { content: '' });
    }
    return {
      tags,
      doc: {
        title: '',
        documentElement: { lang: '' },
        head: {
          querySelector: (sel: string) => {
            const tag = tags.get(sel);
            return tag && { setAttribute: (_n: string, v: string) => void (tag.content = v) };
          },
        },
      } as unknown as Document,
    };
  }

  it.each([['en', 'en', 'en_US'], ['zh-TW', 'zh-Hant', 'zh_TW']] as const)('%s updates lang, title and tags', (language, lang, locale) => {
    const { doc, tags } = fakeDoc();
    applyPageMetadata(language, doc);

    const meta = DICTIONARIES[language].meta;
    expect(doc.documentElement.lang).toBe(lang);
    expect(HTML_LANG[language]).toBe(lang);
    expect(doc.title).toBe(meta.title);
    expect(tags.get('meta[name="description"]')?.content).toBe(meta.description);
    expect(tags.get('meta[property="og:title"]')?.content).toBe(meta.title);
    expect(tags.get('meta[property="og:locale"]')?.content).toBe(locale);
  });

  it.each([['zh-TW', '/preview/og-zh-TW.png'], ['en', '/preview/og-en.png']] as const)('%s switches og:image and its alt text to that language', (language, path) => {
    const { doc, tags } = fakeDoc();
    applyPageMetadata(language, doc);

    expect(tags.get('meta[property="og:image"]')?.content).toBe(`https://juicy-landing-page-tau.vercel.app${path}`);
    expect(tags.get('meta[property="og:image:alt"]')?.content).toBe(DICTIONARIES[language].trial.preview.image.alt);
  });
});
