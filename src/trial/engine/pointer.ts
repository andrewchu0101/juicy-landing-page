// 沿用 Calendar 固定 commit 的 engine/pointer.ts 中本輪用到的部分（見 limits.ts 的說明）。
import { columnMinutesToDate, pixelsToMinutes, timelineSpanMinutes, type TimelineConfig } from './timeline';

/** 欄位區現在在螢幕上的位置（client 座標）。 */
export type GridGeometry = { left: number; top: number; columnWidth: number; columnCount: number };
export type Point = { x: number; y: number };

export function columnIndexAt(x: number, geometry: GridGeometry): number {
  const index = Math.floor((x - geometry.left) / geometry.columnWidth);
  return Math.min(Math.max(index, 0), geometry.columnCount - 1);
}

/** 指標位置轉成時間（REUSE-01）：先換成相對可見範圍起點的分鐘數，再套用磁吸；磁吸關閉時取整分鐘。 */
export function pointerToTime(
  point: Point,
  geometry: GridGeometry,
  days: Date[],
  timeline: TimelineConfig,
  options: { allowOverflow?: boolean; magnetEnabled?: boolean } = {},
): Date {
  const day = days[columnIndexAt(point.x, geometry)];
  if (!day) throw new Error('pointerToTime needs at least one visible day');
  const raw = pixelsToMinutes(point.y - geometry.top, timeline);
  const minutes = magnetMinutes(raw, timeline.pixelsPerMinute, options.magnetEnabled ?? false);
  const resolved = options.allowOverflow ? minutes : Math.min(Math.max(minutes, 0), timelineSpanMinutes(timeline));
  return columnMinutesToDate(day, resolved, timeline);
}

/** 離半點刻度線 8 螢幕像素內才輕輕吸附（預設每分鐘 1 像素，即 8 分鐘）。 */
export function magnetMinutes(minutes: number, pixelsPerMinute: number, enabled: boolean): number {
  const nearest = Math.round(minutes / 30) * 30;
  return enabled && Math.abs(nearest - minutes) * pixelsPerMinute <= 8 ? nearest : minutes;
}

export type RadialRing = { center: Point; radius: number };

export function radialRing(origin: Point, count: number, width: number, height: number): RadialRing {
  const radius = Math.max(76, (count * 50) / (2 * Math.PI));
  const center = {
    x: Math.max(radius + 28, Math.min(origin.x, width - radius - 28)),
    y: Math.max(radius + 28, Math.min(origin.y, height - radius - 28)),
  };
  return { center, radius };
}

/** 圓形選單的球位置，一定留在視窗內；點擊判定與進場動畫無關。 */
export function radialBalls(origin: Point, count: number, width: number, height: number): Point[] {
  const { center, radius } = radialRing(origin, count, width, height);
  return Array.from({ length: count }, (_, i) => ({
    x: center.x + Math.cos((i * Math.PI * 2) / count - Math.PI / 2) * radius,
    y: center.y + Math.sin((i * Math.PI * 2) / count - Math.PI / 2) * radius,
  }));
}

export const RADIAL_HIT_RADIUS = 28;
/** 指標回到圓環中心的這個圓內會取消 hover；兩者重疊的地方球優先。 */
export const RADIAL_CENTER_RADIUS = 80;

export function radialHit(point: Point, balls: Point[]): number {
  return balls.findIndex((ball) => Math.hypot(point.x - ball.x, point.y - ball.y) <= RADIAL_HIT_RADIUS);
}

export type RadialStep = { hovered: number; picked: number | null };

/** hover 只是標示；離開球固定的判定圓就選中那顆球，除非指標回到圓環中心（球的判定圓仍優先）。 */
export function radialStep(previousHovered: number, point: Point, balls: Point[], ring: RadialRing): RadialStep {
  let hit = -1;
  let nearest = Infinity;
  balls.forEach((ball, index) => {
    const distance = Math.hypot(point.x - ball.x, point.y - ball.y);
    if (distance <= RADIAL_HIT_RADIUS && distance < nearest) {
      hit = index;
      nearest = distance;
    }
  });
  if (hit >= 0) return { hovered: hit, picked: null };
  if (Math.hypot(point.x - ring.center.x, point.y - ring.center.y) <= RADIAL_CENTER_RADIUS) return { hovered: -1, picked: null };
  return { hovered: -1, picked: previousHovered >= 0 ? previousHovered : null };
}

export function splitParticles() {
  return Array.from({ length: 18 }, (_, i) => ({
    dx: Math.cos(i * 2.4) * (35 + i * 3),
    dy: Math.sin(i * 2.4) * (35 + i * 3),
    size: 5 + (i % 5),
  }));
}

/** 被拒絕的放開，指標離開視窗時，回饋仍留在可見處。 */
export function visibleFeedbackPoint(point: Point, width: number, height: number): Point {
  return { x: Math.max(24, Math.min(width - 24, point.x)), y: Math.max(24, Math.min(height - 24, point.y)) };
}
