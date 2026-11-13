import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../src/App';
import { DOWNLOAD_LINKS, LEGAL_LINKS } from '../src/config/links';
import { FACT_SOURCES } from '../src/content';

// 以 react-dom/server 輸出靜態標記，不需要 DOM 環境；每次呼叫都是全新渲染，沒有共用狀態。
const html = renderToStaticMarkup(<App />);

function indexOfOrFail(needle: string): number {
  const index = html.indexOf(needle);
  expect(index, `markup should contain ${needle}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe('TC-10a home page and download entry (FR-09, AC-02.1, UI-01)', () => {
  it('has the primary 「下載 Windows 版」 link whose href equals the link constant (one click to Releases)', () => {
    expect(html).toContain(`<a href="${DOWNLOAD_LINKS.primary}"`);
    const anchor = html.slice(indexOfOrFail(`<a href="${DOWNLOAD_LINKS.primary}"`));
    expect(anchor.slice(0, anchor.indexOf('</a>'))).toContain('下載 Windows 版');
  });

  it('lists portable .zip and source links in the download section', () => {
    const section = html.slice(indexOfOrFail('id="download"'));
    expect(section).toContain(`href="${DOWNLOAD_LINKS.portableZip}"`);
    expect(section).toContain(`href="${DOWNLOAD_LINKS.source}"`);
    expect(section).toContain('免安裝');
    expect(section).toContain('原始碼');
  });

  it('orders header → trial → download → footer', () => {
    const order = ['<header', 'id="trial"', 'id="download"', '<footer'].map(indexOfOrFail);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('flags the download links as unverified while the repo is a placeholder (TC-10b/M-10 belong to 011)', () => {
    expect(html).toContain(`data-links-verification="${DOWNLOAD_LINKS.verification}"`);
    expect(DOWNLOAD_LINKS.verification).toBe('unverified');
  });
});

// TC-10c｜AC-02.2、NFR-03：五項敘述的字面內容取自 SRS FR-09 / PRD AC-02.2。
// 「每項對得到 Calendar 文件來源」是人工對照（NFR-03），此處只驗每項敘述存在、且內容出現在下載區。
describe('download integrity (TC-10e): the page shows how to verify the zip', () => {
  const section = () => html.slice(indexOfOrFail('id="download"'), html.indexOf('</section>', indexOfOrFail('id="download"')));

  it('shows the pinned SHA-256 in a code element, with a Get-FileHash instruction', () => {
    expect(section()).toContain(`<code>${DOWNLOAD_LINKS.sha256}</code>`);
    expect(section()).toContain('SHA-256');
    expect(section()).toContain('Get-FileHash');
  });

  it('adds no extra links (the link count is asserted in UI-01)', () => {
    expect(section().match(/<a /g)).toHaveLength(3);
  });
});

describe('TC-10c download section statements (AC-02.2, NFR-03)', () => {
  const section = () => html.slice(indexOfOrFail('id="download"'), html.indexOf('</section>', indexOfOrFail('id="download"')));

  it.each([
    ['僅支援 64 位元 Windows 10 1803 以上', '僅支援 Windows 10 1803 以上的 64 位元'],
    ['需要 WebView2 執行階段', 'WebView2'],
    ['安裝檔未簽章、SmartScreen 處理', '未簽章'],
    ['SmartScreen 如何繼續', '更多資訊'],
    ['網頁試用為瀏覽器版', '網頁試用為瀏覽器版'],
    ['桌面 App 離線', '離線'],
    ['桌面 App 無帳號', '無帳號'],
  ])('mentions %s', (_label, text) => {
    expect(section()).toContain(text);
  });
});

// TC-10d｜AC-02.3、FR-15：頁尾兩個連結存在；目標取決於 D-10，公開上線前才完整驗收。
describe('TC-10d footer links (AC-02.3, FR-15)', () => {
  const footer = () => html.slice(indexOfOrFail('<footer'));

  it('has LICENSE and TRADEMARKS.md links pointing at the configured targets', () => {
    expect(footer()).toContain(`<a href="${LEGAL_LINKS.license}">LICENSE</a>`);
    expect(footer()).toContain(`<a href="${LEGAL_LINKS.trademarks}">TRADEMARKS.md</a>`);
  });
});

// AC-03.2｜專案擁有者 2026-11-13：不做流量統計，頁面明講「本網站不使用流量統計。」（放在頁尾，授權連結之前）。
describe('AC-03.2 privacy statement', () => {
  it('says in the footer that the site does not use analytics', () => {
    const footer = html.slice(indexOfOrFail('<footer'));

    expect(footer).toContain('<p>本網站不使用流量統計。</p>');
    expect(footer.indexOf('本網站不使用流量統計。')).toBeLessThan(footer.indexOf('<a '));
  });

  // 專案擁有者 2026-11-14：AC-03.2 另外要求的兩點也要明講。事實依據：網站唯一寫入瀏覽器儲存的是語言偏好（tests/privacy.test.ts、
  // e2e TC-06）；Calendar 的 NFR-03b／03c：App 自有程式與依賴不含遙測、不主動連網，WebView2 是微軟元件，網路行為另行揭露。
  it('says the language choice is stored only in the visitor browser and never uploaded', () => {
    const footer = html.slice(indexOfOrFail('<footer'));

    expect(footer).toContain('<p>網站只在你的瀏覽器保存你選擇的語言，不會上傳。</p>');
    expect(footer.indexOf('網站只在你的瀏覽器保存')).toBeLessThan(footer.indexOf('<a '));
  });

  it('says the desktop app has no telemetry, with the WebView2 exception stated, in the download facts', () => {
    const section = html.slice(indexOfOrFail('id="download"'), html.indexOf('</section>', indexOfOrFail('id="download"')));

    expect(section).toContain('桌面 App 本身不含遙測，程式碼與依賴不主動對外連線。');
    expect(section).toContain('可能有自己的網路活動，不在這個保證範圍內');
    expect(FACT_SOURCES.telemetry).toContain('NFR-03');
  });
});

// UI-01｜網站自己的控制項可用鍵盤操作並有可辨識名稱。
// 原生 <a href> 預設可聚焦、可用 Enter 啟動；此處驗證每個連結都有 href、非空名稱，且沒有正的 tabindex。
describe('UI-01 keyboard operable controls with names', () => {
  const anchors = [...html.matchAll(/<a ([^>]*)>(.*?)<\/a>/g)];

  it('renders the five site links (primary, zip, source, LICENSE, TRADEMARKS.md)', () => {
    expect(anchors).toHaveLength(5);
  });

  it('gives every link an href and a non-empty visible name', () => {
    for (const [, attributes, name] of anchors) {
      expect(attributes).toMatch(/href="https:\/\/[^"]+"/);
      expect(name?.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses no positive tabindex and exposes landmarks and a page heading', () => {
    expect(html).not.toMatch(/tabindex="[1-9]/i);
    expect(html).toMatch(/<main[ >]/);
    expect(html).toContain('<h1');
  });
});
