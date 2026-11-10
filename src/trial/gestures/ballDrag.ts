// 把球拖到日曆（REUSE-02、REUSE-05）：沿用 Calendar 的 useTemplateDrag 的流程，但不依賴 DOM 或 React。
// 時間怎麼從指標位置解析（命中測試、磁吸）由 timeAt 注入；建立區塊由 createEvent 注入。
import { newEventTimes } from '../engine/mutations';
import { visibleFeedbackPoint, type Point } from '../engine/pointer';

export type Splash = { key: number; x: number; y: number; color: string };
export type GhostEvent = { id: string; title: string; color: string; startAt: string; endAt: string };

export type BallDragView = {
  activeId: string | null;
  /** 球覆蓋層的位置（指標）；沒有拖曳時為 null。 */
  point: Point | null;
  ghost: GhostEvent | null;
  /** 放在日曆外的回饋：一圈粒子。 */
  burst: Splash | null;
  /** 成功放下的回饋：幾滴水珠，只播一次。 */
  splash: Splash | null;
  /** 沿行進方向依速度拉伸球，純視覺；偏好減少動態時為空字串。 */
  ballTransform: string;
};

type Template = { id: string; name: string; color: string };

export function createBallDrag(deps: {
  timeAt(point: Point): Date | null;
  template(id: string): Template | undefined;
  createEvent(templateId: string, start: Date): string | null;
  deselect(): void;
  viewport(): { width: number; height: number };
  reducedMotion(): boolean;
  nextKey(): number;
  onChange(view: BallDragView): void;
}) {
  let view: BallDragView = { activeId: null, point: null, ghost: null, burst: null, splash: null, ballTransform: '' };
  let active = false;
  let pointer: Point | null = null;
  let last: Point | null = null;

  const set = (next: Partial<BallDragView>) => {
    view = { ...view, ...next };
    deps.onChange(view);
  };

  const refreshGhost = (templateId: string) => {
    const template = deps.template(templateId);
    const time = pointer && deps.timeAt(pointer);
    set({
      ghost: template && time ? { id: 'ghost', title: template.name, color: template.color, ...newEventTimes(time) } : null,
    });
  };

  const finish = () => {
    active = false;
    pointer = null;
    last = null;
    set({ activeId: null, point: null, ghost: null, ballTransform: '' });
  };

  return {
    start(templateId: string, point: Point) {
      active = true;
      // 讓整個日曆都能當放置目標（Calendar 在這裡關掉浮動的編輯面板）。
      deps.deselect();
      pointer = point;
      last = null;
      set({ activeId: templateId, point, ballTransform: '' });
    },

    move(templateId: string, point: Point) {
      if (!active) return;
      const previous = last ?? point;
      pointer = point;
      last = point;
      refreshGhost(templateId);
      let ballTransform = '';
      if (!deps.reducedMotion()) {
        const dx = point.x - previous.x;
        const dy = point.y - previous.y;
        const stretch = Math.min(Math.hypot(dx, dy) / 90, 0.22);
        const angle = Math.atan2(dy, dx);
        ballTransform = `rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch}) rotate(${-angle}rad)`;
      }
      set({ point, ballTransform });
    },

    end(templateId: string, point: Point) {
      if (!active) return;
      const time = deps.timeAt(point);
      const color = deps.template(templateId)?.color ?? '#000000';
      finish();
      if (!time) {
        const { width, height } = deps.viewport();
        set({ burst: { key: deps.nextKey(), ...visibleFeedbackPoint(point, width, height), color } });
        return;
      }
      if (deps.createEvent(templateId, time)) {
        set({ splash: { key: deps.nextKey(), x: point.x, y: point.y, color } });
      }
    },

    /** Escape、pointercancel 或離開視窗。只有離開視窗會留下粒子回饋（REUSE-05）。 */
    cancel(leftWindow: boolean) {
      if (!active) return;
      if (leftWindow && view.activeId && pointer) {
        const { width, height } = deps.viewport();
        set({
          burst: {
            key: deps.nextKey(),
            ...visibleFeedbackPoint(pointer, width, height),
            color: deps.template(view.activeId)?.color ?? '#000000',
          },
        });
      }
      finish();
    },

    isActive: () => active,
  };
}

export type BallDrag = ReturnType<typeof createBallDrag>;
