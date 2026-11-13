import { describe, expect, it } from 'vitest';
import css from '../src/trial/trial.css?raw';

// 試用球的視覺不變量（專案擁有者 2026-11-13 呼叫 impeccable 收尾）。CSS 的實際畫面由人工與截圖確認；
// 這裡只守住「不看畫面也能算出來」的部分。預期值是規格或公式：WCAG 對比公式、「進場起點是正圓」的幾何定義。
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

const points = (polygon: string) =>
  [...polygon.matchAll(/(-?[\d.]+)%\s+(-?[\d.]+)%/g)].map((m) => [Number(m[1]), Number(m[2])] as const);

function keyframe(name: string, selector: string): string {
  const block = css.match(new RegExp(String.raw`@keyframes ${name}\s*\{([^]*?)\r?\n\}`))?.[1] ?? '';
  const escaped = selector.replace('.', String.raw`\.`);
  return block.match(new RegExp(String.raw`${escaped}\s*\{\s*clip-path:\s*(polygon\([^)]*\))`))?.[1] ?? '';
}

describe('wobble entry ramp (the ball is a round disc before hover, so the jelly must start from a circle)', () => {
  const wobbleFirst = keyframe('radial-wobble', '0.0%');
  const rampFrom = keyframe('radial-wobble-in', 'from');
  const rampTo = keyframe('radial-wobble-in', 'to');

  it('the ramp starts from a regular circle with the same vertex count as the wobble, so CSS can interpolate', () => {
    expect(wobbleFirst).not.toBe('');
    expect(points(rampFrom)).toHaveLength(points(wobbleFirst).length);
    for (const [x, y] of points(rampFrom)) expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(50, 0);
  });

  it('the ramp ends exactly on the first wobble frame, so the hand-over to the 4s loop does not jump', () => {
    expect(wobbleFirst).not.toBe('');
    expect(rampTo).toBe(wobbleFirst);
  });

  it('hovered balls play the ramp once and start the endless wobble only after it ends', () => {
    const rule = css.match(/\.radial-hovered \.ball\s*\{([^}]*)\}/)?.[1] ?? '';
    const ramp = rule.match(/radial-wobble-in\s+(\d+)ms/);
    const loop = rule.match(/radial-wobble\s+4s\s+linear\s+(\d+)ms\s+infinite/);
    expect(ramp).not.toBeNull();
    expect(loop).not.toBeNull();
    expect(loop![1]).toBe(ramp![1]);
  });

  it('the 1.3× hovered ball does not touch its name: the label steps down while hovered', () => {
    expect(css).toMatch(/\.radial-hovered span\s*\{[^}]*translateY\(\d+px\)/);
  });
});

describe('side ball names are readable (WCAG AA 4.5:1 for small text on the trial canvas)', () => {
  it('uses a text colour with at least 4.5:1 against the canvas', () => {
    const canvas = css.match(/--color-canvas:\s*(#[0-9a-f]{6})/i)![1]!;
    const rule = css.match(/\.trial-ball-name\s*\{([^}]*)\}/)![1]!;
    const token = rule.match(/color:\s*var\((--[\w-]+)\)/)![1]!;
    const value = css.match(new RegExp(String.raw`${token}:\s*(#[0-9a-f]{6})`, 'i'))![1]!;
    expect(contrast(value, canvas)).toBeGreaterThanOrEqual(4.5);
  });
});
