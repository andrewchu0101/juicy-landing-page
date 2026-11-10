# HANDOFF —— Juicy Landing Page 交接紀錄

> 這份記「這一輪做到哪、下一步」。整個專案的狀態只在里程碑改變時才記到 `CURRENT_STATUS.md`（目前尚未建立）。
> 寫給沒看過這段對話的人：只寫查得到的事實，證據附指令或路徑。

## 摘要（每次覆寫這一段）

| 項目 | 內容 |
|---|---|
| 更新時間 | 2026-11-10（接手另一台電腦的進度後同步） |
| 目前目標 | 網站骨架與不依賴共用模組的部分已實作並合併；試用接入（005 起）受阻於專案擁有者決策與 Calendar 端授權；等專案擁有者回答 Gate 決策 |
| 工作目錄 | `C:\Users\student\Project\juicy-landing-page` |
| 分支／HEAD | 本文件所在分支 `docs/handoff-sync-2026-11-10`，由 `main`／`origin/main` 的 `6ea06fe`（PR #3 合併）切出。PR #1（文件）、#2（005 partial＋014）、#3（012 partial）皆已合併 |
| 工作樹 | 未追蹤且**刻意未提交**：`diagrams/*.html`（8 個，依 SRS v0.2 繪製，已過期，只作參考）、`issues/001-guard-secrets-false-positives.md`、`.claude/hooks/test-guard-secrets.sh`（守衛修復票，待專案擁有者確認，不要修改或繞過守衛）。注意 `issues/001-skeleton.md` 與守衛票同編號 001，是兩件事 |

### 已完成（依 issue 檔記載，本機尚未重跑）
- 文件：Brief、PRD v0.5.1、SRS v0.4、SAD v0.1、SDS v0.1、`06-test-plan.md` v0.2、`07-release-checklist.md`、`LESSONS.md`、`issues/001`～`018`
- 001 骨架（`d9e7dac`）、002 首頁與下載區（`6db7530`；`href` 與授權連結目標未驗證）、003 網站語言（`68a7624`；待 M-5）、004 互動閘門與預覽殼（`ca8741b`；單元測試通過，e2e 與 M-4 未執行）
- 005 部分：試用種子、`ensureReady`、隱私監看夾具（`fd83f51`）
- 012 部分：`.github/workflows/ci.yml`（typecheck、lint、test、build）；issue 檔記 PR #3 的 run 42661882621 全過（19 秒）
- 013 部分：metadata M1（`e4df3af`），`og:url`、`og:image` 未完成
- 014 清單已建立；驗收條件待專案擁有者確認

### 進行中
- 無。

### 阻塞
- 005 真實接入、006～011、015～018 皆 blocked：等 Calendar 端授權（015～018 只是依賴，不是授權）與 ADR-03、ADR-04／OR-26、OR-20、D-11（共用模組發布管道與憑證）、套件清單核准
- 公開上線前：D-10（LICENSE、TRADEMARKS.md、Calendar 來源授權；根目錄目前查無這兩個檔）、D-02 網域、D-03 統計工具、D-04 Windows 版驗證；完整清單見 `docs/07-release-checklist.md`
- `CALENDAR_REPO` 仍是占位 `OWNER-TBD`／`REPO-TBD`（EXT-01），下載 `href` 無法驗收
- 守衛誤判（見工作樹）擋住 `diagrams/` 與守衛測試檔的 commit

### 下一步（最多三項）
1. 專案擁有者回答 `docs/04-sad.md`「Gate」決策表：ADR-03、ADR-04、OR-20、D-11、套件清單。
2. 專案擁有者決定是否授權 Calendar 端工作（015～018）；未授權前不修改 Calendar、不發布套件、不設憑證。
3. 專案擁有者確認 `issues/001-guard-secrets-false-positives.md` 的方案（特別是「取捨」第 1 點），之後才能修守衛並提交 `diagrams/` 與守衛測試檔。

相關 issue／PR：PR #1～#3 已合併（`gh pr list --state all` 確認）；守衛票為未提交的 `issues/001-guard-secrets-false-positives.md`。

### 狀態核對（分開寫，不要混為一談）

| 面向 | 狀態 | 說明 |
|---|---|---|
| 已實作 | 部分 | 網站骨架、首頁、語言、互動閘門、種子與夾具、metadata M1；試用互動本體未接入 |
| 自動測試 | 本機 Not Run | 本機尚未 `npm install`，沒有 `node_modules`，這台沒有跑過任何測試。上列通過紀錄來自 issue 檔與 CI，不是本輪驗證。Calendar 的測試一個都沒執行過 |
| 人工驗收 | Manual Pending | M-1～M-10 全部未執行 |
| 已 commit／push | 已合併：PR #1～#3 | 本文件的變更尚未 commit |

### 接手者要先知道
- **這台電腦的 Calendar 位置**：`..\juicy-calendar`（`C:\Users\student\Project\juicy-calendar`）。2026-11-10 用 `git -C ..\juicy-calendar cat-file -t 102ae1917047aee691e88cef9c497b50df745c41` 確認基準 commit 存在（回傳 `commit`）；Calendar 目前 HEAD 為 `4701e12`，與基準不同。LESSONS 寫的 `D:\Project\Fun\...` 是另一台電腦，這台沒有 D 槽。讀 Calendar 一律用 `git -C <路徑> show 102ae1917047aee691e88cef9c497b50df745c41:<路徑>`，不讀工作樹。
- 方向已定：試用沿用 Calendar 的操作與規則，不新增 App 沒有的日曆功能；共用方式採方案 B，發布管道與權限未核准。
- 預期值來自規格與人工算例，不呼叫實作；「找不到測試」不等於「沒有測試」。
- OR-26：Calendar 的快捷鍵監聽在 `window` 上，放進 landing page 會攔截整頁 Ctrl+C（讀程式碼的結論，未在瀏覽器驗證）；TC-12 尚不可執行。
- 這台是暫時工作電腦（沒有 D 槽）；`CLAUDE.md` 的 D 槽規則保留給有 D 槽的主要電腦。程式、測試與 CI 不寫死機器絕對路徑。

---

## 歷史紀錄

（首次建立，無更早的摘要。）
