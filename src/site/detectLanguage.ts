// REUSE-12：瀏覽器語言偵測。
// 沿用來源：Calendar 固定 commit 102ae1917047aee691e88cef9c497b50df745c41 的 src/i18n/detectLanguage.ts。
// 專案擁有者於 2026-11-10 批准暫時複製（等 016 的純偵測匯出後改為引用）。
// 差異：網站沒有系統語系，所以拿掉 systemLocale 參數，只看 `navigator.languages` 第一項。
import type { SiteLanguage } from './webLanguageBackend';

/** 第一項以 `zh` 開頭（不分大小寫，如 zh-TW、zh-HK、zh-CN）→ 繁體中文；其餘或沒有候選 → 英文。 */
export function detectLanguage(candidates: readonly string[]): SiteLanguage {
  const first = candidates[0];
  return first && first.toLowerCase().startsWith('zh') ? 'zh-TW' : 'en';
}
