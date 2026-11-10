// 試用區的互動常數。數字與規則沿用 Juicy Calendar v0.2.0-beta.3（固定 commit 102ae1917047aee691e88cef9c497b50df745c41）的
// src/features/calendar/engine/limits.ts；專案擁有者 2026-11-11 決定不修改 Calendar，所以網站自己實作同樣的純函式，
// 不 import Calendar、不新增套件。Calendar 日後改了這些值，網站不會自動跟上：以 tests/trialEngine.test.ts 的人工算例與
// `npm run check:calendar-release` 發現新版後，由人工比對並更新（SRS 沿用登記表）。
export const EVENT_MIN_MINUTES = 1;
export const NEW_EVENT_MINUTES = 120;
export const RADIAL_LONG_PRESS_MS = 250; // 長按空白處叫出 radial 選單（PRD AC-01.4）
export const RADIAL_MOVE_TOLERANCE_PX = 6; // 長按期間移動超過此距離即取消
export const RADIAL_ENTER_MS = 120; // 選單球向外滑出的進場動畫

/** 按下後移動超過這個距離才算拖曳，所以單擊與雙擊不會移動區塊或球（Calendar 的 PointerSensor／DRAG_THRESHOLD）。 */
export const BALL_DRAG_THRESHOLD_PX = 4;
export const EVENT_DRAG_THRESHOLD_PX = 4;

export const GUTTER_WIDTH_PX = 80; // 時間軸欄
export const MIN_COLUMN_WIDTH_PX = 84; // 日期欄的最小寬度
