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

// issue 012｜e2e 納入 CI。預期規則是字面常數：瀏覽器用官方指令安裝（不新增第三方 Action），
// 瀏覽器只裝 Chromium（playwright.config.ts 只跑 Chromium），e2e 是獨立 job，不拖慢也不遮蔽型別檢查與單元測試。
// 只檢查 workflow 檔文字；GitHub 上的實際執行要看 run 結果。
describe('ci.yml runs the Playwright e2e suite', () => {
  // 取出某個 job 的內容：從 "  <name>:" 那一行之後，到下一個縮排只有兩格的 key（或檔尾）。
  function jobBody(name: string): string {
    const lines = ci.replace(/\r\n/g, '\n').split('\n');
    const start = lines.findIndex((line) => line === `  ${name}:`);
    if (start === -1) return '';
    const body: string[] = [];
    for (const line of lines.slice(start + 1)) {
      if (line !== '' && !line.startsWith('   ')) break;
      body.push(line);
    }
    return body.join('\n');
  }
  const e2eJob = jobBody('e2e');

  it('has an e2e job separate from the check job', () => {
    expect(e2eJob).not.toBe('');
    expect(jobBody('check')).not.toBe('');
    expect(jobBody('check')).not.toContain('test:e2e');
  });

  it('installs dependencies without lifecycle scripts, installs only Chromium, then runs npm run test:e2e', () => {
    expect(e2eJob).toContain('npm ci --ignore-scripts');
    expect(e2eJob).toContain('npx playwright install --with-deps chromium');
    expect(e2eJob).toContain('npm run test:e2e');
    expect(e2eJob.indexOf('playwright install')).toBeLessThan(e2eJob.indexOf('npm run test:e2e'));
    expect(e2eJob.match(/playwright install/g)).toHaveLength(1);
  });

  it('has its own timeout', () => {
    expect(e2eJob).toMatch(/timeout-minutes:\s*\d+/);
  });
});
