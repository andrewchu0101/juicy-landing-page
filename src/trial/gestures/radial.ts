// 長按空白處叫出圓形選單（PRD AC-01.4）：沿用 Calendar 的 useRadialPalette 的流程，但不依賴 DOM 或 React。
// 按住 250ms 出現球（目前是六顆展示球）；hover 只是標示（果凍晃動）；離開球的判定圓只是取消 hover。
// 專案擁有者 2026-11-13：圓形選單只展示，不開始拖曳、不建立區塊；放開或 Escape 關閉。
// 長按期間移動超過 6 像素取消。命中測試與幾何在 engine/pointer.ts。
import { RADIAL_LONG_PRESS_MS, RADIAL_MOVE_TOLERANCE_PX } from '../engine/limits';
import { radialBalls, radialRing, radialStep, type Point, type RadialRing } from '../engine/pointer';

export type RadialMenu = { origin: Point; positions: Point[]; ring: RadialRing; hovered: number };

type Template = { id: string; name: string; color: string; order: number };

export function createRadial(deps: {
  templates(): Template[];
  viewport(): { width: number; height: number };
  onMenu(menu: RadialMenu | null): void;
}) {
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
    /** 呼叫端先確認：主鍵、目標在日曆欄內、不是按鈕或區塊。 */
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
      if (session) {
        const step = radialStep(session.hovered, point, session.positions, session.ring);
        if (step.hovered !== session.hovered) {
          session = { ...session, hovered: step.hovered };
          deps.onMenu(session);
        }
      } else if (origin && Math.hypot(point.x - origin.x, point.y - origin.y) > RADIAL_MOVE_TOLERANCE_PX) {
        clear();
      }
    },

    up(id: number) {
      if (id !== pointerId) return;
      clear();
    },

    /** pointercancel、視窗失焦或 Escape。 */
    cancel() {
      clear();
    },

    escape() {
      this.cancel();
    },

    /** 卸載時：清掉進行中的長按計時器（REUSE-05）。 */
    destroy() {
      clearTimeout(timer);
      session = null;
      origin = null;
      pointerId = null;
      deps.onMenu(null);
    },

    isOpen: () => session !== null,
  };
}

export type Radial = ReturnType<typeof createRadial>;
