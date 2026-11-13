# 005: Demo 一：載入真實共用模組並建立區塊（原 W-05）

**大小：** M

**What to build:** 互動環境的訪客在試用區看到單日、10:00–15:00、示範日為今天的空日曆和三顆占位種子球，能把球拖到日曆放開而建立 120 分鐘的區塊，區塊顯示球名與球色，球仍可再用。排除的控制項（日期切換、起訖時間、設定、右側編輯面板、工作區管理等）**實際未渲染**。**隱私與記憶體儲存從第一次接入就驗：** 試用內容只在分頁記憶體，不寫任何儲存、不經任何網路請求；重新整理後清空，另一個分頁看不到。

**Blocked by:**
- 004
- 016（X-2：套件進入點、Tauri 與預設 backend 隔離）
- 017（X-3）中的 S3、S5，以及 S4 組裝（取決於 ADR-03，**尚未核准**）
- 開發期取得共用模組的方式（建議：016 完成後以本地 workspace 連結，**尚未核准，不是發布管道**）
- 套件核准（Playwright 等，未核准）
- 可先做：測試與夾具；真實接入須等契約。

**Status:** partial（種子、`ensureReady`、隱私監看夾具已合併：`fd83f51`）。**2026-11-11 專案擁有者決定不修改 Calendar、不新增套件，試用改由網站自己實作**（ADR-03 選 B、ADR-04 選 B、OR-20 新增／編輯球排除、圓形選單保留；見 `docs/04-sad.md`）。長按出球、拖球放置、球的 hover 與落下動畫已實作（未提交前的工作樹，見 HANDOFF）；因此原本的 016、017、開發期取得方式、套件核准不再阻塞本票，只剩人工驗收（M-1 等）。

### 實作紀錄（2026-11-11，網站自有實作）

- 行為與樣式逐項沿用 Calendar 固定 commit `102ae19…`：建立長度 120 分鐘、磁吸（離半點 8 像素內）、長按 250ms 叫出三顆球（移動超過 6 像素取消）、hover 只標示、離開判定圓才選中、拖出去的球跟著指標並依速度拉伸、日曆上顯示落點預覽、放下時水珠、放在日曆外時球裂成粒子、Escape 取消。樣式的數值（顏色、間距、圓角、動畫曲線與時間、radial-wobble 關鍵影格）對應 Calendar 的 `index.css` 與各元件的 Tailwind 類別，並限定在 `.trial-root` 內。
- 檔案：`src/trial/engine/`（純函式）、`src/trial/gestures/`（不依賴 DOM 的手勢狀態機）、`src/trial/store.ts`、`src/trial/ui/`、`src/trial/trial.css`。試用的 JS 與 CSS 在動態載入的 chunk 內（約 21 kB＋13 kB），主 bundle 不變。
- 測試（先寫測試、看它失敗、再實作）：`tests/trialEngine.test.ts`、`trialStore.test.ts`、`trialGestures.test.ts`（含 AC-01.7 算例與 Escape／離開視窗）、`trialApp.test.tsx`；`trialFormat.test.ts` 與 `trialColor.test.ts` 的測試與實作在同一步寫出，沒有單獨看過它失敗。預期值來自 REUSE 規則與人工算例。
- 瀏覽器實測（Playwright，Chromium 1280×900，2026-11-11，**不是人工驗收**）：長按 150ms 沒有選單、400ms 出現三顆球；hover 球 `transform` 為 `matrix(1.1,…)`；輪廓晃動；拖到 11:00 附近放開得到「專注 Focus 上午 11:00–下午 1:00」；單擊球不建立；放在日曆外出現 18 個粒子；重新整理後區塊清空；`localStorage` 在操作後仍是空的；沒有跨來源請求；英文切換後標籤變成 `10:00 AM`。
- 沒有做、也沒有測：觸控環境（互動資格擋掉）、不同瀏覽器與縮放、鍵盤操作、日光節約切換日、跨午夜。M-1～M-10 仍 Manual Pending。

**對應 TC：** TC-01a、TC-01e、TC-01f；TC-02；TC-06a～6d（TC-06e 不適用：不做流量統計，2026-11-13 決定）

**預計檔案範圍（預估）：** `src/trial/` 下的 `TrialRuntime`、`buildTrialWorkspace`、`TrialShell`、占位種子資料、記憶體儲存接入；測試夾具（固定時鐘、`localStorage`／`fetch`／XHR／`sendBeacon` 監看）；對應測試。

**種子資料：** 開發與測試使用符合 schema 的固定占位資料（已同意）；**不代表正式名稱與色碼已核准**，正式內容只阻塞種子內容的驗收。

**要讀的規格：** `docs/05-sds.md` MOD-03、MOD-05、DATA-01～05、INV-01、INV-02、INV-05、INV-06、INV-07、磁吸換算表；`docs/03-srs.md` FR-01、FR-07、REUSE-01、REUSE-02、NFR-01；`docs/02-prd.md` AC-01.1、AC-01.4、AC-01.15；`docs/06-test-plan.md` TC-01、TC-02、TC-06。

**驗收指令（預定）：**
```bash
npm test            # TC-02 磁吸表、INV-02、INV-05、INV-07、INV-01 監看
npm run test:e2e    # TC-01a/e/f、TC-06a～6d
```
預期值為規格與人工算例的字面常數，不呼叫實作。

## 驗收條件

