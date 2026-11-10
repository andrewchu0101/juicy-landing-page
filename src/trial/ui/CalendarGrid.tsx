// 單日日曆（Calendar 的 CalendarGrid 去掉工具列、右鍵選單、框選與縮放）。版面、線條、標籤與現在線都沿用 App。
import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { GUTTER_WIDTH_PX, MIN_COLUMN_WIDTH_PX } from '../engine/limits';
import { hiddenEventCounts, layoutSegments } from '../engine/layout';
import { durationMinutes, formatDuration } from '../engine/mutations';
import {
  hourMarks,
  isPastDate,
  minutesFromColumnStart,
  minutesToPixels,
  timelineHeight,
  timelineSpanMinutes,
  type TimelineConfig,
} from '../engine/timeline';
import { columnMinutesToDate } from '../engine/timeline';
import { fillTemplate, formatTime, formatTimeRange, formatWeekday, type TimeFormatOptions } from '../format';
import type { GhostEvent } from '../gestures/ballDrag';
import type { MoveDraft } from '../gestures/eventMove';
import type { SiteLanguage } from '../../site/webLanguageBackend';
import type { TrialEvent } from '../store';
import { EventBlock, GhostBlock } from './EventBlock';

// 時間軸標籤用中性的一天，不受可見日期的日光節約切換影響（與 Calendar 相同）。
const TIME_LABEL_DAY = new Date(2000, 0, 1);

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function CalendarGrid({
  scrollerRef,
  columnsRef,
  days,
  timeline,
  events,
  selectedEventId,
  droppedEventId,
  ghost,
  draft,
  language,
  timeFormat,
  hiddenTitles,
  onPressEvent,
  onDropAnimationEnd,
}: {
  scrollerRef: RefObject<HTMLDivElement | null>;
  columnsRef: RefObject<HTMLDivElement | null>;
  days: Date[];
  timeline: TimelineConfig;
  events: Record<string, TrialEvent>;
  selectedEventId: string | null;
  droppedEventId: string | null;
  ghost: GhostEvent | null;
  draft: MoveDraft | null;
  language: SiteLanguage;
  timeFormat: TimeFormatOptions;
  hiddenTitles: { one: string; many: string };
  onPressEvent: (press: ReactPointerEvent, event: TrialEvent) => void;
  onDropAnimationEnd: () => void;
}) {
  const now = useNow();

  const displayed = useMemo(
    () => Object.values(events).map((event) => (draft && event.id === draft.eventId ? { ...event, ...draft.times } : event)),
    [events, draft],
  );
  const segments = useMemo(() => layoutSegments(displayed, days, timeline), [displayed, days, timeline]);
  const hidden = useMemo(() => hiddenEventCounts(displayed, days, timeline), [displayed, days, timeline]);
  const ghostSegments = useMemo(() => (ghost ? layoutSegments([ghost], days, timeline) : []), [ghost, days, timeline]);
  const marks = useMemo(() => hourMarks(timeline), [timeline]);
  const height = timelineHeight(timeline);
  const span = timelineSpanMinutes(timeline);
  const columnPercent = 100 / days.length;
  const draftEvent = draft ? { ...events[draft.eventId], ...draft.times } : null;

  return (
    <div ref={scrollerRef} data-testid="calendar-scroller" className="calendar-scroller">
      <div style={{ minWidth: GUTTER_WIDTH_PX + MIN_COLUMN_WIDTH_PX * days.length }}>
        <div className="cal-header">
          <div className="cal-gutter-head" style={{ width: GUTTER_WIDTH_PX }} />
          {days.map((day, index) => {
            const hiddenCount = hidden[index] ?? 0;
            return (
              <div key={day.toISOString()} data-testid="day-header" className="cal-day-header">
                <span className="weekday">{formatWeekday(day, language)}</span>
                <span className={`date ${isSameDay(day, now) ? 'today' : ''}`.trim()}>{day.getDate()}</span>
                {hiddenCount > 0 && (
                  <span
                    data-testid="hidden-count"
                    title={fillTemplate(hiddenCount === 1 ? hiddenTitles.one : hiddenTitles.many, { count: hiddenCount })}
                    className="cal-hidden-count"
                  >
                    +{hiddenCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="cal-body">
          <div className="cal-gutter" style={{ width: GUTTER_WIDTH_PX, height }}>
            <div className="cal-gutter-inner">
              {marks.map((mark) => (
                <span
                  key={mark.minutes}
                  data-testid="timeline-label"
                  className="cal-time-label"
                  style={{ top: minutesToPixels(mark.minutes, timeline) }}
                >
                  {formatTime(columnMinutesToDate(TIME_LABEL_DAY, mark.minutes, timeline), timeFormat)}
                  {mark.nextDay && mark.hour === 0 && <sup>+1</sup>}
                </span>
              ))}
            </div>
          </div>

          <div ref={columnsRef} data-testid="calendar-columns" tabIndex={-1} className="cal-columns" style={{ height }}>
            {Array.from({ length: Math.floor(span / 30) }, (_, index) => (index + 1) * 30)
              .filter((minutes) => minutes % 60 !== 0)
              .map((minutes) => (
                <div key={`half-${minutes}`} className="cal-half-line" style={{ top: minutesToPixels(minutes, timeline) }} />
              ))}
            {marks.map((mark) => (
              <div
                key={mark.minutes}
                className={`cal-hour-line ${mark.nextDay && mark.hour === 0 ? 'strong' : ''}`.trim()}
                style={{ top: minutesToPixels(mark.minutes, timeline) }}
              />
            ))}

            {days.map((day, columnIndex) => {
              const nowMinutes = minutesFromColumnStart(now, day, timeline);
              return (
                <div
                  key={day.toISOString()}
                  data-testid="day-column"
                  className="cal-day-column"
                  style={{ left: `${columnIndex * columnPercent}%`, width: `${columnPercent}%` }}
                >
                  {nowMinutes >= 0 && nowMinutes < span && (
                    <div data-testid="now-line" className="cal-now-line" style={{ top: minutesToPixels(nowMinutes, timeline) }} />
                  )}
                  {ghostSegments
                    .filter((segment) => segment.columnIndex === columnIndex)
                    .map((segment) => (ghost ? <GhostBlock key={segment.key} segment={segment} event={ghost} timeFormat={timeFormat} /> : null))}
                  {segments
                    .filter((segment) => segment.columnIndex === columnIndex)
                    .map((segment) => {
                      const event = displayed.find((item) => item.id === segment.eventId);
                      if (!event) return null;
                      return (
                        <EventBlock
                          key={segment.key}
                          past={isPastDate(day, now)}
                          segment={segment}
                          event={event}
                          selected={selectedEventId === event.id}
                          dropped={droppedEventId === event.id}
                          active={draft?.eventId === event.id}
                          timeFormat={timeFormat}
                          onPress={(press) => {
                            // 手勢一律從 store 裡的區塊開始，不是草稿。
                            const stored = events[event.id];
                            if (stored) onPressEvent(press, stored);
                          }}
                          onDropAnimationEnd={onDropAnimationEnd}
                        />
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {draft && draftEvent && (
        <div data-testid="drag-chip" className="drag-chip" style={{ left: draft.pointer.x + 14, top: draft.pointer.y + 14 }}>
          {formatTimeRange(draft.times, timeFormat)} · {formatDuration(durationMinutes(draft.times))}
        </div>
      )}
    </div>
  );
}
