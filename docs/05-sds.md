# 05 SDS — Juicy Landing Page

| 項目 | 內容 |
|---|---|
| 版本／狀態 | v0.1 **草稿**（待專案擁有者審查；契約變更時同步更新測試案例） |
| 負責人／審查者 | 專案擁有者（使用者） |
| 日期 | 2026-11-09 |
| 上游 | `docs/04-sad.md` v0.1、`docs/03-srs.md` v0.4（含沿用登記表 `REUSE-nn`）、`docs/02-prd.md` v0.5 |
| 證據標示 | 同 SAD：【碼】讀過基準 commit `102ae1917047aee691e88cef9c497b50df745c41` 的原始碼；【測】測試存在（未執行）；【推】推論；【未】未驗證。型別與函式簽名是設計提案，實作前需對照共用模組實際匯出核對 |
| 命名 | `calendar-kit`、檔案路徑與鍵名皆為占位，**待命名**；不得因此視為已核准的套件或路徑 |

## 目錄

- [資料模型與不變量](#資料模型與不變量)
- [API 契約](#api-契約)
- [UI 與模組契約](#ui-與模組契約)
- [沿用行為的一致性案例](#沿用行為的一致性案例)
- [OR-24 驗證情境](#or-24-驗證情境)
- [變更與未決](#變更與未決)

## 資料模型與不變量

試用資料的生命週期：頁面載入後第一次符合互動資格時，由 `TrialRuntime` 用種子資料初始化共用 store，之後所有變更都由共用模組的 action 產生；重新整理即全部消失。**區塊、復原歷史、選取與剪貼簿快照的欄位與規則由共用模組擁有**（網站只讀、不寫，不另訂規則）；網站只擁有種子資料、設定固定值與網站狀態。

| 欄位 | 型別、格式與可空性 | 預設／約束 | 來源 |
|---|---|---|---|
| DATA-01 `Template.id` | 字串，符合 `^[A-Za-z0-9_-]{1,120}$`；非空 | 占位 `focus`、`rest`、`chore`（待確認） | FR-01；schema【碼】 |
| `Template.name` | 字串；去前後空白後非空，不超過 30 個使用者看到的字元 | 中英並列，**具體名稱待確認**（OR-12）；球名稱不隨介面語言翻譯 | FR-01、FR-10；REUSE-09 |
| `Template.color` | 字串，`#RRGGBB` | 專注藍、休息綠、雜事橘的**色碼待確認**（OR-12） | FR-01 |
| `Template.defaultDuration` | 正數 | 120（建立時 App 固定用 120 分鐘，與此值無關【測】`appStore.test.ts:23`） | REUSE-02 |
| `Template.order` | 數字 | 0、1、2（依序專注、休息、雜事） | FR-01 |
| DATA-02 `Settings.startHour` | 整數 0–23 | 10 | FR-01；REUSE-11 |
| `Settings.endHour` | 整數 0–24 | 15 | 同上 |
| `Settings.pixelsPerMinute` | 數字 0.4–4 | 1（App 預設；網站不開放縮放） | REUSE-01 |
| `Settings.view` | `'week'` 或 `'day'` | `'day'` | FR-01 |
| `Settings.magnetEnabled` | 布林 | `true`（App 預設；網站不開放開關） | REUSE-01 |
| `Settings.inspectorCollapsed` | 布林 | `false`（網站不掛載面板，值無作用） | — |
| DATA-03 `WorkspaceData` | `{ meta, templates, events, settings, issues }` | `meta = { schemaVersion, name:'trial', createdAt: 初始化時的 ISO }`；`templates` = DATA-01 三筆；`events = {}`；`settings` = DATA-02；`issues = []` | FR-01、FR-07；型別【碼】 |
| `hydrate` 的路徑參數 | 字串 | 固定 `'memory:trial'`；只為通過 `pasteCopied` 對 `workspacePath` 的檢查【碼】，不是檔案路徑 | FR-07 |
| DATA-04 網站狀態：`language` | `'zh-TW'` 或 `'en'` | 無保存值 → 依 REUSE-12；有合法保存值 → 該值 | FR-10 |
| 網站狀態：`interactive` | 布林 | 由 `isInteractive()` 與訂閱決定；不保存 | FR-08 |
| 網站狀態：`trialPhase` | `'preview'`、`'loading'`、`'active'`、`'dormant'` | 初始 `'preview'` 或 `'loading'`；不保存 | FR-08 |
| DATA-05 偏好鍵 | `localStorage` 單一鍵，值為 `zh-TW` 或 `en` 的字串 | 鍵名占位 `juicy-site-language`（待確認）；**這是網站唯一寫入瀏覽器儲存的資料** | FR-07、FR-10 |
| DATA-06 `CalendarEvent`（共用模組擁有） | `id`、`templateId`、`title`、`startAt`、`endAt`、`color` | 標題與長度規則見 REUSE-04、REUSE-09；網站不另訂 | REUSE-02～09 |

### 不變量

| ID | 不變量 | 驗證 |
|---|---|---|
| INV-01 | 網站不呼叫任何寫出：不啟動 `startPersistenceSync`；`localStorage` 只出現 DATA-05 的鍵；沒有其他持久儲存；沒有網路請求攜帶區塊標題或時間 | 整合測試：監看 `localStorage.setItem`、`fetch`、`XMLHttpRequest`、`sendBeacon`；人工看網路面板（NFR-01） |
| INV-02 | `TrialRuntime.ensureReady()` 在頁面生命週期內只初始化一次；重新掛載不呼叫 `hydrate` | 單元：重複呼叫，`hydrate` 只呼叫一次 |
| INV-03 | store 的存活期長於介面：卸載介面不改變 `events`、`past`、`future`、`selected*`、`copiedEvents` | 整合：建立區塊 → 休眠 → 重掛載，內容與歷史相同 |
| INV-04 | 復原歷史上限由共用模組擁有（100，REUSE-08）；網站不複製、不覆寫 | 共用層補測試（OR-25）；網站不重測 |
| INV-05 | 初始設定為 DATA-02 固定值；網站的任何 UI 都不修改設定 | 整合：掛載後 `settings` 與 DATA-02 相同；DOM 中不存在工具列、設定頁、編輯面板的 `data-testid` |
| INV-06 | 示範日 = 初始化時的本地今天的 00:00；初始化後不自動更新 | 假時鐘測試（SAD OR-22） |
| INV-07 | 種子球名稱符合名稱規則，三筆資料通過共用模組的 `templateSchema` | 單元：`templateSchema.safeParse` |
| INV-08 | 試用 chunk 只在 `interactive` 為真時被請求 | e2e：觸控模擬環境的網路請求不含試用 chunk（NFR-05） |
| INV-09 | 休眠與卸載後沒有殘留的 `window` 層級快捷鍵或指標監聽，`document.body` 沒有 `is-interacting*` 類別 | 整合：卸載前後比對監聽器登記數（OR-24 N-7、N-14） |
| INV-10 | 網站語言與共用 i18n 語言一致：網站為來源，共用 i18n 單向跟隨 | 整合：切換語言後兩者相同；共用 i18n 的寫入被關閉，避免重複寫入 |
| INV-11 | 鎖定檔中的共用模組版本與 SRS 登記表的基準相同 | CI 比對（實作票決定檢查方式） |
| INV-12 | 輸入被拒絕時資料不變：網站不改變共用模組的拒絕行為，也不新增訊息 | 一致性案例 CONF-04 |

**重試與重複送出**：網站沒有送出動作。`ensureReady()` 失敗後可再呼叫一次；成功後再呼叫直接返回。

## API 契約

**不適用：沒有後端與自有 API。** 網站是靜態站。外部契約如下。

### EXT-01｜GitHub Releases 連結（FR-09）

下載主按鈕與次要連結是**純連結導向**，不呼叫 API、不傳資料。主按鈕：Calendar 的 GitHub Releases「最新版本」頁，網址形如 `https://github.com/<owner>/<repo>/releases/latest`（擁有者與 repo 名稱**待確認**）；免安裝 .zip 與原始碼為同頁或同 repo 的連結。失敗：外部頁面不可用不在本站控制；頁面不顯示連結失效偵測。

### EXT-02｜流量統計（D-03、OR-10 未決）

工具未選。契約限制：不使用跨站追蹤、不寫識別 cookie、不載入廣告；事件內容不得含區塊標題或時間；載入失敗不得影響頁面。「開始試用」何時算：未決。

### EXT-03｜共用模組的取得（D-11 未決）

網站以確切版本依賴共用模組，來源管道未決（SAD P1～P5）。與管道無關的契約：鎖定檔含完整性雜湊；不使用 `latest` 或範圍版本；升級只經升級 PR。

## UI 與模組契約

### 共用模組需提供的介面（Calendar 端改動提案，待確認）

網站只依賴下列介面。所有新增選項的**預設值等於基準行為**，不新增日曆功能。

| ID | 介面 | 契約 |
|---|---|---|
| SHARED-01 | `./engine` | 純函式，不 import store、backend、DOM：`pointerToTime`、`magnetMinutes`、`columnMinutesToDate`、`validateTitle`、`isPastDate`、`detectLanguage`、限制常數 |
| SHARED-02 | `./store` | 單例 `useAppStore`；網站使用 `hydrate(data, path)`、`goToday()`、`undo()`、`redo()`、`select`、`createEventFromTemplate`、`updateEvent`、`deleteSelected`、`setEditing`；不 import 桌面 backend 或 Tauri【碼：目前成立】 |
| SHARED-03 | `./ui` | `CalendarWorkbench`（S4，具名插槽）、`TemplateBall`（`onEdit` 可省略，S3）、`RadialPalette`、`useKeyboardShortcuts(columnsRef, enabled, options?)` 其中 `options.scope` 預設 `window`（S6） |
| SHARED-04 | `./i18n` | `initLanguage(backend, navigatorLanguages)`、`setLanguage(lang, backend)`、`useT`、字典；模組載入時不引入預設 backend（S2）。**簽章細節實作前以實際原始碼核對**【碼：目前 `initLanguage` 已接受傳入 backend】 |
| SHARED-05 | `./styles` | 元件樣式與主題 token，以容器類別為作用域；不含 `body`、`#root` 的全域重置（S5） |
| SHARED-06 | 一致性案例 | 資料驅動案例（見下一節）隨套件發布，網站執行 |

### MOD-01｜`interactiveGate`（FR-08）

```ts
export const INTERACTIVE_QUERY = '(pointer: fine) and (hover: hover)';
export type MatchMediaFn = (query: string) => MediaQueryList;

/** 缺少 matchMedia 或呼叫拋例外 → false。不看裝置、作業系統、寬度、瀏覽器名稱或版本。 */
export function isInteractive(matchMedia?: MatchMediaFn): boolean;

/** 立即不呼叫 onChange；之後每次查詢結果改變時呼叫。回傳取消訂閱函式。 */
export function subscribeInteractive(onChange: (value: boolean) => void, matchMedia?: MatchMediaFn): () => void;
```

`matchMedia` 參數預設為 `window.matchMedia`，測試可注入假的 `MediaQueryList`（`matches` 與 `change` 事件）。`pointer` 與 `hover` 反映主要輸入【推】；是否在所有目標瀏覽器行為一致**【未】未驗證**。

### MOD-02｜`TrialLoader`（FR-08、NFR-05）

- 輸入：`interactive`、`language`。輸出：`preview`、`loading`、`active`、`dormant` 四種 `trialPhase` 之一的畫面。
- `interactive` 由假變真：若 `ensureReady` 尚未成功，動態 import 試用 chunk → `ensureReady()`；成功 → 掛載 `TrialShell`。
- `interactive` 由真變假：卸載 `TrialShell`（不呼叫 `reset`），`trialPhase = dormant`，顯示靜態預覽。
- 載入或初始化失敗：`trialPhase = preview`，不重試迴圈；`interactive` 再次由假變真時允許重試一次。失敗專用文案**無需求依據，待確認**。
- 競態：載入中 `interactive` 又變假 → 載入完成後不掛載；同一時間最多一個進行中的載入（INV-02）。

### MOD-03｜`TrialRuntime` 與種子（FR-01、FR-07）

```ts
export function buildTrialWorkspace(now: Date): WorkspaceData;       // DATA-03；純函式，不讀系統時鐘
export function ensureReady(deps: { now: () => Date; languageBackend: LanguageBackend; navigatorLanguages: readonly string[] }): Promise<void>;
```

`ensureReady` 的步驟（任何一步拋例外 → 整體拒絕，不留下半初始化狀態）：
1. 若已成功初始化，直接返回（INV-02）。
2. `initLanguage` 的結果與網站語言一致（INV-10）：以網站目前語言呼叫共用 `setLanguage`，後端為 **不寫入** 的包裝。
3. `useAppStore.getState().hydrate(buildTrialWorkspace(now()), 'memory:trial')`。
4. `useAppStore.getState().goToday()`（`hydrate` 不重設 `anchor`【碼】，所以需要這一步；`now()` 由假時鐘控制，見 SAD OR-22）。
5. 標記已初始化。

不呼叫 `startPersistenceSync`、`restoreLastWorkspace`、`selectWorkspace`。

### MOD-04｜`SiteLanguage` 與 `webLanguageBackend`（FR-10）

```ts
type LanguageBackend = {
  readAppSettings(): Promise<{ language: 'zh-TW' | 'en' | null }>;
  writeAppSettings(settings: { language: 'zh-TW' | 'en' }): Promise<void>;
  systemInfo(): Promise<{ locale: null; hour12: null }>;   // 網站沒有系統語系
};
```

- `readAppSettings`：讀 DATA-05；值不是 `zh-TW` 或 `en` → `null`；存取 `localStorage` 拋例外 → `null`。
- `writeAppSettings`：寫 DATA-05；拋例外 → 吞掉，不顯示訊息，本次工作階段語言仍生效（OR-09 提案，待確認）。
- 初始語言 = 保存值，否則 `detectLanguage(null, navigator.languages)`（REUSE-12：`zh` 開頭 → 繁中，其餘 → 英文，取第一項；專案擁有者已接受沿用，未經執行驗證）。
- `setLanguage(lang)`：更新網站狀態 → 寫入 DATA-05 → 若共用 i18n 已載入，呼叫其 `setLanguage(lang, 不寫入的包裝)`。
- 網站字典與共用字典是兩份；**網站字典完整性檢查**：`zh-TW` 與 `en` 的鍵集合相同，且沒有空字串（NFR-02）。共用字典的完整性由 Calendar 端負責【測】`i18n/dictionary.test.ts`。
- 使用者資料（區塊標題，含複製自球名稱的預設標題）與種子球名稱**不經過任何字典**，也不在完整性檢查範圍（FR-10）。

### MOD-05｜`TrialShell`（FR-01、FR-02）

組裝：`CalendarWorkbench` 的插槽只填 日曆、球列（`TemplateBall` 三顆，`onEdit` 省略）、拖曳覆蓋層，以及（待確認，暫定）`RadialPalette`；快捷鍵 `scope` 為試用容器（S6）。不掛載：工具列、編輯面板、設定頁、通知、工作區名稱與切換、新增球按鈕。右鍵選單、框選、剪貼簿由日曆元件內建，保留（REUSE-10）。

### UI-01｜頁面結構（NFR-04、NFR-07）

順序：頁首（語言切換）→ 試用區（標題、一行說明「試用內容不會上傳，重新整理頁面就會消失」、試用或靜態預覽）→ 下載區 → 頁尾。
- 版面不看裝置：桌機接滑鼠縮到手機寬度仍顯示互動試用；日曆單欄加球列的最小寬度需實測（基準的球列寬 104 像素，時間軸欄 80 像素，日欄最小 84 像素【碼】，合計約 268 像素；是否容得下待實測【未】）。
- 頁面沒有水平捲動；下載區可抵達。
- 網站自己的控制項（語言切換、下載連結、頁尾連結）可用鍵盤操作並有可辨識名稱；圖片有替代文字。

### UI-02｜試用區（FR-01、FR-02、FR-07）

- 內容與規則由共用模組決定；網站不加任何日曆控制項，不顯示狀態訊息區。
- 說明文字（含「試用內容不會上傳…」）隨網站語言，由網站字典提供。
- 試用容器需能接收焦點（`tabIndex=-1`），作為快捷鍵 `scope`（S6，待確認）。
- 失敗回饋：見 SAD「故障模式」。

### UI-03｜靜態預覽（FR-08）

圖（繁中版與英文版）、替代文字、圖下說明（繁中：「將球拖進日曆，即可建立時間區塊。請使用電腦及滑鼠體驗互動試用。」，英文版文字待定）、「產品預覽」標示，皆隨網站語言。圖是實際運作的試用介面截圖：單日 10:00–15:00、三顆球、一個 10:00–12:00 區塊；**互動版完成前不製作**，也不放仿真圖（R-13、OR-14）。不可拖曳或點擊；不載入試用模組。

### UI-04｜下載區（FR-09）

主按鈕「下載 Windows 版」→ EXT-01；次要：免安裝 .zip、原始碼。顯示：僅支援 Windows 10 1803 以上 64 位元、需要 WebView2、未簽章與 SmartScreen 處理、網頁試用為瀏覽器版、桌面 App 離線且無帳號。每項敘述對應 Calendar 文件來源（NFR-03，人工）。所有訪客相同。

### UI-05｜頁尾（FR-15）

`LICENSE`、`TRADEMARKS.md` 兩個連結，文字隨網站語言；目標取決於 D-10 與 repo 是否公開，公開上線前才能完整驗收。

### UI-06｜語言切換（FR-10）

兩個選項（繁體中文、English）；切換立即更新網站文字、試用區介面文字、靜態預覽圖與說明；選擇保存見 MOD-04。

### 磁吸換算表（AC-01.1、REUSE-01；預設縮放，每分鐘 1 像素）

建立（球放開）時，指標位置相對可見範圍起點（10:00）的分鐘數 `raw` → 起點時間。規則【碼】：`nearest = round(raw/30) × 30`；若 `|nearest − raw| × 1 ≤ 8` 則取 `nearest`，否則取 `round(raw)`（.5 進位）。

| raw（分鐘） | 與最近半點線距離 | 起點 |
|---|---|---|
| 0 | 0 | 10:00 |
| 8 | 8 | 10:00（吸附） |
| 8.4 | 8.4 | 10:08 |
| 15 | 15 | 10:15 |
| 21 | 9 | 10:21 |
| 21.5 | 8.5 | 10:22 |
| 22 | 8 | 10:30（吸附） |
| 30 | 0 | 10:30 |
| 38 | 8 | 10:30（吸附） |
| 38.5 | 8.5 | 10:39 |
| 39 | 9 | 10:39 |

移動與調整長度：被拖曳的邊緣先由指標換成整分鐘，再判斷磁吸，因此上表的邊界（距離恰為 8）可能差約 0.5 分鐘，測試應避開恰好 8 像素的值。此表是引擎單元測試的預期值，來源為原始碼推算，**尚未執行驗證**（OR-25）。

## 沿用行為的一致性案例

目的：AC-01.16「同一組操作序列，網站與固定版本的共用模組結果相同」。案例是**資料**，放在共用模組，Calendar CI 與網站 CI 對同一版本各執行一次。層級是 store／引擎 API，不經 DOM，避免重測全部引擎；少量 UI 冒煙案例另列於網站 e2e。

```ts
type Ref = `$${number}`;                 // 第 n 個建立的區塊（id 由 store 產生）
type Step =
  | { op: 'create'; templateId: string; start: string }            // createEventFromTemplate
  | { op: 'update'; ref: Ref; patch: { title?: string; startAt?: string; endAt?: string } }
  | { op: 'select'; refs: Ref[] }
  | { op: 'deleteSelected' } | { op: 'undo' } | { op: 'redo' };
type ConformanceCase = {
  id: string; source: string[];          // 對應 REUSE-nn
  setup: { settings: Settings; templates: Template[]; anchor: string; events: CalendarEvent[] };
  steps: Step[];
  expect: { events: { ref: Ref; title: string; startAt: string; endAt: string; color: string }[];
            pastLength: number; futureLength: number; selected: Ref[] };
};
```

| ID | 內容 | 來源 |
|---|---|---|
| CONF-01 | 建立 10:30 → 終點 13:00 → 命名「寫 PRD」；結果 10:30–13:00、標題、球色 | AC-01.1、REUSE-02～04、09 |
| CONF-02 | 建立 → 移動 → 命名 → 刪除 → 復原 ×4 → 重做 → 新操作清除重做 | AC-01.10、REUSE-08 |
| CONF-03 | 沒有選取時 `deleteSelected`：事件與 `pastLength` 不變 | AC-01.9、REUSE-07 |
| CONF-04 | 命名為空、只有空白、31 字：標題不變、`pastLength` 不變、無例外 | INV-12、REUSE-09 |
| CONF-05 | 命名為相同內容：不佔步 | REUSE-09 |
| CONF-06 | 連續 101 個變更：`pastLength` 為 100 | REUSE-08（OR-25，需共用層先補測） |
| CONF-07 | 調整長度到 1 分鐘（允許）與超過 10080 分鐘（夾住） | REUSE-04 |
| CONF-08 | 起點 14:30 建立：終點 16:30 被保存（區塊可延伸到可見範圍外） | REUSE-02、REUSE-11 |
| CONF-09 | 多選刪除一步，復原全部回來 | REUSE-07、REUSE-10 |
| CONF-10 | 複製貼上（`workspacePath` 為 `'memory:trial'`）產生副本且為一步 | REUSE-10 |
| ENG-MAG | 上方磁吸換算表逐列 | REUSE-01 |

案例的預期值**來自 Calendar 基準的行為**，由 Calendar 端先在基準上執行確認後才成為預期值；本草稿的預期值是由原始碼推算，尚未執行。

## OR-24 驗證情境

沿用 App 命名提交行為（REUSE-09：Enter、失焦或點別處提交，Escape 取消，卸載時提交輸入內容，`cancelled` 為真時不提交）。下列是網站端接入後要驗證的情境；「預期」欄是依程式碼推論，**以實際執行結果為準**，不一致時回報專案擁有者，不由網站修正。

| ID | 情境 | 預期（推論） | 層 |
|---|---|---|---|
| N-1 | 命名中、文字已改，介面因失去互動資格卸載 | 標題被提交，一個歷史步驟 | E |
| N-2 | 命名中、文字未改，卸載 | 無步驟 | E |
| N-3 | 命名中輸入空白或 31 字，卸載 | 標題不變，無訊息，無步驟 | E |
| N-4 | 按 Escape 取消後卸載 | 不提交 | E |
| N-5 | 卸載後重新掛載：`editingEventId` 是否殘留使區塊再度進入編輯 | 未知；記錄實際結果，若殘留視為 App 狀態殘留，是否由網站在卸載時呼叫 `setEditing(null)` **待確認** | E |
| N-6 | 命名進行中恢復互動資格（輸入欄焦點） | 記錄 | E |
| N-7 | 移動或調整長度的拖曳中卸載 | 事件不變；`is-interacting*` 類別被移除；`window` 監聽器歸零（hook 有卸載清理【碼】） | E |
| N-8 | 球拖曳中卸載 | 不建立區塊；拖曳覆蓋層不殘留；dnd-kit 感測器清理（只讀到 `stopLoop` 與 blur 處理，部分【未】） | E |
| N-9 | （radial 保留時）長按計時器或選單開啟時卸載 | 計時器與選單被清除【未】 | E |
| N-10 | 右鍵選單開啟時卸載後重掛載 | 選單不殘留 | E |
| N-11 | 卸載前後的選取與剪貼簿快照 | 保留（store 擁有）；記錄 | E |
| N-12 | 卸載後重掛載，復原與重做 | 歷史仍在；不重測 100 步上限 | E |
| N-13 | 輸入能力在短時間內反覆切換十次 | 不重複請求 chunk；只 `hydrate` 一次；監聽器數不累積 | E |
| N-14 | 載入中變成不符合 | 不掛載、不初始化 | E |

層欄：E＝網站整合測試。共用層需要補的測試見 SAD 的 OR-25 要求。

## 變更與未決

**相容性**：全新專案，無既有資料或 API；沒有遷移。語言偏好值域固定，未知值視為未設定。對 Calendar 的相容性要求：S1～S7 的所有新選項預設等於基準行為，桌面 App 既有測試不改即通過（尚未執行）。

**會影響實作、需先定案的未決契約**：

| 項目 | 狀態 |
|---|---|
| SHARED-03 的 `CalendarWorkbench` 與 `scope`（ADR-03、ADR-04） | 待確認；有後備方案 |
| `TemplateBall` 的 `onEdit` 可省略（S3）；新增／編輯球保留或排除（OR-20） | 待確認；暫定排除 |
| radial 選單保留或排除（OR-20） | 待確認；暫定保留 |
| 種子球名稱與色碼（OR-12） | 待確認 |
| EXT-01 的 owner／repo | 待確認 |
| EXT-03 發布管道（OR-21、D-11） | 未核准 |
| DATA-05 鍵名；MOD-04 儲存失敗降級（OR-09） | 提案，待確認 |
| 失敗文案（TrialLoader） | 無需求依據，待確認 |
| EXT-02 統計事件（D-03、OR-10） | 未決，只影響統計 |

> 審查重點：欄位、介面與錯誤行為可直接實作；網站不新增 App 沒有的日曆功能；沿用行為都能對到基準 commit；測試者可據此建立獨立預期；預期值來自推算者已標示尚未執行。
