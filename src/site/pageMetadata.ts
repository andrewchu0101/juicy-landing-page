// NFR-08、OR-18（M1）：初始 HTML 為繁體中文；語言切換後以腳本更新 lang、title、description 與 og 文字與分享圖。
import { DICTIONARIES } from './dictionaries';
import type { SiteLanguage } from './webLanguageBackend';

/** `<html lang>` 與 og:locale 的值。站內語言代碼（保存值）維持 zh-TW／en。 */
export const HTML_LANG: Record<SiteLanguage, string> = { 'zh-TW': 'zh-Hant', en: 'en' };
/** 分享圖需要絕對網址。與 index.html 的 og:url 同一個來源（tests/metadata.test.ts 比對）；自有網域（D-02）決定後替換。 */
export const SITE_ORIGIN = 'https://juicy-landing-page-tau.vercel.app';
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
  set('meta[property="og:image"]', `${SITE_ORIGIN}${trial.preview.image.src}`);
  set('meta[property="og:image:alt"]', trial.preview.image.alt);
}
