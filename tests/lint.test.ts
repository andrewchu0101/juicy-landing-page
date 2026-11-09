import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// issue 012：lint 設定本身的契約。預期值來自票的驗收（lint 必須能抓出明顯錯誤、且現有程式零錯誤），
// 不是呼叫實作去算答案。
const eslint = new ESLint();

describe('lint 設定（issue 012）', () => {
  it('抓得出未使用的變數與 any', async () => {
    const [result] = await eslint.lintText(
      'const unused = 1;\nexport const x: any = 2;\n',
      { filePath: 'src/__lint_probe__.ts' },
    );
    const ruleIds = (result?.messages ?? []).map((m) => m.ruleId);
    expect(ruleIds).toContain('@typescript-eslint/no-unused-vars');
    expect(ruleIds).toContain('@typescript-eslint/no-explicit-any');
  });

  it('抓得出 hooks 違規', async () => {
    const [result] = await eslint.lintText(
      "import { useState } from 'react';\nexport function C({ a }: { a: boolean }) {\n  if (a) { useState(0); }\n  return null;\n}\n",
      { filePath: 'src/__lint_probe__.tsx' },
    );
    const ruleIds = (result?.messages ?? []).map((m) => m.ruleId);
    expect(ruleIds).toContain('react-hooks/rules-of-hooks');
  });

  it('src 與 tests 目前沒有任何 lint 錯誤', async () => {
    const results = await eslint.lintFiles(['src', 'tests', 'vite.config.ts']);
    const errors = results.flatMap((r) =>
      r.messages
        .filter((m) => m.severity === 2)
        .map((m) => `${r.filePath}:${m.line} ${m.ruleId}: ${m.message}`),
    );
    expect(errors).toEqual([]);
  });
});
