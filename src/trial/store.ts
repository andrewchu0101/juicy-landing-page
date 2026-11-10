// 試用區的記憶體資料（FR-07）：區塊、球、設定、選取。只存在這個物件裡，不碰 localStorage、不送出網路請求。
// 行為沿用 Calendar 的 appStore 中試用區用到的部分：建立（REUSE-02）、更新時間、選取（REUSE-06）。
// 復原／重做、命名、刪除、多選、剪貼簿在試用區暫不開放（專案擁有者 2026-11-11：留到下載後體驗）。
import { buildTrialWorkspace, type TrialSettings, type TrialTemplate, type TrialWorkspace } from './buildTrialWorkspace';
import { newEventTimes, type EventTimes } from './engine/mutations';
import type { TrialStorePort } from './trialRuntime';

export type TrialEvent = {
  id: string;
  templateId: string;
  title: string;
  color: string;
  startAt: string;
  endAt: string;
};

export type TrialState = {
  /** 示範日：初始化時的本地今天。 */
  anchor: string;
  settings: TrialSettings;
  templates: Record<string, TrialTemplate>;
  events: Record<string, TrialEvent>;
  selectedEventId: string | null;
  /** 剛放下的區塊，用來播放一次落下動畫。 */
  droppedEventId: string | null;
};

export type TrialStore = TrialStorePort & {
  getState(): TrialState;
  subscribe(listener: () => void): () => void;
  createEventFromTemplate(templateId: string, start: Date): string | null;
  updateEvent(id: string, times: EventTimes): boolean;
  select(id: string | null): void;
  clearDropped(): void;
};

export function createTrialStore(deps: { now: () => Date }): TrialStore {
  const empty = buildTrialWorkspace(deps.now());
  let state: TrialState = {
    anchor: deps.now().toISOString(),
    settings: empty.settings,
    templates: {},
    events: {},
    selectedEventId: null,
    droppedEventId: null,
  };
  const listeners = new Set<() => void>();
  let counter = 0;

  const set = (next: Partial<TrialState>) => {
    state = { ...state, ...next };
    for (const listener of [...listeners]) listener();
  };

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hydrate(data: TrialWorkspace) {
      set({
        settings: data.settings,
        templates: Object.fromEntries(data.templates.map((template) => [template.id, template])),
        events: {},
        selectedEventId: null,
        droppedEventId: null,
      });
    },
    goToday() {
      set({ anchor: deps.now().toISOString() });
    },
    createEventFromTemplate(templateId, start) {
      const template = state.templates[templateId];
      if (!template) return null;
      counter += 1;
      const event: TrialEvent = {
        id: `evt-${counter}`,
        templateId,
        title: template.name,
        color: template.color,
        ...newEventTimes(start),
      };
      set({ events: { ...state.events, [event.id]: event }, selectedEventId: null, droppedEventId: event.id });
      return event.id;
    },
    updateEvent(id, times) {
      const event = state.events[id];
      if (!event) return false;
      if (event.startAt !== times.startAt || event.endAt !== times.endAt) {
        set({ events: { ...state.events, [id]: { ...event, ...times } } });
      }
      return true;
    },
    select(id) {
      if (state.selectedEventId !== id) set({ selectedEventId: id });
    },
    clearDropped() {
      if (state.droppedEventId !== null) set({ droppedEventId: null });
    },
  };
}
