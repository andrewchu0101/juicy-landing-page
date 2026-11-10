import { describe, expect, it } from 'vitest';
import html from '../index.html?raw';
import { DICTIONARIES } from '../src/site/dictionaries';
import { applyPageMetadata, HTML_LANG } from '../src/site/pageMetadata';

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

  it('has og:url on the Vercel default domain (D-02 own domain still pending)', () => {
    expect(content('property="og:url"')).toBe('https://juicy-landing-page-tau.vercel.app/');
  });

  it('does not ship a placeholder og:image (share image waits for the interactive version)', () => {
    expect(html).not.toContain('property="og:image"');
  });
});

describe('applyPageMetadata after a language switch', () => {
  function fakeDoc() {
    const tags = new Map<string, { content: string }>();
    for (const sel of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:locale"]']) {
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
});
