// 下載與授權連結的單一設定來源（SDS EXT-01、FR-09、FR-15）。
// 專案擁有者 2026-11-11 指定：按鈕直接下載檔案（不是前往 Releases 頁），Calendar 規格以其 repository 為準。
// Releases：https://github.com/andrewchu0101/juicy-calendar/releases（公開）。
// GitHub 的 /releases/latest 不含預發行版，且資產檔名帶版本號，所以無法用「最新」直連；
// 這裡固定一個 tag 與檔名，Calendar 發新版時必須改這兩個常數（見 docs/07-release-checklist.md）。
// 2026-11-11 查證：v0.2.0-beta.3（預發行）唯一的 Windows 資產是免安裝 zip，沒有安裝檔；
// 實際下載該檔，SHA-256 與 SHA256SUMS.txt 一致。人工驗收（011、M-10）前 verification 維持 'unverified'。
export type LinkVerification = 'unverified' | 'verified';

export const CALENDAR_REPO = { owner: 'andrewchu0101', repo: 'juicy-calendar' } as const;
export const CALENDAR_RELEASE = {
  tag: 'v0.2.0-beta.3',
  portableZip: 'juicy-calendar_0.2.0-beta.3_x64-portable.zip',
  // 該 zip 的 SHA-256。來源：Calendar release 的 SHA256SUMS.txt，與 GitHub 資產 digest 相同（2026-11-11 查證）。
  // Release 附件事後可被替換（immutable: false），所以網站自己釘雜湊：頁面顯示給訪客核對，
  // 排程檢查（scripts/checkCalendarRelease.ts）比對 GitHub 回報的 digest。Calendar 發新版時與 tag 一起更新。
  sha256: 'c32de3723cefa66e2787eb5f340789220042bc3847f410f43de33350d8a1dc32',
} as const;

const repoUrl = `https://github.com/${CALENDAR_REPO.owner}/${CALENDAR_REPO.repo}`;
const portableZipUrl = `${repoUrl}/releases/download/${CALENDAR_RELEASE.tag}/${CALENDAR_RELEASE.portableZip}`;

export const DOWNLOAD_LINKS = {
  verification: 'unverified' as LinkVerification,
  // 目前唯一的 Windows 資產是免安裝 zip，主按鈕與「免安裝 .zip」因此指向同一個檔案。
  primary: portableZipUrl,
  portableZip: portableZipUrl,
  sha256: CALENDAR_RELEASE.sha256,
  source: repoUrl,
};

// 頁尾授權連結（FR-15）。指向本網站 repo 的 LICENSE 與 TRADEMARKS.md；
// 這兩個檔案尚未存在（Brief D-10），公開上線前才能完整驗收 AC-02.3。
const LANDING_REPO_URL = 'https://github.com/andrewchu0101/juicy-landing-page';

export const LEGAL_LINKS = {
  license: `${LANDING_REPO_URL}/blob/main/LICENSE`,
  trademarks: `${LANDING_REPO_URL}/blob/main/TRADEMARKS.md`,
};
