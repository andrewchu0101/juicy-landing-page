// MOD-04：網站字典（繁體中文與英文兩份）。共用 Calendar 字典是另一份，不在這裡。
// 兩份鍵集合必須相同、沒有空字串（tests/dictionaries.test.ts）。
// 球名與區塊標題是使用者資料，不經過字典（FR-10）。
import { COPY } from '../content';
import type { SiteLanguage } from './webLanguageBackend';

export type SiteDictionary = {
  siteName: string;
  meta: { title: string; description: string };
  trial: { heading: string; note: string; preview: { label: string; caption: string } };
  download: {
    heading: string;
    primary: string;
    portableZip: string;
    source: string;
    factsHeading: string;
    facts: readonly { id: string; text: string }[];
  };
  footer: { license: string; trademarks: string };
};

const EN: SiteDictionary = {
  siteName: 'Juicy Calendar',
  meta: {
    title: 'Juicy Calendar | Offline, no-account time-block calendar',
    description: 'Drag a ball onto the calendar to create a time block. The desktop app works offline with no account and keeps your data on your computer; try it online first.',
  },
  trial: {
    heading: 'Try it online',
    note: 'Nothing you do in the trial is uploaded, and it disappears when you reload the page.',
    preview: {
      label: 'Product preview',
      // 暫定英文（UI-03：英文版圖下說明文字待定，需專案擁有者確認）。
      caption: 'Drag a ball onto the calendar to create a time block. Use a computer with a mouse to try it interactively.',
    },
  },
  download: {
    heading: 'Download',
    primary: 'Download for Windows',
    portableZip: 'Portable .zip',
    source: 'Source code',
    factsHeading: 'Before you install',
    facts: [
      { id: 'platform', text: 'Windows 10 version 1803 or later, 64-bit only. Older systems and 32-bit are not supported.' },
      { id: 'webview2', text: 'Requires the WebView2 runtime. If it is missing, the installer downloads Microsoft’s official version (a network connection is needed only during installation).' },
      { id: 'unsigned', text: 'The installer is unsigned, so Windows SmartScreen may show “Windows protected your PC”. After confirming the file comes from this project’s Releases, choose “More info”, then “Run anyway”.' },
      { id: 'web-trial', text: 'The online trial is the browser version and differs from the desktop app; the desktop app’s features are as you find them after downloading.' },
      { id: 'offline', text: 'The desktop app works offline with no account; your data stays on your computer.' },
    ],
  },
  footer: {
    license: 'LICENSE',
    trademarks: 'TRADEMARKS.md',
  },
};

export const DICTIONARIES: Record<SiteLanguage, SiteDictionary> = {
  'zh-TW': COPY,
  en: EN,
};
