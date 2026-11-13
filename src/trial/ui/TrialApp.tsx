// 試用區的組裝（Calendar 的 AppShell 去掉工具列、右側面板與設定）。兩個體驗：長按出六顆球看 hover 晃動（只展示），
// 以及把側邊三顆球拖放建立區塊、拖移區塊。
// 手勢的規則在 gestures/（不依賴 DOM，有單元測試）；這裡只負責把視窗的指標事件接上去，並顯示結果。
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react';
import { useSiteLanguage } from '../../site/LanguageContext';
import { startOfDay, type TimelineConfig } from '../engine/timeline';
import { browserHourCycle, resolveHour12, type TimeFormatOptions } from '../format';
import { createBallDrag, type BallDragView } from '../gestures/ballDrag';
import { createBallPress } from '../gestures/ballPress';
import { createEventMove, type MoveDraft } from '../gestures/eventMove';
import { createRadial, type RadialMenu } from '../gestures/radial';
import { demoRadialBalls } from '../radialBalls';
import { pointerToTime, type GridGeometry, type Point } from '../engine/pointer';
import type { TrialEvent } from '../store';
import { trialStore } from '../trialStore';
import '../trial.css';
import { CalendarGrid } from './CalendarGrid';
import { BallOverlay, DropSplash, RadialPalette, SplitBurst } from './Overlays';
import { Palette } from './Palette';

const INITIAL_VIEW: BallDragView = { activeId: null, point: null, ghost: null, burst: null, splash: null, ballTransform: '' };
// 這些元素上的按下不叫出圓形選單（Calendar 的 useRadialPalette）。
const RADIAL_BLOCKERS = 'button,input,select,textarea,[role="button"],[data-testid="event-block"]';

function measureGrid(columns: HTMLElement, columnCount: number): GridGeometry {
  const rect = columns.getBoundingClientRect();
  return { left: rect.left, top: rect.top, columnWidth: rect.width / columnCount, columnCount };
}

