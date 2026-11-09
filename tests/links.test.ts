import { describe, expect, it } from 'vitest';
import { CALENDAR_REPO, DOWNLOAD_LINKS } from '../src/config/links';

// TC-10a｜FR-09、AC-02.1、SDS EXT-01：下載連結設定（可離線自動化）。
// 預期值來自 SDS EXT-01 的網址形式 https://github.com/<owner>/<repo>/releases/latest，不是呼叫實作算出來的。
// Releases 的 owner／repo 尚未定案（EXT-01「待確認」），所以本測試只驗「連結由單一設定產生、
// 形式正確、占位值被標為未驗證」，不宣稱連結是真正可下載的頁面（那是 TC-10b／M-10，在 011）。
describe('TC-10a download links (FR-09, AC-02.1)', () => {
  it('primary button points at <repo>/releases/latest built from the single repo constant', () => {
    expect(DOWNLOAD_LINKS.primary).toBe(
      `https://github.com/${CALENDAR_REPO.owner}/${CALENDAR_REPO.repo}/releases/latest`,
    );
  });

  it('provides portable .zip and source links on the same repository', () => {
    const repoUrl = `https://github.com/${CALENDAR_REPO.owner}/${CALENDAR_REPO.repo}`;
    expect(DOWNLOAD_LINKS.portableZip.startsWith(`${repoUrl}/releases`)).toBe(true);
    expect(DOWNLOAD_LINKS.source).toBe(repoUrl);
  });

  it('marks the placeholder repo as unverified until ticket 011 confirms it', () => {
    expect(DOWNLOAD_LINKS.verification).toBe('unverified');
  });
});
