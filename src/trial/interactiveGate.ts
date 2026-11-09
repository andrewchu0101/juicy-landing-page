// MOD-01：互動資格閘門（FR-08）。只看主要輸入能力；不看裝置、作業系統、寬度、瀏覽器名稱或版本。
export const INTERACTIVE_QUERY = '(pointer: fine) and (hover: hover)';
export type MatchMediaFn = (query: string) => MediaQueryList;

function defaultMatchMedia(): MatchMediaFn | undefined {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : undefined;
}

/** matchMedia 缺失或呼叫拋例外 → false。 */
export function isInteractive(matchMedia: MatchMediaFn | undefined = defaultMatchMedia()): boolean {
  if (!matchMedia) return false;
  try {
    return matchMedia(INTERACTIVE_QUERY).matches === true;
  } catch {
    return false;
  }
}

/** 立即不呼叫 onChange；之後每次查詢結果改變時呼叫。回傳取消訂閱函式。 */
export function subscribeInteractive(
  onChange: (value: boolean) => void,
  matchMedia: MatchMediaFn | undefined = defaultMatchMedia(),
): () => void {
  if (!matchMedia) return () => {};
  try {
    const list = matchMedia(INTERACTIVE_QUERY);
    const listener = (event: MediaQueryListEvent) => onChange(event.matches === true);
    list.addEventListener('change', listener);
    return () => list.removeEventListener('change', listener);
  } catch {
    return () => {};
  }
}
