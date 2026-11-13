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
    steps: {
      one: { heading: string; instruction: string; hint: string; menuAria: string; preview: { label: string; caption: string; image: { src: string; alt: string } } };
      two: { heading: string; instruction: string };
    };
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
  footer: { privacy: string; storage: string; license: string; trademarks: string };
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
    steps: {
      one: {
        heading: 'Step 1: Try a long press',
        instruction: 'Press and hold on the empty area below. Six balls pop out; move the pointer over one to see it wobble.',
        hint: 'Press and hold here',
        menuAria: 'Six demo balls; hover one to see it wobble',
        preview: {
          label: 'Product preview',
          caption: 'Hold an empty spot and six balls pop out; hover one to see it wobble. Use a computer with a mouse to try it interactively.',
          image: {
            src: '/preview/radial-en.png',
            alt: 'Screenshot after a long press: six balls in a circle (Coding, Study, Exercise, Reading, Rest and Personal), with the Study ball wobbling.',
          },
        },
      },
      two: {
        heading: 'Step 2: Drag a ball to make a time block',
        instruction: 'Drag a ball onto the calendar to create a time block, and drag a block to move it. Holding an empty spot on the calendar also brings out the balls.',
      },
    },
    preview: {
      label: 'Product preview',
      caption: 'Drag a ball onto the calendar to create a time block. Use a computer with a mouse to try it interactively.',
      image: {
        src: '/preview/trial-en.png',
        alt: 'Screenshot of the trial: three balls (light blue, light green, apricot) on the left, and a calendar with three consecutive days, each 10:00 AM to 3:00 PM, with one light blue time block from 10:00 AM to 12:00 PM on the first day.',
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
      { id: 'telemetry', text: 'The desktop app itself contains no telemetry, and its own code and dependencies do not connect out. It uses Microsoft Edge WebView2, a Microsoft component that may have its own network activity and is not covered by this.' },
    ],
  },
  footer: {
    privacy: 'This website does not use analytics.',
    storage: 'This website only stores your chosen language in your own browser. It is never uploaded.',
    license: 'LICENSE',
    trademarks: 'TRADEMARKS.md',
  },
};

export const DICTIONARIES: Record<SiteLanguage, SiteDictionary> = {
  'zh-TW': COPY,
  en: EN,
};
