# 交付驗收報告（issue 011）

> **結論先講：這不是「整體已驗收」。** 自動化與機器可查的項目已執行並列出；所有需要人眼、實機、觸控或其他瀏覽器的項目維持 **Manual Pending**，下載尚未人工驗收（M-10）。
> 狀態用語：Passed、Failed、Blocked、Not Run、Manual Pending。證據欄是指令或檔案，不是口頭結論。

## 環境與範圍

| 項目 | 內容 |
|---|---|
| 日期 | 2026-11-13 |
| 電腦 | Windows 11 Home 10.0.26200，`D:\Project\Fun\juicy-landing-page`（有 D 槽的主要電腦） |
| 工具 | Node v24.22.0；Chromium 158.0.8127.18（Playwright 1.65.0）；沒有 Firefox、WebKit |
| 程式碼 | 分支 `feat/011-009-012-trial-two-parts`（疊在 PR #12 的 `feat/005-006-009-acceptance` 上）；以 `git log -1` 為準 |
| 試用範圍 | 兩個體驗（2026-11-13）：(1) 長按出六顆球，hover 果凍晃動，只展示；(2) 側邊三顆球拖放建立區塊、拖移區塊。調整長度、命名、刪除、復原、剪貼簿**暫不開放**，對應項目標「暫不開放」，不是「已通過」 |

## 自動化與機器檢查（本輪實際執行）

| 指令 | 結果 | 狀態 |
|---|---|---|
| `npm run typecheck` | 無錯誤 | Passed |
| `npm run lint` | 無錯誤 | Passed |
| `npx vitest run` | 33 檔、335 測試通過 | Passed |
| `npm run build` | 建置成功 | Passed |
| `npm run test:e2e`（Chromium） | 33 項通過（含 `e2e/trialRadial.e2e.ts` 5 項） | Passed（只有 Chromium） |
| `npm audit` | 0 個弱點 | Passed |
| Calendar 固定 commit `102ae19` 單元測試（匯出副本執行） | 12 檔 185 測試通過 | Passed |
| GitHub CI（PR #11 的 run 42974234351） | `check` 20 秒、`e2e` 40 秒皆通過 | Passed（本分支的 CI 要推送後才有） |

## 逐項狀態

| 項目 | 狀態 | 證據與說明 | 負責人 |
|---|---|---|---|
| **002 首頁與下載區** | Passed（自動）／Manual Pending（人工） | `tests/home.test.tsx`、`tests/links.test.ts` | 專案擁有者（M-1） |
| **003 網站語言** | Passed（自動）／**Manual Pending（M-5）** | `tests/languageSwitch.test.tsx`、`tests/siteLanguage.test.ts`；M-5 人工未做 | 專案擁有者 |
| **004 互動資格** | Passed（Chromium e2e）／**Manual Pending（M-4 實機、觸控）** | `e2e/interactiveGate.e2e.ts`。Playwright 模擬的 pointer／hover 能力未獨立驗證 | 專案擁有者 |
| **005 試用互動** | Passed（單元＋e2e） | 長按出球：`tests/trialGestures.test.ts`、`e2e/trialRadial.e2e.ts`；拖球放置、拖移：`e2e/trialDemo.e2e.ts`。人工體驗 Manual Pending | 專案擁有者 |
| **006 移動、調整長度、命名** | 移動 Passed；調整長度、命名**暫不開放** | `e2e/trialDemo.e2e.ts` | — |
| **008 動態資格** | Passed（Chromium e2e，注入 `matchMedia`）／**Manual Pending（M-8 實機）** | `e2e/dynamicEligibility.e2e.ts` | 專案擁有者 |
| **009 一致性案例** | 見下表 | `docs/evidence/009-baseline-conformance.runner.ts.txt` | — |
| **010 預覽圖** | Passed（自動）／**Manual Pending（M-5、視覺確認）** | 圖與替代文字隨語言：`e2e/previewImage.e2e.ts`；2026-11-13 已用新球色重截。種子球**名稱**仍是占位（OR-12），名稱改了要重截 | 專案擁有者（交給 `impeccable` 做視覺） |
| **013 metadata** | Passed（自動）／社群平台實際預覽未驗證 | `tests/metadata.test.ts`（含 1200×630 分享圖檔頭尺寸、canonical、`og:site_name`）。部署後才能用 Facebook／X／LINE 的偵錯工具看實際預覽 | 專案擁有者 |
| **TC-10a 下載 `href`** | **Passed** | `tests/links.test.ts`：按鈕與 zip 都指向 `releases/download/v0.2.0-beta.3/juicy-calendar_0.2.0-beta.3_x64-portable.zip` | — |
| **TC-10b 實際下載（機器端）** | **Passed（curl，不是人工）** | 2026-11-13：`curl -L` 回 200，2,958,720 位元組；SHA-256 `c32de372…dc32` 與 `src/config/links.ts` 釘選值、GitHub 資產 digest 相同；release 為預發行、2026-11-08 發布，只有 zip 與 `SHA256SUMS.txt` | — |
| **M-10 人工下載驗收** | **Manual Pending** | 還沒有人在瀏覽器點按鈕、下載、解壓縮並啟動。**M-10 完成前不得宣稱下載已驗收**；`DOWNLOAD_LINKS.verification` 維持 `'unverified'` | 專案擁有者 |
| **M-9 隱私** | 自動 Passed／**人工 Manual Pending** | `e2e/trialDemo.e2e.ts` TC-06a～6d 與 `tests/privacy.test.ts`：沒有 `localStorage` 寫入、沒有外送請求、第二個分頁看不到區塊。人工開網路面板與 cookie 面板未做 | 專案擁有者 |
| **M-1 主流程** | Manual Pending | 需人工在 1280×800 走一遍，全程不輸入時間數字 | 專案擁有者 |
| **M-3／M-4 W1、W2、觸控** | Manual Pending | 沒有觸控環境，W2（390×844）未驗證；主要輸入不符 `pointer: fine` 與 `hover: hover` 時只顯示靜態預覽 | 專案擁有者 |
| **M-2 跨瀏覽器** | **Blocked（環境缺口）** | 本機只有 Chromium。Firefox、WebKit／Safari 實機都沒有；試用在這些引擎的行為（含 `clip-path` 果凍晃動）未驗證 | 專案擁有者 |
| **TC-07f 效能基線** | 只記錄，不判定 | 見下 | — |
| **公開上線前（D-10、D-02～D-04）** | 未完成 | 見 `docs/07-release-checklist.md`。LICENSE 與 TRADEMARKS.md 目前在 `main` 上回 200（2026-11-13 curl） | 專案擁有者 |

