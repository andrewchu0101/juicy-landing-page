// 供應鏈守衛的純函式（issue 024）：不碰檔案與網路，測試把真實的 package.json／package-lock.json 以字串餵進來。
// 規則來自 SDS EXT-03／NFR-09 的共通契約：確切版本、鎖定檔含完整性雜湊、不使用 latest 或範圍版本。

export type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type LockEntry = { version?: string; resolved?: string; integrity?: string; link?: boolean; name?: string };
export type LockFile = { lockfileVersion: number; packages: Record<string, LockEntry> };

const EXACT = /\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?/.source;
const EXACT_VERSION = new RegExp(`^${EXACT}$`);
const EXACT_NPM_ALIAS = new RegExp(`^npm:(?:@[\\w.-]+/)?[\\w.-]+@${EXACT}$`);
const REGISTRY_URL = /^https:\/\/registry\.npmjs\.org\//;
const SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const;

/** 回傳每一個不是「確切版本」的依賴（範圍、標籤、git、網址、檔案路徑都算）。 */
export function findLooseVersions(pkg: PackageJson): string[] {
  const problems: string[] = [];
  for (const section of SECTIONS) {
    for (const [name, spec] of Object.entries(pkg[section] ?? {})) {
      if (!EXACT_VERSION.test(spec) && !EXACT_NPM_ALIAS.test(spec)) {
        problems.push(`${section}.${name} = ${JSON.stringify(spec)}`);
      }
    }
  }
  return problems;
}

/** 回傳鎖定檔中缺 integrity 或 resolved 不在 npm registry 的項目；鎖定檔格式不符時只回報格式問題。 */
export function findUnverifiedLockEntries(lock: LockFile): string[] {
  if (lock.lockfileVersion !== 3) return [`lockfileVersion 必須是 3，目前是 ${lock.lockfileVersion}`];
  const entries = Object.entries(lock.packages).filter(([path, entry]) => path !== '' && !entry.link);
  if (entries.length === 0) return ['package-lock.json 沒有任何套件'];
  const problems: string[] = [];
  for (const [path, entry] of entries) {
    if (!entry.integrity) problems.push(`${path}: 沒有 integrity`);
    if (!entry.resolved || !REGISTRY_URL.test(entry.resolved)) {
      problems.push(`${path}: resolved 不是 npm registry（${entry.resolved ?? '空'}）`);
    }
  }
  return problems;
}
