import { describe, expect, it } from 'vitest';
import { detectLanguage } from '../src/site/detectLanguage';

// TC-09｜語言偵測表（AC-03.1、FR-10、REUSE-12）。
// 預期值取自 docs/06-test-plan.md TC-09 的表格與 PRD AC-03.1，不呼叫實作推算。
describe('TC-09 detectLanguage (AC-03.1, REUSE-12)', () => {
  it.each([['zh-TW'], ['zh-HK'], ['zh-CN'], ['zh']])('%s → 繁體中文', (locale) => {
    expect(detectLanguage([locale])).toBe('zh-TW');
  });

  it.each([['ja'], ['en-US'], ['fr']])('%s → English', (locale) => {
    expect(detectLanguage([locale])).toBe('en');
  });

  it('empty candidates → English', () => {
    expect(detectLanguage([])).toBe('en');
  });

  it('takes the first candidate only', () => {
    expect(detectLanguage(['ja', 'zh-TW'])).toBe('en');
    expect(detectLanguage(['zh-TW', 'ja'])).toBe('zh-TW');
  });

  it('matches case-insensitively and ignores an empty first entry gracefully', () => {
    expect(detectLanguage(['ZH-tw'])).toBe('zh-TW');
    expect(detectLanguage([''])).toBe('en');
  });
});
