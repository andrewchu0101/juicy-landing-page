import { describe, expect, it } from 'vitest';
import links from '../src/config/links.ts?raw';
import { evaluate, parsePinned, type Pinned, type ReleaseInfo } from '../scripts/calendarRelease';

const pinned: Pinned = { owner: 'o', repo: 'r', tag: 'v1.0.0', asset: 'app_1.0.0_x64-portable.zip' };
const release = (tag: string, date: string, assets: string[], extra: Partial<ReleaseInfo> = {}): ReleaseInfo => ({
  tag_name: tag,
  draft: false,
  prerelease: true,
  published_at: date,
  assets: assets.map((name) => ({ name })),
  ...extra,
});

describe('parsePinned', () => {
  it('reads owner, repo, tag and file name from the real links.ts', () => {
    expect(parsePinned(links)).toEqual({
      owner: 'andrewchu0101',
      repo: 'juicy-calendar',
      tag: 'v0.2.0-beta.3',
      asset: 'juicy-calendar_0.2.0-beta.3_x64-portable.zip',
    });
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

  it('ignores drafts when deciding which release is newest', () => {
    const result = evaluate(pinned, [
      release('v2.0.0', '2026-12-01T00:00:00Z', ['x-portable.zip'], { draft: true }),
      release('v1.0.0', '2026-11-08T00:00:00Z', [pinned.asset]),
    ]);
    expect(result.ok).toBe(true);
  });
});
