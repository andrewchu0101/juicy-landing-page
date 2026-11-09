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

**Status:** partial（種子、`ensureReady`、隱私監看夾具已合併：`fd83f51`；真實接入仍 blocked，等 016、017、ADR-03、開發期取得方式、套件核准）

**對應 TC：** TC-01a、TC-01e、TC-01f；TC-02；TC-06a～6d（TC-06e 等流量統計工具決定）

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

- [ ] 球放在離 10:30 線上方 7 像素處 → 10:30–12:30；TC-02 表逐列通過
- [ ] 在 14:30 建立 → 終點 16:30 被保存
- [ ] 排除項以角色與可及名稱查詢為 0、不在 DOM、Tab 走訪不含；`data-testid` 僅輔助（TC-01f）
- [ ] `localStorage` 只出現語言偏好鍵；沒有請求攜帶標題或時間；沒有 cookie；惡意標題純文字顯示
- [ ] 重新整理後日曆為空、歷史清空、球仍在；第二個分頁看不到
- [ ] `hydrate` 整個頁面生命週期只呼叫一次
- [ ] 實際執行測試並貼出；未完成者維持「未執行」

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
