// NFR-08、OR-18（M1）：初始 HTML 為繁體中文；語言切換後以腳本更新 lang、title、description 與 og 文字。
import { DICTIONARIES } from './dictionaries';
import type { SiteLanguage } from './webLanguageBackend';

/** `<html lang>` 與 og:locale 的值。站內語言代碼（保存值）維持 zh-TW／en。 */
export const HTML_LANG: Record<SiteLanguage, string> = { 'zh-TW': 'zh-Hant', en: 'en' };
const OG_LOCALE: Record<SiteLanguage, string> = { 'zh-TW': 'zh_TW', en: 'en_US' };

export function applyPageMetadata(language: SiteLanguage, doc: Document = document): void {
  const { title, description } = DICTIONARIES[language].meta;
  doc.documentElement.lang = HTML_LANG[language];
  doc.title = title;
  const set = (selector: string, content: string) =>
    doc.head.querySelector(selector)?.setAttribute('content', content);
  set('meta[name="description"]', description);
  set('meta[property="og:title"]', title);
  set('meta[property="og:description"]', description);
  set('meta[property="og:locale"]', OG_LOCALE[language]);
}
