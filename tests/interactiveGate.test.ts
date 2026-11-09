import { describe, expect, it, vi } from 'vitest';
import { INTERACTIVE_QUERY, isInteractive, subscribeInteractive } from '../src/trial/interactiveGate';
import { createFakeMatchMedia, MOUSE, TOUCH } from './fixtures/fakeMatchMedia';

// TC-07a｜互動資格判定（AC-01.6、FR-08、NFR-05）
describe('TC-07a interactiveGate.isInteractive (FR-08, AC-01.6)', () => {
  it('is interactive when the primary input is pointer: fine and hover: hover', () => {
    const media = createFakeMatchMedia(MOUSE);

    expect(isInteractive(media.matchMedia)).toBe(true);
  });

  it('is not interactive with only pointer: fine', () => {
    const media = createFakeMatchMedia({ pointer: 'fine', hover: 'none' });

    expect(isInteractive(media.matchMedia)).toBe(false);
  });

  it('is not interactive with only hover: hover', () => {
    const media = createFakeMatchMedia({ pointer: 'coarse', hover: 'hover' });

    expect(isInteractive(media.matchMedia)).toBe(false);
  });

  it('is not interactive for a touch device', () => {
    expect(isInteractive(createFakeMatchMedia(TOUCH).matchMedia)).toBe(false);
  });

  it('is not interactive when matchMedia is missing', () => {
    expect(isInteractive(undefined)).toBe(false);
  });

  it('is not interactive when matchMedia throws', () => {
    expect(
      isInteractive(() => {
        throw new Error('unsupported');
      }),
    ).toBe(false);
  });

  it('asks only the pointer/hover query (no width, device or browser input)', () => {
    const media = createFakeMatchMedia(MOUSE);
    isInteractive(media.matchMedia);

    expect(media.queries()).toEqual([INTERACTIVE_QUERY]);
  });
});

// TC-07d（單元部分）｜視窗寬度不是互動資格。完整的 W2 寬度 e2e 需要 Playwright（未核准）。
describe('TC-07d interactiveGate ignores viewport width (FR-08, NFR-04)', () => {
  it('never queries width, height or resolution', () => {
    const media = createFakeMatchMedia(MOUSE);
    const wrapped = vi.fn(media.matchMedia);

    expect(isInteractive(wrapped)).toBe(true);
    for (const [query] of wrapped.mock.calls) expect(query).not.toMatch(/width|height|resolution/i);
  });
});

// TC-08｜動態失去與恢復資格的訂閱基礎（AC-01.13、FR-08）
describe('TC-08 interactiveGate.subscribeInteractive (FR-08, AC-01.13)', () => {
  it('does not call onChange immediately', () => {
    const media = createFakeMatchMedia(MOUSE);
    const onChange = vi.fn();
    subscribeInteractive(onChange, media.matchMedia);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange with the new value whenever the result changes', () => {
    const media = createFakeMatchMedia(MOUSE);
    const onChange = vi.fn();
    subscribeInteractive(onChange, media.matchMedia);

    media.setCapability(TOUCH);
    media.setCapability(MOUSE);

    expect(onChange.mock.calls).toEqual([[false], [true]]);
  });

  it('stops notifying and releases the listener after unsubscribe', () => {
    const media = createFakeMatchMedia(MOUSE);
    const onChange = vi.fn();
    const unsubscribe = subscribeInteractive(onChange, media.matchMedia);
    unsubscribe();

    media.setCapability(TOUCH);

    expect(onChange).not.toHaveBeenCalled();
    expect(media.activeListenerCount()).toBe(0);
  });

  it('returns a no-op unsubscribe when matchMedia is missing or throws', () => {
    const onChange = vi.fn();

    expect(() => subscribeInteractive(onChange, undefined)()).not.toThrow();
    expect(() =>
      subscribeInteractive(onChange, () => {
        throw new Error('x');
      })(),
    ).not.toThrow();
    expect(onChange).not.toHaveBeenCalled();
  });
});
