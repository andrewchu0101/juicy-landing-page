import { describe, expect, it } from 'vitest';
import { DICTIONARIES } from '../src/site/dictionaries';

// 把巢狀字典攤平成「路徑 → 字串」。陣列以索引當路徑片段。
function flatten(value: unknown, path = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof value === 'string') {
    out.set(path, value);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      for (const [childPath, text] of flatten(child, path ? `${path}.${key}` : key)) out.set(childPath, text);
    }
  }
  return out;
}

// TC-09｜網站字典完整性（NFR-02、FR-10、SDS MOD-04）
describe('TC-09 site dictionary completeness (NFR-02)', () => {
  const zh = flatten(DICTIONARIES['zh-TW']);
  const en = flatten(DICTIONARIES.en);

  it('has a non-trivial zh-TW dictionary (guards against a vacuous pass)', () => {
    expect(zh.size).toBeGreaterThan(0);
  });

  it('has the same key set in zh-TW and en', () => {
    expect([...en.keys()].sort()).toEqual([...zh.keys()].sort());
  });

  it.each([['zh-TW', zh], ['en', en]] as const)('has no empty string in %s', (_lang, dictionary) => {
    const empty = [...dictionary].filter(([, text]) => text.trim() === '').map(([key]) => key);
    expect(empty).toEqual([]);
  });
});