export function TrialApp() {
  const { language, copy } = useSiteLanguage();
  const state = useSyncExternalStore(trialStore.subscribe, trialStore.getState, trialStore.getState);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  const { startHour, endHour, pixelsPerMinute, visibleDays } = state.settings;
  // 從示範日起連續幾天（專案擁有者 2026-11-11：三天，每天 10:00–15:00）。用本地日期加一天，不用 24 小時，避免日光節約。
  const days = useMemo(() => {
    const first = startOfDay(new Date(state.anchor));
    return Array.from({ length: visibleDays }, (_, i) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + i));
  }, [state.anchor, visibleDays]);
  const timeline = useMemo<TimelineConfig>(() => ({ startHour, endHour, pixelsPerMinute }), [startHour, endHour, pixelsPerMinute]);
  const templates = useMemo(() => Object.values(state.templates).sort((a, b) => a.order - b.order), [state.templates]);
  const timeFormat = useMemo<TimeFormatOptions>(
    () => ({ language, hour12: resolveHour12(null, browserHourCycle()) }),
    [language],
  );

  // 手勢的回呼讀「最新」的資料，而不是建立當時的快照。
  // 圓形選單的六顆展示球依目前網站語言命名（選單是暫時的，不像種子球名稱要固定）。
  const radialTemplates = useMemo(() => demoRadialBalls(language), [language]);
  const latest = useRef({ days, timeline, radialTemplates, magnetEnabled: state.settings.magnetEnabled });
  useEffect(() => {
    latest.current = { days, timeline, radialTemplates, magnetEnabled: state.settings.magnetEnabled };
  });

  const [ballView, setBallView] = useState<BallDragView>(INITIAL_VIEW);
  const [menu, setMenu] = useState<RadialMenu | null>(null);
  const [draft, setDraft] = useState<MoveDraft | null>(null);

  const { ballDrag, ballPress, radial } = useMemo(() => {
    const ballDrag = createBallDrag({
      // 只有指標真的落在日曆欄上才算（浮在上面的東西不算）。
      timeAt(point: Point) {
        const columns = columnsRef.current;
        if (!columns) return null;
        const target = document.elementFromPoint(point.x, point.y);
        if (!target || !columns.contains(target)) return null;
        const current = latest.current;
        return pointerToTime(point, measureGrid(columns, current.days.length), current.days, current.timeline, {
          magnetEnabled: current.magnetEnabled,
        });
      },
      template: (id) => trialStore.getState().templates[id],
      createEvent: (id, start) => trialStore.createEventFromTemplate(id, start),
      deselect: () => trialStore.select(null),
      viewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
      reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      nextKey: () => Date.now(),
      onChange: setBallView,
    });
    const ballPress = createBallPress(ballDrag);
    const radial = createRadial({
      templates: () => latest.current.radialTemplates,
      viewport: () => ({ width: window.innerWidth, height: window.innerHeight }),
      onMenu: setMenu,
    });
    return { ballDrag, ballPress, radial };
  }, []);

  const eventMove = useMemo(
    () =>
      createEventMove({
        geometry: () => (columnsRef.current ? measureGrid(columnsRef.current, days.length) : null),
        days,
        timeline,
        magnetEnabled: () => latest.current.magnetEnabled,
        select: (id) => trialStore.select(id),
        update: (id, times) => trialStore.updateEvent(id, times),
        onDraft: setDraft,
      }),
    [days, timeline],
  );

  // 把視窗的指標與鍵盤事件接到三個手勢上。卸載時一併停止進行中的手勢（REUSE-05）。
  useEffect(() => {
    const at = (event: PointerEvent): Point => ({ x: event.clientX, y: event.clientY });
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !(event.target instanceof Element) || event.target.closest(RADIAL_BLOCKERS)) return;
      if (!columnsRef.current?.contains(event.target)) return;
      radial.down(event.pointerId, at(event));
    };
    const move = (event: PointerEvent) => {
      radial.move(event.pointerId, at(event));
      ballPress.move(event.pointerId, at(event));
      eventMove.move(event.pointerId, at(event));
    };
    const up = (event: PointerEvent) => {
      radial.up(event.pointerId);
      ballPress.up(event.pointerId, at(event));
      eventMove.up(event.pointerId);
    };
    const cancel = (event: PointerEvent) => {
      radial.cancel();
      ballPress.cancel(event.pointerId);
      eventMove.cancel(event.pointerId);
    };
    const blur = () => {
      radial.cancel();
      ballPress.blur();
      eventMove.destroy();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // 只有進行中的拖曳才接住 Escape，否則交還給一般處理。
      if (eventMove.escape()) {
        event.stopPropagation();
        return;
      }
      radial.escape();
      ballPress.escape();
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', blur);
    window.addEventListener('keydown', key, true);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', blur);
      window.removeEventListener('keydown', key, true);
      radial.destroy();
      ballPress.blur();
      ballDrag.cancel(false);
      eventMove.destroy();
    };
  }, [radial, ballPress, ballDrag, eventMove]);

  // 移動區塊期間，整頁不選字、游標是抓取中。
  useEffect(() => {
    if (!draft) return;
    document.body.classList.add('trial-interacting', 'trial-interacting-move');
    return () => document.body.classList.remove('trial-interacting', 'trial-interacting-move');
  }, [draft]);

  const onPressBall = (press: ReactPointerEvent, templateId: string) => {
    if (press.button !== 0) return;
    ballPress.down(templateId, press.pointerId, { x: press.clientX, y: press.clientY });
  };

  const onPressEvent = (press: ReactPointerEvent, event: TrialEvent) => {
    if (press.button !== 0) return;
    press.stopPropagation();
    eventMove.down(press.pointerId, press.button, { x: press.clientX, y: press.clientY }, event);
  };

  const dragging = ballView.activeId ? state.templates[ballView.activeId] : undefined;

  return (
    <div className="trial-root" data-testid="trial-app">
      <div className="trial-app">
        <Palette templates={templates} draggingId={ballView.activeId} ballAria={copy.trial.app.ballAria} onPress={onPressBall} />
        <main className="trial-main">
          <div className="trial-area">
            <div className="trial-area-inner">
              <CalendarGrid
                scrollerRef={scrollerRef}
                columnsRef={columnsRef}
                days={days}
                timeline={timeline}
                events={state.events}
                selectedEventId={state.selectedEventId}
                droppedEventId={state.droppedEventId}
                ghost={ballView.ghost}
                draft={draft}
                language={language}
                timeFormat={timeFormat}
                hiddenTitles={{ one: copy.trial.app.hiddenOne, many: copy.trial.app.hiddenMany }}
                onPressEvent={onPressEvent}
                onDropAnimationEnd={() => trialStore.clearDropped()}
              />
            </div>
          </div>
        </main>
      </div>
      <BallOverlay template={dragging} view={ballView} />
      <DropSplash splash={ballView.splash} />
      <SplitBurst burst={ballView.burst} />
      <RadialPalette menu={menu} templates={radialTemplates} label={copy.trial.app.radialAria} />
    </div>
  );
}
