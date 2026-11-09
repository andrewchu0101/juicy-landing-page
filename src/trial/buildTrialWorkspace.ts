// MOD-03：buildTrialWorkspace（DATA-01～03）。純函式，不讀系統時鐘。
// 注意：WorkspaceData 的正式型別與 templateSchema 由共用模組擁有（尚未可取得，見 issue 005 Blocked by）；
// 這裡的本地型別只是暫時的結構描述，接入共用模組後改為匯入。
// 種子名稱與色碼是占位（OR-12 待確認），不代表正式內容。
export type TrialSettings = {
  startHour: number;
  endHour: number;
  pixelsPerMinute: number;
  view: 'week' | 'day';
  magnetEnabled: boolean;
  inspectorCollapsed: boolean;
};

export type TrialTemplate = {
  id: string;
  name: string;
  color: string;
  defaultDuration: number;
  order: number;
};

export type TrialWorkspace = {
  meta: { name: 'trial'; createdAt: string };
  templates: TrialTemplate[];
  events: Record<string, never>;
  settings: TrialSettings;
  issues: never[];
};

export function buildTrialWorkspace(now: Date): TrialWorkspace {
  return {
    meta: { name: 'trial', createdAt: now.toISOString() },
    templates: [
      { id: 'focus', name: '專注 Focus', color: '#3B82F6', defaultDuration: 120, order: 0 },
      { id: 'rest', name: '休息 Rest', color: '#22C55E', defaultDuration: 120, order: 1 },
      { id: 'chore', name: '雜事 Chore', color: '#F97316', defaultDuration: 120, order: 2 },
    ],
    events: {},
    settings: {
      startHour: 10,
      endHour: 15,
      pixelsPerMinute: 1,
      view: 'day',
      magnetEnabled: true,
      inspectorCollapsed: false,
    },
    issues: [],
  };
}
