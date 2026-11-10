import { describe, expect, it } from 'vitest';
import lockRaw from '../package-lock.json?raw';
import ci from '../.github/workflows/ci.yml?raw';
import releaseCheck from '../.github/workflows/calendar-release-check.yml?raw';
import vercelRaw from '../vercel.json?raw';

// issue 025｜依賴的 install／postinstall 腳本會在建置機上執行。本站依賴不需要它們，所以 CI 與 Vercel 都用 --ignore-scripts 安裝，
// 並讓「哪些套件有安裝腳本」固定成一份清單：清單變動代表有新的建置期程式碼要執行，必須人工審查。
// 預期值是字面常數；「--ignore-scripts 安裝後測試與建置照常通過」在 issue 檔記錄實跑結果，不在這裡驗。
const npmCiLines = (text: string): string[] => text.split('\n').filter((line) => /\bnpm ci\b/.test(line));

describe('install policy (issue 025)', () => {
  it('Vercel installs with --ignore-scripts', () => {
    const config = JSON.parse(vercelRaw) as { installCommand?: string };
    expect(config.installCommand).toBe('npm ci --ignore-scripts');
  });

  it('CI installs with --ignore-scripts', () => {
    const lines = npmCiLines(ci);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) expect(line).toContain('--ignore-scripts');
  });

  it('no workflow runs a plain npm ci or npm install', () => {
    for (const text of [ci, releaseCheck]) {
      expect(text).not.toMatch(/\bnpm install\b/);
      for (const line of npmCiLines(text)) expect(line).toContain('--ignore-scripts');
    }
  });

  it('only the known package has an install script (a new one needs a human review)', () => {
    const lock = JSON.parse(lockRaw) as { packages: Record<string, { hasInstallScript?: boolean }> };
    const withScripts = Object.entries(lock.packages)
      .filter(([, entry]) => entry.hasInstallScript)
      .map(([path]) => path);
    // fsevents 只在 macOS 安裝（optional），在 Windows 與 Linux 不會執行。
    expect(withScripts).toEqual(['node_modules/fsevents']);
  });
});
