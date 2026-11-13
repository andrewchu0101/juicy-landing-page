// 長按空白處叫出圓形選單（PRD AC-01.4）：沿用 Calendar 的 useRadialPalette 的流程，但不依賴 DOM 或 React。
// 按住 250ms 出現球；hover 只是標示（果凍晃動）；回到中心圓取消 hover；長按期間移動超過 6 像素取消。
// 命中測試與幾何在 engine/pointer.ts。兩種用法（專案擁有者 2026-11-14，試用分成兩個階段）：
//  - 步驟 2（有 drag）：離開球的判定圓就選中並開始拖曳，放開就建立區塊——原本的試用行為，球是試用的三顆球。
//  - 步驟 1（沒有 drag）：只展示，球是六顆展示球；離開球只是取消 hover，放開或 Escape 關閉，永遠不建立區塊。
import { RADIAL_LONG_PRESS_MS, RADIAL_MOVE_TOLERANCE_PX } from '../engine/limits';
import { radialBalls, radialRing, radialStep, type Point, type RadialRing } from '../engine/pointer';

export type RadialMenu = { origin: Point; positions: Point[]; ring: RadialRing; hovered: number };

type Template = { id: string; name: string; color: string; order: number };

export function createRadial(deps: {
  templates(): Template[];
  viewport(): { width: number; height: number };
  /** 沒給就是只展示（步驟 1）。 */
  drag?: {
    start(id: string, point: Point): void;
    move(id: string, point: Point): void;
    end(id: string, point: Point): void;
    cancel(): void;
  };
  onMenu(menu: RadialMenu | null): void;
}) {
  let draggingId: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let session: RadialMenu | null = null;
  let origin: Point | null = null;
  let pointerId: number | null = null;

  const sorted = () => [...deps.templates()].sort((a, b) => a.order - b.order);

  const clear = () => {
    clearTimeout(timer);
    session = null;
    origin = null;
    pointerId = null;
    deps.onMenu(null);
  };

  return {
    /** 呼叫端先確認：主鍵、目標在可長按的區域內、不是按鈕或區塊。 */
    down(id: number, point: Point) {
      clear();
      pointerId = id;
      origin = point;
      timer = setTimeout(() => {
        if (!origin) return;
        const { width, height } = deps.viewport();
        const count = sorted().length;
        session = {
          origin,
          positions: radialBalls(origin, count, width, height),
          ring: radialRing(origin, count, width, height),
          hovered: -1,
        };
        deps.onMenu(session);
      }, RADIAL_LONG_PRESS_MS);
    },

    move(id: number, point: Point) {
      if (id !== pointerId) return;
      if (draggingId) {
        deps.drag?.move(draggingId, point);
      } else if (session) {
        const step = radialStep(session.hovered, point, session.positions, session.ring);
        const picked = deps.drag && step.picked !== null ? sorted()[step.picked] : undefined;
        if (picked && deps.drag) {
          draggingId = picked.id;
          session = null;
          deps.onMenu(null);
          deps.drag.start(picked.id, point);
        } else if (step.hovered !== session.hovered) {
          session = { ...session, hovered: step.hovered };
          deps.onMenu(session);
        }
      } else if (origin && Math.hypot(point.x - origin.x, point.y - origin.y) > RADIAL_MOVE_TOLERANCE_PX) {
        clear();
      }
    },

    /** point：放開的位置；只有正在拖曳時用得到（有 drag 的步驟 2）。 */
    up(id: number, point?: Point) {
      if (id !== pointerId) return;
      if (draggingId && deps.drag && point) {
        deps.drag.end(draggingId, point);
      } else if (draggingId) {
        deps.drag?.cancel();
      }
      draggingId = null;
      clear();
    },

    /** pointercancel、視窗失焦或 Escape。 */
    cancel() {
      if (draggingId) deps.drag?.cancel();
      draggingId = null;
      clear();
    },

    escape() {
      this.cancel();
    },

    /** 卸載時：清掉進行中的長按計時器，並停止進行中的拖曳（REUSE-05）。 */
    destroy() {
      clearTimeout(timer);
      if (draggingId) deps.drag?.cancel();
      draggingId = null;
      session = null;
      origin = null;
      pointerId = null;
      deps.onMenu(null);
    },

    isOpen: () => session !== null,
    isOpenOrDragging: () => session !== null || draggingId !== null,
  };
}

export type Radial = ReturnType<typeof createRadial>;
