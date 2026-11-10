import { describe, expect, it } from 'vitest';
import links from '../src/config/links.ts?raw';
import { evaluate, parsePinned, type Pinned, type ReleaseInfo } from '../scripts/calendarRelease';

const HASH = 'a'.repeat(64);
const pinned: Pinned = { owner: 'o', repo: 'r', tag: 'v1.0.0', asset: 'app_1.0.0_x64-portable.zip', sha256: HASH };
// 釘選的資產預設帶著相符的 digest（GitHub API 的 sha256:<hex> 格式）；其他資產沒有 digest。
const release = (tag: string, date: string, assets: string[], extra: Partial<ReleaseInfo> = {}): ReleaseInfo => ({
  tag_name: tag,
  draft: false,
  prerelease: true,
  published_at: date,
  assets: assets.map((name) => ({ name, digest: name === pinned.asset ? `sha256:${HASH}` : null })),
  ...extra,
});

describe('parsePinned', () => {
  it('reads owner, repo, tag and file name from the real links.ts', () => {
    expect(parsePinned(links)).toEqual({
      owner: 'andrewchu0101',
      repo: 'juicy-calendar',
      tag: 'v0.2.0-beta.3',
      asset: 'juicy-calendar_0.2.0-beta.3_x64-portable.zip',
      // 字面常數：來自 Calendar 的 SHA256SUMS.txt（人工對照），不是呼叫實作算出來的。
      sha256: 'c32de3723cefa66e2787eb5f340789220042bc3847f410f43de33350d8a1dc32',
    });
  });

  it('throws when the pinned sha256 is not 64 lowercase hex characters', () => {
    const base = "owner: 'o', repo: 'r', tag: 'v1', portableZip: 'a.zip'";
    expect(() => parsePinned(`${base}, sha256: 'abc'`)).toThrow();
    expect(() => parsePinned(`${base}, sha256: '${'A'.repeat(64)}'`)).toThrow();
    expect(() => parsePinned(base)).toThrow();
  });

  it('throws instead of guessing when a field is missing', () => {
    expect(() => parsePinned("export const CALENDAR_REPO = { owner: 'a' }")).toThrow();
  });
});

describe('evaluate (calendar release drift check)', () => {
  it('passes when the pinned release is the newest and has the asset', () => {
    const result = evaluate(pinned, [release('v1.0.0', '2026-11-08T00:00:00Z', [pinned.asset, 'SHA256SUMS.txt'])]);
    expect(result.ok).toBe(true);
    expect(result.problems).toEqual([]);
  });

  it('fails and suggests the new tag and file when a newer release has a portable zip', () => {
    const result = evaluate(pinned, [
      release('v1.1.0', '2026-11-20T00:00:00Z', ['app_1.1.0_x64-portable.zip']),
      release('v1.0.0', '2026-11-08T00:00:00Z', [pinned.asset]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toContain('v1.1.0');
    expect(result.problems.join('\n')).toContain('app_1.1.0_x64-portable.zip');
  });

  it('fails without suggesting a file when the newer release has no portable zip', () => {
    const result = evaluate(pinned, [
      release('v1.1.0', '2026-11-20T00:00:00Z', ['setup.exe']),
      release('v1.0.0', '2026-11-08T00:00:00Z', [pinned.asset]),
    ]);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toContain('專案擁有者決定');
  });

  it('fails when the pinned asset was removed from its release', () => {
    const result = evaluate(pinned, [release('v1.0.0', '2026-11-08T00:00:00Z', ['SHA256SUMS.txt'])]);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toContain('404');
  });

  it('fails when the pinned release is gone or back to a draft', () => {
    expect(evaluate(pinned, []).ok).toBe(false);
    const draft = release('v1.0.0', '2026-11-08T00:00:00Z', [pinned.asset], { draft: true });
    expect(evaluate(pinned, [draft]).ok).toBe(false);
  });

  it('fails when the pinned asset was replaced: its digest no longer matches the pinned sha256', () => {
    const replaced = release('v1.0.0', '2026-11-08T00:00:00Z', [], {
      assets: [{ name: pinned.asset, digest: `sha256:${'b'.repeat(64)}` }],
    });
    const result = evaluate(pinned, [replaced]);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toContain('被替換');
  });

  it('fails instead of passing when GitHub reports no digest for the pinned asset (cannot verify)', () => {
    const noDigest = release('v1.0.0', '2026-11-08T00:00:00Z', [], { assets: [{ name: pinned.asset, digest: null }] });
    const result = evaluate(pinned, [noDigest]);
    expect(result.ok).toBe(false);
    expect(result.problems.join('\n')).toContain('無法核對');
  });

  it('reports the matching digest as a note when everything lines up', () => {
    const result = evaluate(pinned, [release('v1.0.0', '2026-11-08T00:00:00Z', [pinned.asset])]);
    expect(result.notes.join('\n')).toContain('SHA-256');
  });

  it('ignores drafts when deciding which release is newest', () => {
    const result = evaluate(pinned, [
      release('v2.0.0', '2026-12-01T00:00:00Z', ['x-portable.zip'], { draft: true }),
      release('v1.0.0', '2026-11-08T00:00:00Z', [pinned.asset]),
    ]);
    expect(result.ok).toBe(true);
  });
});
