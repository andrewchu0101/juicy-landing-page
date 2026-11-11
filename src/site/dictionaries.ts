// MOD-04：網站字典（繁體中文與英文兩份）。共用 Calendar 字典是另一份，不在這裡。
// 兩份鍵集合必須相同、沒有空字串（tests/dictionaries.test.ts）。
// 球名與區塊標題是使用者資料，不經過字典（FR-10）。
import { COPY } from '../content';
import type { SiteLanguage } from './webLanguageBackend';

export type SiteDictionary = {
  siteName: string;
  meta: { title: string; description: string };
  trial: {
    heading: string;
    note: string;
    preview: { label: string; caption: string; image: { src: string; alt: string } };
    app: { ballAria: string; radialAria: string; hiddenOne: string; hiddenMany: string };
  };
  download: {
    heading: string;
    primary: string;
    portableZip: string;
    source: string;
    checksum: { heading: string; label: string; howTo: string };
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
      image: {
        src: '/preview/trial-en.png',
        alt: 'Screenshot of the trial: three balls (blue, green, orange) on the left, and on the calendar one blue time block from 10:00 AM to 12:00 PM.',
      },
    },
    app: {
      ballAria: 'Drag {name} onto the calendar',
      radialAria: 'Hold and drag a ball onto the calendar',
      hiddenOne: '1 event outside the visible hours',
      hiddenMany: '{count} events outside the visible hours',
    },
  },
  download: {
    heading: 'Download',
    primary: 'Download for Windows',
    portableZip: 'Portable .zip',
    source: 'Source code',
    checksum: {
      heading: 'Verify the download',
      label: 'SHA-256',
      howTo: 'After downloading, run Get-FileHash <path-to-file> in PowerShell; the result must match the hash above exactly. If it differs, do not run the file.',
    },
    factsHeading: 'Before you download',
    facts: [
      { id: 'platform', text: 'Windows 10 version 1803 or later, 64-bit only. Older systems and 32-bit are not supported.' },
      { id: 'webview2', text: 'Requires an installed Microsoft Edge WebView2 runtime. The portable version does not install it for you; if it is missing, install Microsoft’s official version first.' },
      { id: 'portable', text: 'You download a portable .zip: unzip it, run juicy-calendar.exe, and keep portable.flag; your data goes in the data folder next to it.' },
      { id: 'unsigned', text: 'The portable version is unsigned, so Windows SmartScreen may show “Windows protected your PC”. After confirming the file comes from this project’s Releases, choose “More info”, then “Run anyway”.' },
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
