// MOD-03：buildTrialWorkspace（DATA-01～03）。純函式，不讀系統時鐘。
// 注意：WorkspaceData 的正式型別與 templateSchema 由共用模組擁有（尚未可取得，見 issue 005 Blocked by）；
// 這裡的本地型別只是暫時的結構描述，接入共用模組後改為匯入。
// 種子名稱與色碼是正式內容（OR-12 已決，專案擁有者 2026-11-13：網站上現有的就是正式）；色碼用 Calendar 柔和色票的 Sky、Sage、Peach。
import type { SiteLanguage } from '../site/webLanguageBackend';

export type TrialSettings = {
  startHour: number;
  endHour: number;
  pixelsPerMinute: number;
  /** 可見的日期欄數：專案擁有者 2026-11-11 決定三天（每天 10:00–15:00，共 15 小時），不開放到一週。 */
  visibleDays: number;
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

// 種子球名稱：中文版是中英並列，英文版純英文（專案擁有者 2026-11-11）。名稱在初始化時決定，之後切換網站語言不會改名，
// 因為球名是使用者資料（FR-10）；重新整理後依當時的語言重新決定。
const SEED_NAMES: Record<SiteLanguage, readonly [string, string, string]> = {
  'zh-TW': ['專注 Focus', '休息 Rest', '雜事 Chore'],
  en: ['Focus', 'Rest', 'Chore'],
};

export function buildTrialWorkspace(now: Date, language: SiteLanguage = 'zh-TW'): TrialWorkspace {
  const [focus, rest, chore] = SEED_NAMES[language];
  return {
    meta: { name: 'trial', createdAt: now.toISOString() },
    templates: [
      { id: 'focus', name: focus, color: '#83B9D0', defaultDuration: 120, order: 0 },
      { id: 'rest', name: rest, color: '#A9C98D', defaultDuration: 120, order: 1 },
      { id: 'chore', name: chore, color: '#E9B96E', defaultDuration: 120, order: 2 },
    ],
    events: {},
    settings: {
      startHour: 10,
      endHour: 15,
      pixelsPerMinute: 1,
      visibleDays: 3,
      magnetEnabled: true,
      inspectorCollapsed: false,
    },
    issues: [],
  };
}
