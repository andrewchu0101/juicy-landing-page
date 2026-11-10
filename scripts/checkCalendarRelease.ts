// 用法：npm run check:calendar-release（Node 24 直接執行 TypeScript）。
// 讀 src/config/links.ts 固定的 Calendar release，向 GitHub 查實際的 release 清單並比對。
// 過期或失效時 exit 1；網路或 API 錯誤時 exit 2（與「過期」區分，不把查不到當成通過）。
// 公開 repository 不需要憑證；Actions 內有內建的 GITHUB_TOKEN 時會帶上，只為了避開未登入的流量限制。
import { readFileSync } from 'node:fs';
import { evaluate, parsePinned, type ReleaseInfo } from './calendarRelease.ts';

const pinned = parsePinned(readFileSync(new URL('../src/config/links.ts', import.meta.url), 'utf8'));
const token = process.env['GITHUB_TOKEN'];

let releases: ReleaseInfo[];
try {
  const res = await fetch(`https://api.github.com/repos/${pinned.owner}/${pinned.repo}/releases?per_page=30`, {
    headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  releases = (await res.json()) as ReleaseInfo[];
} catch (error) {
  console.error(`查不到 ${pinned.owner}/${pinned.repo} 的 release 清單：${String(error)}（未判定，不算通過）`);
  process.exit(2);
}

const result = evaluate(pinned, releases);
for (const note of result.notes) console.log(`OK  ${note}`);
for (const problem of result.problems) console.error(`FAIL ${problem}`);
process.exit(result.ok ? 0 : 1);
