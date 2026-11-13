import { describe, expect, it } from 'vitest';

// issue 012：「沒有把憑證寫進任何檔案」。掃描專案裡會被版本控制的文字檔，找常見憑證格式。
// 這是樣式比對，不是 gitleaks 的替代品：只擋明顯的格式，抓不到自訂格式的密碼。
// 樣式用字串拼接，避免這個檔案自己被自己比對到（也不放真的憑證）；掃描範圍排除這個檔案。
const PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'GitHub token', regex: new RegExp('gh[pousr]' + '_[A-Za-z0-9]{36,}') },
  { name: 'GitHub fine-grained token', regex: new RegExp('github' + '_pat_[A-Za-z0-9_]{50,}') },
  { name: 'AWS access key id', regex: new RegExp('AK' + 'IA[0-9A-Z]{16}') },
  { name: 'private key block', regex: new RegExp('-----BEGIN (RSA |EC |DSA |OPENSSH |PGP )?PRIVATE' + ' KEY') },
  { name: 'npm token', regex: new RegExp('npm' + '_[A-Za-z0-9]{36}') },
  { name: 'Slack token', regex: new RegExp('xox' + '[baprs]-[A-Za-z0-9-]{10,}') },
  { name: '.npmrc auth token', regex: new RegExp('_auth' + 'Token[ ]*=[ ]*[A-Za-z0-9+/_-]{8,}') },
];

// 只含文字檔：原始碼、測試、e2e、腳本、文件、票、workflow 與根目錄的設定檔。node_modules、dist、圖片不掃。
const files = import.meta.glob(
  [
    '../src/**/*.{ts,tsx,css}',
    '../tests/**/*.{ts,tsx}',
    '../e2e/**/*.ts',
    '../scripts/**/*.ts',
    '../docs/**/*.md',
    '../issues/**/*.md',
    '../.github/**/*.yml',
    '../*.{json,html,md,yml,yaml,ts,js}',
    '!../tests/noCredentials.test.ts',
  ],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

describe('no credentials in version-controlled text files (issue 012)', () => {
  it('scans a meaningful number of files (guards against an empty glob)', () => {
    const names = Object.keys(files);
    expect(names.length).toBeGreaterThan(80);
    expect(names).toContain('../package.json');
    expect(names).toContain('../.github/workflows/ci.yml');
  });

  it('finds no token or private key shaped strings', () => {
    const hits: string[] = [];
    for (const [file, text] of Object.entries(files)) {
      for (const { name, regex } of PATTERNS) if (regex.test(text)) hits.push(`${file}: ${name}`);
    }
    expect(hits).toEqual([]);
  });

  it('the patterns do catch a sample of each kind (guards against a dead regex)', () => {
    const samples = [
      'gh' + 'p_' + 'a'.repeat(36),
      'github' + '_pat_' + 'A1'.repeat(30),
      'AK' + 'IA' + 'ABCDEFGHIJKLMNOP',
      '-----BEGIN RSA PRIVATE' + ' KEY-----',
      'npm' + '_' + 'b'.repeat(36),
      'xox' + 'b-1234567890-abcdef',
      '_auth' + 'Token=abc12345',
    ];
    samples.forEach((sample, i) => expect(PATTERNS[i]!.regex.test(sample), PATTERNS[i]!.name).toBe(true));
  });
});
