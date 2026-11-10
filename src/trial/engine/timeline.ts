// 沿用 Calendar 固定 commit 的 engine/timeline.ts（見 limits.ts 的說明）；不使用 date-fns，改用原生 Date。
export type TimelineConfig = {
  /** 可見範圍的第一個小時，0–23。 */
  startHour: number;
  /** 可見範圍的最後一個小時，0–24；小於或等於 startHour 表示跨到隔天。 */
  endHour: number;
  pixelsPerMinute: number;
};

export const MINUTES_PER_DAY = 1440;

export function timelineSpanMinutes({ startHour, endHour }: TimelineConfig): number {
  const hours = (endHour - startHour + 24) % 24;
  return (hours === 0 ? 24 : hours) * 60;
}

export function timelineHeight(timeline: TimelineConfig): number {
  return timelineSpanMinutes(timeline) * timeline.pixelsPerMinute;
}

export function minutesToPixels(minutes: number, timeline: TimelineConfig): number {
  return minutes * timeline.pixelsPerMinute;
}

export function pixelsToMinutes(pixels: number, timeline: TimelineConfig): number {
  return pixels / timeline.pixelsPerMinute;
}

/** 兩個日期相差幾個「日曆日」（與時間無關），等同 date-fns 的 differenceInCalendarDays。 */
export function differenceInCalendarDays(later: Date, earlier: Date): number {
  const a = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const b = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.round((a - b) / 86_400_000);
}

/**
 * 某個瞬間距離該欄時間軸起點的牆上時鐘分鐘數。早於該欄為負數，晚於該欄結尾則大於等於 span。
 * 用牆上時鐘（而非經過時間）讓區塊在日光節約時間切換的日子仍與小時標籤對齊。
 */
export function minutesFromColumnStart(instant: Date, columnDay: Date, timeline: TimelineConfig): number {
  const dayOffset = differenceInCalendarDays(instant, columnDay);
  const minuteOfDay = instant.getHours() * 60 + instant.getMinutes() + instant.getSeconds() / 60;
  return dayOffset * MINUTES_PER_DAY + minuteOfDay - timeline.startHour * 60;
}

/** 該欄牆上時鐘偏移對應的瞬間；偏移可以超過該欄結尾。 */
export function columnMinutesToDate(columnDay: Date, minutes: number, timeline: TimelineConfig): Date {
  return new Date(columnDay.getFullYear(), columnDay.getMonth(), columnDay.getDate(), timeline.startHour, Math.round(minutes));
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export type HourMark = {
  minutes: number;
  hour: number;
  label: string;
  /** 這個刻度落在該欄日期的隔天。 */
  nextDay: boolean;
};

export function hourMarks(timeline: TimelineConfig): HourMark[] {
  const hours = timelineSpanMinutes(timeline) / 60;
  return Array.from({ length: hours }, (_, index) => {
    const absolute = timeline.startHour + index;
    const hour = absolute % 24;
    return { minutes: index * 60, hour, label: `${String(hour).padStart(2, '0')}:00`, nextDay: absolute >= 24 };
  });
}

/** 過去的日曆欄降低飽和度；今天稍早的時段保留原色。 */
export function isPastDate(day: Date, now: Date): boolean {
  return differenceInCalendarDays(day, now) < 0;
}
