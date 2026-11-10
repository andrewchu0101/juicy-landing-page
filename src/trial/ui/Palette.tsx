// 球列（Calendar 的 TemplatePalette 去掉新增、編輯與工作區控制；OR-20：新增／編輯球排除，名稱是純文字）。
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { TrialTemplate } from '../buildTrialWorkspace';
import { fillTemplate } from '../format';

export function Palette({
  templates,
  draggingId,
  ballAria,
  onPress,
}: {
  templates: TrialTemplate[];
  draggingId: string | null;
  ballAria: string;
  onPress: (press: ReactPointerEvent, templateId: string) => void;
}) {
  return (
    <aside className="trial-palette">
      <ul>
        {templates.map((template) => (
          <li key={template.id}>
            <div
              role="button"
              data-testid="template-ball"
              data-template-id={template.id}
              aria-label={fillTemplate(ballAria, { name: template.name })}
              className={`ball size-11 ${draggingId === template.id ? 'ball-dragging-source' : ''}`.trim()}
              style={{ '--ball-color': template.color } as CSSProperties}
              onPointerDown={(press) => onPress(press, template.id)}
            />
            <span data-testid="template-name" className="trial-ball-name">
              {template.name}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
