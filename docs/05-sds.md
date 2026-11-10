# 05 SDS — Juicy Landing Page

| 項目 | 內容 |
|---|---|
| 版本／狀態 | v0.2 **草稿**（2026-11-11 修訂：試用改為網站自有實作；待專案擁有者審查；契約變更時同步更新測試案例） |
| 負責人／審查者 | 專案擁有者（使用者） |
| 日期 | 2026-11-09（初版）、2026-11-11（修訂） |
| 上游 | `docs/04-sad.md` v0.1、`docs/03-srs.md` v0.5（含沿用登記表 `REUSE-nn`）、`docs/02-prd.md` v0.5 |
| 證據標示 | 同 SAD：【碼】讀過基準 commit `102ae1917047aee691e88cef9c497b50df745c41` 的原始碼；【測】測試存在（未執行）；【推】推論；【未】未驗證。型別與函式簽名以 `src/trial/` 的實作為準（2026-11-11 起網站自有實作，不再對照共用模組匯出） |
| 命名 | 試用的實作在 `src/trial/`（`engine/`、`gestures/`、`store.ts`、`ui/`、`trial.css`）。`calendar-kit` 與共用模組不再採用（2026-11-11 專案擁有者決定不修改 Calendar、不新增套件；ADR-03 選 B、ADR-04 選 B） |

## 目錄

