import { describe, expect, it } from 'vitest';
import gitignore from '../.gitignore?raw';

// issue 026｜CLAUDE.md §2.3、AGENTS.md「秘密」：.gitignore 要排除建置產物、快取、日誌、秘密與本機設定，
// 同時不能把需要版本控制的檔案（鎖定檔、部署設定、workflow、範例設定）排除。
// 規則是字面清單，不從實作算出。這只管 .gitignore 的內容；已被追蹤的檔案由 git 另行處理。
const patterns = gitignore
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '' && !line.startsWith('#'));

describe('.gitignore coverage', () => {
  it.each([
    'node_modules',
    'dist',
    'dist-test',
    'test-results',
    '.env',
    '.env.*',
    '*.log',
    '.playwright-mcp/',
    '.claude/settings.local.json',
    // 憑證與私鑰檔
    '*.pem',
    '*.key',
    '*.pfx',
    '*.p12',
    'id_rsa*',
  ])('ignores %s', (pattern) => {
    expect(patterns).toContain(pattern);
  });

  it('keeps .env.example tracked (negation comes after .env.*)', () => {
    const negation = patterns.indexOf('!.env.example');
    expect(negation).toBeGreaterThan(patterns.indexOf('.env.*'));
  });

  it.each(['package-lock.json', 'vercel.json', '.github', '.github/', 'LICENSE', 'docs', 'issues', 'src', 'tests', 'scripts'])(
    'does not ignore the tracked path %s',
    (path) => {
      expect(patterns).not.toContain(path);
    },
  );
});
