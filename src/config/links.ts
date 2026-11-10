// 下載與授權連結的單一設定來源（SDS EXT-01、FR-09、FR-15）。
// Releases 位置由專案擁有者 2026-11-11 指定：https://github.com/andrewchu0101/juicy-calendar/releases
// （專案擁有者先前給錯 repository，已更正）。2026-11-11 查證：該 repository 公開，releases 頁回 200，
// 目前只有預發行版（最新 v0.2.0-beta.3，資產為 x64-portable.zip 與 SHA256SUMS.txt，沒有安裝檔），
// 所以 /releases/latest 會 302 轉到 /releases 清單頁。實際下載仍須在 011 人工驗證（M-10），
// 在那之前 verification 必須維持 'unverified'，頁面不得宣稱下載已可用。
export type LinkVerification = 'unverified' | 'verified';

export const CALENDAR_REPO = { owner: 'andrewchu0101', repo: 'juicy-calendar' } as const;

const repoUrl = `https://github.com/${CALENDAR_REPO.owner}/${CALENDAR_REPO.repo}`;
const releasesLatestUrl = `${repoUrl}/releases/latest`;

export const DOWNLOAD_LINKS = {
  verification: 'unverified' as LinkVerification,
  primary: releasesLatestUrl,
  // 免安裝 .zip 的實際檔名未知，先指向同一個 Releases 最新版本頁（EXT-01：同頁或同 repo）。
  portableZip: releasesLatestUrl,
  source: repoUrl,
};

// 頁尾授權連結（FR-15）。指向本網站 repo 的 LICENSE 與 TRADEMARKS.md；
// 這兩個檔案尚未存在（Brief D-10），公開上線前才能完整驗收 AC-02.3。
const LANDING_REPO_URL = 'https://github.com/andrewchu0101/juicy-landing-page';

export const LEGAL_LINKS = {
  license: `${LANDING_REPO_URL}/blob/main/LICENSE`,
  trademarks: `${LANDING_REPO_URL}/blob/main/TRADEMARKS.md`,
};