- [資料模型與不變量](#資料模型與不變量)
- [API 契約](#api-契約)
- [UI 與模組契約](#ui-與模組契約)
- [沿用行為的一致性案例](#沿用行為的一致性案例)
- [OR-24 驗證情境](#or-24-驗證情境)
- [變更與未決](#變更與未決)

## 資料模型與不變量

試用資料的生命週期：頁面載入後第一次符合互動資格時，由 `TrialRuntime` 用種子資料初始化網站自己的記憶體 store（`src/trial/store.ts`），之後所有變更都由該 store 的 action 產生；重新整理即全部消失。**區塊與選取的欄位與規則由網站 store 擁有**，規則對齊沿用登記表（REUSE-nn）；復原歷史與剪貼簿暫不開放（2026-11-11）。網站擁有種子資料、設定固定值、區塊資料與網站狀態。

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
| `hydrate` 的路徑參數 | 字串 | 固定 `'memory:trial'`（`TrialStorePort` 介面保留此參數；網站 store 不使用它，也不是檔案路徑） | FR-07 |
| DATA-04 網站狀態：`language` | `'zh-TW'` 或 `'en'` | 無保存值 → 依 REUSE-12；有合法保存值 → 該值 | FR-10 |
| 網站狀態：`interactive` | 布林 | 由 `isInteractive()` 與訂閱決定；不保存 | FR-08 |
| 網站狀態：`trialPhase` | `'preview'`、`'loading'`、`'active'`、`'dormant'` | 初始 `'preview'` 或 `'loading'`；不保存 | FR-08 |
| DATA-05 偏好鍵 | `localStorage` 單一鍵，值為 `zh-TW` 或 `en` 的字串 | 鍵名占位 `juicy-site-language`（待確認）；**這是網站唯一寫入瀏覽器儲存的資料** | FR-07、FR-10 |
| DATA-06 `TrialEvent`（網站 store 擁有） | `id`、`templateId`、`title`、`color`、`startAt`、`endAt` | 建立時標題複製球名稱、顏色為球色、長度 120 分鐘（REUSE-02）；移動時長度不變（REUSE-03）；命名與調整長度暫不開放 | REUSE-02、03 |

### 不變量

| ID | 不變量 | 驗證 |
|---|---|---|
| INV-01 | 網站不呼叫任何寫出：沒有任何持久化機制；`localStorage` 只出現 DATA-05 的鍵；沒有其他持久儲存；沒有網路請求攜帶區塊標題或時間 | 整合測試：監看 `localStorage.setItem`、`fetch`、`XMLHttpRequest`、`sendBeacon`；人工看網路面板（NFR-01）。2026-11-11 瀏覽器實測：操作後 `localStorage` 為空、沒有跨來源請求（不是人工驗收） |
| INV-02 | `TrialRuntime.ensureReady()` 在頁面生命週期內只初始化一次；重新掛載不重新初始化 store（不清掉訪客已放的區塊） | 單元：重複呼叫，`hydrate` 只呼叫一次（`tests/trialRuntime.test.ts`） |
| INV-03 | store 的存活期長於介面：卸載介面不改變 `events`、`selectedEventId` | 整合：建立區塊 → 休眠 → 重掛載，內容相同（尚未寫自動化測試） |
| INV-04 | **已更改決定（2026-11-11）：復原／重做暫不開放，本項不適用**（原：復原歷史上限由共用模組擁有） | — |
| INV-05 | 初始設定為 DATA-02 固定值；網站的任何 UI 都不修改設定 | 整合：掛載後 `settings` 與 DATA-02 相同；排除的控制項（日期切換、檢視切換、起訖時間、磁吸開關、縮放、設定入口與設定頁、右側編輯面板、工作區名稱與切換、通知列）**實際未渲染**：以角色與可及名稱（中英兩版）查詢數量為 0、不存在於 DOM（不是 `hidden`、`display:none`、`aria-hidden`、離螢幕或 `disabled` 的殘留）、試用區內 Tab 走訪不含這些項目；`data-testid` 只可作輔助（見 `docs/06-test-plan.md` TC-01f） |
| INV-06 | 示範日 = 初始化時的本地今天的 00:00；初始化後不自動更新 | 假時鐘測試（SAD OR-22） |
| INV-07 | 種子球名稱符合名稱規則（去前後空白後非空、不超過 30 個使用者看到的字元），色碼為 `#RRGGBB` | 單元（尚未寫；網站沒有 schema 驗證，種子是常數） |
| INV-08 | 試用 chunk 只在 `interactive` 為真時被請求 | e2e：觸控模擬環境的網路請求不含試用 chunk（NFR-05） |
| INV-09 | 休眠與卸載後沒有殘留的 `window` 層級指標或鍵盤監聽、長按計時器，`document.body` 沒有 `trial-interacting*` 類別 | 手勢狀態機有 `destroy`（`tests/trialGestures.test.ts` 驗長按計時器被清除）；監聽器登記數與 body 類別的整合測試尚未寫（OR-24 N-7、N-14） |
| INV-10 | 試用區的語言與網站語言一致：試用區直接讀網站語言（`useSiteLanguage`），沒有第二份語言狀態 | `tests/trialApp.test.tsx`（zh-TW 與 en 的球標籤） |
| INV-11 | **已更改決定（2026-11-11）**：沒有共用模組版本可比對，本項不再需要（套件鎖定見 `tests/lockfileGuard.test.ts`） | — |
| INV-12 | 輸入被拒絕或取消時資料不變：Escape 或在日曆外放開不建立也不移動，不顯示訊息（命名暫不開放） | `tests/trialGestures.test.ts` |

**重試與重複送出**：網站沒有送出動作。`ensureReady()` 失敗後可再呼叫一次；成功後再呼叫直接返回。

## API 契約

**不適用：沒有後端與自有 API。** 網站是靜態站。外部契約如下。

### EXT-01｜GitHub Releases 連結（FR-09）

下載主按鈕與次要連結是**純連結導向**，不呼叫 API、不傳資料。主按鈕（2026-11-11 專案擁有者決定改為直接下載）：Calendar GitHub Release 固定 tag 的資產，網址形如 `https://github.com/andrewchu0101/juicy-calendar/releases/download/<tag>/<檔名>`；GitHub 的 `/releases/latest` 不含預發行版且檔名帶版本號，無法直連「最新」，所以 tag 與檔名是兩個設定常數，Calendar 發新版時須更新。免安裝 .zip 目前是同一個檔案；原始碼為 repo 首頁連結。失敗：外部頁面不可用不在本站控制；頁面不顯示連結失效偵測。

### EXT-02｜流量統計（D-03、OR-10 未決）

工具未選。契約限制：不使用跨站追蹤、不寫識別 cookie、不載入廣告；事件內容不得含區塊標題或時間；載入失敗不得影響頁面。「開始試用」何時算：未決。

### EXT-03｜共用模組的取得（已更改決定，2026-11-11：不再適用）

試用不依賴共用模組（專案擁有者 2026-11-11 決定不修改 Calendar、不新增套件），所以沒有取得管道、發布流程或憑證。網站自己的套件依賴以確切版本與鎖定檔完整性雜湊管控（`tests/lockfileGuard.test.ts`）。原 SAD P1～P5 保留為決策紀錄。

## UI 與模組契約

### 試用區的內部模組（網站自有實作，2026-11-11）

取代原「共用模組需提供的介面」（SHARED-01～06，已更改決定）。規則與外觀對齊 Calendar 固定 commit，由網站自己實作；不 import Calendar、不新增套件。

| ID | 位置 | 契約 |
|---|---|---|
| TRIAL-01 | `src/trial/engine/` | 純函式，不 import React、store、DOM：`pointerToTime`、`magnetMinutes`、`columnMinutesToDate`、`radialRing`／`radialBalls`／`radialStep`、`layoutSegments`、`hiddenEventCounts`、`newEventTimes`、`moveEvent`、限制常數。沿用登記表的規則（REUSE-01～03、11） |
| TRIAL-02 | `src/trial/store.ts`、`trialStore.ts` | 網站自己的記憶體 store：`hydrate`、`goToday`、`createEventFromTemplate`、`updateEvent`、`select`、`clearDropped`、`subscribe`；`trialStore.ts` 是模組層單例。不碰 `localStorage`，不送出網路請求 |
| TRIAL-03 | `src/trial/gestures/` | 不依賴 DOM 的手勢狀態機：`createBallDrag`、`createBallPress`、`createRadial`、`createEventMove`。時間解析、計時器、回呼由呼叫端注入，所以可用單元測試驗證 |
| TRIAL-04 | `src/trial/ui/`、`format.ts`、`color.ts` | React 元件（`TrialApp`、`CalendarGrid`、`EventBlock`、`Palette`、`Overlays`）與顯示用的時間、顏色函式；把視窗的指標與鍵盤事件接到 TRIAL-03 |
| TRIAL-05 | `src/trial/trial.css` | 樣式逐項對應 Calendar 的 `index.css` 與各元件的 Tailwind 類別，限定在 `.trial-root` 內；隨試用 chunk 載入（NFR-05） |
| TRIAL-06 | `tests/conformance/cases.ts` | 一致性案例資料；執行器改接 TRIAL-01、TRIAL-02（尚未接入，見 issue 009） |
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
export function buildTrialWorkspace(now: Date): TrialWorkspace;   // DATA-03；純函式，不讀系統時鐘
export function createTrialRuntime(deps: { store: TrialStorePort; now: () => Date }): { ensureReady(): Promise<void> };
```

`ensureReady` 的步驟（任何一步拋例外 → 整體拒絕，不留下半初始化狀態）：
1. 若已成功初始化，直接返回（INV-02）。
2. `store.hydrate(buildTrialWorkspace(now()), 'memory:trial')`。
3. `store.goToday()`（以注入的 `now` 取得示範日，見 SAD OR-22）。
4. 標記已初始化。

試用區的語言直接讀網站語言（INV-10），不需要另外初始化第二份 i18n。沒有任何儲存介面或持久化機制可呼叫。
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
- `setLanguage(lang)`：更新網站狀態 → 寫入 DATA-05。試用區讀同一個網站語言，沒有第二份語言狀態需要同步。
- 網站字典（含試用區 App 的介面文字 `trial.app.*`：球的拖曳說明、圓形選單說明、+N 徽章說明）的完整性檢查：`zh-TW` 與 `en` 的鍵集合相同，且沒有空字串（NFR-02）。星期用瀏覽器內建的 `Intl`，時間格式沿用 Calendar 的 `formatTime`（12 或 24 小時跟瀏覽器的 `hourCycle`）。
- 使用者資料（區塊標題，含複製自球名稱的預設標題）與種子球名稱**不經過任何字典**，也不在完整性檢查範圍（FR-10）。

### MOD-05｜`TrialShell`（FR-01、FR-02）

`TrialApp`（`src/trial/ui/TrialApp.tsx`）自己組裝：球列（三顆球，名稱是純文字）、單日日曆（日期欄標題、時間軸、半小時與整點線、現在線、區塊、落點預覽、拖曳時的時間與長度提示）、跟著指標的球與回饋（水珠、粒子）、圓形選單。視窗層級的 `pointerdown`、`pointermove`、`pointerup`、`pointercancel`、`blur`、`keydown`（只處理 Escape）接到 TRIAL-03 的狀態機；卸載時一併停止進行中的手勢（REUSE-05）。不掛載：工具列、編輯面板、設定頁、通知、工作區名稱與切換、新增球按鈕、右鍵選單、框選。快捷鍵：目前沒有任何全域快捷鍵（ADR-04 選 B）。
### UI-01｜頁面結構（NFR-04、NFR-07）

順序：頁首（語言切換）→ 試用區（標題、一行說明「試用內容不會上傳，重新整理頁面就會消失」、試用或靜態預覽）→ 下載區 → 頁尾。
- 版面不看裝置：桌機接滑鼠縮到手機寬度仍顯示互動試用；日曆單欄加球列的最小寬度需實測（基準的球列寬 104 像素，時間軸欄 80 像素，日欄最小 84 像素【碼】，合計約 268 像素；是否容得下待實測【未】）。
- 頁面沒有水平捲動；下載區可抵達。
- 網站自己的控制項（語言切換、下載連結、頁尾連結）可用鍵盤操作並有可辨識名稱；圖片有替代文字。

### UI-02｜試用區（FR-01、FR-02、FR-07）

- 內容與規則由 `src/trial/` 決定（對齊 Calendar 固定 commit）；網站不加任何日曆控制項，不顯示狀態訊息區。
- 說明文字（含「試用內容不會上傳…」）隨網站語言，由網站字典提供。
- 試用區整體的 `data-testid="trial-app"`；日曆欄 `tabIndex=-1`（程式可聚焦，不在 Tab 順序中）。
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

移動與調整長度：被拖曳的邊緣先由指標換成整分鐘，再判斷磁吸，因此上表的邊界（距離恰為 8）可能差約 0.5 分鐘，測試應避開恰好 8 像素的值。此表是依 REUSE-01 規則與 PRD AC-01.1 的例子人工算出的預期值，用於引擎單元測試；規則本身的來源是 SRS REUSE-01（讀過基準 commit 原始碼，未執行）。**尚未執行驗證**（OR-25）。

## 沿用行為的一致性案例

目的：AC-01.16「同一組操作序列，網站與固定版本的 Calendar 結果相同」。**2026-11-11 修訂：**案例是資料，放在 `tests/conformance/cases.ts`，執行器改接網站自己的 `src/trial/`（TRIAL-01、TRIAL-02），不再「隨共用模組發布、Calendar CI 與網站 CI 各執行一次」；與 Calendar 固定 commit 的交叉比對是人工。層級是 store／引擎 API，不經 DOM；少量 UI 冒煙案例另列於網站 e2e。

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
| CONF-01 | 建立 10:30 → 終點 13:00 → 命名「寫 PRD」；結果 10:30–13:00、標題、球色（**含調整長度與命名，暫不開放**） | AC-01.1、REUSE-02～04、09 |
| CONF-02 | 建立 → 移動 → 命名 → 刪除 → 復原 ×4 → 重做 → 新操作清除重做（**含命名、刪除、復原，暫不開放**） | AC-01.10、REUSE-08 |
| CONF-03 | 沒有選取時 `deleteSelected`：事件與 `pastLength` 不變（**暫不開放**） | AC-01.9、REUSE-07 |
| CONF-04 | 命名為空、只有空白、31 字：標題不變、`pastLength` 不變、無例外（**暫不開放**） | INV-12、REUSE-09 |
| CONF-05 | 命名為相同內容：不佔步（**暫不開放**） | REUSE-09 |
| CONF-06 | 連續 101 個變更：`pastLength` 為 100（**復原暫不開放；原需 Calendar 補測，issue 015 已更改決定**） | REUSE-08 |
| CONF-07 | 調整長度到 1 分鐘（允許）與超過 10080 分鐘（夾住）（**調整長度暫不開放**） | REUSE-04 |
| CONF-08 | 起點 14:30 建立：終點 16:30 被保存（區塊可延伸到可見範圍外）（**開放**） | REUSE-02、REUSE-11 |
| CONF-09 | 多選刪除一步，復原全部回來（**暫不開放**） | REUSE-07、REUSE-10 |
| CONF-10 | 複製貼上（`workspacePath` 為 `'memory:trial'`）產生副本且為一步（**暫不開放**） | REUSE-10 |
| ENG-MAG | 上方磁吸換算表逐列 | REUSE-01 |

**2026-11-11：**本輪只開放建立與移動，所以只有標「開放」的案例（CONF-08、ENG-MAG，以及移動的 AC-01.7 算例）會被執行；標「暫不開放」的案例保留為資料，執行結果記「暫不開放」，不是「已通過」。

案例的預期值來自 PRD／SRS 的規格與人工算例，不由實作輸出產生；固定基準 commit 的執行結果僅作交叉比對，不一致時記錄差異與來源並先查原因，不修改預期值（見 `docs/06-test-plan.md`「判定方式」）。規則的來源是 SRS 沿用登記表（讀過基準 commit 原始碼，未執行）。截至本版，人工算例與基準執行**皆尚未執行**。

## OR-24 驗證情境

**2026-11-11：**命名、右鍵選單、復原暫不開放，所以 N-1～N-6、N-10、N-12 標「不適用」；其餘情境仍要驗證。

沿用 App 命名提交行為（REUSE-09：Enter、失焦或點別處提交，Escape 取消，卸載時提交輸入內容，`cancelled` 為真時不提交）。下列是網站端接入後要驗證的情境；「預期」欄是依程式碼推論，**以實際執行結果為準**，不一致時回報專案擁有者，不由網站修正。

| ID | 情境 | 預期（推論） | 層 |
|---|---|---|---|
| N-1（不適用：暫不開放） | 命名中、文字已改，介面因失去互動資格卸載 | 標題被提交，一個歷史步驟 | E |
| N-2（不適用：暫不開放） | 命名中、文字未改，卸載 | 無步驟 | E |
| N-3（不適用：暫不開放） | 命名中輸入空白或 31 字，卸載 | 標題不變，無訊息，無步驟 | E |
| N-4（不適用：暫不開放） | 按 Escape 取消後卸載 | 不提交 | E |
| N-5（不適用：暫不開放） | 卸載後重新掛載：`editingEventId` 是否殘留使區塊再度進入編輯 | 未知；記錄實際結果，若殘留視為 App 狀態殘留，是否由網站在卸載時呼叫 `setEditing(null)` **待確認** | E |
| N-6（不適用：暫不開放） | 命名進行中恢復互動資格（輸入欄焦點） | 記錄 | E |
| N-7 | 移動或調整長度的拖曳中卸載 | 事件不變；`is-interacting*` 類別被移除；`window` 監聽器歸零（hook 有卸載清理【碼】） | E |
| N-8 | 球拖曳中卸載 | 不建立區塊；跟著指標的球與落點預覽不殘留（`ballDrag.cancel`、`ballPress.blur`；卸載時呼叫） | E |
| N-9 | （radial 保留時）長按計時器或選單開啟時卸載 | 計時器與選單被清除【未】 | E |
| N-10（不適用：暫不開放） | 右鍵選單開啟時卸載後重掛載 | 選單不殘留 | E |
| N-11 | 卸載前後的選取 | 保留（store 擁有）；記錄（剪貼簿暫不開放） | E |
| N-12（不適用：暫不開放） | 卸載後重掛載，復原與重做 | 歷史仍在；不重測 100 步上限 | E |
| N-13 | 輸入能力在短時間內反覆切換十次 | 不重複請求 chunk；只 `hydrate` 一次；監聽器數不累積 | E |
| N-14 | 載入中變成不符合 | 不掛載、不初始化 | E |

層欄：E＝網站整合測試。共用層需要補的測試見 SAD 的 OR-25 要求。

## 變更與未決

**相容性**：全新專案，無既有資料或 API；沒有遷移。語言偏好值域固定，未知值視為未設定。對 Calendar 沒有相容性要求：不修改 Calendar（2026-11-11）。

**會影響實作、需先定案的未決契約**：

| 項目 | 狀態 |
|---|---|
| ADR-03、ADR-04 | **已決定（2026-11-11）**：ADR-03 選 B（網站自己組裝）、ADR-04 選 B（滑鼠進試用區才啟用快捷鍵） |
| 新增／編輯球（OR-20） | **已決定（2026-11-11）**：排除，名稱是純文字 |
| radial 選單（OR-20） | **已決定（2026-11-11）**：保留 |
| 種子球名稱與色碼（OR-12） | 待確認 |
| EXT-01 的 owner／repo | 已確認：`andrewchu0101/juicy-calendar`（2026-11-11）；下載版本固定 tag，新版須更新 |
| EXT-03 發布管道（OR-21、D-11） | **已更改決定（2026-11-11）**：不再適用 |
| DATA-05 鍵名；MOD-04 儲存失敗降級（OR-09） | 提案，待確認 |
| 失敗文案（TrialLoader） | 無需求依據，待確認 |
| EXT-02 統計事件（D-03、OR-10） | 未決，只影響統計 |

> 審查重點：欄位、介面與錯誤行為可直接實作；網站不新增 App 沒有的日曆功能；沿用行為都能對到基準 commit；測試者可據此建立獨立預期；預期值來自推算者已標示尚未執行。