- [x] 球放在離 10:30 線上方 7 像素處 → 10:30–12:30（e2e 1a，另驗 9 像素不吸附 → 10:21–12:21）；TC-02 表 12 列逐列通過（`tests/trialEngine.test.ts`，對網站自己的 `pointerToTime`）
- [x] 在 14:30 建立 → 終點 16:30 被保存（e2e 1e 讀區塊的 `title` 屬性；可見的只有 14:30–15:00，太矮不顯示時間文字；單元：CONF-08）
- [x] 排除項以角色與可及名稱查詢為 0、不在 DOM、Tab 走訪不含（TC-01f，e2e 4 項，含 `includeHidden`、中英兩版名稱清單）。**注意：** 試用區裡唯一的按鈕是三顆球（`role="button"`，名稱 "Drag <球名> onto the calendar"）；名稱清單是我列的，專案擁有者若有補充的排除項要加上
- [x] `localStorage` 只出現語言偏好鍵；操作期間沒有任何網路請求；沒有 cookie；沒有 sessionStorage 與 IndexedDB（TC-06a，e2e）。「惡意標題純文字顯示」**不適用**：命名不開放，標題只來自固定的種子球名稱，沒有訪客輸入的標題
- [x] 重新整理後日曆為空、球仍在；第二個分頁看不到（TC-06b、06c，e2e）。歷史不適用（復原不開放）
- [x] `hydrate` 整個頁面生命週期只呼叫一次（單元 `tests/trialRuntime.test.ts`；e2e 以「失去再恢復資格後區塊仍在」間接佐證）
- [x] 實際執行測試並貼出（見下方「驗收補齊」）；M-1 等人工驗收仍未執行

## 實作紀錄（2026-11-10；已合併 `fd83f51`）

票仍為 blocked；只完成不依賴共用模組的部分。`npm test`：15 檔 96 通過、1 todo；`npm run typecheck` 通過。

| 項目 | 狀態 | 證據 |
|---|---|---|
| `buildTrialWorkspace`（DATA-01～03）設定、種子、meta | 單元通過（TC-01a） | `tests/buildTrialWorkspace.test.ts` |
| `ensureReady` 只 hydrate 一次、失敗可重試（INV-02） | 單元通過（store 為注入替身） | `tests/trialRuntime.test.ts` |
| 隱私監看夾具與初始化不寫不送（INV-01，TC-06a 單元層） | 單元通過；真實瀏覽器未執行 | `tests/fixtures/privacyWatch.ts`、`tests/privacy.test.ts` |
| TC-02 磁吸表 | 常數已備；引擎比對 `todo`，未執行 | `tests/fixtures/magnetTable.ts` |
| 其餘（拖曳建立、排除控制項、重新整理、雙分頁、TrialShell、INV-07 `templateSchema`、`schemaVersion`、INV-10 語言步驟） | 未執行，等 016／017／Playwright | — |

偏差：本地暫定 `TrialWorkspace` 型別；種子名稱色碼為占位；`ensureReady` 少 MOD-03 步驟 2。

## 驗收補齊（2026-11-11，TDD）
- **TC-02**：把 `tests/privacy.test.ts` 裡等共用引擎的 `it.todo` 換成真正的比對：`tests/trialEngine.test.ts` 對 `pointerToTime` 逐列比對 `tests/fixtures/magnetTable.ts`（預期值是人工算出的字面常數）。夾具補上 `docs/06-test-plan.md` TC-02 有、SDS 表沒有的 raw 23 → 10:30（離 30 為 7，吸附），共 12 列。這個測試第一次就綠（引擎本來就對），不是自然紅燈；突變檢查：把磁吸門檻 8 改 9，多個列失敗（8.4、21、21.5、38.5、39），還原後全過。
- **基準交叉比對（只讀不執行）**：Calendar 固定 commit 的 `engine.test.ts` 第 283–287 行的五組 `magnetMinutes` 值，網站實作結果相同。
- **e2e**：新增 `e2e/trialDemo.e2e.ts`（見 `issues/006` 的清單）；突變檢查：磁吸門檻 8 改 9 → 「1a boundary」失敗；在 `createEventFromTemplate` 偷塞 `localStorage.setItem` → 「6a」失敗；還原後 `git status` 確認 `src/` 乾淨，全部 e2e 通過。
- 限制：Chromium 單一引擎；觸控、其他瀏覽器、日光節約與跨午夜未測；M-1～M-10 仍 Manual Pending。

## 2026-11-13 變更（專案擁有者）
- 試用拆成兩個體驗：長按叫出**六顆展示球**（只展示 hover 果凍晃動，不建立區塊），以及側邊三顆球拖放建立區塊。圓形選單不再開始拖曳。
- 種子球色碼改為 Calendar 色票 Sky `#83B9D0`、Sage `#A9C98D`、Peach `#E9B96E`。
- 驗證：`tests/radialBalls.test.ts`、`tests/trialGestures.test.ts`（radial 區塊改寫）、`e2e/trialRadial.e2e.ts`（5 項）；先紅後綠（單元），e2e 在功能之後寫，以突變檢查（改一個色碼）證明抓得到問題。

## 2026-11-14 變更（專案擁有者驗收後的修正，取代 2026-11-13 的「兩個體驗」）
- 線上試用分成**兩個階段式區塊**：步驟 1「試著長按」（空白區域、六顆展示球、hover 晃動、只展示）；步驟 2「拖球建立時間區塊」（原本的試用，只有三顆球，長按日曆空白處出三顆可拖的球）。
- 2026-11-13 把圓形選單改成「六顆、只展示」放在日曆上，不是專案擁有者要的；已還原步驟 2 的圓形選單為三顆可拖，六顆展示球移到步驟 1。
- 驗證：`tests/trialGestures.test.ts`（有 drag／無 drag 兩組）、`tests/trialSteps.test.tsx`、`e2e/trialRadial.e2e.ts`（兩個區塊、步驟 1 的六顆與晃動、步驟 2 的三顆與拖出建立區塊）。
