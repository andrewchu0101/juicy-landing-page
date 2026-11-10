import { describe, expect, it } from 'vitest';
import { mutedEventColor, readableTextColor } from '../src/trial/color';

// 區塊文字色與過去日降飽和（REUSE-13）。預期值為人工算例：
// 降飽和保留 40% 的飽和度、明度不變：#FF0000 → 中點 127.5；R = 127.5 + 127.5×0.4 = 178.5 → 179 (b3)；G、B = 127.5 − 127.5×0.4 = 76.5 → 77 (4d)。
describe('mutedEventColor', () => {
  it('keeps 40% of the saturation and the lightness', () => {
    expect(mutedEventColor('#FF0000')).toBe('#b34d4d');
  });

  it('leaves greys untouched', () => {
    expect(mutedEventColor('#808080')).toBe('#808080');
  });
});

describe('readableTextColor', () => {
  it('uses ink on light colours and white on dark ones', () => {
    expect(readableTextColor('#FFFFFF')).toBe('#2E2A26');
    expect(readableTextColor('#000000')).toBe('#FFFFFF');
    expect(readableTextColor('#2E2A26')).toBe('#FFFFFF');
  });
});
