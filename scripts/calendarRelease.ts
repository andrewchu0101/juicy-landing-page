// 下載連結固定在某個 Calendar release（src/config/links.ts 的 CALENDAR_RELEASE）。
// GitHub 的 /releases/latest 不含預發行版、資產檔名又帶版本號，所以網站無法自動跟上新版；
// 這裡把「固定的 tag／檔名」與「Calendar 實際的 release 清單」比對，找出過期或失效的情況。
// 純函式，不碰網路與檔案，方便單元測試；網路與檔案在 checkCalendarRelease.ts。

export type Pinned = { owner: string; repo: string; tag: string; asset: string; sha256: string };
export type ReleaseInfo = {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  html_url?: string;
  // digest 為 GitHub API 的 "sha256:<hex>"；舊資產可能是 null。
  assets: { name: string; digest?: string | null }[];
};

const field = (source: string, name: string): string | undefined =>
  new RegExp(`${name}:\\s*'([^']+)'`).exec(source)?.[1];

/** 從 links.ts 的原始碼取出固定的 owner／repo／tag／檔名；任何一項取不到就丟錯，不猜。 */
export function parsePinned(source: string): Pinned {
  const owner = field(source, 'owner');
  const repo = field(source, 'repo');
  const tag = field(source, 'tag');
  const asset = field(source, 'portableZip');
  const sha256 = field(source, 'sha256');
  if (!owner || !repo || !tag || !asset || !sha256) {
    throw new Error('讀不到 links.ts 的 CALENDAR_REPO／CALENDAR_RELEASE（owner、repo、tag、portableZip、sha256）');
  }
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error('links.ts 的 sha256 必須是 64 位小寫十六進位');
  return { owner, repo, tag, asset, sha256 };
}

export type CheckResult = { ok: boolean; problems: string[]; notes: string[] };

/** releases 為 GitHub API 回傳的清單。草稿不算（未登入看不到，也不能下載）。 */
export function evaluate(pinned: Pinned, releases: ReleaseInfo[]): CheckResult {
  const problems: string[] = [];
  const notes: string[] = [];
  const published = releases
    .filter((r) => !r.draft && r.published_at)
    .sort((a, b) => Date.parse(b.published_at!) - Date.parse(a.published_at!));

  const mine = published.find((r) => r.tag_name === pinned.tag);
  if (!mine) {
    problems.push(`固定的 release ${pinned.tag} 找不到或已不是公開狀態，下載按鈕會 404。`);
  } else {
    const asset = mine.assets.find((a) => a.name === pinned.asset);
    if (!asset) {
      problems.push(`release ${pinned.tag} 沒有資產 ${pinned.asset}，下載按鈕會 404。`);
    } else if (!asset.digest) {
      problems.push(`release ${pinned.tag} 的資產 ${pinned.asset} 沒有 digest，無法核對 SHA-256（不算通過）。`);
    } else if (asset.digest.toLowerCase() !== `sha256:${pinned.sha256}`) {
      problems.push(
        `資產 ${pinned.asset} 的 digest 是 ${asset.digest}，與網站釘選的 sha256:${pinned.sha256} 不同：檔案可能被替換，` +
          '請先確認 Calendar 端原因，再決定是否更新釘選值；在那之前不要信任下載按鈕。',
      );
    } else {
      notes.push(`資產 ${pinned.asset} 的 SHA-256 與釘選值相同。`);
    }
  }

  const newest = published[0];
  if (newest && newest.tag_name !== pinned.tag) {
    const zips = newest.assets.map((a) => a.name).filter((n) => /portable\.zip$/i.test(n));
    problems.push(
      `Calendar 有較新的 release ${newest.tag_name}（網站固定在 ${pinned.tag}）。` +
        (zips.length > 0
          ? `請把 CALENDAR_RELEASE 改成 tag ${newest.tag_name}、檔名 ${zips[0]}，並確認內容後再更新。`
          : `它沒有免安裝 zip 資產（資產：${newest.assets.map((a) => a.name).join('、') || '無'}），請專案擁有者決定。`),
    );
  } else if (newest) {
    notes.push(`固定的 ${pinned.tag} 就是最新公開 release。`);
  }

  return { ok: problems.length === 0, problems, notes };
}
