// 拖球時的覆蓋層與回饋（Calendar 的 TemplateDragOverlay／DropSplash／SplitBurst／RadialPalette）。
// 全部是固定定位、不接收指標事件，所以不影響命中測試。
import type { CSSProperties } from 'react';
import { RADIAL_ENTER_MS, } from '../engine/limits';
import { splitParticles } from '../engine/pointer';
import type { BallDragView, Splash } from '../gestures/ballDrag';
import type { RadialMenu } from '../gestures/radial';

type Template = { id: string; name: string; color: string };

/** 跟著指標的球。 */
export function BallOverlay({ template, view }: { template: Template | undefined; view: BallDragView }) {
  if (!template || !view.point) return null;
  return (
    <div
      data-testid="ball-overlay"
      className="ball ball-overlay size-11"
      style={
        {
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 100,
          left: view.point.x - 22,
          top: view.point.y - 22,
          transform: view.ballTransform || undefined,
          '--ball-color': template.color,
        } as CSSProperties
      }
    />
  );
}

const DROPLETS = [
  { dx: -30, dy: -16, size: 7 },
  { dx: -14, dy: -30, size: 5 },
  { dx: 15, dy: -28, size: 6 },
  { dx: 30, dy: -12, size: 5 },
];

/** 成功放下時，從落點彈出幾滴水珠，只播一次。 */
export function DropSplash({ splash }: { splash: Splash | null }) {
  if (!splash) return null;
  return (
    <div key={splash.key} aria-hidden>
      {DROPLETS.map((droplet) => (
        <span
          key={`${droplet.dx}:${droplet.dy}`}
          className="droplet"
          style={
            {
              left: splash.x,
              top: splash.y,
              width: droplet.size,
              height: droplet.size,
              backgroundColor: splash.color,
              '--dx': `${droplet.dx}px`,
              '--dy': `${droplet.dy}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** 放在日曆外：球裂成一圈粒子。 */
export function SplitBurst({ burst }: { burst: Splash | null }) {
  if (!burst) return null;
  return (
    <div key={burst.key} aria-hidden data-testid="split-burst">
      {splitParticles().map((particle, i) => (
        <span
          key={i}
          className="split-particle"
          style={
            {
              left: burst.x,
              top: burst.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: burst.color,
              '--dx': `${particle.dx}px`,
              '--dy': `${particle.dy}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** 長按空白處叫出的圓形選單。hover 的球以果凍般的輪廓晃動（radial-wobble）。 */
export function RadialPalette({ menu, templates, label }: { menu: RadialMenu | null; templates: Template[]; label: string }) {
  if (!menu) return null;
  return (
    <div className="radial-palette" role="status" aria-label={label}>
      {templates.map((template, index) => {
        const point = menu.positions[index];
        if (!point) return null;
        return (
          <div
            key={template.id}
            className={`radial-choice ${menu.hovered === index ? 'radial-hovered' : ''}`.trim()}
            style={
              {
                left: point.x,
                top: point.y,
                '--from-x': `${menu.origin.x - point.x}px`,
                '--from-y': `${menu.origin.y - point.y}px`,
                '--radial-enter': `${RADIAL_ENTER_MS}ms`,
              } as CSSProperties
            }
          >
            <div className="ball size-11" style={{ '--ball-color': template.color } as CSSProperties} />
            <span>{template.name}</span>
          </div>
        );
      })}
    </div>
  );
}
