// 測試夾具（issue 004，005～009 重用）：假的 matchMedia。
// 以「主要輸入能力」{ pointer, hover } 求值，支援 `(pointer: X)`、`(hover: Y)` 以 `and` 相接的查詢，
// 所以查詢字串寫錯（例如少了 hover）會讓測試失敗，而不是被假物件放過。
// 不看寬度、裝置或瀏覽器名稱。
export type PointerKind = 'fine' | 'coarse' | 'none';
export type HoverKind = 'hover' | 'none';
export type InputCapability = { pointer: PointerKind; hover: HoverKind };

export const MOUSE: InputCapability = { pointer: 'fine', hover: 'hover' };
export const TOUCH: InputCapability = { pointer: 'coarse', hover: 'none' };

type Listener = (event: MediaQueryListEvent) => void;

export type FakeMatchMedia = {
  matchMedia: (query: string) => MediaQueryList;
  /** 改變主要輸入能力，並對每個已訂閱且結果改變的查詢送出 change 事件。 */
  setCapability(next: InputCapability): void;
  /** 目前仍掛著的 change 監聽器數（檢查取消訂閱與不累積）。 */
  activeListenerCount(): number;
  /** matchMedia 被呼叫過的查詢字串。 */
  queries(): readonly string[];
};

function evaluate(query: string, capability: InputCapability): boolean {
  return query.split(/\s+and\s+/i).every((part) => {
    const match = /^\(\s*(pointer|hover)\s*:\s*([a-z]+)\s*\)$/i.exec(part.trim());
    if (!match) return false;
    const feature = match[1]!;
    const value = match[2]!;
    return capability[feature.toLowerCase() as 'pointer' | 'hover'] === value.toLowerCase();
  });
}

export function createFakeMatchMedia(initial: InputCapability): FakeMatchMedia {
  let capability = initial;
  const asked: string[] = [];
  const lists = new Set<{ query: string; last: boolean; listeners: Set<Listener> }>();

  const matchMedia = (query: string): MediaQueryList => {
    asked.push(query);
    const state = { query, last: evaluate(query, capability), listeners: new Set<Listener>() };
    lists.add(state);
    const list = {
      media: query,
      get matches() {
        return evaluate(query, capability);
      },
      addEventListener: (type: string, listener: Listener) => {
        if (type === 'change') state.listeners.add(listener);
      },
      removeEventListener: (type: string, listener: Listener) => {
        if (type === 'change') state.listeners.delete(listener);
      },
    };
    return list as unknown as MediaQueryList;
  };

  return {
    matchMedia,
    setCapability(next) {
      capability = next;
      for (const state of lists) {
        const now = evaluate(state.query, capability);
        if (now === state.last) continue;
        state.last = now;
        for (const listener of [...state.listeners]) {
          listener({ matches: now, media: state.query } as MediaQueryListEvent);
        }
      }
    },
    activeListenerCount: () => [...lists].reduce((sum, s) => sum + s.listeners.size, 0),
    queries: () => asked,
  };
}
