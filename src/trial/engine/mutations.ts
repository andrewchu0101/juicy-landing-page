// 沿用 Calendar 固定 commit 的 engine/mutations.ts 中本輪用到的部分：建立與移動（REUSE-02、REUSE-03）。
// 調整長度、命名、貼上等在試用區暫不開放（專案擁有者 2026-11-11：留到下載後體驗）。
import { NEW_EVENT_MINUTES } from './limits';

export type TimedEvent = { startAt: string; endAt: string };
export type EventTimes = TimedEvent;

const MS_PER_MINUTE = 60_000;

function times(start: Date, end: Date): EventTimes {
  return { startAt: start.toISOString(), endAt: end.toISOString() };
}

export function durationMinutes(event: TimedEvent): number {
  return (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / MS_PER_MINUTE;
}

/** 把球放到日曆：起點取指標時間，長度 120 分鐘。 */
export function newEventTimes(start: Date): EventTimes {
  return times(start, new Date(start.getTime() + NEW_EVENT_MINUTES * MS_PER_MINUTE));
}

/** 移動區塊：新起點由呼叫端算好（指標時間減抓取偏移，再套磁吸），長度不變。 */
export function moveEvent(event: TimedEvent, pointerTime: Date, grabOffsetMs: number): EventTimes {
  const elapsed = new Date(event.endAt).getTime() - new Date(event.startAt).getTime();
  const start = new Date(pointerTime.getTime() - grabOffsetMs);
  return times(start, new Date(start.getTime() + elapsed));
}

/** 拖曳時浮在指標旁的長度文字，例如 `2h`、`2h 30m`、`45m`。 */
export function formatDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
