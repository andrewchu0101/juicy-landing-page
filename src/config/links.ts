// 下載與授權連結的單一設定來源（SDS EXT-01、FR-09、FR-15）。
// Calendar 的 GitHub owner／repo 尚未定案（EXT-01「待確認」）：下列是占位值，不是真正的連結。
// 確認並由 011 實際驗證前，verification 必須維持 'unverified'，頁面不得宣稱下載已可用。
export type LinkVerification = 'unverified' | 'verified';

export const CALENDAR_REPO = { owner: 'OWNER-TBD', repo: 'REPO-TBD' } as const;

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
