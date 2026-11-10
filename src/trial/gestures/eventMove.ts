// 移動區塊（REUSE-03、REUSE-05）：沿用 Calendar 的 useEventInteractions 的「move」模式，不依賴 DOM 或 React。
// 草稿只存在手勢本身，放開時才寫進 store，所以一次手勢就是一次變更。
// 新起點 = 指標時間 − 抓取偏移，再套磁吸；長度不變；移動時指標被夾在可見範圍內。
// 調整長度（resize）在試用區暫不開放。
import { EVENT_DRAG_THRESHOLD_PX } from '../engine/limits';
import { moveEvent, type EventTimes, type TimedEvent } from '../engine/mutations';
import { magnetMinutes, pointerToTime, type GridGeometry, type Point } from '../engine/pointer';
import { columnMinutesToDate, minutesFromColumnStart, type TimelineConfig } from '../engine/timeline';

export type MoveDraft = { eventId: string; times: EventTimes; pointer: Point };

export function createEventMove(deps: {
  geometry(): GridGeometry | null;
  days: Date[];
  timeline: TimelineConfig;
  magnetEnabled(): boolean;
  select(id: string): void;
  update(id: string, times: EventTimes): boolean;
  onDraft(draft: MoveDraft | null): void;
}) {
  let current: {
    pointerId: number;
    event: TimedEvent & { id: string };
    origin: Point;
    grabOffsetMs: number;
    pointer: Point;
    active: boolean;
    latest: EventTimes | null;
  } | null = null;

  // 移動時指標被夾在可見範圍內，所以不允許溢出；磁吸套用在「邊緣」而不是指標上。
  const timeAt = (point: Point): Date | null => {
    const geometry = deps.geometry();
    return geometry ? pointerToTime(point, geometry, deps.days, deps.timeline) : null;
  };

  const resolve = (state: NonNullable<typeof current>): EventTimes | null => {
    const time = timeAt(state.pointer);
    if (!time) return null;
    const rawEdge = new Date(time.getTime() - state.grabOffsetMs);
    const day = deps.days[0]!;
    const edge = columnMinutesToDate(
      day,
      magnetMinutes(minutesFromColumnStart(rawEdge, day, deps.timeline), deps.timeline.pixelsPerMinute, deps.magnetEnabled()),
      deps.timeline,
    );
    return moveEvent(state.event, edge, 0);
  };

  const stop = () => {
    current = null;
    deps.onDraft(null);
  };

  return {
    down(pointerId: number, button: number, point: Point, event: TimedEvent & { id: string }) {
      if (button !== 0) return;
      const origin = timeAt(point);
      if (!origin) return;
      // 按下就選取（REUSE-06）；單擊與雙擊不會移動區塊。
      deps.select(event.id);
      current = {
        pointerId,
        event,
        origin: point,
        // 抓住的點與起點邊緣的距離，按下時不跳動。
        grabOffsetMs: origin.getTime() - new Date(event.startAt).getTime(),
        pointer: point,
        active: false,
        latest: null,
      };
    },

    move(pointerId: number, point: Point) {
      if (!current || current.pointerId !== pointerId) return;
      current.pointer = point;
      if (!current.active) {
        if (Math.hypot(point.x - current.origin.x, point.y - current.origin.y) < EVENT_DRAG_THRESHOLD_PX) return;
        current.active = true;
      }
      current.latest = resolve(current);
      if (current.latest) deps.onDraft({ eventId: current.event.id, times: current.latest, pointer: point });
    },

    up(pointerId: number) {
      if (!current || current.pointerId !== pointerId) return;
      const { active, latest, event } = current;
      stop();
      if (active && latest) deps.update(event.id, latest);
    },

    /** 只有進行中的拖曳才會接住 Escape，否則交還給一般處理。 */
    escape(): boolean {
      if (!current?.active) return false;
      stop();
      return true;
    },

    cancel(pointerId: number) {
      if (!current || current.pointerId !== pointerId) return;
      stop();
    },

    /** 元件卸載時停止進行中的手勢（REUSE-05）。 */
    destroy() {
      if (current) stop();
    },

    isActive: () => current?.active ?? false,
  };
}

export type EventMove = ReturnType<typeof createEventMove>;
