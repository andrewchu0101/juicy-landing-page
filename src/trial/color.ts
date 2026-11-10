// 區塊顏色工具，沿用 Calendar 固定 commit 的 utils/color.ts（REUSE-13）。
const INK = '#2E2A26';
const WHITE = '#FFFFFF';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

/** 墨色與白色之中，對比較高的那個。 */
export function readableTextColor(background: string): string {
  return contrast(background, INK) >= contrast(background, WHITE) ? INK : WHITE;
}

/** 過去日：保留 40% 的飽和度，明度不變。 */
export function mutedEventColor(hex: string): string {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
  const midpoint = (Math.max(...channels) + Math.min(...channels)) / 2;
  return '#' + channels.map((channel) => Math.round(midpoint + (channel - midpoint) * 0.4).toString(16).padStart(2, '0')).join('');
}