### 009 一致性案例

| 面向 | 狀態 | 說明 |
|---|---|---|
| 預期值（人工算例，CONF-01～10） | Passed | 每個案例有人工算例與規格出處（`tests/conformance/cases.ts`），**沒有為了迎合實作而修改** |
| 網站端執行 | 部分 | CONF-08 完整執行；CONF-02 步驟 0–1 部分執行；其餘案例用到命名、刪除、復原、剪貼簿，網站**暫不開放**，標「暫不開放」 |
| **基準端執行（Calendar `102ae19`）** | **Passed：10／10** | 2026-11-13：把固定 commit `git archive` 匯出到暫存區（Calendar repository 沒有任何改動），在副本上用它的 `appStore` 執行同一份 `cases.ts`，**CONF-01～10 全部與人工算例一致**，包含 CONF-06 的 100 步上限（`pastLength` 100）。突變檢查：把預期值改成 99，執行器正確失敗 |
| 差異記錄 | 無差異 | 網站與基準沒有發現不一致 |
| CONF-06 網站端 | 暫不開放 | 試用沒有命名與歷史；原本「受阻於 015、Calendar 沒有 100 步測試」的阻塞，已由上面的基準端執行解除（Calendar 的行為確認為 100），但這不是 Calendar 補測 |

**如何重跑基準端（不改 Calendar）：** 在暫存區 `git -C <Calendar> archive 102ae1917047aee691e88cef9c497b50df745c41 | tar -x -C <暫存目錄>`，把 Calendar 的 `node_modules` 以目錄連結（junction）接進暫存目錄；把本專案 `tests/conformance/cases.ts` 複製成 `<暫存目錄>/src/conformanceCases.copy.ts`，把 `docs/evidence/009-baseline-conformance.runner.ts.txt` 複製成 `<暫存目錄>/src/baselineConformance.test.ts`，在暫存目錄執行 `npx vitest run src/baselineConformance.test.ts`。注意：Calendar 的 `node_modules` 是目前 HEAD（`a1c64e5`）安裝的，不是 `102ae19` 當時的鎖定檔，這是這次執行的已知差異。

### TC-07f 效能基線（只記錄，不判定通過或失敗）

量測方法：`scripts/measurePerformance.ts`。條件：本機 Chromium 158（Playwright）、對本機預覽伺服器 `npm run preview`、1280×800、**無 CPU 與網路節流、沒有網路延遲與 CDN**。數字只能和「同一台電腦、同一方法」的下一次比較，**不代表真實訪客的體驗**，也沒有訂通過數字。

| 項目 | 數值（7 次，中位數；括號為範圍） |
|---|---|
| `domContentLoaded` | 33 ms（30.6–98.5，第一次含冷快取） |
| `load` | 33 ms（30.6–99） |
| 試用區可見（`trial-app` 出現） | 140 ms（120.2–254.7） |
| 拖曳 90 步（rAF 影格間隔） | 95 格，平均 17.4 ms、p95 16.8 ms、最大 33.4 ms |
| JS／CSS 大小（原始／gzip） | `index` JS 232,533／73,650 B；`index` CSS 4,638／1,560 B；`trialModule` JS 21,543／7,742 B；`trialModule` CSS 13,230／4,066 B |

未量測：真實網路下的載入、低階裝置、觸控拖曳、長時間穩定度、記憶體。

## 未完成項目與負責人

1. **M-10（人工下載）、M-1、M-3／M-4、M-5、M-8、M-9 人工部分：** 專案擁有者親自操作，我無法代替。
2. **M-2 跨瀏覽器：** 缺 Firefox、WebKit／Safari 環境；需要專案擁有者提供環境或接受只驗 Chromium。
3. **觸控與 W2：** 缺觸控裝置。
4. **種子球名稱（OR-12）：** 仍是占位，定案後要重截預覽圖。
5. **公開上線前清單：** `docs/07-release-checklist.md`。

**本報告不宣稱整體已驗收。**
