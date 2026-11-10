// 試用區的時間與日期顯示。沿用 Calendar 固定 commit 的 formatTime／formatTimeRange／hour12（FR-10、SRS R-7），
// 星期改用瀏覽器內建的 Intl（Calendar 用 date-fns，網站不新增套件）。
import type { SiteLanguage } from '../site/webLanguageBackend';

export type TimeFormatOptions = { language: SiteLanguage; hour12: boolean };

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * 12 或 24 小時只跟系統設定走，與介面語言無關；12 小時制的寫法才依語言：英文 `1:05 PM`，繁體 `下午 1:05`。
 * 繁體的午夜是 `上午 12:00`、正午是 `下午 12:00`。24 小時制補零：`09:07`。
 */
export function formatTime(date: Date, { language, hour12 }: TimeFormatOptions): string {
  const hours = date.getHours();
  const minutes = pad(date.getMinutes());
  if (!hour12) return `${pad(hours)}:${minutes}`;
  const clock = `${hours % 12 === 0 ? 12 : hours % 12}:${minutes}`;
  const pm = hours >= 12;
  return language === 'zh-TW' ? `${pm ? '下午' : '上午'} ${clock}` : `${clock} ${pm ? 'PM' : 'AM'}`;
}

export function formatTimeRange(event: { startAt: string; endAt: string }, options: TimeFormatOptions): string {
  return `${formatTime(new Date(event.startAt), options)}–${formatTime(new Date(event.endAt), options)}`;
}

/** 12 小時制嗎？網站沒有系統設定（null），所以看瀏覽器 Intl 的 hourCycle；都沒有資訊時用 24 小時制。 */
export function resolveHour12(system: boolean | null, intlHourCycle: string | undefined): boolean {
  if (system !== null) return system;
  return intlHourCycle === 'h11' || intlHourCycle === 'h12';
}

export function browserHourCycle(): string | undefined {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;
  } catch {
    return undefined;
  }
}

/** 日期欄標題的星期，例如 `週三`、`Wed`。 */
export function formatWeekday(date: Date, language: SiteLanguage): string {
  return new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date);
}

/** 把 `{name}` 之類的占位換成值；找不到的占位原樣保留。 */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
