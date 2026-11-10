// 沿用 Calendar 固定 commit 的 engine/layout.ts 中的區塊排版（REUSE-11）；不使用 date-fns。
import { durationMinutes, type TimedEvent } from './mutations';
import { minutesFromColumnStart, minutesToPixels, timelineSpanMinutes, type TimelineConfig } from './timeline';

/** 很短的區塊仍要看得到、抓得到。 */
export const MIN_SEGMENT_HEIGHT = 18;

export type EventSegment = {
  key: string;
  eventId: string;
  columnIndex: number;
  top: number;
  height: number;
  lane: number;
  laneCount: number;
  /** 區塊在這一段之前還有延續時為 false。 */
  isStart: boolean;
  /** 區塊在這一段之後還有延續時為 false。 */
  isEnd: boolean;
};

type Positioned = Omit<EventSegment, 'lane' | 'laneCount'> & { sortStart: number };

function positionEvent(event: TimedEvent & { id: string }, days: Date[], timeline: TimelineConfig): Positioned[] {
  const span = timelineSpanMinutes(timeline);
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  const segments: Positioned[] = [];

  days.forEach((day, columnIndex) => {
    const rawStart = minutesFromColumnStart(start, day, timeline);
    // 日光節約時間倒退的那個小時，牆上時鐘的結束可能早於開始；以經過時間為準。
    const rawEnd = Math.max(minutesFromColumnStart(end, day, timeline), rawStart + Math.min(durationMinutes(event), 1));
    if (rawEnd <= 0 || rawStart >= span) return;

    const clippedStart = Math.max(rawStart, 0);
    const clippedEnd = Math.min(rawEnd, span);
    const top = minutesToPixels(clippedStart, timeline);
    const bottomLimit = minutesToPixels(span, timeline);
    const height = Math.max(minutesToPixels(clippedEnd - clippedStart, timeline), MIN_SEGMENT_HEIGHT);

    segments.push({
      key: `${event.id}:${columnIndex}`,
      eventId: event.id,
      columnIndex,
      // 貼在底邊的最小高度細條往上挪，不裁切。
      top: Math.min(top, Math.max(0, bottomLimit - height)),
      height,
      isStart: rawStart >= 0,
      isEnd: rawEnd <= span,
      sortStart: clippedStart,
    });
  });
  return segments;
}

/** 視覺上重疊的區塊並排成多個車道；絕不改任何區塊的時間。 */
function assignLanes(column: Positioned[]): EventSegment[] {
  const sorted = [...column].sort((a, b) => a.top - b.top || b.height - a.height || a.eventId.localeCompare(b.eventId));
  const output: EventSegment[] = [];
  let cluster: EventSegment[] = [];
  let laneEnds: number[] = [];
  let clusterBottom = -Infinity;

  const flush = () => {
    for (const segment of cluster) segment.laneCount = laneEnds.length;
    output.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterBottom = -Infinity;
  };

  for (const positioned of sorted) {
    const { sortStart: unused, ...segment } = positioned;
    void unused;
    if (segment.top >= clusterBottom) flush();
    let lane = laneEnds.findIndex((bottom) => bottom <= segment.top);
    if (lane === -1) lane = laneEnds.length;
    const bottom = segment.top + segment.height;
    laneEnds[lane] = bottom;
    clusterBottom = Math.max(clusterBottom, bottom);
    cluster.push({ ...segment, lane, laneCount: 1 });
  }
  flush();
  return output;
}

export function layoutSegments(events: (TimedEvent & { id: string })[], days: Date[], timeline: TimelineConfig): EventSegment[] {
  const byColumn = new Map<number, Positioned[]>();
  for (const event of events) {
    for (const segment of positionEvent(event, days, timeline)) {
      const column = byColumn.get(segment.columnIndex) ?? [];
      column.push(segment);
      byColumn.set(segment.columnIndex, column);
    }
  }
  return [...byColumn.values()].flatMap(assignLanes);
}

/** 每一欄當天「可見時段完全看不到」的區塊數（日期欄的 +N 徽章）。 */
export function hiddenEventCounts(events: (TimedEvent & { id: string })[], days: Date[], timeline: TimelineConfig): number[] {
  return days.map((day) => {
    const dayStart = day.getTime();
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
    return events.filter((event) => {
      const start = new Date(event.startAt).getTime();
      const end = new Date(event.endAt).getTime();
      if (end <= dayStart || start >= dayEnd) return false;
      return positionEvent(event, days, timeline).length === 0;
    }).length;
  });
}
