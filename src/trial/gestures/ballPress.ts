// 側邊球列的球：按下後移動超過 4 像素才算拖曳（Calendar 用 dnd-kit 的 PointerSensor、distance: 4），
// 所以單擊不會觸發任何事。Escape 或 pointercancel 取消；視窗失焦視為離開視窗（回饋粒子）。
import { BALL_DRAG_THRESHOLD_PX } from '../engine/limits';
import type { Point } from '../engine/pointer';

export function createBallPress(drag: {
  start(id: string, point: Point): void;
  move(id: string, point: Point): void;
  end(id: string, point: Point): void;
  cancel(leftWindow: boolean): void;
}) {
  let pressed: { id: string; pointerId: number; origin: Point } | null = null;
  let dragging = false;

  const reset = () => {
    pressed = null;
    dragging = false;
  };

  return {
    down(id: string, pointerId: number, point: Point) {
      pressed = { id, pointerId, origin: point };
      dragging = false;
    },

    move(pointerId: number, point: Point) {
      if (!pressed || pressed.pointerId !== pointerId) return;
      if (!dragging) {
        // dnd-kit：移動距離大於門檻才啟動；啟動時的起點是最初按下的位置。
        if (Math.hypot(point.x - pressed.origin.x, point.y - pressed.origin.y) <= BALL_DRAG_THRESHOLD_PX) return;
        dragging = true;
        drag.start(pressed.id, pressed.origin);
      }
      drag.move(pressed.id, point);
    },

    up(pointerId: number, point: Point) {
      if (!pressed || pressed.pointerId !== pointerId) return;
      const { id } = pressed;
      const wasDragging = dragging;
      reset();
      if (wasDragging) drag.end(id, point);
    },

    escape() {
      if (!dragging) return;
      reset();
      drag.cancel(false);
    },

    cancel(pointerId: number) {
      if (!pressed || pressed.pointerId !== pointerId) return;
      const wasDragging = dragging;
      reset();
      if (wasDragging) drag.cancel(false);
    },

    blur() {
      if (!dragging) {
        reset();
        return;
      }
      reset();
      drag.cancel(true);
    },

    isDragging: () => dragging,
  };
}
