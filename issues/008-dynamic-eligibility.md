# 008: 動態資格切換與狀態保留（原 W-08）

**大小：** M

**What to build:** 拖曳中輸入能力變成不符合時，不產生區塊，試用區改為靜態預覽；已完成的區塊與復原歷史保留在分頁記憶體；恢復後回到互動試用，仍看到原區塊，復原歷史仍在，`hydrate` 不重複呼叫。OR-24 的情境（N-1～N-14）**只記錄實際結果，不判定通過**。

**Blocked by:** 004、006（移動區塊已完成）。007（復原／重做）**已更改決定**（2026-11-11：不開放），所以本票只驗「區塊保留、`hydrate` 不重複、拖曳中資格消失不產生區塊」，不含復原歷史。

**Status:** 自動化部分完成（2026-11-11：TC-08 8a～8d 與 OR-24 N-7、N-8、N-9、N-11、N-13、N-14 都有瀏覽器層測試並通過；**M-8 實機仍未執行**，所以整票不宣稱驗收）

**對應 TC：** TC-08a、TC-08b、TC-08c；M-8；OR-24 N-1～N-14 的記錄

**預計檔案範圍（預估）：** `tests/` 下的整合測試（注入假 `matchMedia`）、OR-24 記錄文件；產品程式碼預期只涉及 `TrialLoader` 與 `TrialShell` 的掛載／卸載。

**要讀的規格：** `docs/05-sds.md` INV-02、INV-03、INV-09、「OR-24 驗證情境」；`docs/03-srs.md` FR-08、OR-24；`docs/02-prd.md` AC-01.13；`docs/06-test-plan.md` TC-08。

**驗收指令（預定）：**
```bash
npm test   # 整合測試，注入假 matchMedia
```
人工（M-8）：命名進行中拔掉滑鼠（或切換為不符合資格），只記錄實際結果。

## 驗收條件

- [x] 拖第三顆球時失去資格 → 沒有第三個區塊；2 個區塊保留（歷史不適用：復原不開放）。證據：`e2e/dynamicEligibility.e2e.ts` 8a／8b，Chromium，輸入能力用注入的 `matchMedia` 模擬
- [x] 資格恢復 → 看到 2 個區塊；`hydrate` 只呼叫 1 次（單元：`tests/trialRuntime.test.ts`；瀏覽器層以「恢復後區塊仍在」間接佐證，沒有直接數 `hydrate` 次數）。復原不適用
- [x] 反覆切換 10 次 → 試用模組只請求 1 次，試用掛在 `window` 的監聽器休眠時為 0、恢復後回到相同數量，`body` 無 `trial-interacting*` 類別（e2e 8c／N-13）
- [x] OR-24 情境：記錄實際結果（見下表）；命名相關 N-1～N-6、N-10、N-12 不適用
- [ ] 實際執行測試並貼出；M-8 未做前維持「未執行」

## 實作紀錄（2026-11-11，Chromium，**不是人工驗收**）

沒有改產品程式碼：`TrialLoader`、`TrialApp` 既有的卸載清理已符合預期，這一輪只補驗證。

- 新增 `e2e/dynamicEligibility.e2e.ts`（4 項）。Playwright 無法切換 `pointer`／`hover`，所以用 `addInitScript` 換掉含這兩個特徵的 `window.matchMedia`；閘門、載入器、試用模組、手勢與 DOM 都是真的。這是模擬輸入能力的變化，**不等於實機拔掉滑鼠**。
- 監聽器數：包 `window.addEventListener`／`removeEventListener`，只數呼叫堆疊含 `trialModule` 的（Playwright 自己注入的 `pointerdown`／`pointerup` capture 監聽器不算）。8c 另外斷言「作用中數量 > 0」，避免測試空轉。
- 重複執行 `npx playwright test --repeat-each=5`：40 項全過（6.1 秒）。

| OR-24 | 實際結果 | 證據 |
|---|---|---|
| N-7 移動區塊拖曳中失去資格 | 區塊時間不變；`body.trial-interacting` 被移除；監聽器歸零 | e2e N-7 |
| N-8 球拖曳中失去資格 | 球與落點預覽不殘留；放開滑鼠不產生區塊 | e2e 8a |
| N-13 反覆切換 10 次 | chunk 請求 1 次；休眠時監聽器 0、恢復後與第一次相同；`body` 無類別；區塊仍在 | e2e 8c |
| N-14 載入中變成不符合 | 不掛載；恢復後才掛載；chunk 仍只請求 1 次 | e2e 8d（「不初始化」只由單元 `tests/trialLoader.test.ts` 直接驗證） |
| N-9a 圓形選單開啟時失去資格 | 選單消失、監聽器歸零；恢復後沒有選單、沒有區塊 | e2e N-9a（注意：拿掉 `radial.destroy()` 它仍會通過，因為元件卸載後畫面本來就看不到選單；它只證明使用者看得到的行為） |
| N-9b 250ms 長按期間失去資格 | 試用自己的待觸發計時器由 1 變 0；超過 250ms 後也沒有選單出現 | e2e N-9b（計時器以 `setTimeout` 包裝計數，只數呼叫堆疊含 `trialModule` 的） |
| N-11 卸載前後的選取 | 選取保留：`data-selected` 在失去再恢復資格後仍為 `true` | e2e N-11 |

未做：M-8 實機、觸控實機、其他瀏覽器。

## 收尾（2026-11-11，N-9、N-11；先寫測試再驗證能抓到問題）
- 新增 3 個 e2e 到 `e2e/dynamicEligibility.e2e.ts`：N-9a、N-9b、N-11。產品程式碼沒有改（既有清理已正確），所以第一次執行就全過，**不是自然的紅燈**。
- 為了證明測試真的抓得到問題，做了一次突變檢查：暫時把 `TrialApp` 清理函式裡的 `radial.destroy()` 拿掉再跑。結果 N-9b **失敗**（待觸發計時器 Expected 0、Received 1），N-9a 仍通過（畫面看不出差別）。還原後 7 項全過，`git status` 確認 `src/` 沒有殘留修改。
- 發現的限制：「計時器漏掉」在畫面上看不出來（元件卸載後 `setState` 是空操作），所以只能靠計數計時器偵測；N-9a 只證明使用者看得到的行為。
- 全部 e2e 連跑 5 輪（`--repeat-each=5`）穩定通過。
