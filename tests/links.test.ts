import { describe, expect, it } from 'vitest';
import { CALENDAR_REPO, DOWNLOAD_LINKS } from '../src/config/links';

// TC-10a｜FR-09、AC-02.1、SDS EXT-01：下載連結設定（可離線自動化）。
// 預期值是字面常數，來自 Calendar 的 GitHub Release v0.2.0-beta.3 實際資產（2026-11-11 查證），
// 不是呼叫實作算出來的。本測試只驗 href；「實際下載可用」是 TC-10b／M-10（在 011）。
const ZIP_URL =
  'https://github.com/andrewchu0101/juicy-calendar/releases/download/v0.2.0-beta.3/juicy-calendar_0.2.0-beta.3_x64-portable.zip';

// 字面常數：Calendar v0.2.0-beta.3 的 SHA256SUMS.txt 與 GitHub 資產 digest 皆為此值（2026-11-11 查證）。
const ZIP_SHA256 = 'c32de3723cefa66e2787eb5f340789220042bc3847f410f43de33350d8a1dc32';

describe('TC-10a download links (FR-09, AC-02.1)', () => {
  it('primary button downloads the portable zip of a pinned Calendar release directly', () => {
    expect(DOWNLOAD_LINKS.primary).toBe(ZIP_URL);
  });

  it('portable .zip link is the same file, and source points at the Calendar repository', () => {
    expect(DOWNLOAD_LINKS.portableZip).toBe(ZIP_URL);
    expect(DOWNLOAD_LINKS.source).toBe('https://github.com/andrewchu0101/juicy-calendar');
    expect(`${CALENDAR_REPO.owner}/${CALENDAR_REPO.repo}`).toBe('andrewchu0101/juicy-calendar');
  });

  it('never uses a floating "latest" download path (the asset name carries the version)', () => {
    expect(DOWNLOAD_LINKS.primary).not.toContain('/latest');
    expect(DOWNLOAD_LINKS.primary).toMatch(/\/releases\/download\/v\d+\.\d+\.\d+(-[\w.]+)?\//);
  });

  it('pins the sha256 of the portable zip so the page and the drift check share one value', () => {
    expect(DOWNLOAD_LINKS.sha256).toBe(ZIP_SHA256);
  });

  it('stays unverified until a person has downloaded and checked it (011, M-10)', () => {
    expect(DOWNLOAD_LINKS.verification).toBe('unverified');
  });
});
