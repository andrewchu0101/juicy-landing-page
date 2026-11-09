# 004: 互動資格閘門與靜態預覽容器（原 W-04）

**大小：** M

**What to build:** 訪客的主要輸入同時符合 `pointer: fine` 與 `hover: hover` 時，試用區才載入試用模組；否則試用區顯示靜態預覽容器（圖下說明與「產品預覽」標示），**完全不請求試用模組**，下載區照常顯示。判定只看這兩項，不看寬度、裝置或瀏覽器名稱。用假的試用模組完成，不依賴 Calendar。內含假 `matchMedia` 與網路請求監看的測試夾具。

**UI 部分（預覽容器版面、說明文字樣式）：由 Owner 手動呼叫 `$impeccable`，不自動執行。** 預覽圖本身在 010。

**Blocked by:** 002。
- 載入失敗專用文案未定，只阻塞失敗路徑的文案，不阻塞閘門與預覽。

**Status:** 實作完成、單元測試通過（2026-11-10）；e2e（TC-07b／07c／07d）與 M-4 未執行；未 commit。英文預覽說明為暫定文字，待專案擁有者確認

**對應 TC：** TC-07a、TC-07b、TC-07c、TC-07d；TC-08d；M-4（觸控／模擬環境，與 W1／W2 視窗驗收分開）

**預計檔案範圍（預估）：** `src/` 下的閘門模組、`TrialLoader`、預覽容器、測試夾具（假 `matchMedia`、網路請求監看）、對應測試。

**要讀的規格：** `docs/05-sds.md` MOD-01、MOD-02、UI-03；`docs/03-srs.md` FR-08、NFR-05、NFR-06；`docs/02-prd.md` AC-01.6。

**驗收指令（預定）：**
```bash
npm test              # TC-07a（注入假 matchMedia）、TC-08d（載入中變成不符合）
npm run test:e2e      # TC-07b、07c、07d；需要 Playwright（尚未核准）
```
人工（M-4）：實機觸控裝置或觸控模擬，確認看到預覽容器、不能拖曳、網路面板沒有試用模組請求、下載區可用。Playwright 模擬 `pointer`／`hover` 的能力未驗證，失敗時以 M-4 實機結果為準。

## 驗收條件

- [x] 只有 fine 或只有 hover → 預覽；`matchMedia` 缺失或拋例外 → 預覽
- [x] 觸控模擬環境的網路請求不含試用模組；互動環境才請求（單元：請求監看夾具；另以 Playwright MCP 在 Chromium 臨時實測：isMobile+hasTouch 只載入 index 的 js／css，一般滑鼠環境才多一個 trialModule chunk。這不是可重跑的 e2e，也不取代 M-4 實機）
- [x] 桌機接滑鼠、視窗縮到 W2 寬度，仍判定為互動（單元：查詢字串不含寬度；臨時實測：390×844 滑鼠環境仍請求 trialModule、不顯示預覽）
- [x] 載入中變成不符合 → 不掛載、不初始化（tests/trialLoader.test.ts、tests/connectGate.test.ts 的 TC-08d）
- [x] 測試夾具可被 005～009 重用（tests/fixtures/fakeMatchMedia.ts、fakeTrialModule.ts）
- [ ] 測試實際執行並貼出結果；M-4 未做前維持「未執行」（2026-11-10：typecheck 通過、12 檔 87 測試通過、build 成功；M-4 與 Playwright e2e 未執行，故不勾）

## 實作紀錄與偏差（2026-11-10）

- 檔案：`src/trial/interactiveGate.ts`（MOD-01）、`trialLoader.ts`（MOD-02，無 DOM 狀態機）、`connectGate.ts`、`trialModule.ts`（佔位，005～009 取代）；`TrialSection.tsx`；字典新增 `trial.preview`。
- 偏差 1：專案無 DOM 環境與 Playwright，TC-07b／07c／07d 的 e2e 與網路面板檢查改以單元層替身（`loadModule` 請求監看）加臨時 Playwright MCP 實測；e2e 仍未執行。
- 偏差 2：英文預覽說明為暫定文字（UI-03 待定）。
- 偏差 3：loading 階段顯示預覽、失敗不顯示專用文案（皆規格未定）。預覽容器目前只有「產品預覽」標示與說明，沒有圖（010），樣式留給 Owner 手動呼叫 impeccable。
- 偏差 4：`trialModule.ts` 是空殼，互動環境下試用區目前不顯示任何內容。
