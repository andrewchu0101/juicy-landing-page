import { describe, expect, it } from 'vitest';
import ci from '../.github/workflows/ci.yml?raw';
import releaseCheck from '../.github/workflows/calendar-release-check.yml?raw';

// issue 023｜供應鏈：第三方 Action 的版本標籤（如 @v4）可被移動，所以釘到完整 commit SHA；
// 權限最小化、不使用 secrets、不用 pull_request_target。預期規則是字面常數，不從實作算出。
// 只檢查 workflow 檔文字；Actions 實際行為要看 GitHub 上的 run（未執行前不得宣稱）。
const workflows = { 'ci.yml': ci, 'calendar-release-check.yml': releaseCheck } as const;

describe.each(Object.entries(workflows))('%s', (_name, text) => {
  const uses = [...text.matchAll(/^\s*-?\s*uses:\s*(\S+)(.*)$/gm)];

  it('has at least one third-party action (guards against a vacuous pass)', () => {
    expect(uses.length).toBeGreaterThan(0);
  });

  it('pins every action to a full 40-character commit SHA, with a version comment', () => {
    for (const [, ref, rest] of uses) {
      expect(ref, 'action reference').toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
      expect(rest, `version comment for ${ref}`).toMatch(/#\s*v\d/);
    }
  });

  it('declares least-privilege permissions at the top level (contents: read only)', () => {
    const block = /^permissions:\n((?:[ \t]+\S.*\n?)+)/m.exec(text)?.[1] ?? '';
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    expect(lines).toEqual(['contents: read']);
  });

  it('uses no repository secrets and never runs untrusted PR code with write access', () => {
    expect(text).not.toMatch(/secrets\./);
    expect(text).not.toMatch(/pull_request_target/);
  });
});
