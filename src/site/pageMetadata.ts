// NFR-08、OR-18（M1）：初始 HTML 為繁體中文；語言切換後以腳本更新 lang、title、description 與 og 文字與分享圖。
import { DICTIONARIES } from './dictionaries';
import type { SiteLanguage } from './webLanguageBackend';

/** `<html lang>` 與 og:locale 的值。站內語言代碼（保存值）維持 zh-TW／en。 */
export const HTML_LANG: Record<SiteLanguage, string> = { 'zh-TW': 'zh-Hant', en: 'en' };
/** 分享圖需要絕對網址。與 index.html 的 og:url、canonical 同一個來源（tests/metadata.test.ts 比對）。D-02 已決（2026-11-13）：Vercel 的網域就是正式網域。 */
export const SITE_ORIGIN = 'https://juicy-landing-page-tau.vercel.app';
/** 分享圖（1200×630，1.91:1），每種語言一張；網頁上的預覽圖（trial.preview.image）是另一張 2560×1604 的大圖。 */
const OG_IMAGE: Record<SiteLanguage, string> = { 'zh-TW': '/preview/og-zh-TW.png', en: '/preview/og-en.png' };
const OG_LOCALE: Record<SiteLanguage, string> = { 'zh-TW': 'zh_TW', en: 'en_US' };

export function applyPageMetadata(language: SiteLanguage, doc: Document = document): void {
  const { meta, trial } = DICTIONARIES[language];
  const { title, description } = meta;
  doc.documentElement.lang = HTML_LANG[language];
  doc.title = title;
  const set = (selector: string, content: string) =>
    doc.head.querySelector(selector)?.setAttribute('content', content);
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[property="og:locale"]', OG_LOCALE[language]);
  set('meta[property="og:image"]', `${SITE_ORIGIN}${OG_IMAGE[language]}`);
  set('meta[property="og:image:alt"]', trial.preview.image.alt);
}
