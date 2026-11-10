// 區塊與落點預覽（Calendar 的 EventBlock／GhostBlock）。標題與時間以文字節點呈現，React 會跳脫。
// 雙擊命名、調整長度的邊緣、右鍵選單在試用區暫不開放。
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { mutedEventColor, readableTextColor } from '../color';
import type { EventSegment } from '../engine/layout';
import { formatTimeRange, type TimeFormatOptions } from '../format';
import type { GhostEvent } from '../gestures/ballDrag';
import type { TrialEvent } from '../store';

const GAP = 2;

function segmentStyle(segment: EventSegment): CSSProperties {
  const laneWidth = 100 / segment.laneCount;
  return {
    top: segment.top,
    height: segment.height,
    left: `calc(${segment.lane * laneWidth}% + ${GAP}px)`,
    width: `calc(${laneWidth}% - ${GAP * 2}px)`,
  };
}

const corners = (segment: EventSegment) => `${segment.isStart ? 'round-top' : ''} ${segment.isEnd ? 'round-bottom' : ''}`.trim();

export function EventBlock({
  segment,
  event,
  past,
  selected,
  dropped,
  active,
  timeFormat,
  onPress,
  onDropAnimationEnd,
}: {
  segment: EventSegment;
  event: TrialEvent;
  past: boolean;
  selected: boolean;
  dropped: boolean;
  active: boolean;
  timeFormat: TimeFormatOptions;
  onPress: (press: ReactPointerEvent) => void;
  onDropAnimationEnd: () => void;
}) {
  const displayColor = past ? mutedEventColor(event.color) : event.color;
  const showTime = segment.height >= 38;
  const range = formatTimeRange(event, timeFormat);

  return (
    <div
      data-testid="event-block"
      tabIndex={-1}
      data-event-id={event.id}
      data-selected={selected}
      data-active={active}
      title={`${event.title} · ${range}`}
      className={`event-block ${corners(segment)} ${dropped ? 'event-drop' : ''}`.replace(/\s+/g, ' ').trim()}
      style={{
        ...segmentStyle(segment),
        backgroundColor: displayColor,
        color: readableTextColor(displayColor),
        zIndex: active ? 25 : selected ? 20 : 5 + segment.lane,
        touchAction: 'none',
      }}
      onPointerDown={onPress}
      // 只播一次：沒有這行，換檢視或換欄重新掛載時會再播一次。
      onAnimationEnd={() => {
        if (dropped) onDropAnimationEnd();
      }}
    >
      <div className={`event-text ${segment.height < 26 ? 'compact' : 'roomy'}`}>
        <div data-testid="event-title" className="title">
          {event.title}
        </div>
        {showTime && (
          <div data-testid="event-time" className="time">
            {range}
          </div>
        )}
      </div>
    </div>
  );
}

/** 球會落在哪裡。 */
export function GhostBlock({ segment, event, timeFormat }: { segment: EventSegment; event: GhostEvent; timeFormat: TimeFormatOptions }) {
  return (
    <div
      data-testid="drop-ghost"
      className={`drop-ghost ${corners(segment)}`.trim()}
      style={{
        top: segment.top,
        height: segment.height,
        left: GAP,
        right: GAP,
        borderColor: event.color,
        backgroundColor: `${event.color}40`,
      }}
    >
      <div className="title">{event.title}</div>
      <div className="time">{formatTimeRange(event, timeFormat)}</div>
    </div>
  );
}
